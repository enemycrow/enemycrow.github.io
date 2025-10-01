-- Schema for reactions tracking
CREATE TABLE IF NOT EXISTS reactions_votes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    reaction VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY reactions_votes_unique (slug, ip_hash, reaction),
    KEY reactions_votes_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reactions_totals (
    slug VARCHAR(255) NOT NULL PRIMARY KEY,
    toco INT UNSIGNED NOT NULL DEFAULT 0,
    sumergirme INT UNSIGNED NOT NULL DEFAULT 0,
    personajes INT UNSIGNED NOT NULL DEFAULT 0,
    mundo INT UNSIGNED NOT NULL DEFAULT 0,
    lugares INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
