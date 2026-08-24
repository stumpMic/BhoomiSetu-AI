-- ====================================================================
-- BhoomiSetu AI Database Seeds: Landowner Grievances & Updates History
-- ====================================================================

INSERT INTO grievances (
    id, grievance_number, case_id, parcel_id, landowner_id, category,
    subject, description, status, assigned_department_id, assigned_officer_id, resolution_notes
) VALUES
-- Demo Case 4 Grievance by Landowner Bikram Das
(1, 'GRV-OD-2026-0089', 4, 12, 12, 'Ownership dispute',
 'Clarification on co-sharer division for Plot 142/A',
 'My brother and I have submitted our registered partition deed of 2018, but the initial notification list published at Tahsil office shows a single joint award. We request separate award sanction vouchers for each 50% share.',
 'Under Review', 1, 2, 'Hearing notice issued to both brothers for verification of original partition deed.'),

-- Additional Grievances
(2, 'GRV-OD-2026-0090', 4, 14, 14, 'Incorrect land measurement',
 'Re-measurement request for boundary alignment with village canal',
 'The survey sketch includes 0.3 acres of homestead garden land as non-irrigated agricultural category.',
 'Assigned', 2, 3, 'Joint re-survey scheduled with Amin and complainant.'),

(3, 'GRV-OD-2026-0091', 13, 29, 26, 'Incorrect compensation',
 'Structural valuation missing for tubewell and boundary wall',
 'The award calculation includes land value but excludes the borewell and 120 ft boundary wall constructed in 2021.',
 'Submitted', 3, 4, NULL),

(4, 'GRV-OD-2026-0092', 23, 40, 32, 'Payment not received',
 'Delay in compensation credit after bank account verification',
 'Bank account was verified on 10th July 2026, but award amount of Rs 8.45 Lakhs not yet credited.',
 'Action Taken', 3, 4, 'PFMS batch sanction token generated; payment processing by treasury.'),

(5, 'GRV-OD-2026-0093', 18, 35, 28, 'Document-verification issue',
 'Deceased father death certificate mutation delay',
 'Father Late Baidyanath Panda passed away in 2023; legal heir certificate submitted but mutation not updated in case records.',
 'Resolved', 1, 2, 'Legal heir certificate verified; mutation entered and legal heirs added to acquisition register.');

-- Grievance Update Logs
INSERT INTO grievance_updates (grievance_id, stage, updated_by_user_id, remarks) VALUES
(1, 'Submitted', 6, 'Grievance submitted by landowner via BhoomiSetu portal.'),
(1, 'Assigned', 1, 'Assigned to Land Acquisition Officer, Pipili circle for inquiry.'),
(1, 'Under Review', 2, 'Notice issued for joint appearance on 28th August 2026.'),
(5, 'Submitted', NULL, 'Grievance submitted at Tahsil facilitation center.'),
(5, 'Assigned', 1, 'Assigned to Revenue Department.'),
(5, 'Action Taken', 2, 'Hearing conducted with Tahsildar.'),
(5, 'Resolved', 2, 'Mutation updated in Bhulekh and award list amended.');
