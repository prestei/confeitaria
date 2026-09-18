-- Rode no seu Postgres local (ajuste o usuário se precisar):
-- psql -U postgres -f scripts/init-db.sql

CREATE USER confeitaria WITH PASSWORD 'confeitaria';
CREATE DATABASE confeitaria OWNER confeitaria;
GRANT ALL PRIVILEGES ON DATABASE confeitaria TO confeitaria;

\c confeitaria
GRANT ALL ON SCHEMA public TO confeitaria;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO confeitaria;
