-- ====================================================================
-- BhoomiSetu AI Database Seeds: Departmental Tasks
-- ====================================================================

INSERT INTO departmental_tasks (
    id, title, description, project_id, case_id, parcel_id, assigned_department_id,
    assigned_officer_id, priority, status, start_date, deadline, completed_at, is_overdue, remarks
) VALUES
-- Overdue Survey Task on Demo Case 4
(1, 'Complete Cadastral DGPS Survey for Plot 142/A & 142/B', 'Physical boundary demarcation and coordinate capture using DGPS rovers in Pipili village.', 1, 4, 12, 2, 3, 'High', 'Overdue', '2026-07-15', '2026-08-10', NULL, 1, 'Survey team delayed due to local co-sharer boundary objections.'),

-- Revenue Verification Task on Demo Case 4
(2, 'Verify RoR Mutation Records for Plot 142/A Sub-division', 'Cross-examine Khatiyan No 312 against Bhulekh land records for legal co-sharers Bikram Das and Prasant Das.', 1, 4, 12, 1, 2, 'High', 'In progress', '2026-08-15', '2026-08-25', NULL, 0, 'Pending joint affidavit from co-sharers.'),

-- Compensation Approval Task on Demo Case 4
(3, 'Sanction Award Statement for Case CASE-OD-2026-004', 'Administrative financial sanction for Rs 36.75 Cr package under Section 23 of RFCTLARR Act 2013.', 1, 4, NULL, 3, 4, 'High', 'To do', '2026-08-10', '2026-08-28', NULL, 0, 'Awaiting final title dispute clearance from LAO.'),

-- Tasks for other cases across departments
(4, 'Publish Gazette Notification 11(1) for Balipatna Parcels', 'Draft statutory public notice in Odia daily newspapers and District Gazette.', 1, 7, NULL, 1, 2, 'Medium', 'Completed', '2026-06-01', '2026-06-20', '2026-06-18 15:30:00', 0, 'Published in Samaj and Sambad newspapers.'),
(5, 'Forest Clearance Stage-II Submission for Barang Corridor', 'Submit compliance report on compensatory afforestation land handover.', 2, 13, 29, 4, NULL, 'Urgent', 'Overdue', '2026-06-15', '2026-07-31', NULL, 1, 'CA land proposal pending Tahsildar endorsement.'),
(6, 'Conduct Section 15 Objections Hearing for Biridi Case 18', 'Hear claims and objections from 14 affected families regarding structural valuation.', 2, 18, NULL, 5, 2, 'High', 'To do', '2026-08-20', '2026-09-05', NULL, 0, 'Hearing venue booked at Biridi Block conference hall.'),
(7, 'Verify Bank Account Details for Ersama Beneficiaries', 'PFMS mandate validation for 8 beneficiaries before RTGS disbursement.', 3, 23, NULL, 3, 4, 'Medium', 'In progress', '2026-08-12', '2026-08-26', NULL, 0, '4 passbooks verified, 4 pending branch confirmation.'),
(8, 'Coordinate Railway Alignment Encroachment Removal', 'Joint inspection with District Police and East Coast Railway engineers.', 3, 28, 45, 1, 2, 'High', 'Waiting for info', '2026-08-01', '2026-08-30', NULL, 0, 'Awaiting magistrate deployment order.');
