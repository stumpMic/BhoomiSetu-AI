-- ====================================================================
-- BhoomiSetu AI Database Seeds: 30+ Acquisition Cases
-- ====================================================================

INSERT INTO acquisition_cases (
    id, case_number, project_id, village_id, notification_section, current_stage, status, assigned_officer_id,
    target_deadline, current_delay_probability, current_risk_level, predicted_delay_days,
    missing_doc_pct, survey_completed_pct, ownership_disputes_count, court_cases_count,
    pending_approvals_count, compensation_progress_pct, bank_verification_pct, environmental_clearance, rehabilitation_required
) VALUES
-- Project 1: Bhubaneswar-Puri Expressway Corridor (Pipili & Balipatna)
(1, 'CASE-OD-2026-001', 1, 1, '4(1)', 'Joint Survey & Verification', 'In Progress', 2, '2026-10-15', 0.22, 'Low', 12, 10.0, 85.0, 0, 0, 0, 15.0, 30.0, 1, 0),
(2, 'CASE-OD-2026-002', 1, 1, '6(1)', 'Objections & Hearing (Sec 15)', 'In Progress', 2, '2026-09-30', 0.35, 'Low', 24, 15.0, 70.0, 0, 0, 1, 20.0, 40.0, 1, 0),
(3, 'CASE-OD-2026-003', 1, 1, '11(1)', 'Valuation & Award Determination', 'In Progress', 2, '2026-11-15', 0.48, 'Medium', 52, 25.0, 60.0, 1, 0, 2, 35.0, 50.0, 1, 0),
-- *** CASE 4: PRIMARY HIGH-RISK DEMO CASE ***
(4, 'CASE-OD-2026-004', 1, 1, '11(1)', 'Joint Survey & Verification', 'In Progress', 2, '2026-11-30', 0.84, 'High', 145, 35.0, 40.0, 2, 1, 2, 30.0, 45.0, 1, 1),
(5, 'CASE-OD-2026-005', 1, 1, 'Award', 'Compensation Disbursement', 'In Progress', 2, '2026-08-30', 0.18, 'Low', 8, 5.0, 95.0, 0, 0, 0, 80.0, 90.0, 1, 0),
(6, 'CASE-OD-2026-006', 1, 2, '4(1)', 'Notification Published', 'In Progress', 2, '2026-12-31', 0.28, 'Low', 18, 20.0, 80.0, 0, 0, 0, 10.0, 20.0, 1, 0),
(7, 'CASE-OD-2026-007', 1, 2, '6(1)', 'Joint Survey & Verification', 'In Progress', 2, '2026-10-31', 0.52, 'Medium', 64, 30.0, 50.0, 1, 0, 1, 25.0, 35.0, 1, 0),
(8, 'CASE-OD-2026-008', 1, 2, '11(1)', 'Valuation & Award Determination', 'In Progress', 2, '2026-11-20', 0.76, 'High', 120, 40.0, 45.0, 2, 1, 3, 20.0, 30.0, 0, 1),
(9, 'CASE-OD-2026-009', 1, 2, 'Award', 'Possession Handover', 'Completed', 2, '2026-07-31', 0.12, 'Low', 0, 0.0, 100.0, 0, 0, 0, 100.0, 100.0, 1, 0),
(10, 'CASE-OD-2026-010', 1, 2, 'Award', 'Compensation Disbursement', 'In Progress', 2, '2026-09-15', 0.25, 'Low', 15, 10.0, 90.0, 0, 0, 0, 75.0, 85.0, 1, 0),

