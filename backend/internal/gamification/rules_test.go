package gamification

import "testing"

func TestLevelFromXP(t *testing.T) {
	cases := []struct {
		xp, level, into, need int
	}{
		{0, 1, 0, 100},
		{-50, 1, 0, 100},
		{99, 1, 99, 100},
		{100, 2, 0, 200},
		{299, 2, 199, 200},
		{300, 3, 0, 300},
		{600, 4, 0, 400},
		{1000, 5, 0, 500},
	}
	for _, c := range cases {
		got := LevelFromXP(c.xp)
		if got.Level != c.level || got.XPIntoLevel != c.into || got.XPForNextLevel != c.need {
			t.Errorf("LevelFromXP(%d) = nível %d (%d/%d), esperado nível %d (%d/%d)",
				c.xp, got.Level, got.XPIntoLevel, got.XPForNextLevel, c.level, c.into, c.need)
		}
		if got.XPToNextLevel != got.XPForNextLevel-got.XPIntoLevel {
			t.Errorf("LevelFromXP(%d): XPToNextLevel inconsistente", c.xp)
		}
	}
}

func TestRewardsGrowWithDifficulty(t *testing.T) {
	if !(MilestoneReward(Easy).Coins < MilestoneReward(Medium).Coins && MilestoneReward(Medium).Coins < MilestoneReward(Hard).Coins) {
		t.Error("recompensa de meta deve crescer com a dificuldade")
	}
	if !(GoalReward(Easy).Coins < GoalReward(Medium).Coins && GoalReward(Medium).Coins < GoalReward(Hard).Coins) {
		t.Error("recompensa de objetivo deve crescer com a dificuldade")
	}
}

func TestParseDifficulty(t *testing.T) {
	for _, s := range []string{"easy", "medium", "hard"} {
		if _, err := ParseDifficulty(s); err != nil {
			t.Errorf("ParseDifficulty(%q) falhou: %v", s, err)
		}
	}
	if _, err := ParseDifficulty("insano"); err == nil {
		t.Error("ParseDifficulty deveria rejeitar valor desconhecido")
	}
}
