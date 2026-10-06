# Registro de impacto à privacidade — Socrates AI (protótipo)

Status: **Rascunho técnico**, preparado na Story 3.7. A análise jurídica (LGPD art. 14 e ECA Digital) ainda não foi feita e deve acontecer antes de qualquer uso com dados reais de alunos.

Data: 2026-10-06

## 1. Dados tratados

| Dado | Origem | Quem vê | Prazo |
|---|---|---|---|
| Código e objetivo da sessão | Professor | Professor da sessão | 90 dias ou exclusão pelo professor |
| Respostas do check-in (dificuldade, tempo, sentimento) | Aluno | Professor, só em totais | 90 dias ou exclusão |
| Trilha escolhida | Aluno | Professor, só em totais | 90 dias ou exclusão |
| Quantidade de tentativas por exercício e se foi resolvido | Aluno | Servidor (o professor vê só agregados) | 90 dias ou exclusão |
| Texto das mensagens do chat | Aluno | Não gravado pelo app; enviado ao Gemini para gerar a resposta | Não gravado |
| Código aleatório do aparelho (token do aluno) | Servidor, na entrada | Só o servidor guarda o hash | 90 dias ou exclusão |
| Token do professor | Servidor, na criação | Só o servidor guarda o hash | 90 dias ou exclusão |

Não são coletados nome, e-mail, documento, foto ou localização.

## 2. Finalidade

Apoiar o professor com um painel de turma e o aluno com um tutor socrático durante a aula. A finalidade é pedagógica e a demo usa apenas dados fictícios.

## 3. Medidas já implementadas

- Identificador do aparelho substituído por token emitido pelo servidor, guardado só como hash (Story 3.5).
- Painel acessível só com o token do professor; aluno não lê o painel (Story 3.5).
- Prazo de 90 dias, aplicado a cada criação de sessão (Story 3.7).
- Exclusão da turma pelo professor, com confirmação, em uma transação (Story 3.7).
- Política de privacidade acessível pela entrada do app (Story 3.7).

## 4. Riscos em aberto

| Risco | Probabilidade | Impacto | Situação |
|---|---|---|---|
| Token guardado no `localStorage` pode ser lido por script injetado | Baixa | Alto | Aceito no protótipo; revisar antes de uso real |
| Mensagens de alunos enviadas ao Gemini | Média | Alto | Termos da chave verificados pelo responsável; registrar a verificação |
| Limpeza só roda ao criar sessão | Média | Médio | Dados antigos podem ficar até a próxima criação |
| Sessões anteriores à Story 3.5 não podem ser apagadas pelo professor | Baixa | Médio | Limpeza automática do prazo cobre |
| Falta de análise jurídica (LGPD art. 14, ECA Digital) | Alta | Alto | Pendente; bloqueia uso com alunos reais |

## 5. Correção de documentos

O PRD (`docs/prd/prd-mvp-avit.md`) afirmava que nenhum dado pessoal é coletado. Corrigido em 2026-10-06 para refletir este registro. A política de privacidade no app também tinha um erro (dizia que as mensagens eram guardadas) e foi corrigida no mesmo dia.

## 6. Próximos passos

1. Análise jurídica por profissional habilitado, antes de qualquer uso com alunos reais.
3. Decidir sobre o token do professor fora do `localStorage`.
4. Registrar a verificação dos termos do Gemini junto a este documento.
