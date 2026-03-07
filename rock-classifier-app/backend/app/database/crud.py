"""Database CRUD operations."""

from sqlalchemy.orm import Session
from ..models.database import RockRecord


def get_all_rocks(db: Session):
    return db.query(RockRecord).all()


def get_rock_by_name(db: Session, name: str):
    return db.query(RockRecord).filter(RockRecord.name == name).first()
