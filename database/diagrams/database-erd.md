# BhoomiSetu AI — Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    DEPARTMENTS ||--o{ USERS : "employs"
    DEPARTMENTS ||--o{ DEPARTMENTAL_TASKS : "assigned_to"
    USERS ||--o{ PROJECTS : "authorizes"
    USERS ||--o{ ACQUISITION_CASES : "manages"
    USERS ||--o{ DOCUMENTS : "uploads_or_verifies"
    USERS ||--o{ LANDOWNERS : "authenticates_as"
    
    PROJECTS ||--|{ ACQUISITION_CASES : "contains"
    VILLAGES ||--|{ ACQUISITION_CASES : "situates"
    VILLAGES ||--|{ PARCELS : "contains_plots"
    VILLAGES ||--o{ LANDOWNERS : "resides_in"
    
    ACQUISITION_CASES ||--|{ PARCELS : "acquires"
    ACQUISITION_CASES ||--o{ DOCUMENTS : "evidences"
    ACQUISITION_CASES ||--o{ DEPARTMENTAL_TASKS : "workflows"
    ACQUISITION_CASES ||--o{ RISK_PREDICTIONS : "evaluates"
    ACQUISITION_CASES ||--o{ GRIEVANCES : "disputes"
    ACQUISITION_CASES ||--o{ ALERTS : "notifies"

    PARCELS ||--|{ PARCEL_OWNERSHIPS : "mapped_by"
    LANDOWNERS ||--|{ PARCEL_OWNERSHIPS : "owns_share"
    
    PARCELS ||--o{ DOCUMENTS : "attaches"
    PARCELS ||--o{ COMPENSATIONS : "values_and_pays"
    LANDOWNERS ||--o{ COMPENSATIONS : "receives_award"
    
    COMPENSATIONS ||--o{ COMPENSATION_STAGES_LOG : "progresses_through"
    
    DOCUMENTS ||--o| OCR_RESULTS : "analyzed_by"
    
    RISK_PREDICTIONS ||--|{ PREDICTION_FACTORS : "explains_via_SHAP"
    
    GRIEVANCES ||--|{ GRIEVANCE_UPDATES : "tracks_resolution"
    
    USERS ||--o{ ACTIVITY_LOGS : "audits_action"
```

## Primary Entity Key Hierarchy
- **Project**: Macro-infrastructure level (Highways, Rails, Canals).
- **Village**: Cadastral survey unit within Tahsil/District.
- **Acquisition Case**: Administrative statutory file tracking notification sections (4(1), 6(1), 11(1), 19(1), Award) and overall delay probability.
- **Land Parcel**: Physical plot polygon with Plot No, Khata No, Land Type, and Valuations.
- **Landowner**: Legal titleholder / co-sharer receiving compensation awards.
- **Documents & OCR**: Digital Patta / RoRs scanned for discrepancies.
- **9-Stage Compensation**: Milestone-driven award payment tracking.
