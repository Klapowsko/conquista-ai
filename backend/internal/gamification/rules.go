// Package gamification concentra as regras de moedas, XP e níveis.
// Moedas são gastas na loja; XP só cresce com progresso e define o nível.
package gamification

import "fmt"

type Difficulty string

const (
	Easy   Difficulty = "easy"
	Medium Difficulty = "medium"
	Hard   Difficulty = "hard"
)

// Reward é o que se ganha ao concluir algo: moedas para a loja e XP para o nível.
type Reward struct {
	Coins int `json:"coins"`
	XP    int `json:"xp"`
}

type DifficultyRule struct {
	Difficulty      Difficulty `json:"difficulty"`
	Label           string     `json:"label"`
	MilestoneReward Reward     `json:"milestone_reward"`
	GoalReward      Reward     `json:"goal_reward"`
}

// Rules é a tabela de recompensas por dificuldade, na ordem exibida na tela.
var Rules = []DifficultyRule{
	{Difficulty: Easy, Label: "Fácil", MilestoneReward: Reward{Coins: 5, XP: 5}, GoalReward: Reward{Coins: 50, XP: 50}},
	{Difficulty: Medium, Label: "Médio", MilestoneReward: Reward{Coins: 10, XP: 10}, GoalReward: Reward{Coins: 150, XP: 150}},
	{Difficulty: Hard, Label: "Difícil", MilestoneReward: Reward{Coins: 20, XP: 20}, GoalReward: Reward{Coins: 300, XP: 300}},
}

// XPPerLevelStep: para subir do nível N para N+1 são necessários N * XPPerLevelStep de XP.
// Nível 2 em 100 XP, nível 3 em 300, nível 4 em 600, nível 5 em 1000...
const XPPerLevelStep = 100

func ParseDifficulty(s string) (Difficulty, error) {
	for _, r := range Rules {
		if string(r.Difficulty) == s {
			return r.Difficulty, nil
		}
	}
	return "", fmt.Errorf("dificuldade inválida %q: use easy, medium ou hard", s)
}

func ruleFor(d Difficulty) DifficultyRule {
	for _, r := range Rules {
		if r.Difficulty == d {
			return r
		}
	}
	return Rules[1] // médio como padrão defensivo
}

// MilestoneReward é o ganho por concluir uma meta de um objetivo com essa dificuldade.
func MilestoneReward(d Difficulty) Reward { return ruleFor(d).MilestoneReward }

// GoalReward é o bônus por concluir o objetivo inteiro.
func GoalReward(d Difficulty) Reward { return ruleFor(d).GoalReward }

// Level descreve o nível atual e quanto falta para o próximo.
type Level struct {
	Level           int `json:"level"`
	TotalXP         int `json:"total_xp"`
	XPIntoLevel     int `json:"xp_into_level"`
	XPForNextLevel  int `json:"xp_for_next_level"`
	XPToNextLevel   int `json:"xp_to_next_level"`
	ProgressPercent int `json:"progress_percent"`
}

// TotalXPForLevel é o XP acumulado necessário para estar no nível informado.
func TotalXPForLevel(level int) int {
	if level <= 1 {
		return 0
	}
	return XPPerLevelStep * (level - 1) * level / 2
}

func LevelFromXP(totalXP int) Level {
	if totalXP < 0 {
		totalXP = 0
	}
	level := 1
	for TotalXPForLevel(level+1) <= totalXP {
		level++
	}
	into := totalXP - TotalXPForLevel(level)
	need := level * XPPerLevelStep
	return Level{
		Level:           level,
		TotalXP:         totalXP,
		XPIntoLevel:     into,
		XPForNextLevel:  need,
		XPToNextLevel:   need - into,
		ProgressPercent: into * 100 / need,
	}
}
