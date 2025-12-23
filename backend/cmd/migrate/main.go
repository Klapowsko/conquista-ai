package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

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

	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("Erro ao ler diretório de migrations: %v", err)
	}

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".sql") {
			filePath := filepath.Join(migrationsDir, file.Name())
			sql, err := ioutil.ReadFile(filePath)
			if err != nil {
				log.Printf("Erro ao ler arquivo %s: %v", file.Name(), err)
				continue
			}

			fmt.Printf("Executando migration: %s\n", file.Name())
			if _, err := db.Exec(string(sql)); err != nil {
				log.Printf("Erro ao executar migration %s: %v", file.Name(), err)
			} else {
				fmt.Printf("Migration %s executada com sucesso\n", file.Name())
			}
		}
	}

	fmt.Println("Todas as migrations foram executadas")
}

