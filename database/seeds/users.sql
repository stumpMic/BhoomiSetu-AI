-- ====================================================================
-- BhoomiSetu AI Database Seeds: Departments & Users
-- Password for all demo accounts: DemoPass123!
-- Hashed via bcrypt ($2b$12$K1dJ... or standard passlib format)
-- ====================================================================

-- Departments
INSERT INTO departments (id, name, code, description, contact_email) VALUES
(1, 'Revenue & Land Reforms Department', 'REV', 'Land records, mutations, inquiries, and gazette notifications', 'revenue.cell@bhoomisetu.gov.in'),
(2, 'Survey & Cadastral Directorate', 'SURV', 'DGPS surveys, plot boundary demarcations, and village maps', 'survey.cell@bhoomisetu.gov.in'),
(3, 'Compensation & Accounts Cell', 'COMP', 'Land valuations, award calculations, and PFMS disbursements', 'compensation.cell@bhoomisetu.gov.in'),
(4, 'Forest & Environment Clearance Cell', 'ENV', 'Environmental clearances and compensatory afforestation', 'forest.cell@bhoomisetu.gov.in'),
(5, 'Legal & Dispute Resolution Cell', 'LEGAL', 'Land acquisition tribunals, court cases, and joint hearings', 'legal.cell@bhoomisetu.gov.in');

-- Users (All initial demo seed accounts are marked VERIFIED)
INSERT INTO users (id, email, hashed_password, full_name, phone, role, department_id, district, state, address, verification_status, is_active) VALUES
(1, 'admin@bhoomisetu.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W5650h6W5650h6W5', 'Shri R. K. Mohapatra (IAS)', '+91 94370 00001', 'admin', 1, 'Bhubaneswar', 'Odisha', 'Secretariat, Lok Seva Bhawan, Bhubaneswar', 'VERIFIED', 1),
(2, 'officer.patra@bhoomisetu.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W5650h6W5650h6W5', 'Shri Ashok Patra (OAS)', '+91 94370 12345', 'land_acquisition_officer', 1, 'Khurda', 'Odisha', 'Collectorate, Khurda', 'VERIFIED', 1),
(3, 'surveyor.mishra@bhoomisetu.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W5650h6W5650h6W5', 'Smt. Sunita Mishra', '+91 94370 23456', 'survey_officer', 2, 'Khurda', 'Odisha', 'Survey Bhawan, Bhubaneswar', 'VERIFIED', 1),
(4, 'comp.jena@bhoomisetu.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W5650h6W5650h6W5', 'Shri Debasis Jena', '+91 94370 34567', 'compensation_officer', 3, 'Khurda', 'Odisha', 'Collectorate, Khurda', 'VERIFIED', 1),
(5, 'authority.nayak@bhoomisetu.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W5650h6W5650h6W5', 'Dr. Bijay Nayak', '+91 94370 45678', 'project_authority', 1, 'Odisha', 'Odisha', 'Works Department, Bhubaneswar', 'VERIFIED', 1),
(6, 'landowner.das@gmail.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W5650h6W5650h6W5', 'Bikram Keshari Das', '+91 98610 99881', 'landowner', NULL, 'Khurda', 'Odisha', 'Hatapatana, Pipili, Dist: Khurda', 'VERIFIED', 1),
(7, 'landowner.rout@gmail.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W5650h6W5650h6W5', 'Smt. Manorama Rout', '+91 94371 44552', 'landowner', NULL, 'Khurda', 'Odisha', 'Gop Road, Pipili', 'VERIFIED', 1);
