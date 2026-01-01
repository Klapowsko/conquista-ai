package utils

import (
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// ValidateURL verifica se uma URL é válida e acessível
// Retorna true se a URL é válida e acessível, false caso contrário
// Retorna erro se houver problema na validação
func ValidateURL(urlString string) (bool, error) {
	// Se URL estiver vazia, considerar válida (não obrigatória)
	if urlString == "" {
		return true, nil
	}

	// Verificar formato da URL
	parsedURL, err := url.Parse(urlString)
	if err != nil {
		return false, fmt.Errorf("URL inválida: %w", err)
	}

	// Verificar se tem scheme (http/https)
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return false, fmt.Errorf("URL deve usar http ou https")
	}

	// Verificar se tem host
	if parsedURL.Host == "" {
		return false, fmt.Errorf("URL deve ter um host")
	}

	// Criar cliente HTTP com timeout curto
	client := &http.Client{
		Timeout: 5 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Permitir até 3 redirecionamentos
			if len(via) >= 3 {
				return fmt.Errorf("muitos redirecionamentos")
			}
			return nil
		},
	}

	// Fazer requisição HEAD para verificar se URL está acessível
	req, err := http.NewRequest("HEAD", urlString, nil)
	if err != nil {
		return false, fmt.Errorf("erro ao criar requisição: %w", err)
	}

	// Adicionar User-Agent para evitar bloqueios
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; ConquistaAI/1.0)")

	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("URL não acessível: %w", err)
	}
	defer resp.Body.Close()

	// Considerar válido se status code for 2xx ou 3xx
	if resp.StatusCode >= 200 && resp.StatusCode < 400 {
		return true, nil
	}

	// Se for 404 ou 410, URL não existe
	if resp.StatusCode == 404 || resp.StatusCode == 410 {
		return false, fmt.Errorf("URL não encontrada (status %d)", resp.StatusCode)
	}

	// Para outros códigos de erro, considerar inválido
	return false, fmt.Errorf("URL retornou status %d", resp.StatusCode)
}

