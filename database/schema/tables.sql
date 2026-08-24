-- ====================================================================
-- BhoomiSetu AI Database Schema DDL
-- Tables Definition (Compatible with SQLite & PostgreSQL)
-- ====================================================================

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    description TEXT,
    contact_email VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Officers, Admins, Landowners)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(120) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(40) NOT NULL, -- admin, project_authority, land_acquisition_officer, survey_officer, compensation_officer, landowner
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    district VARCHAR(60),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Projects (Infrastructure Corridors, Railways, Dams)
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    executing_agency VARCHAR(150),
    project_authority_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    state VARCHAR(50) DEFAULT 'Odisha',
    districts VARCHAR(255),
    target_start_date DATE,
    target_end_date DATE,
    estimated_budget_cr NUMERIC(12, 2),
    total_area_required_acres NUMERIC(10, 2),
    status VARCHAR(40) DEFAULT 'Active', -- Planning, Active, Completed, Stalled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Villages
CREATE TABLE IF NOT EXISTS villages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    tahsil VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT 'Odisha',
    pincode VARCHAR(10),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Acquisition Cases
CREATE TABLE IF NOT EXISTS acquisition_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_number VARCHAR(50) NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
    notification_section VARCHAR(20) DEFAULT '4(1)', -- 4(1), 6(1), 11(1), 19(1), Award
    current_stage VARCHAR(60) NOT NULL DEFAULT 'Notification', 
    status VARCHAR(40) DEFAULT 'In Progress', -- In Progress, Delayed, Completed, Disputed, Cancelled
    assigned_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_deadline DATE,
    current_delay_probability NUMERIC(4, 3) DEFAULT 0.0,
    current_risk_level VARCHAR(20) DEFAULT 'Low', -- Low, Medium, High
    predicted_delay_days INTEGER DEFAULT 0,
    missing_doc_pct NUMERIC(5, 2) DEFAULT 0.0,
    survey_completed_pct NUMERIC(5, 2) DEFAULT 0.0,
    ownership_disputes_count INTEGER DEFAULT 0,
    court_cases_count INTEGER DEFAULT 0,
    pending_approvals_count INTEGER DEFAULT 0,
    compensation_progress_pct NUMERIC(5, 2) DEFAULT 0.0,
    bank_verification_pct NUMERIC(5, 2) DEFAULT 0.0,
    environmental_clearance BOOLEAN DEFAULT 1,
    rehabilitation_required BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Land Parcels
CREATE TABLE IF NOT EXISTS parcels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
    plot_number VARCHAR(40) NOT NULL,
    khata_number VARCHAR(40) NOT NULL,
    area_acres NUMERIC(8, 3) NOT NULL,
    land_type VARCHAR(60) DEFAULT 'Agricultural', -- Agricultural, Homestead, Commercial, Forest, Barren
    valuation_per_acre_inr NUMERIC(12, 2) DEFAULT 1000000.0,
    total_valuation_inr NUMERIC(14, 2) DEFAULT 0.0,
    risk_level VARCHAR(20) DEFAULT 'Low',
    risk_color VARCHAR(10) DEFAULT '#10B981',
    survey_status VARCHAR(40) DEFAULT 'Pending', -- Pending, In Progress, Completed, Disputed
    acquisition_status VARCHAR(40) DEFAULT 'Notification',
    geometry_geojson TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Landowners
CREATE TABLE IF NOT EXISTS landowners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    father_or_husband_name VARCHAR(150),
    gender VARCHAR(10),
    phone VARCHAR(20),
    masked_aadhaar VARCHAR(20) DEFAULT 'XXXX-XXXX-1234',
    address TEXT,
    village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
    bank_account_masked VARCHAR(30) DEFAULT 'XXXX-XXXX-5678',
    bank_ifsc VARCHAR(20) DEFAULT 'SBIN0001234',
    bank_name VARCHAR(100) DEFAULT 'State Bank of India',
    bank_verification_status VARCHAR(30) DEFAULT 'Pending', -- Pending, Verified, Rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Parcel Ownership Mapping (Many-to-Many with share percentage)
CREATE TABLE IF NOT EXISTS parcel_ownerships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parcel_id INTEGER NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    landowner_id INTEGER NOT NULL REFERENCES landowners(id) ON DELETE CASCADE,
    ownership_share_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    is_primary_contact BOOLEAN DEFAULT 1,
    dispute_flag BOOLEAN DEFAULT 0,
    dispute_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parcel_id, landowner_id)
);

-- 9. Documents
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
    parcel_id INTEGER REFERENCES parcels(id) ON DELETE SET NULL,
    uploaded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    document_type VARCHAR(80) NOT NULL, -- Record of Rights (RoR), Aadhaar Consent, Bank Passbook, Mutation Slip, Survey Map, Objection Petiton
    file_path VARCHAR(255) NOT NULL,
    filename VARCHAR(150) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(60),
    verification_status VARCHAR(40) DEFAULT 'Pending Processing', -- Pending Processing, Verified, Possible Mismatch, Manual Review Required, Rejected
    officer_remarks TEXT,
    verified_by_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. OCR Results
