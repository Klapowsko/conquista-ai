package step_definitions

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/cucumber/godog"
)

type apiContext struct {
	baseURL     string
	status      int
	body        []byte
	goalID      int64
	milestoneID int64
	rewardID    int64
	// Para desfazer ao final do cenário e não deixar moedas sobrando na carteira.
	goalCompleted      bool
	milestoneCompleted bool
}

var ctx *apiContext

func InitializeScenario(sc *godog.ScenarioContext) {
	sc.After(func(c context.Context, _ *godog.Scenario, err error) (context.Context, error) {
		cleanup()
		return c, err
	})

	sc.Step(`^que o sistema está configurado$`, queOSistemaEstaConfigurado)
	sc.Step(`^eu listo as categorias$`, func() error { return request("GET", "/api/v1/categories", nil) })
	sc.Step(`^devem existir as categorias "([^"]*)"$`, devemExistirAsCategorias)
	sc.Step(`^que existe um objetivo "([^"]*)" com dificuldade "([^"]*)"$`, existeUmObjetivo)
	sc.Step(`^eu crio um objetivo "([^"]*)" com dificuldade "([^"]*)"$`, criarObjetivo)
	sc.Step(`^o objetivo tem a meta "([^"]*)"$`, oObjetivoTemAMeta)
	sc.Step(`^eu concluo a meta$`, func() error { return progress("/api/v1/milestones/%d/complete", ctx.milestoneID, &ctx.milestoneCompleted, true) })
	sc.Step(`^eu reabro a meta$`, func() error { return progress("/api/v1/milestones/%d/reopen", ctx.milestoneID, &ctx.milestoneCompleted, false) })
	sc.Step(`^eu concluo o objetivo$`, func() error { return progress("/api/v1/goals/%d/complete", ctx.goalID, &ctx.goalCompleted, true) })
	sc.Step(`^o ganho deve ser de (-?\d+) moedas e (-?\d+) XP$`, oGanhoDeveSer)
	sc.Step(`^que existe uma recompensa "([^"]*)" custando (\d+) moedas$`, existeUmaRecompensa)
	sc.Step(`^eu compro a recompensa$`, func() error { return request("POST", fmt.Sprintf("/api/v1/rewards/%d/purchase", ctx.rewardID), nil) })
	sc.Step(`^a resposta deve ter status (\d+)$`, aRespostaDeveTerStatus)
}

func queOSistemaEstaConfigurado() error {
	url := os.Getenv("API_BASE_URL")
	if url == "" {
		url = "http://localhost:8080"
	}
	ctx = &apiContext{baseURL: url}
	return nil
}

func request(method, path string, body any) error {
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(data)
	}
	req, err := http.NewRequest(method, ctx.baseURL+path, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("API indisponível em %s: %w", ctx.baseURL, err)
	}
	defer resp.Body.Close()
	ctx.status = resp.StatusCode
	ctx.body, err = io.ReadAll(resp.Body)
	return err
}

func createdID() (int64, error) {
	var obj struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal(ctx.body, &obj); err != nil || obj.ID == 0 {
		return 0, fmt.Errorf("resposta sem id (status %d): %s", ctx.status, ctx.body)
	}
	return obj.ID, nil
}

func criarObjetivo(title, difficulty string) error {
	return request("POST", "/api/v1/goals", map[string]any{"title": title, "category_id": 1, "difficulty": difficulty})
}

func existeUmObjetivo(title, difficulty string) error {
	if err := criarObjetivo(title, difficulty); err != nil {
		return err
	}
	id, err := createdID()
	ctx.goalID = id
	return err
}

func oObjetivoTemAMeta(title string) error {
	if err := request("POST", "/api/v1/milestones", map[string]any{"goal_id": ctx.goalID, "title": title}); err != nil {
		return err
	}
	id, err := createdID()
	ctx.milestoneID = id
	return err
}

func progress(pathFmt string, id int64, flag *bool, completed bool) error {
	if err := request("POST", fmt.Sprintf(pathFmt, id), nil); err != nil {
		return err
	}
	if ctx.status == http.StatusOK {
		*flag = completed
	}
	return nil
}

func oGanhoDeveSer(coins, xp int) error {
	var res struct {
		Change struct {
			Coins int `json:"coins"`
			XP    int `json:"xp"`
		} `json:"change"`
	}
	if err := json.Unmarshal(ctx.body, &res); err != nil {
		return fmt.Errorf("resposta inválida: %s", ctx.body)
	}
	if res.Change.Coins != coins || res.Change.XP != xp {
		return fmt.Errorf("esperado %d moedas e %d XP, recebido %d moedas e %d XP", coins, xp, res.Change.Coins, res.Change.XP)
	}
	return nil
}

func existeUmaRecompensa(name string, cost int) error {
	if err := request("POST", "/api/v1/rewards", map[string]any{"name": name, "cost": cost}); err != nil {
		return err
	}
	id, err := createdID()
	ctx.rewardID = id
	return err
}

func devemExistirAsCategorias(names string) error {
	var list []struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(ctx.body, &list); err != nil {
		return err
	}
	found := map[string]bool{}
	for _, c := range list {
		found[c.Name] = true
	}
	for _, n := range strings.Split(names, ", ") {
		if !found[n] {
			return fmt.Errorf("categoria %q não encontrada", n)
		}
	}
	return nil
}

func aRespostaDeveTerStatus(status int) error {
	if ctx.status != status {
		return fmt.Errorf("esperado status %d, recebido %d: %s", status, ctx.status, ctx.body)
	}
	return nil
}

// cleanup estorna o que o cenário ganhou e apaga os dados criados.
func cleanup() {
	if ctx == nil {
		return
	}
	if ctx.milestoneCompleted {
		_ = request("POST", fmt.Sprintf("/api/v1/milestones/%d/reopen", ctx.milestoneID), nil)
	}
	if ctx.goalCompleted {
		_ = request("POST", fmt.Sprintf("/api/v1/goals/%d/reopen", ctx.goalID), nil)
	}
	if ctx.goalID != 0 {
		_ = request("DELETE", fmt.Sprintf("/api/v1/goals/%d", ctx.goalID), nil)
	}
	if ctx.rewardID != 0 {
		_ = request("DELETE", fmt.Sprintf("/api/v1/rewards/%d", ctx.rewardID), nil)
	}
}
