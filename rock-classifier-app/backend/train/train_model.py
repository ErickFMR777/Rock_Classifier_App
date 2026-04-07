"""
Train the rock classifier using transfer learning on ResNet50.
Optimized for CPU training with limited resources.
"""

import os
import json
import copy
import logging
import time
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import transforms, datasets, models
from sklearn.metrics import classification_report
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
DATASET_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "models"
CLASSES_PATH = MODEL_DIR / "rock_classes.json"
MODEL_SAVE_PATH = MODEL_DIR / "rock_classifier.pt"

# Training hyperparameters (optimized for CPU)
BATCH_SIZE = 16
NUM_EPOCHS = 8
LEARNING_RATE = 1e-4
FC_LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
IMAGE_SIZE = 224
VAL_SPLIT = 0.2
NUM_WORKERS = 2


def get_transforms():
    """Get training and validation transforms with strong augmentation."""
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        transforms.RandomGrayscale(p=0.1),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform


def create_model(num_classes: int) -> nn.Module:
    """Create ResNet50 with transfer learning - freeze early layers."""
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)

    # Freeze all layers first
    for param in model.parameters():
        param.requires_grad = False

    # Unfreeze layer4 (last residual block) for fine-tuning
    for param in model.layer4.parameters():
        param.requires_grad = True

    # Also unfreeze layer3 to improve representational power for fine-tuning
    for param in model.layer3.parameters():
        param.requires_grad = True

    # Replace classifier with a better head
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, 512),
        nn.ReLU(inplace=True),
        nn.Dropout(0.2),
        nn.Linear(512, num_classes)
    )

    return model


def train_one_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for inputs, labels in tqdm(dataloader, desc="Training", leave=False):
        inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc


