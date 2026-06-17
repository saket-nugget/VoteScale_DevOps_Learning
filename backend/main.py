from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

import models
from database import SessionLocal

app = FastAPI(title="VoteScale API")

# Configure CORS so our React frontend can make API calls from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Session Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas ---
class VoteCreate(BaseModel):
    option: str
    voter_name: Optional[str] = None

class VoteResponse(BaseModel):
    id: int
    scale_id: int
    option: str
    voter_name: Optional[str] = None

    class Config:
        from_attributes = True

class ScaleCreate(BaseModel):
    title: str
    description: Optional[str] = None

class ScaleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    votes: List[VoteResponse] = []

    class Config:
        from_attributes = True

# --- API Routes ---

@app.get("/")
def read_root():
    return {"message": "Welcome to VoteScale API"}

@app.post("/scales", response_model=ScaleResponse, status_code=status.HTTP_201_CREATED)
def create_scale(scale: ScaleCreate, db: Session = Depends(get_db)):
    db_scale = models.Scale(title=scale.title, description=scale.description)
    db.add(db_scale)
    db.commit()
    db.refresh(db_scale)
    return db_scale

@app.get("/scales", response_model=List[ScaleResponse])
def read_scales(db: Session = Depends(get_db)):
    return db.query(models.Scale).all()

@app.get("/scales/{scale_id}", response_model=ScaleResponse)
def read_scale(scale_id: int, db: Session = Depends(get_db)):
    db_scale = db.query(models.Scale).filter(models.Scale.id == scale_id).first()
    if not db_scale:
        raise HTTPException(status_code=404, detail="Scale not found")
    return db_scale

@app.post("/scales/{scale_id}/votes", response_model=VoteResponse, status_code=status.HTTP_201_CREATED)
def create_vote(scale_id: int, vote: VoteCreate, db: Session = Depends(get_db)):
    # Verify the scale exists first
    db_scale = db.query(models.Scale).filter(models.Scale.id == scale_id).first()
    if not db_scale:
        raise HTTPException(status_code=404, detail="Scale not found")
    
    db_vote = models.Vote(scale_id=scale_id, option=vote.option, voter_name=vote.voter_name)
    db.add(db_vote)
    db.commit()
    db.refresh(db_vote)
    return db_vote

@app.delete("/scales/{scale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scale(scale_id: int, db: Session = Depends(get_db)):
    db_scale = db.query(models.Scale).filter(models.Scale.id == scale_id).first()
    if not db_scale:
        raise HTTPException(status_code=404, detail="Scale not found")
    db.delete(db_scale)
    db.commit()
    return