-- ====================================================================
-- BHOOMISETU AI — SURVEY OFFICER MODULE SEED DATA (PROTOTYPE DATASET)
-- ====================================================================

-- 1. Survey Requests
INSERT INTO survey_requests (
    id, request_number, case_id, parcel_id, lao_id, assigned_so_id,
    status, priority, purpose, instructions, assignment_date, accepted_date,
    scheduled_date, survey_start_date, survey_completed_date, submission_date,
    deadline, return_reason
) VALUES
-- Survey 1: ASSIGNED (Pending SO Acceptance)
(
    1, 'SURV-REQ-2026-001', 1, 1, 2, 3,
    'ASSIGNED', 'High', 'NH-316 Highway Expansion - Cadastral Field Demarcation',
    'Conduct on-ground boundary verification, structure enumeration, and agricultural crop assessment for Plot 101.',
    '2026-08-28 10:00:00', NULL,
    NULL, NULL, NULL, NULL,
    '2026-09-15', NULL
),
-- Survey 2: SCHEDULED (Accepted and Date Planned)
(
    2, 'SURV-REQ-2026-002', 1, 2, 2, 3,
    'SCHEDULED', 'Medium', 'NH-316 Corridor Survey - Khurda Section',
    'Verify agricultural easement and check electrical pole alignments adjacent to highway corridor.',
    '2026-08-25 09:30:00', '2026-08-26 11:15:00',
    '2026-09-08', NULL, NULL, NULL,
    '2026-09-18', NULL
),
-- Survey 3: IN_PROGRESS (Active Field Survey)
(
    3, 'SURV-REQ-2026-003', 2, 4, 2, 3,
    'IN_PROGRESS', 'Urgent', 'Bhubaneswar Outer Ring Road - Critical Parcel Survey',
    'Detailed ETS/GPS survey of Plot 142/A with recorded co-sharer interests and well structure.',
    '2026-08-20 08:30:00', '2026-08-21 09:00:00',
    '2026-08-24', '2026-08-24 10:00:00', NULL, NULL,
    '2026-09-10', NULL
),
-- Survey 4: RESURVEY_REQUIRED (Discrepancy identified, awaiting resurvey)
(
    4, 'SURV-REQ-2026-004', 3, 7, 2, 3,
    'RESURVEY_REQUIRED', 'High', 'Puri Industrial Logistics Park - Boundary Alignment',
    'Re-measurement required due to neighbor boundary overlap and canal reserve buffer.',
    '2026-08-10 11:00:00', '2026-08-11 10:30:00',
    '2026-08-14', '2026-08-14 09:30:00', '2026-08-15 17:00:00', '2026-08-16 12:00:00',
    '2026-09-05', 'Canal bund boundary offset requires joint cadastral verification with Minor Irrigation JE.'
),
-- Survey 5: RETURNED (Returned by LAO for clarification)
(
    5, 'SURV-REQ-2026-005', 1, 3, 2, 3,
    'RETURNED', 'Medium', 'NH-316 Junction Roundabout Demarcation',
    'Survey report returned: Please attach high-resolution photos of the tube-well structure on north boundary.',
    '2026-08-12 14:00:00', '2026-08-13 10:00:00',
    '2026-08-16', '2026-08-16 11:00:00', '2026-08-17 16:30:00', '2026-08-18 15:00:00',
    '2026-09-12', 'Photographic evidence for irrigation borewell structure is missing from Annexure B.'
),
-- Survey 6: COMPLETED (Approved & Sanctioned)
(
    6, 'SURV-REQ-2026-006', 2, 5, 2, 3,
    'COMPLETED', 'Low', 'Outer Ring Road Interchange Section 4',
    'Cadastral boundaries verified. Clean title without encumbrance or structure dispute.',
    '2026-08-01 09:00:00', '2026-08-02 10:00:00',
    '2026-08-05', '2026-08-05 09:30:00', '2026-08-05 16:00:00', '2026-08-06 11:00:00',
    '2026-08-20', NULL
);

