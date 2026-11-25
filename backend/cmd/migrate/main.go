package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

// legacyMigrations foram aplicadas antes de existir a tabela schema_migrations.
// Em bancos antigos elas são apenas registradas, nunca re-executadas
// (004_fix_categories.sql apaga as categorias e, em cascata, os objetivos).
var legacyMigrations = []string{
	"001_initial_schema.sql",
	"002_educational_roadmap.sql",
	"002_fix_categories.sql",
	"003_educational_trail.sql",
	"004_fix_categories.sql",
	"005_add_okr_completion_date.sql",
	"006_add_key_result_expected_completion_date.sql",
}

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL não configurada")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("Erro ao conectar ao banco: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Erro ao fazer ping no banco: %v", err)
	}

	migrationsDir := "./migrations"
	if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
		migrationsDir = "/app/migrations"
	}

	if err := ensureMigrationsTable(db); err != nil {
		log.Fatalf("Erro ao preparar schema_migrations: %v", err)
	}

	applied, err := appliedMigrations(db)
	if err != nil {
		log.Fatalf("Erro ao ler migrations aplicadas: %v", err)
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("Erro ao ler diretório de migrations: %v", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	pending := 0
	for _, name := range files {
		if applied[name] {
			continue
		}
		pending++

		content, err := os.ReadFile(filepath.Join(migrationsDir, name))
		if err != nil {
			log.Fatalf("Erro ao ler %s: %v", name, err)
		}

		fmt.Printf("Executando migration: %s\n", name)
		if err := runMigration(db, name, string(content)); err != nil {
			log.Fatalf("Erro ao executar migration %s (nada desta migration foi aplicado): %v", name, err)
		}
		fmt.Printf("Migration %s executada com sucesso\n", name)
	}

	if pending == 0 {
		fmt.Println("Banco já está atualizado, nenhuma migration pendente")
		return
	}
	fmt.Println("Todas as migrations foram executadas")
}

func ensureMigrationsTable(db *sql.DB) error {
	var exists bool
	if err := db.QueryRow(`SELECT to_regclass('public.schema_migrations') IS NOT NULL`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}

	if _, err := db.Exec(`CREATE TABLE schema_migrations (
		filename VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`); err != nil {
		return err
	}

	// Banco legado: as migrations antigas já rodaram, então só registramos.
	var legacy bool
	if err := db.QueryRow(`SELECT to_regclass('public.categories') IS NOT NULL`).Scan(&legacy); err != nil {
		return err
	}
	if legacy {
		fmt.Println("Banco existente detectado: registrando migrations antigas como aplicadas")
		for _, name := range legacyMigrations {
			if _, err := db.Exec(`INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`, name); err != nil {
				return err
			}
		}
	}
	return nil
}

func appliedMigrations(db *sql.DB) (map[string]bool, error) {
	rows, err := db.Query(`SELECT filename FROM schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := map[string]bool{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		applied[name] = true
	}
	return applied, rows.Err()
}

func runMigration(db *sql.DB, name, content string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(content); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT INTO schema_migrations (filename) VALUES ($1)`, name); err != nil {
		return err
	}
	return tx.Commit()
}
