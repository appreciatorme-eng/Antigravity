/**
 * Portal E2E Test Fixtures
 *
 * Creates valid test data for portal E2E tests.
 */

import { createClient } from '@supabase/supabase-js';

interface CreatePortalTokenOptions {
  tripName: string;
  travelerName: string;
  operatorName: string;
}

/**
 * Creates a valid test portal token in the database for E2E testing.
 * Returns the generated token that can be used in portal URLs.
 */
export async function createTestPortalToken(
  options: CreatePortalTokenOptions
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Generate a unique token for this test run
  const token = `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Create a test trip portal entry
  const { data, error } = await supabase
    .from('trip_portals')
    .insert({
      token,
      trip_name: options.tripName,
      traveler_name: options.travelerName,
      operator_name: options.operatorName,
      // Add any other required fields with sensible defaults
      created_at: new Date().toISOString(),
    })
    .select('token')
    .single();

  if (error) {
    throw new Error(
      `Failed to create test portal token: ${error.message}`
    );
  }

  return data.token;
}

/**
 * Cleans up test portal tokens created during E2E tests.
 * Should be called in test teardown to avoid polluting the database.
 */
export async function cleanupTestPortalTokens(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return; // Skip cleanup if credentials not available
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Delete all tokens that start with 'e2e-test-'
  await supabase
    .from('trip_portals')
    .delete()
    .like('token', 'e2e-test-%');
}
