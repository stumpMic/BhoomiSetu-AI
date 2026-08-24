-- ====================================================================
-- BhoomiSetu AI Database Integrity Verification Queries
-- ====================================================================

SELECT 'Departments Count' AS metric, COUNT(*) AS count FROM departments
UNION ALL
SELECT 'Users Count', COUNT(*) FROM users
UNION ALL
SELECT 'Projects Count', COUNT(*) FROM projects
UNION ALL
SELECT 'Villages Count', COUNT(*) FROM villages
UNION ALL
SELECT 'Acquisition Cases Count', COUNT(*) FROM acquisition_cases
UNION ALL
SELECT 'Land Parcels Count', COUNT(*) FROM parcels
UNION ALL
SELECT 'Landowners Count', COUNT(*) FROM landowners
UNION ALL
SELECT 'Compensations Count', COUNT(*) FROM compensations
UNION ALL
SELECT 'Tasks Count', COUNT(*) FROM departmental_tasks
UNION ALL
SELECT 'Grievances Count', COUNT(*) FROM grievances;
