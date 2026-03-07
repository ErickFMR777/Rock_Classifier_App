"""SQLAlchemy ORM models for the rock classifier database."""

from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class RockRecord(Base):
    __tablename__ = "rocks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    rock_type = Column(String, nullable=False)
    color = Column(String)
    grain_size = Column(String)
    description = Column(Text)
