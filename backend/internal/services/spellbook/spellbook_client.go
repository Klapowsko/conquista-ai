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
			Timeout: 30 * time.Second,
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
// Roadmap API Types
// ============================================================================

type RoadmapRequest struct {
	Topic string `json:"topic"`
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

func (c *Client) GenerateRoadmap(topic string) (*RoadmapResponse, error) {
	reqBody := RoadmapRequest{
		Topic: topic,
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
