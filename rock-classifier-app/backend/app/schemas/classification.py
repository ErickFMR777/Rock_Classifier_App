"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import List, Optional


class RockInfo(BaseModel):
    """Information about a classified rock."""

    rock_class: str = Field(..., alias="class")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score 0-1")
    type: str = Field(default="", description="Rock type classification")
    color: str = Field(default="", description="Rock color")
    grain_size: str = Field(default="", description="Grain size")
    mineral_composition: List[str] = Field(default_factory=list)
    formation: List[str] = Field(default_factory=list)
    uses: List[str] = Field(default_factory=list)
    description: str = Field(default="", description="Detailed rock description")

    model_config = {"populate_by_name": True}


class AlternativeMatch(BaseModel):
    """Alternative rock classification match."""

    rock_class: str = Field(..., alias="class")
    confidence: float = Field(..., ge=0, le=1)

    model_config = {"populate_by_name": True}


class ClassificationResponse(BaseModel):
    """Complete classification response."""

    primary: RockInfo = Field(..., description="Primary classification result")
    alternatives: List[AlternativeMatch] = Field(
        default_factory=list, description="Top 5 alternatives"
    )
    inference_time_ms: int = Field(
        ..., description="Time taken for inference in milliseconds"
    )

    model_config = {"populate_by_name": True}
