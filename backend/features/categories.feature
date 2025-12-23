Feature: Gerenciar Categorias
  Como um usuário do sistema
  Eu quero gerenciar categorias de OKRs
  Para que eu possa organizar meus objetivos

  Scenario: Listar todas as categorias
    Given que o sistema está configurado
    When eu faço uma requisição GET para /api/v1/categories
    Then a resposta deve ter status 200
    And a resposta deve conter uma lista de categorias
    And deve incluir as categorias padrão: Profissional, Espiritual, Saúde, Família

  Scenario: Criar uma nova categoria
    Given que o sistema está configurado
    When eu faço uma requisição POST para /api/v1/categories com name "Pessoal"
    Then a resposta deve ter status 201
    And a resposta deve conter a categoria criada com name "Pessoal"

  Scenario: Buscar categoria por ID
    Given que o sistema está configurado
    And existe uma categoria com name "Profissional"
    When eu faço uma requisição GET para /api/v1/categories/{id}
    Then a resposta deve ter status 200
    And a resposta deve conter a categoria com name "Profissional"

  Scenario: Atualizar categoria
    Given que o sistema está configurado
    And existe uma categoria com name "Pessoal"
    When eu faço uma requisição PUT para /api/v1/categories/{id} com name "Desenvolvimento Pessoal"
    Then a resposta deve ter status 200
    And a resposta deve conter a categoria atualizada com name "Desenvolvimento Pessoal"

  Scenario: Deletar categoria
    Given que o sistema está configurado
    And existe uma categoria com name "Pessoal"
    When eu faço uma requisição DELETE para /api/v1/categories/{id}
    Then a resposta deve ter status 200
    And a categoria não deve mais existir

