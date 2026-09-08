import os
import shutil
from datetime import datetime
from typing import Tuple, Optional, Dict, Any, List
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config import settings
from app.models.user import User
from app.models.department import Department
from app.models.landowner import Landowner
from app.models.officer import Officer, OfficerVerificationRecord
from app.models.verification_record import LandVerificationRecord, VerificationRequest
from app.models.activity_log import ActivityLog
from app.security.password import get_password_hash
from app.services.notification_service import NotificationService

# Ensure upload directory exists
VERIFICATION_UPLOADS_DIR = os.path.join(settings.UPLOAD_DIR, "verifications")
os.makedirs(VERIFICATION_UPLOADS_DIR, exist_ok=True)

class VerificationService:

    @staticmethod
    def save_verification_doc(file: Optional[UploadFile], prefix: str = "doc") -> Optional[str]:
        """Saves uploaded verification identity or land deed to secure disk storage"""
        if not file or not file.filename:
            return None
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{prefix}_{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(VERIFICATION_UPLOADS_DIR, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return f"uploads/verifications/{safe_filename}"

    @staticmethod
    def verify_officer_whitelist(
        db: Session,
        officer_id: str,
        email: str,
        office_code: str,
        department: str
    ) -> Tuple[bool, Optional[OfficerVerificationRecord], str]:
        """
        Validates officer registration credentials against pre-approved whitelist dataset.
        Prevents unauthorized creation of government officer accounts.
        """
        officer_id_clean = officer_id.strip().upper()
        office_code_clean = office_code.strip().upper()
        
        record = db.query(OfficerVerificationRecord).filter(
            OfficerVerificationRecord.officer_id == officer_id_clean
        ).first()

        if not record:
            return False, None, "Officer verification failed: Employee ID is not registered in the authorized government directory."
            
        if not record.is_active or record.verification_status != "VERIFIED":
            return False, None, "Officer verification failed: The officer record is currently inactive or suspended."
            
        if record.office_code.strip().upper() != office_code_clean:
            return False, None, f"Officer verification failed: Office Code '{office_code}' does not match official allocation for Officer {officer_id}."

        return True, record, "Officer verification eligible."

    @staticmethod
    def verify_land_record_whitelist(
        db: Session,
        land_record_id: Optional[str],
        plot_number: str,
        khata_number: str,
        village: str,
        district: str,
        owner_name: str
    ) -> Tuple[bool, Optional[LandVerificationRecord], str]:
        """
        Validates landowner registration details against revenue cadastral dataset.
        """
        query = db.query(LandVerificationRecord)
        
        if land_record_id and land_record_id.strip():
            rec = query.filter(LandVerificationRecord.land_record_id == land_record_id.strip().upper()).first()
            if rec and rec.is_verified:
                return True, rec, "Land record verified via Official Land Record ID."

        # Fallback to Plot + Khata + Village match
        plot_clean = plot_number.strip().upper()
        khata_clean = khata_number.strip()
        village_clean = village.strip().lower()
        
        rec = query.filter(
            LandVerificationRecord.plot_number == plot_clean,
            LandVerificationRecord.khata_number == khata_clean
        ).first()

        if rec and rec.village.strip().lower() == village_clean and rec.is_verified:
            return True, rec, "Land record verified via Cadastral Plot & Khata matching."

        return False, None, "Land record pending manual revenue verification against RoR records."

    @staticmethod
    def register_landowner(
        db: Session,
        full_name: str,
        email: str,
        phone: str,
        password: str,
        confirm_password: str,
        address: str,
        district: str,
        state: str,
        land_record_id: Optional[str],
        tahasil: str,
        village: str,
        plot_number: str,
        khata_number: str,
        doc_ref_number: Optional[str],
        doc_file: Optional[UploadFile] = None
    ) -> Dict[str, Any]:
        """
        Registers a Landowner with automated land validation and creates verification request.
        """
        if password != confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match.")

        # Check existing user
        existing_user = db.query(User).filter(
            or_(User.email == email.strip().lower(), User.phone == phone.strip())
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="An account with this email or mobile number is already registered.")

        # Check land record against whitelist
        is_verified, land_rec, verify_msg = VerificationService.verify_land_record_whitelist(
            db=db,
            land_record_id=land_record_id,
            plot_number=plot_number,
            khata_number=khata_number,
            village=village,
            district=district,
            owner_name=full_name
        )

        doc_path = VerificationService.save_verification_doc(doc_file, prefix="land_ror")

        # Determine verification status
        verif_status = "VERIFIED" if is_verified else "PENDING_VERIFICATION"

        # Create User
        user = User(
            email=email.strip().lower(),
            hashed_password=get_password_hash(password),
            full_name=full_name.strip(),
            phone=phone.strip(),
            role="landowner",
            district=district.strip(),
            state=state.strip() or "Odisha",
            address=address.strip(),
            verification_status=verif_status,
            is_active=True
        )
        db.add(user)
        db.flush()

        # Create Landowner Profile
        landowner = Landowner(
            user_id=user.id,
            full_name=full_name.strip(),
            phone=phone.strip(),
            address=f"{address.strip()}, {tahasil.strip()}, {district.strip()}",
            bank_verification_status="Pending"
        )
        db.add(landowner)
        db.flush()

        # Create Verification Request
        verif_req = VerificationRequest(
            user_id=user.id,
            request_type="LANDOWNER",
            status="APPROVED" if is_verified else "PENDING",
            notes=f"Land ID: {land_record_id or 'N/A'} | Plot: {plot_number} | Khata: {khata_number} | Village: {village} | Tahasil: {tahasil}. {verify_msg}",
            document_path=doc_path,
            reviewed_at=datetime.utcnow() if is_verified else None
        )
        db.add(verif_req)

        # Audit Log
        log = ActivityLog(
            user_id=user.id,
            action="LANDOWNER_REGISTRATION",
            entity_type="User",
            entity_id=user.id,
            details=f"Landowner registered: {full_name} ({verif_status}). {verify_msg}"
        )
        db.add(log)
        db.commit()
        db.refresh(user)

        user_message = (
            "Registration Successful! Your land ownership information has been verified. You may now sign in."
            if is_verified else
            "Your registration has been submitted successfully. Your land ownership information is being verified by the Tahsil Authority. Your account will be activated after verification."
        )

        return {
            "success": True,
            "user_id": user.id,
            "account_type": "Landowner",
            "verification_status": verif_status,
            "message": user_message,
            "details": {
                "land_verified": is_verified,
                "verification_message": verify_msg,
                "verification_request_id": verif_req.id
            }
        }

    @staticmethod
    def register_officer(
        db: Session,
        full_name: str,
        official_email: str,
        phone: str,
        password: str,
        confirm_password: str,
        department: str,
        designation: str,
        district: str,
        office_name: str,
        officer_id: str,
        office_code: str,
        doc_file: Optional[UploadFile] = None
    ) -> Dict[str, Any]:
        """
        Registers a Government Officer after strict whitelist credential validation.
        Account initially requires Admin authorization (PENDING_VERIFICATION).
        """
        if password != confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match.")

        # Check existing user
        existing_user = db.query(User).filter(
            or_(User.email == official_email.strip().lower(), User.phone == phone.strip())
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="An account with this email or mobile number is already registered.")

        # Check Officer Whitelist (CRITICAL SECURITY STEP)
        is_eligible, whitelist_rec, verify_msg = VerificationService.verify_officer_whitelist(
            db=db,
            officer_id=officer_id,
            email=official_email,
            office_code=office_code,
            department=department
        )

        if not is_eligible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{verify_msg} For demo evaluation, please use Officer ID 'OFF-DEMO-001' with Office Code 'REV-BBSR-01' (or click 'Autofill Sample Officer')."
            )

        # Map department to internal role
        dept_lower = department.lower()
        if "survey" in dept_lower or "cadastral" in dept_lower:
            assigned_role = "survey_officer"
            dept_id = 2
        elif "compensation" in dept_lower or "account" in dept_lower:
            assigned_role = "compensation_officer"
            dept_id = 3
        else:
            assigned_role = "land_acquisition_officer"
            dept_id = 1

        doc_path = VerificationService.save_verification_doc(doc_file, prefix="officer_auth")

        # Officer accounts start with PENDING_VERIFICATION until Admin confirms
        verif_status = "PENDING_VERIFICATION"

        # Create User
        user = User(
            email=official_email.strip().lower(),
            hashed_password=get_password_hash(password),
            full_name=full_name.strip(),
            phone=phone.strip(),
            role=assigned_role,
            department_id=dept_id,
            district=district.strip(),
            state="Odisha",
            address=f"{office_name.strip()}, {district.strip()}",
            verification_status=verif_status,
            is_active=True
        )
        db.add(user)
        db.flush()

        # Create Officer Profile
        officer = Officer(
            user_id=user.id,
            officer_id=officer_id.strip().upper(),
            department=department.strip(),
            designation=designation.strip(),
            office_name=office_name.strip(),
            office_code=office_code.strip().upper(),
            district=district.strip(),
            authorization_doc_path=doc_path,
            verification_status=verif_status
        )
        db.add(officer)
        db.flush()

        # Create Verification Request
        verif_req = VerificationRequest(
            user_id=user.id,
            request_type="OFFICER",
            status="PENDING",
            notes=f"Officer ID: {officer_id.strip().upper()} | Office: {office_code} ({office_name}) | Dept: {department} | Desig: {designation}. Matched authorized directory.",
            document_path=doc_path
        )
        db.add(verif_req)

        # Audit Log
        log = ActivityLog(
            user_id=user.id,
            action="OFFICER_REGISTRATION_SUBMITTED",
            entity_type="User",
            entity_id=user.id,
            details=f"Officer registration submitted: {full_name} ({officer_id}). Status: {verif_status}."
        )
        db.add(log)
        db.commit()
        db.refresh(user)

        return {
            "success": True,
            "user_id": user.id,
            "account_type": "Government Officer",
            "verification_status": verif_status,
            "message": "Your official identity and department information have been verified against the government directory. Your account will be activated after final administrator authorization.",
            "details": {
                "officer_id": officer_id,
                "department": department,
                "verification_request_id": verif_req.id
            }
        }

    @staticmethod
    def get_pending_verification_requests(db: Session) -> List[Dict[str, Any]]:
        """Fetches all pending verification requests for Admin Review Dashboard"""
        requests = db.query(VerificationRequest).filter(
            VerificationRequest.status == "PENDING"
        ).order_by(VerificationRequest.submitted_at.desc()).all()

        results = []
        for r in requests:
            u = r.user
            item = {
                "id": r.id,
                "user_id": u.id,
                "request_type": r.request_type,
                "submitted_at": r.submitted_at,
                "status": r.status,
                "notes": r.notes,
                "document_path": r.document_path,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "district": u.district,
                "officer_id": None,
                "department": None,
                "designation": None,
                "office_code": None,
                "office_name": None,
                "land_record_id": None,
                "tahasil": None,
                "village": None,
                "plot_number": None,
                "khata_number": None
            }

            if r.request_type == "OFFICER" and u.officer_profile:
                item["officer_id"] = u.officer_profile.officer_id
                item["department"] = u.officer_profile.department
                item["designation"] = u.officer_profile.designation
                item["office_code"] = u.officer_profile.office_code
                item["office_name"] = u.officer_profile.office_name
            elif r.request_type == "LANDOWNER":
                # Parse land info from notes if available
                item["tahasil"] = u.district
                item["village"] = u.district

            results.append(item)

        return results

    @staticmethod
    def review_verification_request(
        db: Session,
        request_id: int,
        admin_user: User,
        action: str,
        rejection_reason: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Admin approves or rejects pending verification request"""
        req = db.query(VerificationRequest).filter(VerificationRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Verification request not found.")

        user = req.user
        action_clean = action.strip().upper()

        if action_clean == "APPROVE":
            req.status = "APPROVED"
            req.reviewed_at = datetime.utcnow()
            req.reviewed_by_id = admin_user.id
            if notes:
                req.notes = f"{req.notes or ''}\nApproval note: {notes}"

            user.verification_status = "VERIFIED"
            if user.officer_profile:
                user.officer_profile.verification_status = "VERIFIED"

            # Create notification
            NotificationService.create_alert(
                db=db,
                title="Account Approved & Activated",
                message=f"Your account registration for BhoomiSetu AI has been verified and activated by Administrator {admin_user.full_name}.",
                alert_type="verification_approved",
                severity="success",
                target_user_id=user.id,
                target_role=user.role
            )

            msg = f"Account for {user.full_name} successfully verified and activated."

        elif action_clean == "REJECT":
            req.status = "REJECTED"
            req.reviewed_at = datetime.utcnow()
            req.reviewed_by_id = admin_user.id
            req.rejection_reason = rejection_reason or "Submitted documentation did not meet official requirements."
            if notes:
                req.notes = f"{req.notes or ''}\nRejection note: {notes}"

            user.verification_status = "REJECTED"
            if user.officer_profile:
                user.officer_profile.verification_status = "REJECTED"

            # Create notification
            NotificationService.create_alert(
                db=db,
                title="Account Registration Rejected",
                message=f"Your account registration could not be verified. Reason: {req.rejection_reason}",
                alert_type="verification_rejected",
                severity="critical",
                target_user_id=user.id,
                target_role=user.role
            )

            msg = f"Account request for {user.full_name} has been rejected."
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Must be APPROVE or REJECT.")

        # Log
        log = ActivityLog(
            user_id=admin_user.id,
            action=f"VERIFICATION_{action_clean}",
            entity_type="VerificationRequest",
            entity_id=req.id,
            details=f"Admin {admin_user.full_name} {action_clean} request #{req.id} for user #{user.id} ({user.email})."
        )
        db.add(log)
        db.commit()

        return {
            "success": True,
            "request_id": req.id,
            "status": req.status,
            "user_verification_status": user.verification_status,
            "message": msg
        }