-- 2. Survey Schedules
INSERT INTO survey_schedules (
    id, survey_request_id, scheduled_date, scheduled_time,
    expected_duration_hours, field_team_members, special_instructions, notes
) VALUES
(1, 2, '2026-09-08', '10:00 AM', 3.0, 'S. Mishra (SO), R. K. Nayak (Amin), P. Swain (Chainman)', 'Coordinate with Sarpanch Pipili for spot notice.', 'Landowner informed via phone.'),
(2, 3, '2026-08-24', '09:30 AM', 4.0, 'S. Mishra (SO), Amin Pipili Tahsil', 'Bring DGPS / ETS equipment for high precision sub-plot coordinates.', 'Landowner Shri Bikram Keshari Das present.'),
(3, 4, '2026-08-14', '10:30 AM', 3.5, 'S. Mishra (SO), Balipatna Revenue Inspector', 'Inspect boundary peg on western side.', 'Irrigation buffer controversy flagged.'),
(4, 5, '2026-08-16', '11:00 AM', 2.5, 'S. Mishra (SO), Chainman', 'Photograph borewell installation.', 'Re-inspection scheduled.'),
(5, 6, '2026-08-05', '09:30 AM', 3.0, 'S. Mishra (SO), Amin Barang', 'Complete cadastral perimeter measurement.', 'Joint inspection completed.');

-- 3. Survey Document Verifications
INSERT INTO survey_document_verifications (
    id, survey_request_id, document_id, doc_type, doc_title,
    file_path, verification_status, mismatch_details, remarks, verified_at, verified_by_id
) VALUES
-- For Survey 3 (Plot 142/A):
(1, 3, 1, 'Record of Rights (RoR)', 'RoR Khatiyan No. 312 Pipili', 'sample-documents/valid_ror_plot142a.txt', 'VERIFIED', NULL, 'RoR matches official Bhulekh cadastral records.', '2026-08-22 14:00:00', 3),
(2, 3, 2, 'Land ownership document', 'Registered Sale Deed No. 4410', 'sample-documents/valid_ror_plot142a.txt', 'VERIFIED', NULL, 'Land title verified against Sub-Registrar records.', '2026-08-22 14:15:00', 3),
(3, 3, 3, 'Land map', 'Cadastral Village Map Sheet 2 Pipili', 'sample-documents/valid_ror_plot142a.txt', 'VERIFIED', NULL, 'Plot shape and access lane match GIS vector layout.', '2026-08-22 14:30:00', 3),
-- For Survey 4 (Plot 110 - Balipatna):
(4, 4, NULL, 'Record of Rights (RoR)', 'RoR Khatiyan No. 104 Balipatna', 'sample-documents/ror_discrepancy_plot142a.txt', 'MISMATCH', 'Recorded area in RoR is 2.80 Acres but field measurement indicates 2.45 Acres.', 'Discrepancy in Western boundary buffer.', '2026-08-12 11:30:00', 3),
(5, 4, NULL, 'Previous survey report', 'Tahsil Survey Sheet 2019', NULL, 'MISSING', 'Previous 2019 road widening survey report not provided in case dossier.', 'Requested from Tahsil record room.', '2026-08-12 11:45:00', 3);

-- 4. Survey GPS & Location Verifications
INSERT INTO survey_gps_verifications (
    id, survey_request_id, captured_latitude, captured_longitude,
    expected_latitude, expected_longitude, distance_from_expected_meters,
    location_status, is_manual_entry, captured_at
) VALUES
(1, 3, 20.124500, 85.832400, 20.124580, 85.832450, 10.4, 'LOCATION VERIFIED', 0, '2026-08-24 10:15:00'),
(2, 4, 20.186500, 85.894200, 20.187800, 85.896100, 245.8, 'NEAR EXPECTED LOCATION', 0, '2026-08-14 10:00:00'),
(3, 5, 20.128900, 85.835100, 20.128920, 85.835120, 3.2, 'LOCATION VERIFIED', 0, '2026-08-16 11:15:00'),
(4, 6, 20.354100, 85.823900, 20.354110, 85.823890, 1.8, 'LOCATION VERIFIED', 0, '2026-08-05 09:45:00');

-- 5. Survey Field Observations
INSERT INTO survey_field_observations (
    id, survey_request_id, observed_area_acres, land_use, crop_type,
    irrigation_available, general_condition, has_house, has_building,
    has_boundary_wall, has_well, has_pond, trees_count, has_electrical_infra,
    other_structures, landowner_present, occupant_present, tenant_present,
    occupancy_remarks, boundary_status, boundary_remarks
) VALUES
-- Survey 3 (Plot 142/A):
(
    1, 3, 4.500, 'Agricultural', 'Paddy / Kharif (Swarna variety)',
    1, 'Well-maintained fertile agricultural land with canal feeder access.',
    0, 0, 0, 1, 0, 8, 0,
    '1 Masonry Irrigation Borewell with 5HP pump, 8 mature Coconut trees on field bund.',
    1, 1, 0,
    'Recorded Pattadar Shri Bikram Keshari Das present during spot inspection.',
    'Boundary matches records',
    'All 4 corner boundary pillars (Munha) identified and verified against cadastral map.'
),
-- Survey 4 (Plot 110):
(
    2, 4, 2.450, 'Agricultural', 'Vegetable cultivation',
    1, 'Partially waterlogged low-lying terrain near minor canal.',
    0, 0, 1, 0, 0, 3, 1,
    'Temporary brick boundary wall along western edge encroaching 3.5 meters into canal reserve.',
    1, 1, 1,
    'Tenant farmer cultivating seasonal greens.',
    'Boundary mismatch',
    'Western corner boundary pillar missing. Neighboring claimant disputes boundary line.'
),
-- Survey 6 (Plot 120 - Completed):
(
    3, 6, 1.850, 'Agricultural', 'Paddy',
    0, 'Flat dry land with clear access road on eastern frontage.',
    0, 0, 0, 0, 0, 2, 0,
    'No immovable structures on land.',
    1, 1, 0,
    'Landowner confirmed boundaries without dispute.',
    'Boundary matches records',
    'Corner coordinates verified with GPS survey.'
);

