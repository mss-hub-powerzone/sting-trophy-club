CREATE TABLE IF NOT EXISTS `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `registrations` (
	`player_id` text PRIMARY KEY NOT NULL,
	`selections` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`paid_cents` integer DEFAULT 0 NOT NULL,
	`payment_note` text DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, name TEXT NOT NULL, team TEXT NOT NULL, jersey TEXT NOT NULL, emails TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staff (email TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_challenges (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions (hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS session_expiry ON auth_sessions(expires_at);
CREATE TABLE IF NOT EXISTS auth_rate (key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL);
