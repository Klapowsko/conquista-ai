package spellbook

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 180 * time.Second, // 3 minutos para trilhas educacionais complexas
		},
	}
}

// ============================================================================
// Topics API Types
// ============================================================================

type TopicsRequest struct {
	Subject string `json:"subject"`
	Count   int    `json:"count"`
}

type TopicsResponse struct {
	Subject string   `json:"subject"`
	Topics  []string `json:"topics"`
}

// ============================================================================
// Key Results API Types
// ============================================================================

type KeyResultsRequest struct {
	Objective      string  `json:"objective"`
	Count          int     `json:"count"`
	CompletionDate *string `json:"completion_date,omitempty"`
}

type KeyResultsResponse struct {
	Objective  string   `json:"objective"`
	KeyResults []string `json:"key_results"`
}

// ============================================================================
// Roadmap API Types
// ============================================================================

type RoadmapRequest struct {
	Topic        string `json:"topic"`
	AvailableDays *int  `json:"available_days,omitempty"`
	ExactItemCount *int `json:"exact_item_count,omitempty"` // Número exato de itens a serem gerados
}

type RoadmapResponse struct {
	Topic   string                    `json:"topic"`
	Roadmap []RoadmapCategoryResponse `json:"roadmap"`
}

type RoadmapCategoryResponse struct {
	Category string                `json:"category"`
	Items    []RoadmapItemResponse `json:"items"`
}

type RoadmapItemResponse struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

// ============================================================================
// Educational Roadmap API Types
// ============================================================================

type EducationalRoadmapRequest struct {
	Topic string `json:"topic"`
}

type EducationalRoadmapResponse struct {
	Topic    string                `json:"topic"`
	Books    []EducationalResource `json:"books"`
	Courses  []EducationalResource `json:"courses"`
	Videos   []EducationalResource `json:"videos"`
	Articles []EducationalResource `json:"articles"`
	Projects []EducationalResource `json:"projects"`
}

type EducationalResource struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	URL         string   `json:"url,omitempty"`
	Chapters    []string `json:"chapters,omitempty"`
	Duration    string   `json:"duration,omitempty"`
	Author      string   `json:"author,omitempty"`
}

func (c *Client) GenerateTopics(subject string, count int) (*TopicsResponse, error) {
	reqBody := TopicsRequest{
		Subject: subject,
		Count:   count,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar requisição: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/topics", c.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("erro na API Spellbook: status %d, body: %s", resp.StatusCode, string(body))
	}

	var topicsResp TopicsResponse
	if err := json.NewDecoder(resp.Body).Decode(&topicsResp); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta: %w", err)
	}

	return &topicsResp, nil
}

func (c *Client) GenerateKeyResults(objective string, count int, completionDate *time.Time) (*KeyResultsResponse, error) {
	var completionDateStr *string
	if completionDate != nil {
		formatted := completionDate.Format("2006-01-02")
		completionDateStr = &formatted
	}
	
	reqBody := KeyResultsRequest{
		Objective:      objective,
		Count:          count,
		CompletionDate: completionDateStr,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar requisição: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/key-results", c.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("erro na API Spellbook: status %d, body: %s", resp.StatusCode, string(body))
	}

	var keyResultsResp KeyResultsResponse
	if err := json.NewDecoder(resp.Body).Decode(&keyResultsResp); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta: %w", err)
	}

	return &keyResultsResp, nil
}

func (c *Client) GenerateRoadmap(topic string, availableDays *int, exactItemCount *int) (*RoadmapResponse, error) {
	reqBody := RoadmapRequest{
		Topic:        topic,
		AvailableDays: availableDays,
		ExactItemCount: exactItemCount,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar requisição: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/roadmap", c.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("erro na API Spellbook: status %d, body: %s", resp.StatusCode, string(body))
	}

	var roadmapResp RoadmapResponse
	if err := json.NewDecoder(resp.Body).Decode(&roadmapResp); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta: %w", err)
	}

	return &roadmapResp, nil
}

// ============================================================================
// Educational Roadmap API Methods
// ============================================================================

// GenerateEducationalRoadmap gera um roadmap educacional detalhado para um tópico específico,
// incluindo livros, cursos, vídeos, artigos e projetos lúdicos para consolidar o conhecimento.
func (c *Client) GenerateEducationalRoadmap(topic string) (*EducationalRoadmapResponse, error) {
	reqBody := EducationalRoadmapRequest{
		Topic: topic,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar requisição: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/educational-roadmap", c.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("erro na API Spellbook: status %d, body: %s", resp.StatusCode, string(body))
	}

	var roadmapResp EducationalRoadmapResponse
	if err := json.NewDecoder(resp.Body).Decode(&roadmapResp); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta: %w", err)
	}

	return &roadmapResp, nil
}

// ============================================================================
// Educational Trail API Types
// ============================================================================

type EducationalTrailRequest struct {
	Topic        string `json:"topic"`
	AvailableDays *int  `json:"available_days,omitempty"`
}

type TrailActivity struct {
	Type        string   `json:"type"`
	ResourceID  string   `json:"resource_id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Chapters    []string `json:"chapters,omitempty"`
	Duration    string   `json:"duration,omitempty"`
	URL         string   `json:"url,omitempty"`
	Progress    string   `json:"progress,omitempty"`
}

type EducationalTrailStep struct {
	Day         int            `json:"day"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Activities  []TrailActivity `json:"activities"`
}

type TrailResource struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Author      string   `json:"author,omitempty"`
	Chapters    []string `json:"chapters,omitempty"`
	Duration    string   `json:"duration,omitempty"`
	URL         string   `json:"url,omitempty"`
}

type EducationalTrailResponse struct {
	Topic       string                       `json:"topic"`
	TotalDays   int                          `json:"total_days"`
	Description string                       `json:"description"`
	Steps       []EducationalTrailStep    `json:"steps"`
	Resources   map[string]TrailResource    `json:"resources"`
}

// GenerateEducationalTrail gera uma trilha educacional estruturada em dias/etapas
func (c *Client) GenerateEducationalTrail(topic string, availableDays *int) (*EducationalTrailResponse, error) {
	reqBody := EducationalTrailRequest{
		Topic:        topic,
		AvailableDays: availableDays,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar requisição: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/educational-trail", c.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("erro na API Spellbook: status %d, body: %s", resp.StatusCode, string(body))
	}

	var trailResp EducationalTrailResponse
	if err := json.NewDecoder(resp.Body).Decode(&trailResp); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta: %w", err)
	}

	return &trailResp, nil
}
