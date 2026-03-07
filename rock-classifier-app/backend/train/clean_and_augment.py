"""
Clean dataset: remove corrupted/invalid images, verify all are loadable.
Then download additional images using icrawler with multiple search terms.
"""
import os
import sys
import time
import random
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

BASE_DIR = Path(__file__).parent.parent.parent
DATASET_DIR = BASE_DIR / "dataset"

def clean_dataset():
    """Remove corrupted or too-small images."""
    removed = 0
    kept = 0
    for cls_dir in sorted(DATASET_DIR.iterdir()):
        if not cls_dir.is_dir():
            continue
        for img_path in list(cls_dir.iterdir()):
            try:
                img = Image.open(img_path)
                img.verify()
                img = Image.open(img_path)
                if img.size[0] < 32 or img.size[1] < 32:
                    img_path.unlink()
                    removed += 1
                    continue
                img = img.convert("RGB")
                kept += 1
            except Exception:
                img_path.unlink()
                removed += 1
        count = len(list(cls_dir.iterdir()))
        print(f"  {cls_dir.name}: {count} valid images")
    print(f"\nCleaned: removed {removed}, kept {kept}")


def download_more_images():
    """Download additional rock images using icrawler with varied search terms."""
    try:
        from icrawler.builtin import BingImageCrawler, GoogleImageCrawler
    except ImportError:
        print("icrawler not installed, skipping download")
        return

    # Multiple search queries per rock type for variety
    search_variants = {
        "Andesite": ["andesite rock specimen", "andesite igneous rock", "andesite stone geology", "andesite volcanic rock sample"],
        "Basalt": ["basalt rock specimen", "basalt igneous rock", "basalt stone sample", "basalt volcanic rock close up"],
        "Breccia": ["breccia rock specimen", "breccia sedimentary rock", "breccia stone geology sample"],
        "Chalk": ["chalk rock specimen geology", "chalk sedimentary rock sample", "natural chalk stone"],
        "Conglomerate": ["conglomerate rock specimen", "conglomerate sedimentary rock", "conglomerate stone geology"],
        "Diorite": ["diorite rock specimen", "diorite igneous rock", "diorite stone sample geology"],
        "Dolomite": ["dolomite rock specimen", "dolomite stone geology", "dolomite mineral rock sample"],
        "Dunite": ["dunite rock specimen", "dunite igneous rock", "dunite ultramafic rock sample"],
        "Flint": ["flint rock specimen geology", "flint stone sample", "natural flint rock"],
        "Gneiss": ["gneiss rock specimen", "gneiss metamorphic rock", "gneiss stone sample geology"],
        "Granite": ["granite rock specimen", "granite igneous rock close up", "granite stone sample geology"],
        "Limestone": ["limestone rock specimen", "limestone sedimentary rock", "limestone stone geology sample"],
        "Marble": ["marble rock specimen geology", "marble metamorphic rock sample", "natural marble stone"],
        "Obsidian": ["obsidian rock specimen", "obsidian volcanic glass", "obsidian stone sample geology"],
        "Pegmatite": ["pegmatite rock specimen", "pegmatite igneous rock", "pegmatite crystal rock sample"],
        "Porphyry": ["porphyry rock specimen", "porphyry igneous rock", "porphyry stone geology sample"],
        "Pumice": ["pumice rock specimen", "pumice volcanic rock", "pumice stone sample geology"],
        "Quartzite": ["quartzite rock specimen", "quartzite metamorphic rock", "quartzite stone sample"],
        "Rhyolite": ["rhyolite rock specimen", "rhyolite volcanic rock", "rhyolite stone geology sample"],
        "Sandstone": ["sandstone rock specimen", "sandstone sedimentary rock", "sandstone stone geology sample"],
        "Schist": ["schist rock specimen", "schist metamorphic rock", "schist stone sample geology"],
        "Shale": ["shale rock specimen", "shale sedimentary rock", "shale stone geology sample"],
        "Slate": ["slate rock specimen geology", "slate metamorphic rock", "slate stone sample"],
        "Syenite": ["syenite rock specimen", "syenite igneous rock", "syenite stone geology sample"],
        "Tuff": ["tuff rock specimen", "volcanic tuff rock", "tuff stone geology sample"],
    }

    target_per_class = 80

    for rock_name, queries in search_variants.items():
        cls_dir = DATASET_DIR / rock_name
        cls_dir.mkdir(parents=True, exist_ok=True)
        current_count = len(list(cls_dir.iterdir()))

        if current_count >= target_per_class:
            print(f"  {rock_name}: already has {current_count} images, skipping")
            continue

        needed = target_per_class - current_count
        per_query = max(needed // len(queries), 10)

        print(f"  {rock_name}: has {current_count}, downloading ~{needed} more...")

        for query in queries:
            if len(list(cls_dir.iterdir())) >= target_per_class:
                break
            try:
                crawler = BingImageCrawler(
                    storage={"root_dir": str(cls_dir)},
                    log_level=40,  # ERROR only
                )
                crawler.crawl(
                    keyword=query,
                    max_num=per_query,
                    min_size=(100, 100),
                    filters={"type": "photo"},
                )
                time.sleep(random.uniform(1.0, 3.0))
            except Exception as e:
                print(f"    Error with '{query}': {e}")
                continue

        final_count = len(list(cls_dir.iterdir()))
        print(f"    {rock_name}: now has {final_count} images")


if __name__ == "__main__":
    print("=== Cleaning existing dataset ===")
    clean_dataset()
    print("\n=== Downloading additional images ===")
    download_more_images()
    print("\n=== Final cleanup ===")
    clean_dataset()
