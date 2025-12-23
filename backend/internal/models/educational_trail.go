package models

import "time"

type EducationalTrail struct {
	ID           int64                    `json:"id"`
	RoadmapItemID int64                    `json:"roadmap_item_id"`
	Topic        string                   `json:"topic"`
	TotalDays    int                      `json:"total_days"`
	Description  string                   `json:"description"`
	Steps        []EducationalTrailStep   `json:"steps"`
	Resources    map[string]TrailResource `json:"resources"`
	CreatedAt    time.Time                `json:"created_at"`
	UpdatedAt    time.Time                `json:"updated_at"`
}

type EducationalTrailStep struct {
	ID          int64                  `json:"id"`
	TrailID     int64                  `json:"trail_id"`
	Day         int                    `json:"day"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Activities  []TrailActivity        `json:"activities"`
	CreatedAt   time.Time              `json:"created_at"`
}

type TrailActivity struct {
	ID          int64     `json:"id"`
	StepID      int64     `json:"step_id"`
	Type        string    `json:"type"`
	ResourceID  string    `json:"resource_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Chapters    []string  `json:"chapters,omitempty"`
	Duration    string    `json:"duration,omitempty"`
	URL         string    `json:"url,omitempty"`
	Progress    string    `json:"progress,omitempty"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TrailResource struct {
	ID          int64    `json:"id"`
	TrailID     int64    `json:"trail_id"`
	ResourceID  string   `json:"resource_id"` // ID único do recurso na trilha
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Author      string   `json:"author,omitempty"`
	Chapters    []string `json:"chapters,omitempty"`
	Duration    string   `json:"duration,omitempty"`
	URL         string   `json:"url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

