# language: pt
# Roda contra uma API em execução (API_BASE_URL, padrão http://localhost:8080).
# Use um banco de desenvolvimento: cada cenário desfaz o que ganhou antes de apagar seus dados.
Funcionalidade: Objetivos gamificados
  Como casal
  Queremos ganhar moedas e XP ao concluir metas e objetivos
  Para trocar por recompensas na loja

  Contexto:
    Dado que o sistema está configurado

  Cenário: As categorias fixas estão disponíveis
    Quando eu listo as categorias
    Então a resposta deve ter status 200
    E devem existir as categorias "Pessoal, Profissional, Social"

  Cenário: Concluir uma meta paga conforme a dificuldade, uma única vez
    Dado que existe um objetivo "Reserva de emergência" com dificuldade "hard"
    E o objetivo tem a meta "Guardar R$ 1.000"
    Quando eu concluo a meta
    Então a resposta deve ter status 200
    E o ganho deve ser de 20 moedas e 20 XP
    Quando eu concluo a meta
    Então o ganho deve ser de 0 moedas e 0 XP

  Cenário: Reabrir uma meta estorna o que ela rendeu
    Dado que existe um objetivo "Caminhar 3x por semana" com dificuldade "easy"
    E o objetivo tem a meta "Primeira semana"
    Quando eu concluo a meta
    E eu reabro a meta
    Então o ganho deve ser de -5 moedas e -5 XP

  Cenário: Concluir o objetivo paga o bônus
    Dado que existe um objetivo "Ler 6 livros" com dificuldade "medium"
    Quando eu concluo o objetivo
    Então a resposta deve ter status 200
    E o ganho deve ser de 150 moedas e 150 XP

  Cenário: Não dá para comprar sem saldo
    Dado que existe uma recompensa "Viagem dos sonhos" custando 99999999 moedas
    Quando eu compro a recompensa
    Então a resposta deve ter status 422

  Cenário: Dificuldade inválida é recusada
    Quando eu crio um objetivo "Teste" com dificuldade "insano"
    Então a resposta deve ter status 400
