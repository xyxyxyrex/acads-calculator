-- Drop and recreate the sessions table with the correct schema
DROP TABLE IF EXISTS sessions CASCADE;

CREATE TABLE sessions (
  session_token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Create index on session_token
CREATE INDEX IF NOT EXISTS session_token_idx ON sessions (session_token);
