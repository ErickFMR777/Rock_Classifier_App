"""
Rock Classification Model.
Handles PyTorch model loading and inference.
"""

import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from pathlib import Path
import json
import logging
import time

logger = logging.getLogger(__name__)


class RockClassifier:
    """
    Loads and manages a ResNet50 rock classification model.
    """

    def __init__(self, model_path: str, classes_path: str, device: str = "cpu"):
        self.device = torch.device(device)
        self.model_path = Path(model_path)
        self.classes_path = Path(classes_path)

        # Load class labels
        if not self.classes_path.exists():
            raise FileNotFoundError(f"Classes file not found: {self.classes_path}")

        with open(self.classes_path, "r") as f:
            self.classes = json.load(f)

        logger.info(f"Loaded {len(self.classes)} rock classes")

        # Initialize model architecture
        self.model = self._initialize_model()

        # Load pre-trained weights if they exist
        if self.model_path.exists():
            self._load_weights()
        else:
            logger.warning(f"Model weights not found: {self.model_path}")
            logger.info("Using ImageNet pre-trained model with random final layer")

        self.model.eval()
        self.model.to(self.device)

        # Image preprocessing pipeline (ImageNet standard)
        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        )

    def _initialize_model(self) -> nn.Module:
        """Initialize ResNet50 architecture with custom output classes."""
        num_classes = len(self.classes)
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, num_classes)
        logger.info(f"Initialized ResNet50 with {num_classes} output classes")
        return model

    def _load_weights(self):
        """Load saved model weights from checkpoint."""
        try:
            checkpoint = torch.load(
                self.model_path, map_location=self.device, weights_only=True
            )
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                self.model.load_state_dict(checkpoint["model_state_dict"])
            else:
                self.model.load_state_dict(checkpoint)
            logger.info(f"Loaded model weights from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load model weights: {e}")
            raise

    def predict(self, image_path: str, top_k: int = 5) -> dict:
        """
        Classify a rock image and return predictions.

        Args:
            image_path: Path to image file
            top_k: Number of top predictions to return

        Returns:
            Dictionary with primary classification and alternatives
        """
        from PIL import Image

        image_path = Path(image_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        start_time = time.time()

        # Load and preprocess image
        image = Image.open(image_path).convert("RGB")
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)

        # Inference
        with torch.no_grad():
            logits = self.model(image_tensor)
            probabilities = torch.softmax(logits, dim=1)[0]

        # Get top-k predictions
        top_probs, top_indices = torch.topk(
            probabilities, k=min(top_k, len(self.classes))
        )

        primary_idx = top_indices[0].item()
        primary_class = self.classes[primary_idx]
        primary_confidence = float(top_probs[0].item())

        alternatives = [
            {"class": self.classes[idx.item()], "confidence": float(prob.item())}
            for idx, prob in zip(top_indices[1:], top_probs[1:])
        ]

        inference_time = int((time.time() - start_time) * 1000)

        return {
            "primary": {"class": primary_class, "confidence": primary_confidence},
            "alternatives": alternatives,
            "inference_time_ms": inference_time,
        }
