from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import User, Build
from schemas import BuildCreateRequest, BuildResponse
from auth import get_current_user
from ai_engine import generate_build_plan
from validation_engine import validate_build

router = APIRouter(
    prefix="/builds",
    tags=["builds"],
)

@router.post("/generate", response_model=BuildResponse)
async def generate_build(
    request: BuildCreateRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Generate plan using Gemini
    plan_data = await generate_build_plan(request.prompt)
    
    if "error" in plan_data:
         raise HTTPException(status_code=500, detail=plan_data["error"])

    # 2. Validate
    warnings = validate_build(plan_data.get("parts", []))
    # We could store warnings, for now we just verify it runs.
    
    # 2. Extract Data
    build_data = plan_data 
    print(f"DEBUG: AI Response Keys: {list(build_data.keys())}")
    
    # 3. (Optional) Validation Layer
    # validation = await validation_engine.validate_build_plan(plan)
    # plan["validation"] = validation

    # 4. Save to DB
    new_build = Build(
        user_id=current_user.id,
        prompt=request.prompt,
        device_name=build_data.get("device_name", "Untitled Device"),
        description=build_data.get("description", ""),
        parts_json=build_data.get("parts", []),
        wiring_json=build_data.get("wiring_diagram") if build_data.get("wiring_diagram") else build_data.get("wiring_text", ""),
        firmware_code=build_data.get("firmware", ""),
        enclosure_md=build_data.get("enclosure", ""),
        analysis=build_data.get("analysis", ""),
        steps_json=build_data.get("steps", []),
    )
    
    db.add(new_build)
    db.commit()
    db.refresh(new_build)
    return new_build

@router.get("/", response_model=List[BuildResponse])
def get_my_builds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Build).filter(Build.user_id == current_user.id).order_by(Build.created_at.desc()).all()

@router.get("/public", response_model=List[BuildResponse])
def get_public_builds(db: Session = Depends(get_db)):
    # In a real app we might have a 'public' flag. For now, show all (or just limit).
    return db.query(Build).order_by(Build.created_at.desc()).limit(20).all()

@router.get("/{build_id}", response_model=BuildResponse)
def get_build(build_id: int, db: Session = Depends(get_db)):
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")
    return build

@router.delete("/{build_id}")
def delete_build(
    build_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")
    if build.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this build")
        
    db.delete(build)
    db.commit()
    return {"message": "Build deleted"}
