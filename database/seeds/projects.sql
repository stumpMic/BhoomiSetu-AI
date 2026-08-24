-- ====================================================================
-- BhoomiSetu AI Database Seeds: Projects & Villages
-- ====================================================================

-- 3 Fictional Infrastructure Projects in Odisha
INSERT INTO projects (id, code, name, description, executing_agency, project_authority_id, state, districts, target_start_date, target_end_date, estimated_budget_cr, total_area_required_acres, status) VALUES
(1, 'PRJ-OD-EXP-001', 'Bhubaneswar-Puri Expressway Corridor', '6-lane Greenfield expressway connecting Capital City with Heritage City Puri to ease tourist traffic and boost coastal economic corridor.', 'National Highways Authority of India (NHAI) / Works Dept', 5, 'Odisha', 'Khurda, Puri', '2025-01-15', '2027-06-30', 2450.00, 380.50, 'Active'),
(2, 'PRJ-OD-CAN-002', 'Mahanadi Water Basin Canal Link', 'Inter-basin agricultural irrigation canal and flood alleviation corridor through Cuttack and Khurda agricultural zones.', 'Water Resources Department, Govt of Odisha', 5, 'Odisha', 'Cuttack, Khurda', '2024-08-01', '2026-12-31', 1120.00, 240.00, 'Active'),
(3, 'PRJ-OD-RLY-003', 'Paradip Port Coastal Heavy-Haul Railway Expansion', 'Dedicated dual-track freight rail line enhancing coal, steel, and container logistics from industrial hinterlands to Paradip Deepwater Port.', 'East Coast Railway / Rail Vikas Nigam Ltd', 5, 'Odisha', 'Jagatsinghpur, Cuttack', '2025-03-01', '2027-12-31', 3180.00, 520.00, 'Active');

-- 6 Demonstration Villages in Odisha
INSERT INTO villages (id, name, tahsil, district, state, pincode, latitude, longitude) VALUES
(1, 'Pipili', 'Pipili', 'Khurda', 'Odisha', '752104', 20.1228, 85.8335),
(2, 'Balipatna', 'Balipatna', 'Khurda', 'Odisha', '752102', 20.1850, 85.9520),
(3, 'Barang', 'Barang', 'Cuttack', 'Odisha', '754005', 20.4010, 85.8230),
(4, 'Biridi', 'Biridi', 'Jagatsinghpur', 'Odisha', '754111', 20.3150, 86.0820),
(5, 'Ersama', 'Ersama', 'Jagatsinghpur', 'Odisha', '754139', 20.1980, 86.4250),
(6, 'Kujang', 'Kujang', 'Jagatsinghpur', 'Odisha', '754141', 20.2950, 86.5380);
