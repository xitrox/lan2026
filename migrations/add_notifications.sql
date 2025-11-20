-- Add notification preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_chat BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_games BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_accommodations BOOLEAN DEFAULT true;

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, endpoint)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
