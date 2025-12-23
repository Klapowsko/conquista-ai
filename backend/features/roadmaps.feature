Feature: Gerenciar Roadmaps
  Como um usuário do sistema
  Eu quero gerar e gerenciar roadmaps de estudo
  Para que eu possa ter um guia estruturado de aprendizado

  Scenario: Gerar roadmap para um Key Result
    Given que o sistema está configurado
    And existe um Key Result com title "Aprender sobre goroutines"
    When eu faço uma requisição POST para /api/v1/key-results/{key_result_id}/roadmap
    Then a resposta deve ter status 200
    And a resposta deve conter um roadmap com categorias e itens
    And o roadmap deve estar associado ao Key Result

  Scenario: Buscar roadmap por Key Result ID
    Given que o sistema está configurado
    And existe um roadmap para um Key Result
    When eu faço uma requisição GET para /api/v1/key-results/{key_result_id}/roadmap
    Then a resposta deve ter status 200
    And a resposta deve conter o roadmap completo

  Scenario: Marcar item do roadmap como concluído
    Given que o sistema está configurado
    And existe um roadmap com itens
    When eu faço uma requisição PUT para /api/v1/roadmap-items/{item_id} com completed true
    Then a resposta deve ter status 200
    And o item deve estar marcado como concluído

