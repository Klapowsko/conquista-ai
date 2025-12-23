package models

import "time"

type Roadmap struct {
	ID          int64          `json:"id"`
	KeyResultID int64          `json:"key_result_id"`
	Topic       string         `json:"topic"`
	Categories  []RoadmapCategory `json:"categories"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type RoadmapCategory struct {
	ID        int64         `json:"id"`
	RoadmapID int64         `json:"roadmap_id"`
	Category  string        `json:"category"`
	Items     []RoadmapItem `json:"items"`
	CreatedAt time.Time     `json:"created_at"`
}

type RoadmapItem struct {
	ID           int64     `json:"id"`
	CategoryID   int64     `json:"category_id"`
	Title        string    `json:"title"`
	Completed    bool      `json:"completed"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateRoadmapRequest struct {
	KeyResultID int64 `json:"key_result_id" binding:"required"`
}

