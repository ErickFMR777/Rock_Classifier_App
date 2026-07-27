"""
Build the training dataset from Wikimedia Commons.

Why Commons: it is the only large, openly-licensed image corpus with a public API
and no account required, and it re-hosts specimen photography from recognised
institutions — notably GeoDIL (Geoscience Digital Image Library), USGS and
university teaching collections. Every download records its licence and author
into dataset/MANIFEST.json so attribution can be honoured.

Why not category listings: Commons categories such as Category:Granite are
dominated by landscapes, buildings and countertops. Sampling them poisons the
dataset. This script uses targeted full-text search plus an aggressive
per-class blocklist instead, and prefers GeoDIL-tagged hand specimens.

Usage:
    python download_commons.py                # all classes
    python download_commons.py Granite Basalt # selected classes
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR / "dataset"
CLASSES_PATH = BASE_DIR / "models" / "rock_classes.json"
MANIFEST_PATH = DATASET_DIR / "MANIFEST.json"

API = "https://commons.wikimedia.org/w/api.php"

# Wikimedia's User-Agent policy asks automated clients to identify themselves
# with a contact. Combined with connection reuse below, this took the measured
# throughput from 7 images/min (almost everything answered 429) to ~100/min.
UA = {
    "User-Agent": (
        "RockClassifierDatasetBuilder/1.0 "
        "(https://github.com/ErickFMR777/Rock_Classifier_App; "
        "respaldoefmrunal1@gmail.com) python-requests"
    )
}

SESSION = requests.Session()
SESSION.headers.update(UA)

TARGET_PER_CLASS = 70
MIN_PER_CLASS = 30
THUMB_WIDTH = 640
MIN_PIXELS = 120
REQUEST_PAUSE = 0.6      # seconds between API calls
DOWNLOAD_PAUSE = 0.35    # seconds between image downloads (keep-alive session)

ALLOWED_EXT = (".jpg", ".jpeg", ".png")

# A title carrying one of these is specimen photography regardless of what else
# the filename mentions. Used by the top-up pass to waive SOFT_BLOCK.
SPECIMEN_MARKERS = [
    "geodil", "specimen", "sample", "hand ", "macro", "closeup", "close-up",
    "close up", "muestra", "handstück", "handstuck",
]

# Never acceptable: wrong modality or unmistakably not a rock photo.
HARD_BLOCK = [
    "thin section", "thinsection", "photomicrograph", "micrograph", "microscope",
    "microscopic", "polarized", "polarised", "xpl", "ppl", "sem ", "cathodolum",
    "diagram", "map", "chart", "graph", "sketch", "drawing", "illustration",
    "logo", "coat of arms", "flag", "seal of", "stamp", "coin", "banknote",
    "cross section", "profile", "graph of", "plot of", "spectrum",
    "portrait", "poster", "book", "cover", "title page", "page ", "manuscript",
    "signature", "label only", "plaque",
    "church", "cathedral", "basilica", "chapel", "temple", "mosque", "synagogue",
    "statue", "sculpture", "bust", "relief", "carving", "tomb", "grave",
    "headstone", "tombstone", "cemetery", "memorial", "obelisk",
]

# Rejected for every class: wrong subject, wrong modality or wrong scale.
GLOBAL_BLOCK = [
    # architecture / worked stone
    "church", "cathedral", "basilica", "chapel", "temple", "mosque", "synagogue",
    "building", "monument", "statue", "sculpture", "bust", "relief", "carving",
    "tomb", "grave", "headstone", "tombstone", "cemetery", "memorial", "obelisk",
    "bridge", "wall", "facade", "column", "pillar", "arch", "castle", "palace",
    "tile", "floor", "pavement", "countertop", "kitchen", "bathroom", "fireplace",
    "sink", "table", "furniture", "house", "museum interior", "staircase",
    # landscape / place
    "landscape", "panorama", "aerial", "mountain", "mount ", "cliff", "coast",
    "beach", "island", "valley", "canyon", "river", "lake", "waterfall", "glacier",
    "national park", "view of", "view from", "skyline", "village", "town", "city",
    "quarry", "mine ", "mining", "outcrop panorama", "hillside", "ridge", "peak",
    # wrong modality
    "thin section", "thinsection", "photomicrograph", "micrograph", "microscope",
    "microscopic", "polarized", "polarised", "xpl", "ppl", "sem ", "cathodolum",
    "diagram", "map", "chart", "graph", "sketch", "drawing", "illustration",
    "logo", "coat of arms", "flag", "seal of", "stamp", "coin", "banknote",
    "cross section", "profile", "graph of", "plot of", "spectrum",
    # documents / people
    "portrait", "poster", "book", "cover", "title page", "page ", "manuscript",
    "signature", "label only", "plaque",
]

# Per-class: extra search phrases and extra blocked words for that class's traps.
CLASS_CONFIG: dict[str, dict[str, list[str]]] = {
    "Granite": {
        "queries": ["granite hand sample", "granite rock specimen", "granite closeup macro"],
        "block": ["curling", "curling stone", "dome", "boulder field", "tor "],
    },
    "Basalt": {
        "queries": ["basalt hand sample", "basalt rock specimen", "vesicular basalt specimen"],
        "block": ["columnar", "column", "causeway", "giant's", "lava flow field", "organ pipes"],
    },
    "Limestone": {
        "queries": ["limestone hand sample", "limestone rock specimen", "fossiliferous limestone specimen"],
        "block": ["cave", "cavern", "karst", "stalact", "stalagm", "sinkhole", "gorge"],
    },
    "Sandstone": {
        "queries": ["sandstone hand sample", "sandstone rock specimen", "sandstone closeup"],
        "block": ["antelope", "formation of", "butte", "mesa", "hoodoo", "petra", "delicate arch"],
    },
    "Shale": {
        "queries": ["shale hand sample", "shale rock specimen", "oil shale specimen"],
        "block": ["gas well", "fracking", "drilling rig", "basin map"],
    },
    "Slate": {
        "queries": ["slate rock specimen", "slate hand sample", "roofing slate specimen"],
        "block": ["roof", "blackboard", "chalkboard", "billiard", "pool table", "magazine",
                  "writing slate", "slate industry", "shingle"],
    },
    "Marble": {
        "queries": ["marble rock specimen", "marble hand sample", "raw marble stone geology"],
        "block": ["marbles", "toy", "game", "glass marble", "sculpture", "statue", "michelangelo",
                  "carrara quarry", "slab", "polished slab", "cake"],
    },
    "Quartzite": {
        "queries": ["quartzite hand sample", "quartzite rock specimen", "quartzite closeup"],
        "block": ["ridge", "range", "hill"],
    },
    "Gneiss": {
        "queries": ["gneiss hand sample", "gneiss rock specimen", "banded gneiss specimen"],
        "block": ["dome", "terrain map"],
    },
    "Schist": {
        "queries": ["schist hand sample", "schist rock specimen", "mica schist specimen"],
        "block": [],
    },
    "Diorite": {
        "queries": ["diorite hand sample", "diorite rock specimen", "diorite closeup"],
        "block": ["hammurabi", "stele", "vase", "egyptian"],
    },
    "Pegmatite": {
        "queries": ["pegmatite hand sample", "pegmatite rock specimen", "graphic granite pegmatite"],
        "block": [],
    },
    "Obsidian": {
        "queries": ["obsidian rock specimen", "obsidian hand sample", "obsidian closeup"],
        "block": ["arrowhead", "blade", "knife", "tool", "artifact", "jewelry", "jewellery",
                  "sphere", "polished", "bead", "pendant", "mirror", "scalpel"],
    },
    "Pumice": {
        "queries": ["pumice rock specimen", "pumice hand sample", "pumice stone geology"],
        "block": ["exfoli", "cosmetic", "foot", "skin", "soap", "sponge"],
    },
    "Andesite": {
        "queries": ["andesite hand sample", "andesite rock specimen", "andesite closeup"],
        "block": [],
    },
    "Rhyolite": {
        "queries": ["rhyolite hand sample", "rhyolite rock specimen", "flow banded rhyolite specimen"],
        "block": [],
    },
    "Conglomerate": {
        "queries": ["conglomerate rock specimen", "conglomerate hand sample", "puddingstone specimen"],
        "block": ["company", "corporation", "business", "media"],
    },
    "Breccia": {
        "queries": ["breccia rock specimen", "breccia hand sample", "fault breccia specimen"],
        "block": ["impact crater map"],
    },
    "Tuff": {
        "queries": ["tuff rock specimen", "volcanic tuff hand sample", "welded tuff specimen"],
        "block": ["cappadocia", "cone", "dwelling", "fairy chimney", "church", "cave house"],
    },
    "Flint": {
        "queries": ["flint nodule specimen", "flint rock geology specimen", "flint chalk nodule"],
        "block": ["michigan", "flintstone", "lighter", "arrowhead", "blade", "tool", "knapp",
                  "axe", "artifact", "paleolithic", "neolithic", "handaxe", "musket", "lock",
                  "water crisis", "city of flint"],
    },
    "Chalk": {
        "queries": ["chalk rock specimen geology", "chalk hand sample geology", "cretaceous chalk specimen"],
        "block": ["blackboard", "chalkboard", "drawing", "pastel", "sidewalk", "billiard",
                  "cue", "gym", "climbing", "white cliffs", "chalk stream", "chalk figure",
                  "hill figure", "writing"],
    },
    "Dolomite": {
        "queries": ["dolomite rock specimen", "dolostone hand sample", "dolomite rock geology sample"],
        "block": ["dolomites", "dolomiti", "alps", "sella", "marmolada", "tre cime", "unesco",
                  "ski", "hut", "pass"],
    },
    "Dunite": {
        "queries": ["dunite rock specimen", "dunite hand sample", "olivine dunite rock",
                    "peridotite dunite specimen"],
        "block": [],
    },
    "Syenite": {
        "queries": ["syenite rock specimen", "syenite hand sample", "nepheline syenite specimen"],
        "block": [],
    },
    "Porphyry": {
        "queries": ["porphyry rock specimen", "porphyry hand sample", "porphyritic rock specimen"],
        "block": ["copper deposit", "ore deposit", "mine", "drill core shed", "imperial",
                  "roman", "column", "sarcophagus"],
    },
}


_last_call = 0.0


def _throttle(min_interval: float = REQUEST_PAUSE) -> None:
    """Serialise API calls. Commons answers 429 well before any documented quota."""
    global _last_call
    wait = min_interval - (time.monotonic() - _last_call)
    if wait > 0:
        time.sleep(wait)
    _last_call = time.monotonic()


def _retry_delay(resp: requests.Response | None, attempt: int) -> float:
    retry_after = resp.headers.get("Retry-After") if resp is not None else None
    if (retry_after or "").isdigit():
        return int(retry_after) + 0.5
    return 1.5 * (attempt + 1)


# Second-pass queries for classes the first pass leaves short. Commons is
# multilingual, and petrological synonyms/varieties surface specimens that the
# plain English name ranks too low to reach.
EXTRA_QUERIES: dict[str, list[str]] = {
    "Andesite": ["Andesit Gestein Handstück", "andesita roca muestra", "andésite échantillon",
                 "basaltic andesite specimen", "hornblende andesite specimen",
                 "pyroxene andesite sample", "andesite porphyry sample"],
    "Dunite": ["Dunit Gestein", "dunita muestra", "olivinite specimen",
               "olivine rock specimen", "dunite xenolith", "chromitite dunite sample"],
    "Diorite": ["Diorit Gestein Handstück", "diorita muestra", "quartz diorite specimen",
                "diorite porphyry sample", "tonalite specimen"],
    "Flint": ["Feuerstein Gestein", "silex nodule geologie", "flint nodule chalk specimen",
              "flint rock geology sample"],
    "Pumice": ["Bimsstein Gestein", "piedra pómez muestra", "pumice specimen geology",
               "pumice lapilli sample", "pumice pyroclastic specimen"],
    "Syenite": ["Syenit Gestein", "sienita muestra", "nepheline syenite specimen",
                "larvikite specimen"],
    "Rhyolite": ["Rhyolith Gestein", "riolita muestra", "rhyolite porphyry specimen",
                 "flow banded rhyolite sample"],
    "Tuff": ["Tuffstein Gestein", "toba volcánica muestra", "welded tuff specimen",
             "ignimbrite specimen"],
    "Obsidian": ["Obsidian Gestein", "obsidiana muestra", "snowflake obsidian specimen"],
    "Quartzite": ["Quarzit Gestein", "cuarcita muestra", "quartzite specimen geology"],
    "Pegmatite": ["Pegmatit Gestein", "pegmatita muestra", "graphic granite specimen"],
    "Porphyry": ["Porphyr Gestein", "pórfido muestra", "porphyritic texture specimen"],
    "Gneiss": ["Gneis Gestein Handstück", "gneis muestra", "augen gneiss specimen"],
    "Schist": ["Schiefer Gestein Handstück", "esquisto muestra", "garnet schist specimen"],
    "Slate": ["Tonschiefer Gestein", "pizarra roca muestra", "slate specimen geology"],
    "Marble": ["Marmor Gestein Handstück", "mármol roca muestra", "marble specimen geology"],
    "Chalk": ["Kreide Gestein", "creta roca muestra", "chalk specimen geology"],
    "Dolomite": ["Dolomit Gestein Handstück", "dolomía muestra", "dolostone specimen"],
    "Breccia": ["Brekzie Gestein", "brecha roca muestra", "breccia specimen geology"],
    "Conglomerate": ["Konglomerat Gestein", "conglomerado roca muestra"],
    "Shale": ["Schiefer Tonstein", "lutita muestra", "shale specimen geology"],
    "Limestone": ["Kalkstein Handstück", "caliza muestra", "limestone specimen geology"],
    "Sandstone": ["Sandstein Handstück", "arenisca muestra", "sandstone specimen geology"],
    "Basalt": ["Basalt Gestein Handstück", "basalto muestra", "basalt specimen geology"],
    "Granite": ["Granit Gestein Handstück", "granito muestra"],
}


def api_get(params: dict, tries: int = 5) -> dict:
    params["format"] = "json"
    # maxlag is the courtesy flag Wikimedia asks automated clients to send.
    params.setdefault("maxlag", "5")
    for attempt in range(tries):
        _throttle()
        try:
            resp = SESSION.get(API, params=params, timeout=45)
            if resp.status_code == 429:
                time.sleep(_retry_delay(resp, attempt))
                continue
            resp.raise_for_status()
            data = resp.json()
            if "error" in data and data["error"].get("code") == "maxlag":
                time.sleep(5)
                continue
            return data
        except Exception as exc:
            if attempt == tries - 1:
                logger.warning(f"API failed after {tries} tries: {exc}")
                return {}
            time.sleep(1.5 * (attempt + 1))
    return {}


def search_titles(query: str, limit: int = 120) -> list[str]:
    """Full-text search restricted to the File namespace."""
    titles, offset = [], 0
    while len(titles) < limit:
        data = api_get({
            "action": "query", "list": "search", "srsearch": query,
            "srnamespace": "6", "srlimit": str(min(50, limit - len(titles))),
            "sroffset": str(offset),
        })
        hits = data.get("query", {}).get("search", [])
        if not hits:
            break
        titles.extend(h["title"] for h in hits)
        offset += len(hits)
        if "continue" not in data:
            break
    return titles


def is_acceptable(title: str, blocked: list[str], relaxed: bool = False) -> bool:
    """
    `relaxed` is used by the top-up pass for under-represented classes. Volcanic
    rocks in particular lose most of their specimen photography to the geographic
    blocklist, because filenames legitimately name the volcano the sample came
    from ("Andesite, Mount Shasta"). When the title also carries a specimen
    marker, the geographic terms are waived; the hard blocks never are.
    """
    low = title.lower()
    if not low.endswith(ALLOWED_EXT):
        return False
    if any(word in low for word in HARD_BLOCK):
        return False
    if relaxed and any(marker in low for marker in SPECIMEN_MARKERS):
        return True
    return not any(word in low for word in blocked)


def fetch_imageinfo(titles: list[str]) -> dict[str, dict]:
    """Resolve titles to thumbnail URLs plus licence metadata, 40 at a time."""
    out: dict[str, dict] = {}
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        data = api_get({
            "action": "query", "titles": "|".join(chunk), "prop": "imageinfo",
            "iiprop": "url|size|extmetadata", "iiurlwidth": str(THUMB_WIDTH),
        })
        for page in data.get("query", {}).get("pages", {}).values():
            info = (page.get("imageinfo") or [{}])[0]
            if not info.get("thumburl"):
                continue
            meta = info.get("extmetadata", {})
            out[page["title"]] = {
                "thumburl": info["thumburl"],
                "descriptionurl": info.get("descriptionurl", ""),
                "license": meta.get("LicenseShortName", {}).get("value", "unknown"),
                "artist": re.sub("<[^>]+>", "", meta.get("Artist", {}).get("value", ""))[:200],
            }
    return out


_last_download = 0.0


def _throttle_download() -> None:
    global _last_download
    wait = DOWNLOAD_PAUSE - (time.monotonic() - _last_download)
    if wait > 0:
        time.sleep(wait)
    _last_download = time.monotonic()


def download(url: str, dest: Path, tries: int = 5) -> bool:
    """
    upload.wikimedia.org throttles hard and answers 429 with a short Retry-After.
    Requests go through the shared keep-alive session: reconnecting per image
    triggered a 429 on ~95% of downloads.
    """
    raw = b""
    for attempt in range(tries):
        _throttle_download()
        try:
            resp = SESSION.get(url, timeout=45)
            if resp.status_code == 429:
                if attempt == tries - 1:
                    return False
                time.sleep(_retry_delay(resp, attempt))
                continue
            resp.raise_for_status()
            raw = resp.content
            break
        except Exception:
            if attempt == tries - 1:
                return False
            time.sleep(1.0 * (attempt + 1))
    else:
        return False

    try:
        if len(raw) < 4000:
            return False
        img = Image.open(BytesIO(raw))
        img.verify()
        img = Image.open(BytesIO(raw)).convert("RGB")
        if min(img.size) < MIN_PIXELS:
            return False
        img.save(dest, "JPEG", quality=92)
        return True
    except Exception:
        return False


def build_class(rock: str, manifest: dict, relaxed: bool = False) -> int:
    cfg = CLASS_CONFIG.get(rock, {})
    blocked = GLOBAL_BLOCK + cfg.get("block", [])
    out_dir = DATASET_DIR / rock
    out_dir.mkdir(parents=True, exist_ok=True)

    have = len(list(out_dir.glob("*.jpg")))
    if have >= TARGET_PER_CLASS:
        logger.info(f"[{rock}] already has {have} images, skipping")
        return have

    # GeoDIL first: curated hand specimens photographed against neutral backgrounds.
    queries = [f'"GeoDIL" {rock}'] + cfg.get("queries", [f"{rock} rock specimen"])

    # Titles already on disk from an earlier run; re-downloading them would
    # duplicate images under new filenames and skew the class distribution.
    already: set[str] = {entry["title"] for entry in manifest.get(rock, [])}

    if relaxed:
        # Second pass: multilingual and varietal phrasings, and geographic terms
        # waived when the title still reads as specimen photography.
        queries = EXTRA_QUERIES.get(rock, []) + queries

    seen: set[str] = set(already)
    candidates: list[str] = []
    for q in queries:
        for t in search_titles(q, limit=80):
            if t not in seen and is_acceptable(t, blocked, relaxed=relaxed):
                seen.add(t)
                candidates.append(t)
        logger.info(f"[{rock}] '{q}' -> {len(candidates)} candidates so far")
        if len(candidates) >= TARGET_PER_CLASS * 3:
            break

    info = fetch_imageinfo(candidates)

    saved = have
    for title in candidates:
        if saved >= TARGET_PER_CLASS:
            break
        meta = info.get(title)
        if not meta or title in already:
            continue
        dest = out_dir / f"{rock.lower()}_{saved:04d}.jpg"
        if download(meta["thumburl"], dest):
            manifest.setdefault(rock, []).append({
                "file": dest.name, "title": title,
                "license": meta["license"], "artist": meta["artist"],
                "source": meta["descriptionurl"],
            })
            saved += 1

    level = logging.WARNING if saved < MIN_PER_CLASS else logging.INFO
    logger.log(level, f"[{rock}] saved {saved} images")
    return saved


def main() -> None:
    classes = json.loads(CLASSES_PATH.read_text(encoding="utf-8"))
    args = sys.argv[1:]
    # --topup: re-run only the classes still below target, with the widened
    # query set and the relaxed filter, to flatten the class distribution.
    relaxed = "--topup" in args
    wanted = [a for a in args if not a.startswith("--")] or classes
    DATASET_DIR.mkdir(parents=True, exist_ok=True)

    # Explicit UTF-8: Commons artist names carry accents and Windows would
    # otherwise default to cp1252 and abort the whole run on write.
    manifest = (
        json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        if MANIFEST_PATH.exists() else {}
    )

    counts = {}
    for rock in wanted:
        counts[rock] = build_class(rock, manifest, relaxed=relaxed)
        MANIFEST_PATH.write_text(
            json.dumps(manifest, indent=1, ensure_ascii=False), encoding="utf-8"
        )

    print("\n" + "=" * 46)
    print(f"{'Class':<15}{'Images':>8}")
    print("-" * 46)
    for rock, n in sorted(counts.items(), key=lambda kv: kv[1]):
        flag = "  <-- LOW" if n < MIN_PER_CLASS else ""
        print(f"{rock:<15}{n:>8}{flag}")
    print("-" * 46)
    print(f"{'TOTAL':<15}{sum(counts.values()):>8}")


if __name__ == "__main__":
    main()
