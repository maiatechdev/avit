# Auditoria completa: UI/UX, funcionalidades e arquitetura (Socrates AI)

Data: 2026-10-05. Método: Impeccable (crítica com agentes isolados de design e de evidência mecânica) + lente UX do AIOS (@ux-design-expert) + auditoria de arquitetura (@architect). Evidência apenas de código: não houve navegador disponível. Os números de alvos de toque e de contraste são estimativas.

## 1. Resposta aos quatro pontos do usuário

| Ponto | Veredito | Evidência |
|---|---|---|
| Falta voltar e avançar | Procede | Só o cadastro do aluno tem "← Voltar". Nenhuma tela leva ao início. Voltar do navegador sai do app (navegação por estado, sem rotas). |
| Barra inferior sobrepõe conteúdo | Procede, com dois casos graves | Tela de ativação do professor tem `pb-8`; o botão principal fica sob a barra. No chat desktop, a barra cobre o campo de texto e o envio. |
| Chat não otimizado para desktop | Procede | Coluna de 768px com aside, mas a barra inferior continua ocupando o rodapé. |
| Cards e botões do painel esticados | Procede | Painel com largura total (~1360px em 1440px): faixa de um número, quatro cartões de ~330px, botão de largura total. |

## 2. Problemas críticos (antes de qualquer apresentação)

1. **Tutor guarda estado por sessão, não por aluno.** Um aluno que erra três vezes faz o próximo receber a explicação de imediato. Um acerto marca o exercício como resolvido para a turma inteira.
2. **"Não é 11" conta como resposta correta.** O juiz do stub procura o número 11 em qualquer lugar do texto. Isso libera "Concluí o desafio!" indevidamente. Está na Story 3.2.
3. **Aluno cai no painel do professor** depois da reflexão.
4. **Barra de navegação do protótipo** aparece para todos os papéis, com as seis abas.
5. **Reflexão não é salva**, mas a tela diz que a resposta ajuda o professor.
6. **QR code é decorativo**: um padrão fixo que não codifica a sessão.
7. **"Tempo médio de desafios como esse"** é texto sem dado real.
8. **Qualquer pessoa com o `sessionId` lê o painel.** O aluno recebe esse id ao entrar.
9. **Privacidade:** o identificador do aparelho é persistente e ligado ao check-in de menores, sem prazo de retenção nem exclusão. O PRD afirma que nenhum dado pessoal é coletado, e o código não sustenta isso.
10. **Recarregar a página perde** o código da sessão (professor), a trilha, a missão e o foco (aluno).

## 3. UI/UX

- **Nielsen: 19/40.** Pior: controle e liberdade (1), consistência (1), ajuda (1). Melhor: estética (3).
- **Consistência:** há dois estilos de botão (com borda de 3px e sombra dura, e sem borda) e três verdes diferentes.
- **Acessibilidade:**
  - Texto na cor da IA (`#6C8CFF`) tem contraste de ~3:1 sobre branco.
  - Botão de envio do chat só tem ícone, sem nome acessível.
  - Campos e botões sem anel de foco visível.
  - Interruptor do Modo Foco sem nome acessível.
  - Nenhum `aria-live` nas mensagens do chat.
  - Chips escondidos continuam focáveis.
- **Alvos de toque abaixo de 44px:** botão "Encerrar" do foco, abas da barra inferior, botão de envio do chat.
- **Texto de 12px em conteúdo** (não só em rótulos), fora da escala documentada.
- **Desktop:** o chat, o painel e as telas do aluno precisam de layout próprio, não só de coluna centralizada.
- **Divergência de identidade:** o `DESIGN.md` ainda descreve o sistema terracota e plano. O código usa azul, marinho e dourado, com bordas e sombras cartoon. **Precisa de decisão sua** antes de ajustar cores.

## 4. Arquitetura e funcionalidades

- **Separação de papéis:** não existe. Professor e aluno compartilham o mesmo roteamento por estado e a mesma barra. A proposta é rotas por URL: `/` (escolha de papel), `/professor/*` e `/aluno/*`.
- **Autenticação mínima sem login completo:**
  - Professor recebe um token na criação da sessão, guardado em hash no banco. Painel e encerramento exigem o token.
  - Aluno recebe um token na entrada. Substitui o identificador do aparelho como credencial.
  - Aluno não lê o painel mesmo conhecendo o `sessionId`.
