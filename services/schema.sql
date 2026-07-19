-- =============================================================
--  Kanad S.H.I.E.L.D. — Shared Database Schema  (schema.sql)
--  Owner: Developer 1 | All three devs agree on this file Day 1
--  Mounted as docker-entrypoint-initdb.d in the Postgres container
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------
-- USERS (victim / general public accounts)
-- -----------------------------------------------------------------
CREATE TABLE users (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone             VARCHAR(15) UNIQUE NOT NULL,
    full_name         VARCHAR(120),
    password_hash     TEXT        NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',   -- en | hi | gu
    totp_secret       TEXT,                         -- NULL = phone-OTP only
    is_active         BOOLEAN     DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------
-- EMERGENCY CONTACTS  (guardians per user)
-- -----------------------------------------------------------------
CREATE TABLE emergency_contacts (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
    contact_name   VARCHAR(120),
    contact_phone  VARCHAR(15),
    relationship   VARCHAR(50)
);

-- -----------------------------------------------------------------
-- POLICE OFFICERS
-- -----------------------------------------------------------------
CREATE TABLE police_officers (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_no    VARCHAR(30) UNIQUE NOT NULL,
    name        VARCHAR(120),
    station     VARCHAR(120),
    role        VARCHAR(30) DEFAULT 'officer',   -- officer | supervisor | admin
    totp_secret TEXT        NOT NULL DEFAULT '',  -- MFA required for officers
    is_active   BOOLEAN     DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------
-- INCIDENTS  (physical SOS + cyber crime, unified)
-- -----------------------------------------------------------------
CREATE TABLE incidents (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         REFERENCES users(id),
    incident_type       VARCHAR(20)  NOT NULL CHECK (incident_type IN ('physical','cyber')),
    category            VARCHAR(40),
    -- sos | stalking | harassment | fraud | deepfake | blackmail | fake_profile | phishing
    status              VARCHAR(20)  DEFAULT 'open',
    -- open | under_review | dispatched | en_route | arrived | escalated | resolved | closed
    severity            SMALLINT     DEFAULT 0 CHECK (severity BETWEEN 0 AND 100),
    lat                 DOUBLE PRECISION,
    lng                 DOUBLE PRECISION,
    description         TEXT,
    is_silent           BOOLEAN      DEFAULT false,
    perpetrator_phone   VARCHAR(15),
    perpetrator_upi     VARCHAR(60),
    perpetrator_device  VARCHAR(120),
    assigned_officer_id UUID         REFERENCES police_officers(id),
    erss_case_id        VARCHAR(60),             -- filled by ERSS adapter
    created_at          TIMESTAMPTZ  DEFAULT now(),
    updated_at          TIMESTAMPTZ  DEFAULT now()
);

-- -----------------------------------------------------------------
-- EVIDENCE  (hash-chain, tamper-evident)
-- -----------------------------------------------------------------
CREATE TABLE evidence (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id    UUID         REFERENCES incidents(id) ON DELETE CASCADE,
    file_ref       TEXT         NOT NULL,       -- MinIO/S3 object key
    file_hash      CHAR(64)     NOT NULL,       -- SHA-256 of raw file bytes
    prev_hash      CHAR(64),                    -- chain link (NULL for first item)
    chain_hash     CHAR(64)     NOT NULL,       -- SHA256(file_hash + prev_hash + timestamp)
    uploaded_by    UUID         REFERENCES users(id),
    ntp_timestamp  TIMESTAMPTZ  NOT NULL,
    metadata_json  JSONB,                       -- original filename, mime-type, size
    verified       BOOLEAN      DEFAULT false   -- set true after verify endpoint confirms chain
);

-- -----------------------------------------------------------------
-- AI SCORES  (one row per AI module invocation on any target)
-- -----------------------------------------------------------------
CREATE TABLE ai_scores (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    module        VARCHAR(40)  NOT NULL,
    -- phishing | fake_profile | harassment_nlp | deepfake | social_scan | facial_match
    target_type   VARCHAR(20)  NOT NULL,         -- url | profile | message | image
    target_ref    TEXT         NOT NULL,          -- the URL / profile URL / evidence_id
    incident_id   UUID         REFERENCES incidents(id),
    score         NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    confidence    NUMERIC(4,3),
    features_json JSONB,                         -- top contributing features (explainability)
    flag_for_review BOOLEAN    DEFAULT false,
    reviewed_by   UUID         REFERENCES police_officers(id),
    reviewed_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  DEFAULT now()
);

-- -----------------------------------------------------------------
-- CASE LINKS  (repeat-offender entity resolution edges)
--   Written by Dev 2's entity-resolution service; read by Dev 1's police API
-- -----------------------------------------------------------------
CREATE TABLE case_links (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_a  UUID        REFERENCES incidents(id),
    incident_b  UUID        REFERENCES incidents(id),
    link_type   VARCHAR(30),
    -- same_phone | same_upi | same_face | same_device | same_email
    confidence  NUMERIC(4,3),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------
-- FACIAL SEARCH AUDIT  (every police face-search is logged here)
-- -----------------------------------------------------------------
CREATE TABLE facial_search_audit (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id        UUID        REFERENCES police_officers(id) NOT NULL,
    case_reference    VARCHAR(60) NOT NULL,
    justification     TEXT        NOT NULL,
    query_image_ref   TEXT        NOT NULL,
    top_match_ids     JSONB,
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------
-- REFRESH TOKENS  (JWT rotation — stored for revocation support)
-- -----------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,                           -- NULL if officer token
    officer_id  UUID,
    token_hash  CHAR(64)    NOT NULL UNIQUE,    -- SHA-256 of the raw refresh token
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------
CREATE INDEX idx_incidents_status          ON incidents(status);
CREATE INDEX idx_incidents_geo             ON incidents(lat, lng);
CREATE INDEX idx_incidents_user            ON incidents(user_id);
CREATE INDEX idx_incidents_type_status     ON incidents(incident_type, status);
CREATE INDEX idx_incidents_created         ON incidents(created_at DESC);
CREATE INDEX idx_evidence_incident         ON evidence(incident_id);
CREATE INDEX idx_ai_scores_incident        ON ai_scores(incident_id);
CREATE INDEX idx_ai_scores_module          ON ai_scores(module);
CREATE INDEX idx_case_links_a              ON case_links(incident_a);
CREATE INDEX idx_case_links_b              ON case_links(incident_b);
CREATE INDEX idx_refresh_tokens_hash       ON refresh_tokens(token_hash);

-- -----------------------------------------------------------------
-- SEED: demo police officer account (change password in production!)
-- -----------------------------------------------------------------
INSERT INTO police_officers (badge_no, name, station, role, totp_secret)
VALUES ('ACP-001', 'Demo Officer', 'Cyber Crime Branch Ahmedabad', 'officer', 'DEMO_TOTP_SECRET_CHANGE_ME');
