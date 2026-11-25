package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:        os.Getenv("PORT"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}

	if cfg.Port == "" {
		return nil, fmt.Errorf("PORT é obrigatória")
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL é obrigatória")
	}
	return cfg, nil
}
