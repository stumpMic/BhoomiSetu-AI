from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.officer import OfficerVerificationRecord
from app.models.verification_record import LandVerificationRecord
from app.schemas.auth import LoginRequest, LoginResponse, UserProfileResponse
from app.schemas.verification import (
    OTPRequest,
    OTPResponse,
    OTPVerifyRequest,
    RegistrationResultResponse
)
from app.security.password import verify_password
from app.security.jwt import create_access_token
from app.dependencies import get_current_user
from app.services.verification_service import VerificationService

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
    user = db.query(User).filter(User.email == request.email.strip().lower()).first()
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

    # Check verification status
    if user.verification_status == "PENDING_VERIFICATION":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is awaiting verification. An administrator or Tahsil authority will review your submitted credentials."
        )
    elif user.verification_status == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration was rejected. Please contact the concerned department authority."
        )
    elif user.verification_status == "SUSPENDED" or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended or deactivated."
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
        district=user.district,
        state=user.state or "Odisha",
        address=user.address,
        verification_status=user.verification_status
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
        district=current_user.district,
        state=current_user.state or "Odisha",
        address=current_user.address,
        verification_status=current_user.verification_status
    )

@router.post("/send-otp", response_model=OTPResponse)
def send_otp(request: OTPRequest):
    """
    Dispatches a simulated 6-digit OTP to mobile or email for SIH prototype verification.
    """
    ident = request.identifier.strip()
    if len(ident) < 5:
        raise HTTPException(status_code=400, detail="Invalid mobile number or email address.")
        
    return OTPResponse(
        success=True,
        message=f"OTP verification code sent to {ident}. (Prototype Demo OTP: 123456)",
        demo_otp="123456",
        expires_in_seconds=300
    )

@router.post("/verify-otp")
def verify_otp(request: OTPVerifyRequest):
    """
    Validates entered OTP code.
    """
    if request.otp_code.strip() in ["123456", "999888", "000000"]:
        return {"success": True, "message": "Mobile/Email OTP verified successfully."}
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please enter the demo OTP: 123456.")

@router.post("/register/landowner", response_model=RegistrationResultResponse)
def register_landowner(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    address: str = Form(...),
    district: str = Form(...),
    state: str = Form("Odisha"),
    land_record_id: Optional[str] = Form(None),
    tahasil: str = Form(...),
    village: str = Form(...),
    plot_number: str = Form(...),
    khata_number: str = Form(...),
    doc_ref_number: Optional[str] = Form(None),
    document_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Registers a Landowner after validating land information against cadastral verification records.
    """
    res = VerificationService.register_landowner(
        db=db,
        full_name=full_name,
        email=email,
        phone=phone,
        password=password,
        confirm_password=confirm_password,
        address=address,
        district=district,
        state=state,
        land_record_id=land_record_id,
        tahasil=tahasil,
        village=village,
        plot_number=plot_number,
        khata_number=khata_number,
        doc_ref_number=doc_ref_number,
        doc_file=document_file
    )
    return RegistrationResultResponse(**res)

@router.post("/register/officer", response_model=RegistrationResultResponse)
def register_officer(
    full_name: str = Form(...),
    official_email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    department: str = Form(...),
    designation: str = Form(...),
    district: str = Form(...),
    office_name: str = Form(...),
    officer_id: str = Form(...),
    office_code: str = Form(...),
    authorization_document: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Registers a Government Officer after strict whitelist verification against authorized officer records.
    """
    res = VerificationService.register_officer(
        db=db,
        full_name=full_name,
        official_email=official_email,
        phone=phone,
        password=password,
        confirm_password=confirm_password,
        department=department,
        designation=designation,
        district=district,
        office_name=office_name,
        officer_id=officer_id,
        office_code=office_code,
        doc_file=authorization_document
    )
    return RegistrationResultResponse(**res)

@router.get("/verification-records/sample")
def get_sample_verification_records(db: Session = Depends(get_db)):
    """
    Helper endpoint returning sample whitelist records for zero-friction demo testing.
    Labeled with DEMO DATA notice.
    """
    officers = db.query(OfficerVerificationRecord).filter(OfficerVerificationRecord.is_active == True).limit(3).all()
    lands = db.query(LandVerificationRecord).filter(LandVerificationRecord.is_verified == True).limit(3).all()
    
    return {
        "disclaimer": "DEMO DATA — NOT REAL GOVERNMENT RECORDS. Used for prototype testing.",
        "sample_officers": [
            {
                "officer_id": o.officer_id,
                "full_name": o.full_name,
                "official_email": o.official_email,
                "department": o.department,
                "designation": o.designation,
                "office_code": o.office_code,
                "district": o.district
            }
            for o in officers
        ],
        "sample_land_records": [
            {
                "land_record_id": l.land_record_id,
                "owner_name": l.owner_name,
                "district": l.district,
                "tahasil": l.tahasil,
                "village": l.village,
                "plot_number": l.plot_number,
                "khata_number": l.khata_number,
                "area_acres": float(l.area_acres)
            }
            for l in lands
        ]
    }
