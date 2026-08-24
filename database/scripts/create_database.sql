-- ====================================================================
-- BhoomiSetu AI Database Initialization Script
-- ====================================================================

-- Execute Schema Tables, Relationships, and Indexes
.read database/schema/tables.sql
.read database/schema/indexes.sql

-- Execute Demo Seeds
.read database/seeds/users.sql
.read database/seeds/projects.sql
.read database/seeds/cases.sql
.read database/seeds/parcels.sql
.read database/seeds/compensations.sql
.read database/seeds/tasks.sql
.read database/seeds/grievances.sql
