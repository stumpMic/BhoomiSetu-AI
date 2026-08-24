-- ====================================================================
-- BhoomiSetu AI Database Reset Script
-- Drops all tables and re-initializes cleanly
-- ====================================================================

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS grievance_updates;
DROP TABLE IF EXISTS grievances;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS prediction_factors;
DROP TABLE IF EXISTS risk_predictions;
DROP TABLE IF EXISTS departmental_tasks;
DROP TABLE IF EXISTS compensation_stages_log;
DROP TABLE IF EXISTS compensations;
DROP TABLE IF EXISTS ocr_results;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS parcel_ownerships;
DROP TABLE IF EXISTS landowners;
DROP TABLE IF EXISTS parcels;
DROP TABLE IF EXISTS acquisition_cases;
DROP TABLE IF EXISTS villages;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- Rebuild
.read database/scripts/create_database.sql
