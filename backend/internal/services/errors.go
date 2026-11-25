package services

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrNotFound          = errors.New("não encontrado")
	ErrInsufficientCoins = errors.New("moedas insuficientes")
)

// ValidationError indica dados inválidos enviados pelo cliente (HTTP 400).
type ValidationError struct{ Msg string }

func (e ValidationError) Error() string { return e.Msg }

func invalid(msg string) error { return ValidationError{Msg: msg} }

// normalizeDate valida "YYYY-MM-DD"; vazio vira nil (sem prazo).
func normalizeDate(s *string, field string) (*string, error) {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil, nil
	}
	v := strings.TrimSpace(*s)
	if _, err := time.Parse("2006-01-02", v); err != nil {
		return nil, invalid(field + " inválida: use o formato AAAA-MM-DD")
	}
	return &v, nil
}

func requireText(s, field string) (string, error) {
	v := strings.TrimSpace(s)
	if v == "" {
		return "", invalid(field + " é obrigatório")
	}
	return v, nil
}