- **`App.tsx` com 1.267 linhas**, com dez telas, primitivas, ilustrações e cliente de API misturados. Proposta: dividir em `features/professor`, `features/aluno`, `components` e `api/client.ts`, em etapas sem mudança de comportamento.
- **Contratos:** o cliente chama os endpoints certos, mas os erros são frouxos (só o status HTTP é usado). Duplicações: validação de ids, função de resposta JSON copiada em sete arquivos e criação de tabelas em várias chamadas por requisição, o que soma latência ao limite de 10 segundos do tutor.
- **Documentação:** as stories 1.1 a 2.4 seguem como "Ready" com os checkboxes desmarcados, e a arquitetura descreve endpoints que não existem.

### Funcionalidades (PRD)

| FR | Estado | Principal lacuna |
|---|---|---|
| FR1 Objetivo | Parcial | O objetivo não guia o tutor: exercício fixo de matemática |
| FR2 Código | Parcial | QR decorativo; 10 mil combinações; entrada sem limite de tentativas |
| FR3 Check-in | Feito | A missão só muda a primeira fala |
| FR4 Caminhos | Feito, com ressalvas | Trilha perdida ao recarregar |
| FR5 Tutor socrático | Parcial | IA é stub; contador por sessão; exercício parecido não é avaliado |
| FR6 Níveis | Parcial | Calculados no cliente, não persistidos |
| FR7 Modo Foco | Parcial | Só cronômetro; não bloqueia nada |
| FR8 Reflexão | Parcial | Não grava; falta "o que atrapalhou" |
| FR9 XP ético | Faltando | Não existe |
| FR10 Painel | Parcial | Competência mal calculada; engajamento pode passar de 100%; sem número mínimo de respostas |
| FR11 Sugestão da IA | Parcial | Regra fixa; IA depende do Gemini |

## 5. Plano proposto

**Ordem de trabalho (estimativa total ~105 horas):**

1. **Story 3.1, refatoração sem mudança de comportamento (5 h).** Primitivas, cliente de API e contratos compartilhados.
2. **Story 3.2, tutor por participante (8 h).** Contador por aluno, exercício parecido avaliado e juiz sem falso positivo.
3. **Story 3.3, Gemini real (9 h).** Uma chamada por turno com saída JSON validada, timeout e erro controlado. Depende de termos de uso verificados.
4. **Story 3.4, painel íntegro (7 h).** Competência corrigida, número mínimo de respostas e estado vazio sem erro.
5. **Story 3.5, identidade mínima (8 h).** Tokens de professor e de aluno.
6. **Story 3.6, áreas por rota (10 h).** Professor e aluno separados, barra de protótipo removida, QR real, recuperação ao recarregar, desktop por área.
7. **Story 3.7, privacidade e retenção (8 h).** Política no app, prazo de retenção, exclusão pelo professor e registro de impacto.
8. **Story 3.8, erros e entrada protegida (8 h).** Formato de erro único e limite de tentativas no código.

**Decisões que dependem de você:**
- **Identidade visual:** plana (DESIGN.md) ou cartoon (código atual), e azul ou terracota. Sem isso, o ajuste de cor fica parcial.
- **Base legal e papel da escola:** a LGPD (art. 14) e o ECA Digital pedem análise jurídica. Recomendo consultar antes da banca se dados reais de alunos forem usados.
- **Termos do Gemini:** verificar se o plano gratuito usa as mensagens para treinar modelos. Se sim, mensagens de alunos não devem ir a esse plano.

## 6. Próximo passo

Nenhuma correção de código foi feita nesta rodada de auditoria. A próxima etapa é aprovar a ordem do plano (seção 5) e as três decisões pendentes.

## 7. Decisões tomadas

1. **Identidade visual: cartoon.** Mantém a linha da logo (traço marinho, cantos arredondados, sombra de adesivo). `DESIGN.md` precisa ser reescrito para refletir isso; a documentação atual (plana, terracota) fica obsoleta.
2. **Dados reais: não necessários no protótipo.** A demo usa apenas dados fictícios. Isso reduz o risco de LGPD/ECA para a apresentação, mas o identificador persistente do aparelho continua sendo coletado: deve ser removido ou trocado por token de sessão antes de qualquer uso com alunos reais.
3. **Verificação dos termos do Gemini: pendente.** Enquanto não for verificada, nenhuma mensagem real de aluno deve ser enviada ao Gemini. A integração real fica condicionada a essa verificação (Story 3.3).

**Impacto no plano:** o item P1-3 (privacidade e retenção) cai de prioridade para protótipo, mas o `participantId` persistente continua sendo tratado como dado pessoal. A Story 3.5 (identidade mínima) passa a ser a principal medida de privacidade.
