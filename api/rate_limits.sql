-- Table for IP-based rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    ip VARCHAR(45) PRIMARY KEY,
    last_request DATETIME NOT NULL,
    attempts INT NOT NULL
);