-- 6. Survey Photo / Video Evidence
INSERT INTO survey_evidence (
    id, survey_request_id, category, title, description,
    file_path, file_type, latitude, longitude, uploaded_at, uploaded_by_id
) VALUES
(1, 3, 'Land Boundary', 'North-Eastern Boundary Peg Marker', 'Spot photo showing verified cadastral boundary stone.', '/sample-documents/valid_ror_plot142a.txt', 'photo', 20.124500, 85.832400, '2026-08-24 10:30:00', 3),
(2, 3, 'Existing Structure', 'Irrigation Borewell & Pump Housing', 'Masonry well structure on south-west boundary corner.', '/sample-documents/valid_ror_plot142a.txt', 'photo', 20.124200, 85.832100, '2026-08-24 10:45:00', 3),
(3, 4, 'Encroachment', 'Western Canal Bund Overlap', 'Photo showing newly constructed brick boundary wall inside canal reserve.', '/sample-documents/ror_discrepancy_plot142a.txt', 'photo', 20.186500, 85.894200, '2026-08-14 10:20:00', 3),
(4, 6, 'Parcel Location', 'Wide View of Demarcated Plot 120', 'Panoramic photo of agricultural parcel with demarcation flags.', '/sample-documents/valid_ror_plot142a.txt', 'photo', 20.354100, 85.823900, '2026-08-05 10:00:00', 3);

-- 7. Survey Discrepancies
INSERT INTO survey_discrepancies (
    id, survey_request_id, category, description, severity, evidence_id, remarks
) VALUES
-- Discrepancy for Survey 4:
(
    1, 4, 'Boundary mismatch',
    'Western boundary pillar displaced by 3.5 meters into canal reserve buffer.',
    'HIGH', 3, 'Joint inspection with Minor Irrigation Department recommended.'
),
(
    2, 4, 'Area mismatch',
    'Observed land area is 2.45 Acres vs RoR recorded area of 2.80 Acres (-0.35 Acres discrepancy).',
    'HIGH', NULL, 'Requires re-measurement with electronic total station (ETS).'
);

-- 8. Resurvey Requests
INSERT INTO survey_resurvey_requests (
    id, original_survey_request_id, new_survey_request_id, resurvey_reason,
    priority, required_action, supporting_evidence, remarks, requested_by_id,
    requested_at, status, reviewed_by_id, reviewed_at
) VALUES
(
    1, 4, NULL,
    'Boundary pillar missing on Western canal frontage; 0.35 Acre area reduction on ground.',
    'High', 'Joint boundary demarcation with Tahsil Amin, Minor Irrigation JE, and adjacent plot owners.',
    'Evidence Item #3 (Photo of brick wall inside canal buffer)',
    'Resurvey notice to be served to adjacent khata owners 5 days in advance.',
    3, '2026-08-16 12:30:00', 'PENDING_LAO_REVIEW', NULL, NULL
);