def validate(model, dataloader, criterion, device):
    """Validate the model."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in tqdm(dataloader, desc="Validating", leave=False):
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc, all_preds, all_labels


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    # Load class names
    with open(CLASSES_PATH) as f:
        class_names = json.load(f)
    num_classes = len(class_names)
    logger.info(f"Number of classes: {num_classes}")

    # Check dataset
    if not DATASET_DIR.exists():
        logger.error(f"Dataset directory not found: {DATASET_DIR}")
        logger.error("Run download_images.py first!")
        return

    # Check how many images per class
    for cls in class_names:
        cls_dir = DATASET_DIR / cls
        if cls_dir.exists():
            count = len(list(cls_dir.glob("*.jpg")))
            logger.info(f"  {cls}: {count} images")
        else:
            logger.warning(f"  {cls}: NO DIRECTORY")

    # Create datasets
    train_transform, val_transform = get_transforms()

    # Load full dataset with train transform first to get class mapping
    full_dataset = datasets.ImageFolder(DATASET_DIR, transform=train_transform)

    # Map ImageFolder classes to our class order
    logger.info(f"ImageFolder found {len(full_dataset.classes)} classes: {full_dataset.classes}")
    logger.info(f"Total images: {len(full_dataset)}")

    # Split into train/val
    val_size = int(len(full_dataset) * VAL_SPLIT)
    train_size = len(full_dataset) - val_size
    train_dataset, val_dataset = random_split(
        full_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )

    # Override val transforms
    class ValSubset(torch.utils.data.Dataset):
        def __init__(self, subset, transform):
            self.subset = subset
            self.transform = transform
        def __len__(self):
            return len(self.subset)
        def __getitem__(self, idx):
            img, label = self.subset[idx]
            # img is already transformed, we need the original
            # So we'll access the dataset directly
            original_idx = self.subset.indices[idx]
            path, label = self.subset.dataset.samples[original_idx]
            from PIL import Image
            img = Image.open(path).convert("RGB")
            img = self.transform(img)
            return img, label

    val_dataset_proper = ValSubset(val_dataset, val_transform)

    logger.info(f"Train size: {train_size}, Val size: {val_size}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True,
                              num_workers=NUM_WORKERS, pin_memory=False)
    val_loader = DataLoader(val_dataset_proper, batch_size=BATCH_SIZE, shuffle=False,
                            num_workers=NUM_WORKERS, pin_memory=False)

    # Create model
    model = create_model(num_classes).to(device)

    # Ensure class mapping matches
    # ImageFolder sorts by folder name alphabetically - update rock_classes.json to match
    if full_dataset.classes != class_names:
        logger.warning("Class order mismatch! Updating rock_classes.json to match ImageFolder order.")
        class_names = list(full_dataset.classes)
        with open(CLASSES_PATH, 'w') as f:
            json.dump(class_names, f, indent=2)
        logger.info(f"Updated rock_classes.json with {len(class_names)} classes")

    # Loss and optimizer
    # Compute class weights to address imbalance
    from collections import Counter
    counts = Counter([full_dataset.samples[i][1] for i in range(len(full_dataset))])
    class_counts = [counts.get(i, 0) for i in range(num_classes)]
    total = float(sum(class_counts)) if sum(class_counts) > 0 else 1.0
    class_weights = [total / (c + 1e-6) for c in class_counts]
    weights_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device)
    criterion = nn.CrossEntropyLoss(weight=weights_tensor)

    # Different learning rates: higher for FC, lower for fine-tuned layers
    fc_params = list(model.fc.parameters())
    backbone_params = [p for p in model.layer4.parameters() if p.requires_grad] + [p for p in model.layer3.parameters() if p.requires_grad]

    # Try AdamW for better generalization, fall back to Adam if not available
    try:
        optimizer = optim.AdamW([
            {'params': backbone_params, 'lr': LEARNING_RATE},
            {'params': fc_params, 'lr': FC_LEARNING_RATE},
        ], weight_decay=WEIGHT_DECAY)
    except Exception:
        optimizer = optim.Adam([
            {'params': backbone_params, 'lr': LEARNING_RATE},
            {'params': fc_params, 'lr': FC_LEARNING_RATE},
        ], weight_decay=WEIGHT_DECAY)

    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5,
                                                       patience=3, verbose=True)

    # Training loop
    best_val_acc = 0.0
    best_model_state = None
    patience_counter = 0
    max_patience = 6

    logger.info("=" * 60)
    logger.info("Starting training...")
    logger.info("=" * 60)

    start_time = time.time()

    for epoch in range(NUM_EPOCHS):
        epoch_start = time.time()

        # Train
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)

        # Validate
        val_loss, val_acc, all_preds, all_labels = validate(model, val_loader, criterion, device)

        scheduler.step(val_loss)

        epoch_time = time.time() - epoch_start

        logger.info(
            f"Epoch [{epoch+1}/{NUM_EPOCHS}] "
            f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f} | "
            f"Time: {epoch_time:.1f}s"
        )

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = copy.deepcopy(model.state_dict())
            patience_counter = 0
            logger.info(f"  >> New best model! Val Acc: {val_acc:.4f}")
        else:
            patience_counter += 1

        if patience_counter >= max_patience:
            logger.info(f"Early stopping at epoch {epoch+1}")
            break

    total_time = time.time() - start_time
    logger.info("=" * 60)
    logger.info(f"Training complete in {total_time:.1f}s")
    logger.info(f"Best validation accuracy: {best_val_acc:.4f}")

    # Load best model and save
    if best_model_state:
        model.load_state_dict(best_model_state)

        # Save checkpoint
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        torch.save({
            'model_state_dict': best_model_state,
            'class_names': class_names,
            'num_classes': num_classes,
            'best_val_acc': best_val_acc,
            'architecture': 'resnet50_transfer',
        }, MODEL_SAVE_PATH)
        logger.info(f"Model saved to {MODEL_SAVE_PATH}")

        # Final validation report
        val_loss, val_acc, all_preds, all_labels = validate(model, val_loader, criterion, device)
        report = classification_report(all_labels, all_preds, target_names=class_names, zero_division=0)
        logger.info(f"\nClassification Report:\n{report}")

        # Save metrics to JSON for API consumption
        import json
        metrics = {
            'best_val_acc': best_val_acc,
            'val_loss': val_loss,
            'val_acc': val_acc,
            'num_classes': num_classes,
            'classification_report': report,
        }
        metrics_path = MODEL_DIR / 'metrics.json'
        with open(metrics_path, 'w') as mf:
            json.dump(metrics, mf, indent=2)
        logger.info(f"Metrics saved to {metrics_path}")
    else:
        logger.error("No model was saved (training may have failed)")


if __name__ == "__main__":
    main()
