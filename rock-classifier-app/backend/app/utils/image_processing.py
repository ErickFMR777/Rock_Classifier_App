"""
Image processing utilities.
Validates, preprocesses, and handles image files.
"""

from fastapi import UploadFile, HTTPException
from pathlib import Path
import tempfile
import logging
from PIL import Image

from ..config import IMAGE_MAX_SIZE, ALLOWED_EXTENSIONS, IMAGE_SIZE

logger = logging.getLogger(__name__)


async def validate_image(file: UploadFile) -> str:
    """
    Validate uploaded image file and save to a temporary location.

    Returns:
        Path to temporary file
    """
    # Check file extension
    filename = file.filename or "unknown.jpg"
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file_ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file contents
    contents = await file.read()

    # Check file size
    if len(contents) > IMAGE_MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {IMAGE_MAX_SIZE / 1024 / 1024:.1f}MB",
        )

    # Save to temporary file first so we can validate
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    # Validate image can be opened
    try:
        img = Image.open(tmp_path)
        img.verify()
    except Exception as e:
        Path(tmp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    logger.info(f"Image validated and saved: {tmp_path}")
    return tmp_path


def resize_image(image_path: str, size: int = IMAGE_SIZE) -> Image.Image:
    """Resize image to standard size."""
    img = Image.open(image_path).convert("RGB")
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img
