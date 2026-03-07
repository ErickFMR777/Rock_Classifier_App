"""
Reference data endpoints.
Provides access to rock database and information.
"""

from fastapi import APIRouter, HTTPException
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

ROCKS_DATABASE = {
    "Granite": {"type": "Igneous - Intrusive", "color": "Light gray, white, pink", "grain_size": "Coarse", "description": "Light-colored igneous rock composed of quartz, feldspar, and mica."},
    "Basalt": {"type": "Igneous - Extrusive", "color": "Dark gray to black", "grain_size": "Fine", "description": "Dark volcanic rock, most common igneous rock on Earth."},
    "Limestone": {"type": "Sedimentary", "color": "White, gray, tan", "grain_size": "Variable", "description": "Sedimentary rock composed of calcium carbonate."},
    "Sandstone": {"type": "Sedimentary", "color": "Tan, brown, red", "grain_size": "Medium", "description": "Sedimentary rock formed from consolidated sand grains."},
    "Shale": {"type": "Sedimentary", "color": "Gray, black, brown", "grain_size": "Very fine", "description": "Fine-grained sedimentary rock formed from compressed mud."},
    "Slate": {"type": "Metamorphic", "color": "Gray, black, green", "grain_size": "Very fine", "description": "Metamorphic rock that splits into thin flat sheets."},
    "Marble": {"type": "Metamorphic", "color": "White, pink, gray", "grain_size": "Medium crystalline", "description": "Metamorphic rock formed from recrystallized limestone."},
    "Quartzite": {"type": "Metamorphic", "color": "White, gray, pink", "grain_size": "Medium crystalline", "description": "Hard metamorphic rock formed from sandstone."},
    "Gneiss": {"type": "Metamorphic", "color": "Banded light and dark", "grain_size": "Medium to coarse", "description": "High-grade metamorphic rock with distinctive banding."},
    "Schist": {"type": "Metamorphic", "color": "Silver, green, brown", "grain_size": "Medium to coarse", "description": "Metamorphic rock with strong foliation and visible mica."},
    "Diorite": {"type": "Igneous - Intrusive", "color": "Medium gray", "grain_size": "Coarse", "description": "Intrusive igneous rock with salt-and-pepper appearance."},
    "Pegmatite": {"type": "Igneous - Intrusive", "color": "Variable", "grain_size": "Very coarse", "description": "Igneous rock with exceptionally large crystals."},
    "Obsidian": {"type": "Igneous - Volcanic Glass", "color": "Black, dark brown", "grain_size": "Glassy", "description": "Volcanic glass formed from rapid lava cooling."},
    "Pumice": {"type": "Igneous - Volcanic", "color": "White, light gray", "grain_size": "Vesicular", "description": "Porous volcanic rock light enough to float on water."},
    "Andesite": {"type": "Igneous - Extrusive", "color": "Gray", "grain_size": "Fine", "description": "Intermediate volcanic rock common in subduction zones."},
    "Rhyolite": {"type": "Igneous - Extrusive", "color": "Light gray, pink", "grain_size": "Fine", "description": "Light-colored volcanic rock, extrusive equivalent of granite."},
    "Conglomerate": {"type": "Sedimentary", "color": "Multicolored", "grain_size": "Coarse (rounded)", "description": "Sedimentary rock composed of rounded pebbles."},
    "Breccia": {"type": "Sedimentary", "color": "Variable", "grain_size": "Coarse (angular)", "description": "Sedimentary rock composed of angular rock fragments."},
    "Tuff": {"type": "Igneous - Pyroclastic", "color": "White, tan", "grain_size": "Fine to medium", "description": "Rock formed from compacted volcanic ash."},
    "Flint": {"type": "Sedimentary", "color": "Black, dark gray", "grain_size": "Cryptocrystalline", "description": "Hard cryptocrystalline quartz used historically for tools."},
    "Chalk": {"type": "Sedimentary", "color": "White", "grain_size": "Very fine", "description": "Soft white rock composed of microscopic marine shells."},
    "Dolomite": {"type": "Sedimentary", "color": "White, gray, pink", "grain_size": "Fine to medium", "description": "Sedimentary rock similar to limestone with magnesium."},
    "Dunite": {"type": "Igneous - Ultramafic", "color": "Green, olive", "grain_size": "Coarse", "description": "Ultramafic rock composed mostly of olivine."},
    "Syenite": {"type": "Igneous - Intrusive", "color": "Gray, pink", "grain_size": "Coarse", "description": "Intrusive igneous rock similar to granite but low in quartz."},
    "Porphyry": {"type": "Igneous", "color": "Variable", "grain_size": "Mixed", "description": "Igneous rock with large crystals in a fine-grained matrix."},
}


@router.get("/rocks")
async def get_all_rocks():
    """Get all rock types in the database."""
    rocks = [
        {
            "id": i,
            "name": name,
            "type": data.get("type", "Unknown"),
            "color": data.get("color", "Variable"),
            "grain_size": data.get("grain_size", ""),
            "description": data.get("description", ""),
        }
        for i, (name, data) in enumerate(ROCKS_DATABASE.items(), 1)
    ]
    return {"rocks": rocks, "total": len(rocks)}


@router.get("/rocks/{rock_name}")
async def get_rock_details(rock_name: str):
    """Get detailed information about a specific rock type."""
    if rock_name not in ROCKS_DATABASE:
        raise HTTPException(status_code=404, detail=f"Rock type '{rock_name}' not found")
    return {"rock": rock_name, "details": ROCKS_DATABASE[rock_name]}
