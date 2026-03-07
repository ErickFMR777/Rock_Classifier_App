"""
Improved Rock Classifier Training - optimized for small datasets (30-80 images per class).
Key improvements over v1:
  - ResNet18 backbone (less prone to overfitting on small data)
  - Unfreeze layers 3, 4, and FC with differential learning rates
  - Very aggressive data augmentation (RandAugment-style)
  - Weighted random sampler for class imbalance
  - Label smoothing (0.1)
  - Cosine annealing with warm restarts
  - Mixup augmentation
  - Gradient clipping
  - Smaller batch size (8) for more gradient updates per epoch
  - 30 epochs with patience 12
"""

import os
import json
import copy
import logging
import time
import random
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split, WeightedRandomSampler, Dataset
from torchvision import transforms, datasets, models
import numpy as np

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
DATASET_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "models"
CLASSES_PATH = MODEL_DIR / "rock_classes.json"
MODEL_SAVE_PATH = MODEL_DIR / "rock_classifier.pt"

# Training hyperparameters
BATCH_SIZE = 8
NUM_EPOCHS = 30
BACKBONE_LR = 1e-4
FC_LR = 1e-3
WEIGHT_DECAY = 1e-4
IMAGE_SIZE = 224
VAL_SPLIT = 0.2
LABEL_SMOOTHING = 0.1
MIXUP_ALPHA = 0.2
GRAD_CLIP = 1.0


class MixupDataset(Dataset):
    """Wrapper that applies mixup augmentation."""
    def __init__(self, dataset, alpha=0.2):
        self.dataset = dataset
        self.alpha = alpha
        self.num_classes = len(dataset.dataset.classes) if hasattr(dataset, 'dataset') else len(dataset.classes)

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, idx):
        img1, label1 = self.dataset[idx]

        if random.random() < 0.5:  # 50% chance of mixup
            idx2 = random.randint(0, len(self.dataset) - 1)
            img2, label2 = self.dataset[idx2]
            lam = np.random.beta(self.alpha, self.alpha)
            lam = max(lam, 1 - lam)  # Ensure lam >= 0.5
            img = lam * img1 + (1 - lam) * img2
            return img, label1, label2, lam
        else:
            return img1, label1, label1, 1.0


def get_transforms():
    """Very aggressive augmentation for small dataset."""
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.5, 1.0), ratio=(0.75, 1.33)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(45),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1), shear=10),
        transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.15),
        transforms.RandomGrayscale(p=0.15),
        transforms.GaussianBlur(kernel_size=5, sigma=(0.1, 3.0)),
        transforms.RandomPosterize(bits=6, p=0.1),
        transforms.RandomAdjustSharpness(sharpness_factor=2, p=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.3, scale=(0.02, 0.2)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform


def create_model(num_classes: int) -> nn.Module:
    """ResNet18 - better for small datasets than ResNet50."""
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

    # Freeze layers 1 and 2 only, unfreeze 3, 4 and FC
    for name, param in model.named_parameters():
        if 'layer3' in name or 'layer4' in name or 'fc' in name:
            param.requires_grad = True
        else:
            param.requires_grad = False

    # Replace FC head
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(num_ftrs, 256),
        nn.BatchNorm1d(256),
        nn.ReLU(inplace=True),
        nn.Dropout(0.2),
        nn.Linear(256, num_classes)
    )

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    logger.info(f"Model: ResNet18 | Trainable params: {trainable:,} / {total:,} ({100*trainable/total:.1f}%)")

    return model


def get_weighted_sampler(dataset):
    """Create a weighted random sampler to handle class imbalance."""
    targets = [dataset.targets[i] for i in range(len(dataset))]
    class_counts = np.bincount(targets)
    class_weights = 1.0 / class_counts
    sample_weights = [class_weights[t] for t in targets]
    sampler = WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)
    return sampler


class ValSubset(Dataset):
    """Proper validation subset with val transforms."""
    def __init__(self, subset, transform):
        self.subset = subset
        self.transform = transform

    def __len__(self):
        return len(self.subset)

    def __getitem__(self, idx):
        original_idx = self.subset.indices[idx]
        path, label = self.subset.dataset.samples[original_idx]
        from PIL import Image
        img = Image.open(path).convert("RGB")
        img = self.transform(img)
        return img, label


