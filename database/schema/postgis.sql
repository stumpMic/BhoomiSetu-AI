-- ====================================================================
-- BhoomiSetu AI Database Schema - PostGIS Spatial Extension
-- ====================================================================

-- Enable PostGIS extension if running on PostgreSQL/PostGIS
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- In PostGIS production environments, parcel polygons can be stored natively:
-- ALTER TABLE parcels ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326);
-- CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom);

-- For prototype interoperability, parcels store GeoJSON directly in `geometry_geojson`.
