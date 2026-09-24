-- ====================================================================
-- BhoomiSetu AI Database Seeds: Verification Whitelist Records
-- NOTE: DEMO DATA — NOT REAL GOVERNMENT RECORDS
-- Used for automated eligibility validation during account registration
-- ====================================================================

-- 1. Authorized Officer Verification Records (Whitelist)
INSERT INTO officer_verification_records (id, officer_id, official_email, full_name, department, designation, office_code, district, verification_status, is_active) VALUES
(1, 'OFF-DEMO-001', 'officer.demo@bhoomisetu.gov.in', 'Shri Suresh Mohanty', 'Revenue & Land Reforms Department', 'Sub-Collector & LAO', 'REV-BBSR-01', 'Khurda', 'VERIFIED', 1),
(2, 'OFF-DEMO-002', 'survey.demo@bhoomisetu.gov.in', 'Smt. Arpita Patnaik', 'Survey & Cadastral Directorate', 'Assistant Director of Survey', 'SURV-PURI-02', 'Puri', 'VERIFIED', 1),
(3, 'OFF-DEMO-003', 'comp.demo@bhoomisetu.gov.in', 'Shri Manoranjan Das', 'Compensation & Accounts Cell', 'Special Land Acquisition Officer', 'COMP-CTC-01', 'Cuttack', 'VERIFIED', 1),
(4, 'OFF-OD-7721', 'lao.khurda@bhoomisetu.gov.in', 'Dr. Alok Kumar Sahu', 'Revenue & Land Reforms Department', 'Additional District Magistrate (LA)', 'REV-KHD-04', 'Khurda', 'VERIFIED', 1),
(5, 'OFF-OD-8834', 'surveyor.puri@bhoomisetu.gov.in', 'Shri Prakash Chandra Rout', 'Survey & Cadastral Directorate', 'Head Surveyor', 'SURV-PURI-01', 'Puri', 'VERIFIED', 1);

-- 2. Official Cadastral Land Verification Records (Whitelist)
INSERT INTO land_verification_records (id, land_record_id, owner_name, district, tahasil, village, plot_number, khata_number, area_acres, verification_status, is_verified) VALUES
(1, 'LAND-DEMO-001', 'Bikram Keshari Das', 'Khurda', 'Pipili', 'Pipili', '142/A', '312', 4.500, 'VERIFIED', 1),
(2, 'LAND-DEMO-002', 'Bimal Kumar Jena', 'Khurda', 'Pipili', 'Pipili', '101', '201', 2.500, 'VERIFIED', 1),
(3, 'LAND-DEMO-003', 'Sarat Chandra Mohapatra', 'Khurda', 'Pipili', 'Pipili', '102', '202', 3.100, 'VERIFIED', 1),
(4, 'LAND-DEMO-004', 'Gokul Chandra Senapati', 'Khurda', 'Balipatna', 'Balipatna', '120', '225', 3.400, 'VERIFIED', 1),
(5, 'LAND-DEMO-005', 'Surendra Nath Jena', 'Cuttack', 'Barang', 'Barang', '130', '235', 4.100, 'VERIFIED', 1),
(6, 'LAND-DEMO-006', 'Smt. Pravati Mishra', 'Khurda', 'Pipili', 'Pipili', '103/1', '203', 1.800, 'VERIFIED', 1);

-- 3. Initial Demo Verification Requests (Sample Pending Submissions for Admin Review)
INSERT INTO verification_requests (id, user_id, request_type, status, notes, document_path) VALUES
(1, 2, 'OFFICER', 'APPROVED', 'Pre-verified during prototype database seeding (Officer Patra)', 'sample-documents/valid_ror_plot142a.txt'),
(2, 6, 'LANDOWNER', 'APPROVED', 'Pre-verified during prototype database seeding (Landowner Das)', 'sample-documents/valid_ror_plot142a.txt');
