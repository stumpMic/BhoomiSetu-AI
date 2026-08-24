-- ====================================================================
-- BhoomiSetu AI Database Schema - Performance Indexes
-- ====================================================================

-- User lookup indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- Project & Case indexes
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON acquisition_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_project_id ON acquisition_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_cases_village_id ON acquisition_cases(village_id);
CREATE INDEX IF NOT EXISTS idx_cases_risk_level ON acquisition_cases(current_risk_level);
CREATE INDEX IF NOT EXISTS idx_cases_stage ON acquisition_cases(current_stage);

-- Parcel & Ownership indexes
CREATE INDEX IF NOT EXISTS idx_parcels_case_id ON parcels(case_id);
CREATE INDEX IF NOT EXISTS idx_parcels_plot_number ON parcels(plot_number);
CREATE INDEX IF NOT EXISTS idx_parcels_khata_number ON parcels(khata_number);
CREATE INDEX IF NOT EXISTS idx_parcels_risk_level ON parcels(risk_level);
CREATE INDEX IF NOT EXISTS idx_parcel_ownerships_parcel ON parcel_ownerships(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_ownerships_landowner ON parcel_ownerships(landowner_id);

-- Tasks & Workflow indexes
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON departmental_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON departmental_tasks(assigned_department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON departmental_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON departmental_tasks(deadline);

-- Compensation & Grievance indexes
CREATE INDEX IF NOT EXISTS idx_compensations_parcel ON compensations(parcel_id);
CREATE INDEX IF NOT EXISTS idx_compensations_stage ON compensations(current_stage);
CREATE INDEX IF NOT EXISTS idx_grievances_number ON grievances(grievance_number);
CREATE INDEX IF NOT EXISTS idx_grievances_landowner ON grievances(landowner_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);

-- Prediction & Alert indexes
CREATE INDEX IF NOT EXISTS idx_predictions_case_id ON risk_predictions(case_id);
CREATE INDEX IF NOT EXISTS idx_alerts_target_user ON alerts(target_user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
