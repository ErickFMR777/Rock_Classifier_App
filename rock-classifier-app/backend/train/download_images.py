"""
Download rock images for training using DuckDuckGo image search.
"""

import os
import time
import hashlib
import logging
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from duckduckgo_search import DDGS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Search queries per rock type for better variety
SEARCH_QUERIES = {
    "Granite": ["granite rock sample", "granite stone specimen", "granite geology", "raw granite rock"],
    "Basalt": ["basalt rock sample", "basalt stone specimen", "basalt geology", "raw basalt rock"],
    "Limestone": ["limestone rock sample", "limestone stone specimen", "limestone geology"],
    "Sandstone": ["sandstone rock sample", "sandstone stone specimen", "sandstone geology"],
    "Shale": ["shale rock sample", "shale stone specimen", "shale geology"],
    "Slate": ["slate rock sample", "slate stone specimen", "slate geology"],
    "Marble": ["marble rock sample", "marble stone specimen", "marble geology raw"],
    "Quartzite": ["quartzite rock sample", "quartzite stone specimen", "quartzite geology"],
    "Gneiss": ["gneiss rock sample", "gneiss stone specimen", "gneiss geology"],
    "Schist": ["schist rock sample", "schist stone specimen", "schist geology"],
    "Diorite": ["diorite rock sample", "diorite stone specimen", "diorite geology"],
    "Pegmatite": ["pegmatite rock sample", "pegmatite stone specimen", "pegmatite geology"],
    "Obsidian": ["obsidian rock sample", "obsidian stone specimen", "obsidian geology natural"],
    "Pumice": ["pumice rock sample", "pumice stone specimen", "pumice geology"],
    "Andesite": ["andesite rock sample", "andesite stone specimen", "andesite geology"],
    "Rhyolite": ["rhyolite rock sample", "rhyolite stone specimen", "rhyolite geology"],
    "Conglomerate": ["conglomerate rock sample", "conglomerate stone specimen", "conglomerate geology"],
    "Breccia": ["breccia rock sample", "breccia stone specimen", "breccia geology"],
    "Tuff": ["tuff rock sample", "volcanic tuff specimen", "tuff geology"],
    "Flint": ["flint rock sample", "flint stone specimen", "flint geology natural"],
    "Chalk": ["chalk rock sample geology", "chalk stone specimen", "chalk geology natural"],
    "Dolomite": ["dolomite rock sample", "dolomite stone specimen", "dolomite geology"],
    "Dunite": ["dunite rock sample", "dunite stone specimen", "dunite geology"],
    "Syenite": ["syenite rock sample", "syenite stone specimen", "syenite geology"],
    "Porphyry": ["porphyry rock sample", "porphyry stone specimen", "porphyry geology"],
}

IMAGES_PER_QUERY = 30
MAX_IMAGES_PER_CLASS = 80
DATASET_DIR = Path(__file__).parent.parent.parent / "dataset"


def download_single_image(url: str, save_path: Path, timeout: int = 10) -> bool:
    """Download a single image from URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=timeout, stream=True)
        resp.raise_for_status()

        content_type = resp.headers.get('content-type', '')
        if 'image' not in content_type and not url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            return False

        content = resp.content
        if len(content) < 5000:  # Skip tiny images
            return False
        if len(content) > 10_000_000:  # Skip huge images
            return False

        # Verify it's a valid image
        from PIL import Image
        from io import BytesIO
        img = Image.open(BytesIO(content))
        img.verify()

        # Re-open after verify
        img = Image.open(BytesIO(content)).convert("RGB")
        w, h = img.size
        if w < 100 or h < 100:
            return False

        img.save(save_path, "JPEG", quality=90)
        return True
    except Exception:
        return False


def search_images(rock_name: str, query: str, max_results: int = 30) -> list[str]:
    """Search for images using DuckDuckGo."""
    try:
        with DDGS() as ddgs:
            results = ddgs.images(query, max_results=max_results)
            urls = [r["image"] for r in results if r.get("image")]
            return urls
    except Exception as e:
        logger.warning(f"Search failed for '{query}': {e}")
        return []


def download_rock_images(rock_name: str, output_dir: Path, max_images: int = MAX_IMAGES_PER_CLASS):
    """Download images for a single rock type."""
    rock_dir = output_dir / rock_name
    rock_dir.mkdir(parents=True, exist_ok=True)

    existing = len(list(rock_dir.glob("*.jpg")))
    if existing >= max_images:
        logger.info(f"[{rock_name}] Already have {existing} images, skipping.")
        return existing

    queries = SEARCH_QUERIES.get(rock_name, [f"{rock_name} rock sample"])
    all_urls = []

    for query in queries:
        urls = search_images(rock_name, query, IMAGES_PER_QUERY)
        all_urls.extend(urls)
        time.sleep(1)  # Rate limiting

    # Deduplicate by URL hash
    seen = set()
    unique_urls = []
    for url in all_urls:
        url_hash = hashlib.md5(url.encode()).hexdigest()
        if url_hash not in seen:
            seen.add(url_hash)
            unique_urls.append(url)

    logger.info(f"[{rock_name}] Found {len(unique_urls)} unique URLs")

    downloaded = existing
    for i, url in enumerate(unique_urls):
        if downloaded >= max_images:
            break
        fname = f"{rock_name.lower()}_{downloaded:04d}.jpg"
        save_path = rock_dir / fname
        if download_single_image(url, save_path):
            downloaded += 1

    logger.info(f"[{rock_name}] Total images: {downloaded}")
    return downloaded


def main():
    import json
    classes_path = Path(__file__).parent.parent.parent / "models" / "rock_classes.json"
    with open(classes_path) as f:
        rock_classes = json.load(f)

    logger.info(f"Downloading images for {len(rock_classes)} rock types")
    logger.info(f"Dataset directory: {DATASET_DIR}")

    total = 0
    for rock in rock_classes:
        count = download_rock_images(rock, DATASET_DIR)
        total += count
        logger.info(f"Progress: {rock} done ({count} images)")

    logger.info(f"Download complete! Total images: {total}")


if __name__ == "__main__":
    main()