-- Project 2: Mahanadi Water Basin Canal Link (Barang & Biridi)
(11, 'CASE-OD-2026-011', 2, 3, '4(1)', 'Notification Published', 'In Progress', 2, '2027-01-31', 0.31, 'Low', 20, 15.0, 75.0, 0, 0, 1, 5.0, 15.0, 1, 0),
(12, 'CASE-OD-2026-012', 2, 3, '6(1)', 'Joint Survey & Verification', 'In Progress', 2, '2026-11-30', 0.45, 'Medium', 48, 25.0, 65.0, 1, 0, 1, 20.0, 40.0, 1, 0),
(13, 'CASE-OD-2026-013', 2, 3, '11(1)', 'Objections & Hearing (Sec 15)', 'In Progress', 2, '2026-12-15', 0.81, 'High', 135, 45.0, 35.0, 3, 2, 2, 15.0, 25.0, 0, 1),
(14, 'CASE-OD-2026-014', 2, 3, '11(1)', 'Valuation & Award Determination', 'In Progress', 2, '2026-10-15', 0.38, 'Low', 28, 10.0, 80.0, 0, 0, 0, 40.0, 60.0, 1, 0),
(15, 'CASE-OD-2026-015', 2, 3, 'Award', 'Compensation Disbursement', 'In Progress', 2, '2026-09-30', 0.20, 'Low', 10, 5.0, 95.0, 0, 0, 0, 85.0, 90.0, 1, 0),
(16, 'CASE-OD-2026-016', 2, 4, '4(1)', 'Notification Published', 'In Progress', 2, '2027-02-28', 0.26, 'Low', 16, 12.0, 80.0, 0, 0, 0, 5.0, 10.0, 1, 0),
(17, 'CASE-OD-2026-017', 2, 4, '6(1)', 'Joint Survey & Verification', 'In Progress', 2, '2026-12-31', 0.62, 'Medium', 88, 35.0, 50.0, 1, 1, 2, 15.0, 30.0, 1, 0),
(18, 'CASE-OD-2026-018', 2, 4, '11(1)', 'Valuation & Award Determination', 'In Progress', 2, '2026-11-30', 0.72, 'High', 110, 38.0, 40.0, 2, 1, 1, 25.0, 40.0, 1, 1),
(19, 'CASE-OD-2026-019', 2, 4, 'Award', 'Compensation Disbursement', 'In Progress', 2, '2026-09-15', 0.22, 'Low', 12, 8.0, 90.0, 0, 0, 0, 70.0, 80.0, 1, 0),
(20, 'CASE-OD-2026-020', 2, 4, 'Award', 'Possession Handover', 'Completed', 2, '2026-08-15', 0.08, 'Low', 0, 0.0, 100.0, 0, 0, 0, 100.0, 100.0, 1, 0),

-- Project 3: Paradip Port Coastal Heavy-Haul Railway (Ersama & Kujang)
(21, 'CASE-OD-2026-021', 3, 5, '4(1)', 'Notification Published', 'In Progress', 2, '2027-03-31', 0.29, 'Low', 22, 15.0, 75.0, 0, 0, 1, 0.0, 10.0, 1, 0),
(22, 'CASE-OD-2026-022', 3, 5, '6(1)', 'Joint Survey & Verification', 'In Progress', 2, '2026-12-15', 0.58, 'Medium', 75, 30.0, 55.0, 1, 0, 2, 10.0, 25.0, 1, 0),
(23, 'CASE-OD-2026-023', 3, 5, '11(1)', 'Objections & Hearing (Sec 15)', 'In Progress', 2, '2026-11-15', 0.88, 'High', 160, 50.0, 30.0, 4, 2, 3, 10.0, 20.0, 0, 1),
(24, 'CASE-OD-2026-024', 3, 5, '11(1)', 'Valuation & Award Determination', 'In Progress', 2, '2026-10-31', 0.44, 'Medium', 42, 20.0, 70.0, 0, 0, 1, 30.0, 50.0, 1, 0),
(25, 'CASE-OD-2026-025', 3, 5, 'Award', 'Compensation Disbursement', 'In Progress', 2, '2026-09-30', 0.19, 'Low', 10, 5.0, 95.0, 0, 0, 0, 80.0, 90.0, 1, 0),
(26, 'CASE-OD-2026-026', 3, 6, '4(1)', 'Notification Published', 'In Progress', 2, '2027-04-30', 0.30, 'Low', 20, 18.0, 75.0, 0, 0, 1, 0.0, 5.0, 1, 0),
(27, 'CASE-OD-2026-027', 3, 6, '6(1)', 'Joint Survey & Verification', 'In Progress', 2, '2027-01-31', 0.55, 'Medium', 68, 28.0, 60.0, 1, 0, 2, 15.0, 30.0, 1, 0),
(28, 'CASE-OD-2026-028', 3, 6, '11(1)', 'Valuation & Award Determination', 'In Progress', 2, '2026-12-15', 0.68, 'Medium', 95, 32.0, 50.0, 2, 1, 2, 25.0, 45.0, 1, 1),
(29, 'CASE-OD-2026-029', 3, 6, 'Award', 'Compensation Disbursement', 'In Progress', 2, '2026-09-30', 0.16, 'Low', 8, 4.0, 95.0, 0, 0, 0, 90.0, 95.0, 1, 0),
(30, 'CASE-OD-2026-030', 3, 6, 'Award', 'Possession Handover', 'Completed', 2, '2026-07-15', 0.05, 'Low', 0, 0.0, 100.0, 0, 0, 0, 100.0, 100.0, 1, 0),
(31, 'CASE-OD-2026-031', 1, 1, '6(1)', 'Joint Survey & Verification', 'In Progress', 2, '2026-11-10', 0.42, 'Medium', 44, 20.0, 65.0, 0, 0, 1, 20.0, 35.0, 1, 0),
(32, 'CASE-OD-2026-032', 2, 3, '11(1)', 'Valuation & Award Determination', 'In Progress', 2, '2026-12-05', 0.49, 'Medium', 56, 22.0, 60.0, 1, 0, 1, 30.0, 45.0, 1, 0);
