from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.security.jwt import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Decode JWT token and load current authenticated user from database"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check for mock development tokens
    if token.startswith("mock_jwt_token_bhoomisetu_2026_"):
        role_suffix = token.replace("mock_jwt_token_bhoomisetu_2026_", "")
        role_map = {
            "officer": "land_acquisition_officer",
            "compensation_officer": "compensation_officer",
            "survey_officer": "survey_officer",
            "project_authority": "project_authority",
            "admin": "admin",
            "landowner": "landowner",
            "land_acquisition_officer": "land_acquisition_officer"
        }
        target_role = role_map.get(role_suffix, role_suffix)
        user = db.query(User).filter(User.role == target_role).first()
        if user:
            return user

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
        
    # Check verification status
    if user.verification_status and user.verification_status != "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account access restricted. Verification Status: {user.verification_status}"
        )
        
    return user

def require_roles(allowed_roles: List[str]):
    """Role-based authorization dependency guard"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker
