package models

import "time"

type EducationalRoadmap struct {
	ID           int64                    `json:"id"`
	RoadmapItemID int64                    `json:"roadmap_item_id"`
	Topic        string                   `json:"topic"`
	Books        []EducationalResource    `json:"books"`
	Courses      []EducationalResource    `json:"courses"`
	Videos       []EducationalResource    `json:"videos"`
	Articles     []EducationalResource    `json:"articles"`
	Projects     []EducationalResource    `json:"projects"`
	CreatedAt    time.Time                `json:"created_at"`
	UpdatedAt    time.Time                `json:"updated_at"`
}

type EducationalResource struct {
	ID          int64     `json:"id"`
	RoadmapID   int64     `json:"educational_roadmap_id"`
	Type        string    `json:"type"` // 'book', 'course', 'video', 'article', 'project'
	Title       string    `json:"title"`
	Description string    `json:"description"`
	URL         string    `json:"url,omitempty"`
	Author      string    `json:"author,omitempty"`
	Duration    string    `json:"duration,omitempty"`
	Chapters    []string  `json:"chapters,omitempty"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type EducationalResourceChapter struct {
	ID          int64     `json:"id"`
	ResourceID  int64     `json:"resource_id"`
	ChapterTitle string   `json:"chapter_title"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateEducationalRoadmapRequest struct {
	RoadmapItemID int64  `json:"roadmap_item_id" binding:"required"`
	Topic         string `json:"topic" binding:"required"`
}

