-- Seed default platform settings. Idempotent — re-running is safe.
INSERT INTO platform_settings (key, value, updated_at)
VALUES
  ('min_approval_votes',     '"10"',     NOW()),
  ('approval_window_hours',  '"15"',     NOW()),
  ('dispute_window_hours',   '"24"',     NOW()),
  ('stake_fee_percentage',   '"1"',      NOW()),
  ('starting_balance',       '"10"',     NOW()),
  ('min_stake_amount',       '"1"',      NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