-- 9. Survey Reports
INSERT INTO survey_reports (
    id, report_number, survey_request_id, final_recommendation, final_remarks,
    is_digitally_confirmed, certified_by_officer_id, certified_officer_name,
    certified_at, certification_statement, checklist_json, report_summary_json,
    generated_at, submitted_at, reviewed_by_lao_id, lao_review_status,
    lao_review_remarks, lao_reviewed_at, reviewed_by_co_id, co_review_status,
    co_review_remarks, co_reviewed_at
) VALUES
-- Report for Completed Survey 6:
(
    1, 'SURV-REP-2026-006', 6, 'Survey Completed',
    'All four boundary markers physically verified against cadastral revenue records. Landowner agreed with survey boundaries without objections.',
    1, 3, 'Sunita Mishra',
    '2026-08-06 10:45:00',
    'I certify that the information recorded in this survey report is based on the field survey conducted by me.',
    '{"documents_verified":true,"parcel_verified":true,"survey_completed":true,"location_recorded":true,"field_observations_completed":true,"evidence_attached":true,"discrepancies_recorded":true,"remarks_entered":true,"report_reviewed":true}',
    '{"observed_area":1.85,"crop":"Paddy","structures":"None","boundary_status":"Verified Clean"}',
    '2026-08-06 10:30:00', '2026-08-06 11:00:00',
    2, 'APPROVED',
    'Survey report vetted and approved. Proceed to Section 19 notification.', '2026-08-07 15:00:00',
    NULL, 'APPROVED',
    'Cadastral valuation verified for compensation computation.', '2026-08-08 11:30:00'
);

-- 10. Survey Status History & Audit Trail
INSERT INTO survey_status_history (
    id, survey_request_id, previous_status, new_status, action, remarks, performed_by_id, timestamp
) VALUES
(1, 1, NULL, 'ASSIGNED', 'Survey Request Created', 'LAO Ashok Patra created survey request and assigned to SO Sunita Mishra.', 2, '2026-08-28 10:00:00'),
(2, 2, 'ASSIGNED', 'ACCEPTED', 'Survey Assignment Accepted', 'SO Sunita Mishra accepted survey assignment.', 3, '2026-08-26 11:15:00'),
(3, 2, 'ACCEPTED', 'SCHEDULED', 'Field Survey Scheduled', 'Survey scheduled for 2026-09-08 at 10:00 AM.', 3, '2026-08-27 09:00:00'),
(4, 3, 'ASSIGNED', 'ACCEPTED', 'Survey Assignment Accepted', 'SO Sunita Mishra accepted urgent survey assignment.', 3, '2026-08-21 09:00:00'),
(5, 3, 'ACCEPTED', 'SCHEDULED', 'Field Survey Scheduled', 'Survey scheduled for 2026-08-24 at 09:30 AM.', 3, '2026-08-22 10:00:00'),
(6, 3, 'SCHEDULED', 'IN_PROGRESS', 'Survey Started', 'Field survey commenced on site. DGPS coordinates recorded.', 3, '2026-08-24 10:00:00'),
(7, 4, 'IN_PROGRESS', 'RESURVEY_REQUIRED', 'Resurvey Initiated', 'Resurvey requested due to canal bund boundary overlap and missing survey stone.', 3, '2026-08-16 12:30:00'),
(8, 5, 'SUBMITTED', 'RETURNED', 'Returned by LAO', 'LAO returned report for missing borewell photo documentation.', 2, '2026-08-19 14:00:00'),
(9, 6, 'SUBMITTED', 'APPROVED', 'Survey Approved by LAO', 'LAO Ashok Patra approved the final survey report.', 2, '2026-08-07 15:00:00'),
(10, 6, 'APPROVED', 'COMPLETED', 'Survey Completed', 'Survey finalized and archived into case dossier.', 2, '2026-08-08 12:00:00');

-- 11. Survey Predictive Delay Metrics
INSERT INTO survey_predictive_metrics (
    id, survey_request_id, assignment_date, acceptance_date, scheduled_date,
    survey_start_date, survey_completion_date, submission_date,
    document_mismatches_count, missing_docs_count, discrepancies_count,
    critical_discrepancies_count, resurvey_requests_count, corrections_count,
    landowner_availability_issue, field_access_issue, boundary_mismatch,
    gps_mismatch, doc_verification_duration_days, survey_duration_days,
    review_duration_days, times_report_returned
) VALUES
(1, 1, '2026-08-28', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0, 0.0, 0.0, 0),
(2, 2, '2026-08-25', '2026-08-26', '2026-09-08', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.1, 0.0, 0.0, 0),
(3, 3, '2026-08-20', '2026-08-21', '2026-08-24', '2026-08-24', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2.0, 4.0, 0.0, 0),
(4, 4, '2026-08-10', '2026-08-11', '2026-08-14', '2026-08-14', '2026-08-15', '2026-08-16', 1, 1, 2, 1, 1, 0, 0, 1, 1, 0, 2.0, 5.0, 2.0, 0),
(5, 5, '2026-08-12', '2026-08-13', '2026-08-16', '2026-08-16', '2026-08-17', '2026-08-18', 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.0, 4.0, 2.0, 1),
(6, 6, '2026-08-01', '2026-08-02', '2026-08-05', '2026-08-05', '2026-08-05', '2026-08-06', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.0, 4.0, 2.0, 0);
