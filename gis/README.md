# BhoomiSetu AI — GIS Subsystem

Geospatial data layers, parcel cadastral boundaries, village demarcation polygons, and color-coded risk visualizers.

## GeoJSON Files
- `geojson/sample_parcels.geojson`: 80+ cadastral land plots for demonstration villages in Odisha (Pipili, Balipatna, Barang, Biridi, Ersama, Kujang).
- `geojson/sample_villages.geojson`: Village administrative boundary polygons.
- `geojson/sample_project_boundary.geojson`: Infrastructure corridor alignment polygon.

## Scripts & Validation
- `scripts/generate_sample_parcels.py`: Geospatial generator creating topologically sound, adjacent cadastral parcel polygons.
- `scripts/validate_geojson.py`: Validates GeoJSON compliance and bounding boxes.
- `styles/risk-colours.json`: Authoritative risk color schema (Green, Yellow, Red, Grey, Blue).
