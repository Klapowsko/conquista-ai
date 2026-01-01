package models

import "time"

type OKR struct {
	ID             int64      `json:"id"`
	Objective      string     `json:"objective"`
	CategoryID     int64      `json:"category_id"`
	Category       *Category  `json:"category,omitempty"`
	CompletionDate *time.Time `json:"completion_date,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type CreateOKRRequest struct {
	Objective      string  `json:"objective" binding:"required"`
	CategoryID     int64   `json:"category_id" binding:"required"`
	CompletionDate *string `json:"completion_date,omitempty"`
}

type UpdateOKRRequest struct {
	Objective      string  `json:"objective" binding:"required"`
	CategoryID     int64   `json:"category_id" binding:"required"`
	CompletionDate *string `json:"completion_date,omitempty"`
}

