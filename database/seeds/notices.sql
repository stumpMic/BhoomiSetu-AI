-- ====================================================================
-- BhoomiSetu AI Database Seeds: Statutory Notices & Public Announcements
-- ====================================================================

INSERT INTO notices (
    id, case_id, notice_number, notice_type, title,
    content_summary, priority, deadline, issuing_authority,
    publish_date, status, is_active, recipients_count
) VALUES
(
    1, 1, 'NOTICE-2026-001',
    'Section 4(1) Preliminary Notification',
    'Preliminary Notification for NH-316 Highway Expansion (Pipili Tahsil)',
    'Notice is hereby given under Section 4(1) of RFCTLARR Act 2013 regarding proposed acquisition of land across Pipili village for national highway widening.',
    'Urgent', '2026-10-15',
    'Land Acquisition Officer, Khurda District',
    '2026-08-15', 'Published', 1, 24
),
(
    2, 2, 'NOTICE-2026-002',
    'Section 11(1) Preliminary Notification',
    'Notification under Section 11(1) for Bhubaneswar Outer Ring Road',
    'Government of Odisha intends to acquire land in Barang Tahsil for public purpose under Section 11(1) of Act 30 of 2013. Objections may be filed within 60 days.',
    'Important', '2026-10-30',
    'Special Land Acquisition Officer, Bhubaneswar',
    '2026-08-20', 'Published', 1, 42
),
(
    3, 3, 'NOTICE-2026-003',
    'Section 19(1) Declaration',
    'Declaration of Public Purpose for Puri Logistics Park (Balipatna)',
    'Declaration under Section 19(1) of RFCTLARR Act 2013 that land is required for development of multi-modal logistics terminal.',
    'Normal', '2026-11-15',
    'District Collector & Magistrate, Puri',
    '2026-08-25', 'Published', 1, 18
);
