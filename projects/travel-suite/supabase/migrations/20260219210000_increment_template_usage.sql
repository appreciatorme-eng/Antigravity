-- Function to atomically increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE tour_templates
    SET
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
