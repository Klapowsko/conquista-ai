package features

import (
	"os"
	"testing"

	"github.com/cucumber/godog"
	"github.com/conquista-ai/conquista-ai/features/step_definitions"
)

func TestFeatures(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: func(ctx *godog.ScenarioContext) {
			step_definitions.InitializeCommonScenario(ctx)
			step_definitions.InitializeAPISteps(ctx)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"features"},
			TestingT: t,
		},
	}

	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}

func TestMain(m *testing.M) {
	// Configurar variáveis de ambiente para testes se necessário
	_ = os.Setenv("API_BASE_URL", os.Getenv("API_BASE_URL"))

	status := m.Run()
	os.Exit(status)
}

