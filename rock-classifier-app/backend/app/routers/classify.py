"""
Classification endpoints.
Handles rock image classification requests.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pathlib import Path
import logging

from ..schemas.classification import ClassificationResponse
from ..utils.image_processing import validate_image

logger = logging.getLogger(__name__)
router = APIRouter()

# Rock geological information database (all 25 types)
ROCK_DATABASE = {
    "Granite": {
        "class": "Granite",
        "confidence": 0.0,
        "type": "Igneous - Intrusive",
        "color": "Light gray, white, pink",
        "grain_size": "Coarse (> 5 mm)",
        "mineral_composition": ["Quartz 30-40%", "Feldspar 50-60%", "Mica 10-20%"],
        "formation": [
            "Formed from slow cooling of magma",
            "Found in continental crust",
            "Common in mountain roots",
        ],
        "uses": [
            "Building material (countertops, monuments)",
            "Decorative stone",
            "Aggregate in concrete",
        ],
        "description": "Granite is a light-colored, hard igneous rock composed primarily of quartz, feldspar, and mica minerals. It forms deep underground from the slow cooling of magma.",
    },
    "Basalt": {
        "class": "Basalt",
        "confidence": 0.0,
        "type": "Igneous - Extrusive",
        "color": "Dark gray to black",
        "grain_size": "Fine (< 1 mm)",
        "mineral_composition": ["Pyroxene", "Feldspar", "Magnetite"],
        "formation": [
            "Formed from rapid cooling of lava",
            "Most common volcanic rock",
            "Forms oceanic crust",
        ],
        "uses": [
            "Aggregate for roads",
            "Decorative stone",
            "Crushed stone for construction",
        ],
        "description": "Basalt is a dark, dense volcanic rock with a fine grain size. It forms from the rapid cooling of lava flows at the Earth's surface.",
    },
    "Limestone": {
        "class": "Limestone",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "White, gray, tan, brown",
        "grain_size": "Variable",
        "mineral_composition": ["Calcite (CaCO3)"],
        "formation": [
            "Formed from accumulation of shells and organisms",
            "Precipitated from seawater",
            "Marine environments",
        ],
        "uses": ["Cement production", "Building stone", "Aggregate", "Agriculture (soil amendment)"],
        "description": "Limestone is a sedimentary rock composed primarily of calcium carbonate. It forms from the accumulation of shells, corals, and other marine organisms.",
    },
    "Sandstone": {
        "class": "Sandstone",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "Tan, brown, red, white, gray",
        "grain_size": "Medium (0.06-2 mm sand)",
        "mineral_composition": ["Quartz", "Feldspar", "Mica"],
        "formation": [
            "Formed from consolidated sand grains",
            "Deposited in rivers, beaches, deserts",
            "Compacted and cemented over time",
        ],
        "uses": ["Building stone", "Decorative stone", "Glass sand", "Abrasive material"],
        "description": "Sandstone is a clastic sedimentary rock formed from consolidated sand-sized mineral grains. It is commonly tan, red, or brown and has a grainy texture.",
    },
    "Shale": {
        "class": "Shale",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "Gray, black, brown, red",
        "grain_size": "Very fine (< 0.004 mm)",
        "mineral_composition": ["Clay minerals", "Quartz", "Feldspar"],
        "formation": [
            "Formed from compressed mud and clay",
            "Deposited in calm water environments",
            "Most common sedimentary rock",
        ],
        "uses": ["Brick making", "Cement production", "Oil shale extraction"],
        "description": "Shale is a fine-grained sedimentary rock formed from compressed mud. It splits easily into thin layers and is the most common sedimentary rock.",
    },
    "Slate": {
        "class": "Slate",
        "confidence": 0.0,
        "type": "Metamorphic",
        "color": "Gray, black, green, purple",
        "grain_size": "Very fine",
        "mineral_composition": ["Mica", "Chlorite", "Quartz"],
        "formation": [
            "Formed from metamorphism of shale",
            "Low-grade metamorphic rock",
            "Develops slaty cleavage",
        ],
        "uses": ["Roofing tiles", "Floor tiles", "Blackboards", "Decorative stone"],
        "description": "Slate is a fine-grained metamorphic rock derived from shale. It is known for its ability to split into thin, flat sheets.",
    },
    "Marble": {
        "class": "Marble",
        "confidence": 0.0,
        "type": "Metamorphic",
        "color": "White, pink, gray, green",
        "grain_size": "Medium to coarse crystalline",
        "mineral_composition": ["Calcite", "Dolomite"],
        "formation": [
            "Formed from metamorphism of limestone",
            "Recrystallization under heat and pressure",
            "Develops interlocking crystal texture",
        ],
        "uses": ["Sculpture material", "Building facades", "Countertops", "Decorative stone"],
        "description": "Marble is a metamorphic rock formed from recrystallized limestone. It is prized for its beauty and has been used in art and architecture for millennia.",
    },
    "Quartzite": {
        "class": "Quartzite",
        "confidence": 0.0,
        "type": "Metamorphic",
        "color": "White, gray, pink, red",
        "grain_size": "Medium crystalline",
        "mineral_composition": ["Quartz (> 90%)"],
        "formation": [
            "Formed from metamorphism of sandstone",
            "Quartz grains recrystallize and fuse",
            "Very hard and resistant to weathering",
        ],
        "uses": ["Decorative stone", "Countertops", "Road construction", "Railway ballast"],
        "description": "Quartzite is a hard, non-foliated metamorphic rock formed from sandstone. It is composed almost entirely of quartz and is extremely durable.",
    },
    "Gneiss": {
        "class": "Gneiss",
        "confidence": 0.0,
        "type": "Metamorphic",
        "color": "Light and dark banded",
        "grain_size": "Medium to coarse",
        "mineral_composition": ["Feldspar", "Quartz", "Mica", "Amphibole"],
        "formation": [
            "High-grade metamorphism of various rocks",
            "Develops characteristic banding",
            "Forms deep in the crust under extreme pressure",
        ],
        "uses": ["Building stone", "Countertops", "Decorative landscaping"],
        "description": "Gneiss is a high-grade metamorphic rock with distinctive banding of light and dark minerals. It forms under extreme heat and pressure deep in the Earth's crust.",
    },
    "Schist": {
        "class": "Schist",
        "confidence": 0.0,
        "type": "Metamorphic",
        "color": "Silver, green, brown",
        "grain_size": "Medium to coarse",
        "mineral_composition": ["Mica", "Chlorite", "Talc", "Garnet"],
        "formation": [
            "Medium-grade metamorphism",
            "Develops strong foliation (schistosity)",
            "Often contains visible mineral crystals",
        ],
        "uses": ["Decorative stone", "Landscaping", "Historical building material"],
        "description": "Schist is a medium-grade metamorphic rock characterized by its strong foliation and visible mineral grains, especially micas that give it a shiny appearance.",
    },
    "Diorite": {
        "class": "Diorite",
        "confidence": 0.0,
        "type": "Igneous - Intrusive",
        "color": "Medium gray (salt-and-pepper)",
        "grain_size": "Coarse",
        "mineral_composition": ["Plagioclase feldspar", "Hornblende", "Biotite"],
        "formation": [
            "Formed from slow cooling of intermediate magma",
            "Crystallizes beneath the surface",
            "Intermediate between granite and gabbro",
        ],
        "uses": ["Building stone", "Decorative stone", "Aggregate"],
        "description": "Diorite is an intrusive igneous rock with an intermediate composition, giving it a characteristic salt-and-pepper appearance.",
    },
    "Pegmatite": {
        "class": "Pegmatite",
        "confidence": 0.0,
        "type": "Igneous - Intrusive",
        "color": "Variable (light colors common)",
        "grain_size": "Very coarse (> 2.5 cm)",
        "mineral_composition": ["Quartz", "Feldspar", "Mica", "Rare minerals"],
        "formation": [
            "Formed from last stages of magma crystallization",
            "Extremely large crystals due to volatile-rich fluids",
            "Often contains rare earth minerals",
        ],
        "uses": ["Source of rare minerals", "Gemstone mining", "Industrial minerals"],
        "description": "Pegmatite is an intrusive igneous rock with exceptionally large crystals, formed during the final stages of magma cooling when volatile-rich fluids promote crystal growth.",
    },
    "Obsidian": {
        "class": "Obsidian",
        "confidence": 0.0,
        "type": "Igneous - Extrusive (Volcanic Glass)",
        "color": "Black, dark brown, mahogany",
        "grain_size": "Glassy (no crystals)",
        "mineral_composition": ["Volcanic glass (SiO2-rich)"],
        "formation": [
            "Formed from extremely rapid cooling of lava",
            "High silica content prevents crystallization",
            "Found near volcanic vents",
        ],
        "uses": ["Surgical scalpels", "Jewelry", "Historical tools and weapons"],
        "description": "Obsidian is a naturally occurring volcanic glass formed when lava cools so rapidly that crystals cannot form. It has a glassy luster and conchoidal fracture.",
    },
    "Pumice": {
        "class": "Pumice",
        "confidence": 0.0,
        "type": "Igneous - Extrusive (Volcanic)",
        "color": "White, light gray, cream",
        "grain_size": "Vesicular (porous)",
        "mineral_composition": ["Volcanic glass with gas bubbles"],
        "formation": [
            "Formed from gas-rich explosive volcanic eruptions",
            "Trapped gas creates porous texture",
            "Can float on water due to low density",
        ],
        "uses": ["Abrasive products", "Lightweight concrete", "Horticulture", "Cosmetics"],
        "description": "Pumice is an extremely porous volcanic rock that forms during explosive eruptions. Its many trapped gas bubbles make it light enough to float on water.",
    },
    "Andesite": {
        "class": "Andesite",
        "confidence": 0.0,
        "type": "Igneous - Extrusive",
        "color": "Gray, dark gray",
        "grain_size": "Fine to medium",
        "mineral_composition": ["Plagioclase", "Pyroxene", "Hornblende"],
        "formation": [
            "Formed from intermediate volcanic eruptions",
            "Common in subduction zone volcanoes",
            "Named after the Andes mountains",
        ],
        "uses": ["Building stone", "Road aggregate", "Decorative stone"],
        "description": "Andesite is an intermediate volcanic rock commonly found in subduction zone volcanoes. It is named after the Andes Mountains where it is abundant.",
    },
    "Rhyolite": {
        "class": "Rhyolite",
        "confidence": 0.0,
        "type": "Igneous - Extrusive",
        "color": "Light gray, pink, tan",
        "grain_size": "Fine (often with phenocrysts)",
        "mineral_composition": ["Quartz", "Feldspar", "Biotite"],
        "formation": [
            "Formed from silica-rich volcanic eruptions",
            "Extrusive equivalent of granite",
            "Often associated with explosive eruptions",
        ],
        "uses": ["Decorative stone", "Aggregate", "Historical tool-making"],
        "description": "Rhyolite is a light-colored, fine-grained volcanic rock that is the extrusive equivalent of granite. It forms from highly viscous, silica-rich lava.",
    },
    "Conglomerate": {
        "class": "Conglomerate",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "Variable (multicolored pebbles)",
        "grain_size": "Coarse (rounded pebbles > 2 mm)",
        "mineral_composition": ["Various rock fragments", "Quartz", "Feldspar"],
        "formation": [
            "Formed from rounded gravel and pebbles",
            "Deposited by rivers and streams",
            "Cemented by minerals over time",
        ],
        "uses": ["Decorative stone", "Aggregate", "Geological study"],
        "description": "Conglomerate is a coarse-grained sedimentary rock composed of rounded pebbles and gravel cemented together. The rounded nature of its fragments indicates transport by water.",
    },
    "Breccia": {
        "class": "Breccia",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "Variable",
        "grain_size": "Coarse (angular fragments > 2 mm)",
        "mineral_composition": ["Various angular rock fragments"],
        "formation": [
            "Formed from angular broken rock fragments",
            "Minimal transport (fragments remain angular)",
            "Can form from landslides, faults, or volcanic activity",
        ],
        "uses": ["Decorative stone", "Geological study", "Building material"],
        "description": "Breccia is a coarse-grained sedimentary rock composed of angular rock fragments. Unlike conglomerate, its sharp-edged fragments indicate little to no water transport.",
    },
    "Tuff": {
        "class": "Tuff",
        "confidence": 0.0,
        "type": "Igneous - Pyroclastic",
        "color": "White, tan, brown, green",
        "grain_size": "Fine to medium (ash-sized)",
        "mineral_composition": ["Volcanic ash", "Glass fragments", "Crystal fragments"],
        "formation": [
            "Formed from compacted volcanic ash",
            "Deposited during explosive eruptions",
            "Lithified volcanic debris",
        ],
        "uses": ["Building stone", "Lightweight construction", "Historical architecture"],
        "description": "Tuff is a rock formed from compacted volcanic ash ejected during explosive eruptions. It is relatively soft and has been used as building stone throughout history.",
    },
    "Flint": {
        "class": "Flint",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "Black, dark gray, brown",
        "grain_size": "Cryptocrystalline (very fine)",
        "mineral_composition": ["Chalcedony (microcrystalline quartz)"],
        "formation": [
            "Formed from silica-rich solutions in limestone",
            "Nodular formation in chalk and limestone",
            "Biogenic silica from marine organisms",
        ],
        "uses": ["Historical tool-making", "Fire-starting", "Building material"],
        "description": "Flint is a hard, sedimentary cryptocrystalline form of quartz. It was one of humanity's first tool-making materials due to its conchoidal fracture properties.",
    },
    "Chalk": {
        "class": "Chalk",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "White, off-white",
        "grain_size": "Very fine (microscopic)",
        "mineral_composition": ["Calcite (from coccolithophores)"],
        "formation": [
            "Formed from microscopic marine organisms",
            "Accumulated on deep ocean floors",
            "Composed of coccolithophore shells",
        ],
        "uses": ["Writing chalk", "Cement production", "Agriculture", "Cosmetics"],
        "description": "Chalk is a soft, white, porous sedimentary rock composed of the microscopic shells of marine organisms called coccolithophores.",
    },
    "Dolomite": {
        "class": "Dolomite",
        "confidence": 0.0,
        "type": "Sedimentary",
        "color": "White, gray, pink, tan",
        "grain_size": "Fine to medium crystalline",
        "mineral_composition": ["Dolomite mineral CaMg(CO3)2"],
        "formation": [
            "Formed from alteration of limestone",
            "Magnesium-rich fluids replace calcium",
            "Process called dolomitization",
        ],
        "uses": ["Construction aggregate", "Cement production", "Refractory material", "Soil conditioner"],
        "description": "Dolomite is a sedimentary rock similar to limestone but composed of the mineral dolomite (calcium magnesium carbonate) rather than pure calcite.",
    },
    "Dunite": {
        "class": "Dunite",
        "confidence": 0.0,
        "type": "Igneous - Intrusive (Ultramafic)",
        "color": "Green, olive green, yellowish",
        "grain_size": "Coarse",
        "mineral_composition": ["Olivine (> 90%)", "Chromite", "Pyroxene"],
        "formation": [
            "Formed deep in the Earth's mantle",
            "Olivine-rich ultramafic rock",
            "Found in ophiolite complexes",
        ],
        "uses": ["Source of olivine", "Refractory material", "CO2 sequestration research"],
        "description": "Dunite is an ultramafic plutonic rock composed almost entirely of olivine. It forms deep in the Earth's mantle and is brought to the surface through tectonic processes.",
    },
    "Syenite": {
        "class": "Syenite",
        "confidence": 0.0,
        "type": "Igneous - Intrusive",
        "color": "Gray, pink, white",
        "grain_size": "Coarse",
        "mineral_composition": ["Alkali feldspar", "Hornblende", "Biotite"],
        "formation": [
            "Formed from slow cooling of alkaline magma",
            "Similar to granite but with less quartz",
            "Found in continental rift zones",
        ],
        "uses": ["Building stone", "Decorative stone", "Dimension stone"],
        "description": "Syenite is a coarse-grained intrusive igneous rock similar to granite but containing very little quartz. It is composed mainly of alkali feldspar.",
    },
    "Porphyry": {
        "class": "Porphyry",
        "confidence": 0.0,
        "type": "Igneous",
        "color": "Variable (depends on composition)",
        "grain_size": "Mixed (large crystals in fine matrix)",
        "mineral_composition": ["Feldspar phenocrysts", "Quartz", "Various groundmass minerals"],
        "formation": [
            "Two-stage cooling of magma",
            "Large crystals form slowly at depth",
            "Fine matrix forms from rapid surface cooling",
        ],
        "uses": ["Decorative stone", "Building material", "Copper ore host rock"],
        "description": "Porphyry is a textural term for igneous rocks with large crystals (phenocrysts) embedded in a fine-grained groundmass, indicating two stages of cooling.",
    },
}


@router.post("/rock", response_model=ClassificationResponse)
@router.post("/predict", response_model=ClassificationResponse)
async def classify_rock(request: Request, file: UploadFile = File(...)):
    """
    Classify a rock from an uploaded image.
    """
    temp_path = None

    try:
        temp_path = await validate_image(file)
        rock_classifier = request.app.state.rock_classifier
        result = rock_classifier.predict(temp_path, top_k=5)

        # Enrich with rock-specific information
        primary_class = result["primary"]["class"]
        if primary_class in ROCK_DATABASE:
            rock_info = ROCK_DATABASE[primary_class].copy()
            rock_info["confidence"] = result["primary"]["confidence"]
            result["primary"] = rock_info

        return ClassificationResponse(**result)

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail="Classification failed")
    finally:
        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink()
