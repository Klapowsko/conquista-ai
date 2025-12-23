Feature: Gerenciar OKRs
  Como um usuário do sistema
  Eu quero gerenciar meus OKRs
  Para que eu possa acompanhar meus objetivos

  Scenario: Criar um novo OKR
    Given que o sistema está configurado
    And existe uma categoria com name "Profissional"
    When eu faço uma requisição POST para /api/v1/okrs com objective "Aprender Golang" e category_id
    Then a resposta deve ter status 201
    And a resposta deve conter o OKR criado
    And Key Results devem ser gerados automaticamente

  Scenario: Listar todos os OKRs
    Given que o sistema está configurado
    And existem OKRs cadastrados
    When eu faço uma requisição GET para /api/v1/okrs
    Then a resposta deve ter status 200
    And a resposta deve conter uma lista de OKRs

  Scenario: Buscar OKR por ID
    Given que o sistema está configurado
    And existe um OKR com objective "Aprender Golang"
    When eu faço uma requisição GET para /api/v1/okrs/{id}
    Then a resposta deve ter status 200
    And a resposta deve conter o OKR com objective "Aprender Golang"

  Scenario: Listar OKRs por categoria
    Given que o sistema está configurado
    And existe uma categoria "Profissional"
    And existem OKRs na categoria "Profissional"
    When eu faço uma requisição GET para /api/v1/okrs?category_id={category_id}
    Then a resposta deve ter status 200
    And a resposta deve conter apenas OKRs da categoria "Profissional"

  Scenario: Atualizar OKR
    Given que o sistema está configurado
    And existe um OKR com objective "Aprender Golang"
    When eu faço uma requisição PUT para /api/v1/okrs/{id} com objective "Dominar Golang"
    Then a resposta deve ter status 200
    And a resposta deve conter o OKR atualizado com objective "Dominar Golang"

  Scenario: Deletar OKR
    Given que o sistema está configurado
    And existe um OKR
    When eu faço uma requisição DELETE para /api/v1/okrs/{id}
    Then a resposta deve ter status 200
    And o OKR não deve mais existir

  Scenario: Gerar Key Results para um OKR
    Given que o sistema está configurado
    And existe um OKR com objective "Aprender Golang"
    When eu faço uma requisição POST para /api/v1/okrs/{id}/generate-key-results
    Then a resposta deve ter status 200
    And Key Results devem ser gerados para o OKR

