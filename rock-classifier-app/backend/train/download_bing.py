"""
Download rock images using icrawler (Bing image search).
More reliable than DuckDuckGo for bulk downloads.
"""

import json
import logging
from pathlib import Path
from icrawler.builtin import BingImageCrawler
from PIL import Image
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent.parent
DATASET_DIR = BASE_DIR / "dataset"
CLASSES_PATH = BASE_DIR / "models" / "rock_classes.json"
TARGET_PER_CLASS = 60


def validate_images(class_dir: Path):
    """Remove corrupted or too-small images."""
    removed = 0
    for img_path in class_dir.iterdir():
        if not img_path.suffix.lower() in ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'):
            continue
        try:
            with Image.open(img_path) as img:
                img.verify()
            with Image.open(img_path) as img:
                w, h = img.size
                if w < 80 or h < 80:
                    img_path.unlink()
                    removed += 1
                    continue
                # Convert to JPG and save
                rgb = img.convert("RGB")
                new_path = img_path.with_suffix('.jpg')
                if new_path != img_path:
                    rgb.save(new_path, "JPEG", quality=90)
                    img_path.unlink()
                else:
                    rgb.save(new_path, "JPEG", quality=90)
        except Exception:
            if img_path.exists():
                img_path.unlink()
            removed += 1
    return removed


def download_rock_class(rock_name: str, target: int = TARGET_PER_CLASS):
    """Download images for a single rock class using Bing."""
    class_dir = DATASET_DIR / rock_name
    
    existing = len([f for f in class_dir.glob("*.jpg")]) if class_dir.exists() else 0
    if existing >= target:
        logger.info(f"[{rock_name}] Already has {existing} images, skipping")
        return existing
    
    need = target - existing
    queries = [
        f"{rock_name} rock specimen",
        f"{rock_name} stone geology",
        f"{rock_name} rock sample close up",
    ]
    
    for query in queries:
        if existing >= target:
            break
            
        class_dir.mkdir(parents=True, exist_ok=True)
        
        crawler = BingImageCrawler(
            storage={'root_dir': str(class_dir)},
            log_level=logging.WARNING
        )
        
        try:
            crawler.crawl(
                keyword=query,
                max_num=need // len(queries) + 10,
                min_size=(100, 100),
            )
        except Exception as e:
            logger.warning(f"[{rock_name}] Crawl failed for '{query}': {e}")
        
        # Validate and count
        removed = validate_images(class_dir)
        existing = len([f for f in class_dir.glob("*.jpg")])
        logger.info(f"[{rock_name}] After '{query}': {existing} images (removed {removed} bad)")
    
    return existing


def main():
    with open(CLASSES_PATH) as f:
        rock_classes = json.load(f)
    
    logger.info(f"Downloading images for {len(rock_classes)} rock types to {DATASET_DIR}")
    
    results = {}
    for rock in rock_classes:
        count = download_rock_class(rock)
        results[rock] = count
        logger.info(f"[{rock}] Final count: {count}")
    
    logger.info("\n" + "=" * 50)
    logger.info("DOWNLOAD SUMMARY:")
    total = 0
    for rock, count in results.items():
        status = "OK" if count >= 20 else "LOW" if count >= 10 else "CRITICAL"
        logger.info(f"  {rock:20s}: {count:3d} images [{status}]")
        total += count
    logger.info(f"  {'TOTAL':20s}: {total:3d} images")


if __name__ == "__main__":
    main()
