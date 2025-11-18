-- ============================================
-- LAN Party 2026 Database Schema
-- PostgreSQL Database Schema for Supabase/Vercel
-- ============================================

-- ============================================
-- TABLE: users
-- User accounts for the LAN party system
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- ============================================
-- TABLE: event_data
-- Main event information (single row)
-- ============================================
CREATE TABLE IF NOT EXISTS event_data (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'LAN Party 2026',
    event_date TIMESTAMP,
    location VARCHAR(255),
    max_participants INTEGER DEFAULT 30,
    registration_password VARCHAR(255) NOT NULL DEFAULT 'lanparty2026',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: cabins
-- Cabin/location suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS cabins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT,
    image_url TEXT,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for created_by
CREATE INDEX IF NOT EXISTS idx_cabins_created_by ON cabins(created_by);

-- ============================================
-- TABLE: cabin_votes
-- User votes for cabins
-- ============================================
CREATE TABLE IF NOT EXISTS cabin_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cabin_id INTEGER NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cabin_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cabin_votes_user_id ON cabin_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_cabin_votes_cabin_id ON cabin_votes(cabin_id);

-- ============================================
-- TABLE: games
-- Game suggestions for the LAN party
-- ============================================
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_name ON games(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);

-- ============================================
-- TABLE: game_votes
-- User votes for games
-- ============================================
CREATE TABLE IF NOT EXISTS game_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_votes_user_id ON game_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_game_id ON game_votes(game_id);

-- ============================================
-- TABLE: messages
-- Chat/discussion messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- TRIGGERS for auto-updating timestamps
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for messages table
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for event_data table
DROP TRIGGER IF EXISTS update_event_data_updated_at ON event_data;
CREATE TRIGGER update_event_data_updated_at
    BEFORE UPDATE ON event_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Insert default event data
-- ============================================
INSERT INTO event_data (title, event_date, location, max_participants, registration_password)
VALUES (
    'Enemy Territory Reunion LAN 2026',
    '2026-06-20 14:00:00',
    'TBD - To be decided via cabin voting',
    30,
    'lanparty2026'
)
ON CONFLICT DO NOTHING;
