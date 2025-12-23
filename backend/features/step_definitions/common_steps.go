package step_definitions

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/cucumber/godog"
)

type apiContext struct {
	response *http.Response
	body     []byte
	baseURL  string
}

var ctx *apiContext

func InitializeCommonScenario(ctx *godog.ScenarioContext) {
	ctx.Step(`^que o sistema está configurado$`, queOSistemaEstaConfigurado)
	ctx.Step(`^existe uma categoria com name "([^"]*)"$`, existeUmaCategoriaComName)
	ctx.Step(`^existe um OKR com objective "([^"]*)"$`, existeUmOKRComObjective)
	ctx.Step(`^existe um Key Result com title "([^"]*)"$`, existeUmKeyResultComTitle)
	ctx.Step(`^existe um roadmap para um Key Result$`, existeUmRoadmapParaUmKeyResult)
	ctx.Step(`^existe um roadmap com itens$`, existeUmRoadmapComItens)
	ctx.Step(`^existem OKRs cadastrados$`, existemOKRsCadastrados)
	ctx.Step(`^existem OKRs na categoria "([^"]*)"$`, existemOKRsNaCategoria)
}

func queOSistemaEstaConfigurado() error {
	ctx = &apiContext{
		baseURL: getBaseURL(),
	}
	return nil
}

func getBaseURL() string {
	url := os.Getenv("API_BASE_URL")
	if url == "" {
		return "http://localhost:8080"
	}
	return url
}

func makeRequest(method, path string, body interface{}) error {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, ctx.baseURL+path, reqBody)
	if err != nil {
		return err
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}

	ctx.response = resp
	ctx.body, _ = io.ReadAll(resp.Body)
	resp.Body.Close()

	return nil
}

func existeUmaCategoriaComName(name string) error {
	body := map[string]interface{}{
		"name": name,
	}
	return makeRequest("POST", "/api/v1/categories", body)
}

func existeUmOKRComObjective(objective string) error {
	// Primeiro criar categoria se não existir
	categoryBody := map[string]interface{}{
		"name": "Profissional",
	}
	makeRequest("POST", "/api/v1/categories", categoryBody)

	// Buscar categorias para pegar o ID
	resp, _ := http.Get(ctx.baseURL + "/api/v1/categories")
	if resp != nil && resp.StatusCode == 200 {
		var categories []map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&categories)
		resp.Body.Close()

		if len(categories) > 0 {
			categoryID := int(categories[0]["id"].(float64))
			okrBody := map[string]interface{}{
				"objective":  objective,
				"category_id": categoryID,
			}
			return makeRequest("POST", "/api/v1/okrs", okrBody)
		}
	}

	return fmt.Errorf("não foi possível criar OKR")
}

func existeUmKeyResultComTitle(title string) error {
	// Implementação simplificada - em produção seria mais complexo
	return nil
}

func existeUmRoadmapParaUmKeyResult() error {
	// Implementação simplificada
	return nil
}

func existeUmRoadmapComItens() error {
	// Implementação simplificada
	return nil
}

func existemOKRsCadastrados() error {
	// Implementação simplificada
	return nil
}

func existemOKRsNaCategoria(categoryName string) error {
	// Implementação simplificada
	return nil
}

