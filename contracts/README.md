# BhoomiSetu AI — API Contracts & Technical Agreements

This directory houses the **contract-first specifications** that define how the frontend, backend, GIS, and ML systems communicate.

## Structure
- `openapi/`: Complete OpenAPI 3.0 YAML specification describing all REST endpoints.
- `json-schemas/`: Formal JSON schema definitions for critical payloads (Predictions, Parcels, Notifications).
- `examples/`: Realistic mock JSON responses used by the frontend when `VITE_USE_MOCK_API=true`.

## Contract-First Rule
Any change to request/response shapes must be documented here first before frontend or backend implementation begins. This ensures zero communication breakdown between team members.
