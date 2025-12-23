package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port            string
	DatabaseURL     string
	SpellbookAPIURL string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:            getEnv("PORT"),
		DatabaseURL:     getEnv("DATABASE_URL"),
		SpellbookAPIURL: getEnv("SPELLBOOK_API_URL"),
	}

	if cfg.Port == "" {
		return nil, fmt.Errorf("PORT é obrigatória")
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL é obrigatória")
	}
	if cfg.SpellbookAPIURL == "" {
		return nil, fmt.Errorf("SPELLBOOK_API_URL é obrigatória")
	}

	return cfg, nil
}

func getEnv(key string) string {
	return os.Getenv(key)
}
