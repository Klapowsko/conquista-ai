package models

import "time"

// Reward é um item da loja de recompensas (ex.: "Café no fim de semana").
type Reward struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	Cost        int       `json:"cost"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RewardRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Cost        int    `json:"cost" binding:"required"`
}
