-- ====================================================================
-- BhoomiSetu AI Database Seeds: 9-Stage Compensations
-- RFCTLARR Act 2013 Valuation: Base Land Value + 100% Solatium + Interest
-- ====================================================================

INSERT INTO compensations (
    id, parcel_id, landowner_id, case_id, base_land_value_inr, solatium_100pct_inr,
    additional_interest_inr, total_award_inr, landowner_share_inr, current_stage, stage_index,
    responsible_officer_id, mock_payment_ref, payment_disbursed_at
) VALUES
-- Demo Case 4 Parcels (Plot 142/A with Bikram Das at Stage 4: Approval Pending)
(1, 12, 12, 4, 3375000.0, 3375000.0, 250000.0, 7000000.0, 3500000.0, 'Approval pending', 4, 4, 'MOCK-PFMS-OD-2026-994821', NULL),
(2, 12, 13, 4, 3375000.0, 3375000.0, 250000.0, 7000000.0, 3500000.0, 'Approval pending', 4, 4, 'MOCK-PFMS-OD-2026-994822', NULL),
(3, 14, 14, 4, 4480000.0, 4480000.0, 350000.0, 9310000.0, 9310000.0, 'Bank verification', 7, 4, 'MOCK-PFMS-OD-2026-994823', NULL),
(4, 15, 15, 4, 4350000.0, 4350000.0, 300000.0, 9000000.0, 9000000.0, 'Compensation approved', 5, 4, 'MOCK-PFMS-OD-2026-994824', NULL),

-- Case 1 to 3
(5, 1, 1, 1, 1500000.0, 1500000.0, 100000.0, 3100000.0, 3100000.0, 'Valuation completed', 2, 4, NULL, NULL),
(6, 2, 2, 1, 1860000.0, 1860000.0, 120000.0, 3840000.0, 3840000.0, 'Land valuation pending', 1, 4, NULL, NULL),
(7, 4, 4, 2, 2520000.0, 2520000.0, 180000.0, 5220000.0, 5220000.0, 'Compensation calculated', 3, 4, NULL, NULL),
(8, 7, 7, 3, 2280000.0, 2280000.0, 160000.0, 4720000.0, 4720000.0, 'Landowner consent pending', 6, 4, NULL, NULL),

-- Completed cases (Payment Completed - Stage 9)
(9, 16, 10, 5, 2700000.0, 2700000.0, 200000.0, 5600000.0, 5600000.0, 'Payment completed', 9, 4, 'MOCK-PFMS-OD-2026-881201', '2026-07-20 11:30:00'),
(10, 17, 11, 5, 3075000.0, 3075000.0, 220000.0, 6370000.0, 6370000.0, 'Payment completed', 9, 4, 'MOCK-PFMS-OD-2026-881202', '2026-07-22 14:15:00'),
(11, 25, 22, 9, 1650000.0, 1650000.0, 110000.0, 3410000.0, 3410000.0, 'Payment completed', 9, 4, 'MOCK-PFMS-OD-2026-881203', '2026-06-30 10:00:00'),
(12, 37, 30, 20, 2600000.0, 2600000.0, 180000.0, 5380000.0, 5380000.0, 'Payment completed', 9, 4, 'MOCK-PFMS-OD-2026-881204', '2026-08-01 16:45:00');

-- Insert Initial Stage History Logs
INSERT INTO compensation_stages_log (compensation_id, stage_name, stage_index, updated_by_user_id, remarks) VALUES
(1, 'Land valuation pending', 1, 4, 'Valuation initiated for Pipili cluster'),
(1, 'Valuation completed', 2, 4, 'Benchmark land rate approved @ Rs 15L/acre'),
(1, 'Compensation calculated', 3, 4, 'Total calculated with 100% solatium: Rs 70 Lakhs'),
(1, 'Approval pending', 4, 4, 'Award draft forwarded to Competent Authority for sanction');
