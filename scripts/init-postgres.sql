-- Inisialisasi Role dan Database Terisolasi untuk SIMAG BMKG (Development & Testing)

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'simag_local') THEN
    CREATE ROLE simag_local WITH LOGIN PASSWORD 'simag_local_pass' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'simag_test') THEN
    CREATE ROLE simag_test WITH LOGIN PASSWORD 'simag_test_pass' NOSUPERUSER CREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END
$$;

SELECT 'CREATE DATABASE simag_bmkg OWNER simag_local'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'simag_bmkg')\gexec

SELECT 'CREATE DATABASE simag_bmkg_test OWNER simag_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'simag_bmkg_test')\gexec

ALTER DATABASE simag_bmkg OWNER TO simag_local;
ALTER DATABASE simag_bmkg_test OWNER TO simag_test;

-- Isolasi akses silang antar database
REVOKE CONNECT ON DATABASE simag_bmkg FROM PUBLIC;
REVOKE CONNECT ON DATABASE simag_bmkg_test FROM PUBLIC;

GRANT CONNECT, TEMPORARY ON DATABASE simag_bmkg TO simag_local;
GRANT CONNECT, TEMPORARY ON DATABASE simag_bmkg_test TO simag_test;

\connect simag_bmkg
GRANT ALL ON SCHEMA public TO simag_local;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO simag_local;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO simag_local;

\connect simag_bmkg_test
GRANT ALL ON SCHEMA public TO simag_test;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO simag_test;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO simag_test;
