package repositories

import (
	"database/sql"
	"time"
)

// Querier é satisfeito por *sql.DB e *sql.Tx, permitindo usar os
// repositórios dentro ou fora de uma transação.
type Querier interface {
	Exec(query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
}

// InTx executa fn numa transação; faz rollback se fn retornar erro.
func InTx(db *sql.DB, fn func(tx *sql.Tx) error) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit()
}

const dateLayout = "2006-01-02"

// dateString converte uma coluna DATE para "YYYY-MM-DD" (nil se nula).
func dateString(t sql.NullTime) *string {
	if !t.Valid {
		return nil
	}
	s := t.Time.Format(dateLayout)
	return &s
}

// nullDate converte "YYYY-MM-DD" (ou nil/vazio) para o parâmetro da coluna DATE.
func nullDate(s *string) any {
	if s == nil || *s == "" {
		return nil
	}
	return *s
}

func timePtr(t sql.NullTime) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time
	return &v
}
