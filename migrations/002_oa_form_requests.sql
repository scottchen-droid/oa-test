-- ============================================================
-- OA System - Migration 002: OA Form Requests Table
-- ============================================================

CREATE TABLE IF NOT EXISTS oa_form_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type VARCHAR(50) NOT NULL,
    submitter_user_id UUID NOT NULL REFERENCES users(id),
    content JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    approval_instance_id UUID REFERENCES approval_instances(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oa_form_requests_submitter ON oa_form_requests(submitter_user_id);
CREATE INDEX IF NOT EXISTS idx_oa_form_requests_status ON oa_form_requests(status);
CREATE INDEX IF NOT EXISTS idx_oa_form_requests_form_type ON oa_form_requests(form_type);
