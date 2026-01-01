package models

import "time"

type KeyResult struct {
	ID                   int64      `json:"id"`
	OKRID                int64      `json:"okr_id"`
	Title                string     `json:"title"`
	Completed            bool       `json:"completed"`
	ExpectedCompletionDate *time.Time `json:"expected_completion_date,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type CreateKeyResultRequest struct {
	OKRID int64  `json:"okr_id" binding:"required"`
	Title string `json:"title" binding:"required"`
}

type UpdateKeyResultRequest struct {
	Title     string `json:"title" binding:"required"`
	Completed bool   `json:"completed"`
}