def train_one_epoch_mixup(model, dataloader, criterion, optimizer, device):
    """Train for one epoch with mixup support."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for batch in dataloader:
        if len(batch) == 4:
            inputs, labels1, labels2, lam = batch
            inputs = inputs.to(device)
            labels1, labels2 = labels1.to(device), labels2.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)

            # Mixup loss
            loss = lam.unsqueeze(1).to(device) * criterion(outputs, labels1) + \
                   (1 - lam.unsqueeze(1).to(device)) * criterion(outputs, labels2)
            loss = loss.mean()

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels1.size(0)
            correct += predicted.eq(labels1).sum().item()
        else:
            inputs, labels = batch
            inputs, labels = inputs.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    return running_loss / total, correct / total


def validate(model, dataloader, criterion, device):
    """Validate the model."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    return running_loss / total, correct / total, all_preds, all_labels


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    # Load class names
    with open(CLASSES_PATH) as f:
        class_names = json.load(f)
    num_classes = len(class_names)
    logger.info(f"Number of classes: {num_classes}")

    if not DATASET_DIR.exists():
        logger.error(f"Dataset directory not found: {DATASET_DIR}")
        return

    # Create transforms
    train_transform, val_transform = get_transforms()

    # Load full dataset
    full_dataset = datasets.ImageFolder(DATASET_DIR, transform=train_transform)
    logger.info(f"Total images: {len(full_dataset)}")
    logger.info(f"Classes: {full_dataset.classes}")

    # Sync class names with ImageFolder order
    if list(full_dataset.classes) != class_names:
        class_names = list(full_dataset.classes)
        with open(CLASSES_PATH, 'w') as f:
            json.dump(class_names, f, indent=2)
        logger.info("Updated rock_classes.json to match dataset order")

    # Split train/val with stratification attempt
    val_size = int(len(full_dataset) * VAL_SPLIT)
    train_size = len(full_dataset) - val_size
    train_subset, val_subset = random_split(
        full_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )

    # Create proper val dataset with val transforms
    val_dataset = ValSubset(val_subset, val_transform)

    # Wrap train in mixup
    train_mixup = MixupDataset(train_subset, alpha=MIXUP_ALPHA)

    logger.info(f"Train size: {train_size}, Val size: {val_size}")

    # Weighted sampler for class balance
    # Get targets for training subset
    train_targets = [full_dataset.targets[i] for i in train_subset.indices]
    class_counts = np.bincount(train_targets, minlength=num_classes)
    class_weights = 1.0 / (class_counts + 1)
    sample_weights = [class_weights[t] for t in train_targets]
    train_sampler = WeightedRandomSampler(sample_weights, num_samples=len(sample_weights) * 3, replacement=True)

    train_loader = DataLoader(train_mixup, batch_size=BATCH_SIZE, sampler=train_sampler,
                              num_workers=2, pin_memory=False, drop_last=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False,
                            num_workers=2, pin_memory=False)

    logger.info(f"Train batches per epoch: {len(train_loader)} (3x oversampled)")

    # Create model
    model = create_model(num_classes).to(device)

    # Loss with label smoothing
    criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTHING)

    # Optimizer with differential learning rates
    backbone_params = []
    fc_params = []
    for name, param in model.named_parameters():
        if param.requires_grad:
            if 'fc' in name:
                fc_params.append(param)
            else:
                backbone_params.append(param)

    optimizer = optim.AdamW([
        {'params': backbone_params, 'lr': BACKBONE_LR},
        {'params': fc_params, 'lr': FC_LR},
    ], weight_decay=WEIGHT_DECAY)

    # Cosine annealing with warm restarts
    scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=10, T_mult=2)

    # Training loop
    best_val_acc = 0.0
    best_model_state = None
    patience_counter = 0
    max_patience = 12

    logger.info("=" * 70)
    logger.info("Starting training (ResNet18 + Mixup + LabelSmoothing + WeightedSampling)")
    logger.info("=" * 70)

    start_time = time.time()

    for epoch in range(NUM_EPOCHS):
        epoch_start = time.time()

        train_loss, train_acc = train_one_epoch_mixup(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, all_preds, all_labels = validate(model, val_loader, criterion, device)

        scheduler.step(epoch)

        epoch_time = time.time() - epoch_start
        current_lr = optimizer.param_groups[0]['lr']

        logger.info(
            f"Epoch [{epoch+1:2d}/{NUM_EPOCHS}] "
            f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f} | "
            f"LR: {current_lr:.6f} | Time: {epoch_time:.0f}s"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = copy.deepcopy(model.state_dict())
            patience_counter = 0
            logger.info(f"  >> New best! Val Acc: {val_acc:.4f}")
        else:
            patience_counter += 1

        if patience_counter >= max_patience:
            logger.info(f"Early stopping at epoch {epoch+1}")
            break

    total_time = time.time() - start_time
    logger.info("=" * 70)
    logger.info(f"Training complete in {total_time:.0f}s ({total_time/60:.1f} min)")
    logger.info(f"Best validation accuracy: {best_val_acc:.4f}")

    # Save best model
    if best_model_state:
        model.load_state_dict(best_model_state)
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        torch.save({
            'model_state_dict': best_model_state,
            'class_names': class_names,
            'num_classes': num_classes,
            'best_val_acc': best_val_acc,
            'architecture': 'resnet18_transfer',
        }, MODEL_SAVE_PATH)
        logger.info(f"Model saved to {MODEL_SAVE_PATH}")

        # Final report
        val_loss, val_acc, all_preds, all_labels = validate(model, val_loader, criterion, device)
        from sklearn.metrics import classification_report
        report = classification_report(all_labels, all_preds, target_names=class_names, zero_division=0)
        logger.info(f"\nClassification Report:\n{report}")

        # Per-class accuracy summary
        from collections import defaultdict
        correct_per_class = defaultdict(int)
        total_per_class = defaultdict(int)
        for pred, true in zip(all_preds, all_labels):
            total_per_class[true] += 1
            if pred == true:
                correct_per_class[true] += 1

        logger.info("\nPer-class accuracy:")
        for i, name in enumerate(class_names):
            if total_per_class[i] > 0:
                acc = correct_per_class[i] / total_per_class[i]
                logger.info(f"  {name:15s}: {acc:.0%} ({correct_per_class[i]}/{total_per_class[i]})")
    else:
        logger.error("No model was saved")


if __name__ == "__main__":
    main()
