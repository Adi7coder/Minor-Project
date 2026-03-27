-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table (Municipal)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- admin, inspector, viewer
    zones INTEGER[], -- Array of assigned zone IDs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Zones Table
CREATE TABLE IF NOT EXISTS zones (
    zone_id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    boundary GEOGRAPHY(POLYGON, 4326), -- PostGIS polygon
    active BOOLEAN DEFAULT TRUE
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(20) UNIQUE NOT NULL, -- GD-YYYYMMDD-XXXXX
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT,
    location_point GEOGRAPHY(POINT, 4326), -- PostGIS for spatial queries
    image_urls TEXT[], -- Array of S3/Local URLs
    confidence_score FLOAT,
    waste_type VARCHAR(50), -- plastic, organic, construction, mixed
    status VARCHAR(20) NOT NULL, -- pending, verified, in_progress, resolved, rejected
    assigned_to UUID REFERENCES users(user_id),
    citizen_phone TEXT, -- Optional, encrypted
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    CONSTRAINT valid_coordinates CHECK (
        latitude BETWEEN 12.8 AND 13.2 AND
        longitude BETWEEN 77.4 AND 77.8
    )
);

CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST(location_point);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_tracking_code ON reports(tracking_code);

-- Detection Results Table (separate for ML metadata)
CREATE TABLE IF NOT EXISTS detection_results (
    detection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(report_id) ON DELETE CASCADE,
    model_version VARCHAR(50),
    confidence_score FLOAT,
    waste_type VARCHAR(50),
    detections JSONB, -- Array of detected objects with bboxes
    inference_time FLOAT,
    detected_at TIMESTAMP DEFAULT NOW()
);

-- Status History Table (audit trail)
CREATE TABLE IF NOT EXISTS status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(report_id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID REFERENCES users(user_id),
    notes TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
