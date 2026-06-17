from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Scale(Base):
    __tablename__ = "scales"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)

    votes = relationship("Vote", back_populates="scale", cascade="all, delete-orphan")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    scale_id = Column(Integer, ForeignKey("scales.id", ondelete="CASCADE"), nullable=False)
    option = Column(String, nullable=False)
    voter_name = Column(String, nullable=True)

    scale = relationship("Scale", back_populates="votes")
