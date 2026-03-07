"""
Model loading utilities.
Handles loading ML models at app startup.
"""

import logging
from ..models.rock_classifier import RockClassifier
from ..config import ROCK_MODEL_PATH, ROCK_CLASSES_PATH, MODEL_DEVICE

logger = logging.getLogger(__name__)


def load_rock_model() -> RockClassifier:
    """
    Load rock classification model. Called at app startup.
    """
    logger.info("Loading rock classification model...")

    if not ROCK_CLASSES_PATH.exists():
        raise FileNotFoundError(
            f"Rock classes file not found: {ROCK_CLASSES_PATH}\n"
            f"Please ensure {ROCK_CLASSES_PATH} exists."
        )

    if not ROCK_MODEL_PATH.exists():
        logger.warning(
            f"Rock model weights not found: {ROCK_MODEL_PATH}\n"
            f"Will use ImageNet pre-trained model with random final layer."
        )

    model = RockClassifier(
        model_path=str(ROCK_MODEL_PATH),
        classes_path=str(ROCK_CLASSES_PATH),
        device=MODEL_DEVICE,
    )

    logger.info("Rock classifier loaded successfully")
    return model
