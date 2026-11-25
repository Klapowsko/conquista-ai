package features

import (
	"testing"

	"github.com/conquista-ai/conquista-ai/features/step_definitions"
	"github.com/cucumber/godog"
)

func TestFeatures(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: step_definitions.InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"."},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("cenários BDD falharam")
	}
}