CREATE TABLE IF NOT EXISTS ocr_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    raw_text TEXT,
    extracted_owner_name VARCHAR(150),
    extracted_plot_number VARCHAR(40),
    extracted_khata_number VARCHAR(40),
    extracted_area_acres NUMERIC(8, 3),
    extracted_doc_date VARCHAR(40),
    ocr_confidence NUMERIC(4, 3) DEFAULT 0.0,
    name_similarity_score NUMERIC(5, 2) DEFAULT 0.0,
    plot_match BOOLEAN DEFAULT 1,
    khata_match BOOLEAN DEFAULT 1,
    area_match BOOLEAN DEFAULT 1,
    discrepancy_details TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Compensations (9-stage pipeline)
CREATE TABLE IF NOT EXISTS compensations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parcel_id INTEGER NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    landowner_id INTEGER NOT NULL REFERENCES landowners(id) ON DELETE CASCADE,
    case_id INTEGER NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
    base_land_value_inr NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    solatium_100pct_inr NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    additional_interest_inr NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    total_award_inr NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    landowner_share_inr NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    current_stage VARCHAR(60) DEFAULT 'Land valuation pending',
    stage_index INTEGER DEFAULT 1, -- 1 to 9
    responsible_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    mock_payment_ref VARCHAR(80),
    payment_disbursed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parcel_id, landowner_id)
);

-- 12. Compensation Stage History
CREATE TABLE IF NOT EXISTS compensation_stages_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compensation_id INTEGER NOT NULL REFERENCES compensations(id) ON DELETE CASCADE,
    stage_name VARCHAR(60) NOT NULL,
    stage_index INTEGER NOT NULL,
    updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Departmental Tasks
CREATE TABLE IF NOT EXISTS departmental_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES acquisition_cases(id) ON DELETE CASCADE,
    parcel_id INTEGER REFERENCES parcels(id) ON DELETE SET NULL,
    assigned_department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    assigned_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Urgent
    status VARCHAR(30) DEFAULT 'To do', -- To do, In progress, Waiting for info, Completed, Overdue
    start_date DATE,
    deadline DATE NOT NULL,
    completed_at TIMESTAMP,
    is_overdue BOOLEAN DEFAULT 0,
    remarks TEXT,
    completion_evidence VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. AI Risk Predictions
CREATE TABLE IF NOT EXISTS risk_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
    delay_probability NUMERIC(4, 3) NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- Low, Medium, High
    predicted_delay_days INTEGER NOT NULL,
    model_version VARCHAR(40) DEFAULT 'v1.0.0-rf',
    trigger_reason VARCHAR(100) DEFAULT 'Scheduled / Manual Recalculation',
    prediction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Prediction Contributing Factors (Explainability)
CREATE TABLE IF NOT EXISTS prediction_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER NOT NULL REFERENCES risk_predictions(id) ON DELETE CASCADE,
    factor_name VARCHAR(100) NOT NULL,
    impact_score NUMERIC(5, 3) NOT NULL,
    direction VARCHAR(20) NOT NULL, -- increases_risk, decreases_risk
    description TEXT
);

-- 16. Alerts & Notifications
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(40) NOT NULL, -- risk_escalation, deadline_warning, task_overdue, ocr_mismatch, document_uploaded, compensation_updated, grievance_filed, grievance_resolved
    severity VARCHAR(20) DEFAULT 'info', -- critical, warning, info, success
    case_id INTEGER REFERENCES acquisition_cases(id) ON DELETE CASCADE,
    parcel_id INTEGER REFERENCES parcels(id) ON DELETE SET NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(40),
    is_read BOOLEAN DEFAULT 0,
    mock_sms_dispatched BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Grievances
CREATE TABLE IF NOT EXISTS grievances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grievance_number VARCHAR(50) NOT NULL UNIQUE,
    case_id INTEGER REFERENCES acquisition_cases(id) ON DELETE CASCADE,
    parcel_id INTEGER REFERENCES parcels(id) ON DELETE SET NULL,
    landowner_id INTEGER NOT NULL REFERENCES landowners(id) ON DELETE CASCADE,
    category VARCHAR(60) NOT NULL, -- Ownership dispute, Incorrect land measurement, Incorrect compensation, Payment not received, Document-verification issue, Hearing issue, Other
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Submitted', -- Submitted, Assigned, Under Review, Action Taken, Resolved
    assigned_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    assigned_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Grievance Updates History
CREATE TABLE IF NOT EXISTS grievance_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    stage VARCHAR(40) NOT NULL,
    updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
