from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserProfileResponse
from app.security.password import verify_password
from app.security.jwt import create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

ROLE_DISPLAY_MAP = {
    "admin": "Administrator",
    "project_authority": "Project Authority (Director)",
    "land_acquisition_officer": "Land Acquisition Officer (LAO)",
    "survey_officer": "Survey & Cadastral Officer",
    "compensation_officer": "Compensation Officer",
    "landowner": "Landowner / Beneficiary"
}

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    dept_name = user.department.name if user.department else None
    role_disp = ROLE_DISPLAY_MAP.get(user.role, user.role.replace("_", " ").title())

    user_profile = UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        role_display=role_disp,
        department_id=user.department_id,
        department_name=dept_name,
        district=user.district
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_profile
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    dept_name = current_user.department.name if current_user.department else None
    role_disp = ROLE_DISPLAY_MAP.get(current_user.role, current_user.role.replace("_", " ").title())

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        role_display=role_disp,
        department_id=current_user.department_id,
        department_name=dept_name,
        district=current_user.district
    )
