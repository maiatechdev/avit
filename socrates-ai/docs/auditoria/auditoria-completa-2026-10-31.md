# Auditoria completa: lógica, segurança e interface (Socrates AI)

Data: 2026-10-31. Segunda rodada, depois das Stories 3.1–3.9.

**Método.** Três agentes do AIOS trabalharam em paralelo e somente leitura:

- **@architect + @dev:** lógica e arquitetura.
- **@qa:** comandos de verificação, cobertura de testes, segurança, requisitos funcionais e gates.
- **@ux-design-expert:** interface, usando a tasteskill (design-taste-frontend v2) como régua de crítica.

**Interface.** A tasteskill rodou `lint.mjs --app` e `inspect.mjs --app` em 11 telas, a 390, 768 e 1440 px. Um script de navegação percorreu 17 estados interativos, com o app rodando no Vite e a API simulada.

**Limites.** Não houve acesso ao banco Neon, aos logs da Vercel nem ao deploy de produção. A pedagogia do tutor não foi avaliada no navegador.

**Relatórios completos** (cada achado com arquivo:linha, cenário de falha e correção):

- [Lógica e arquitetura](2026-10-31/logica-arquitetura.md)
- [QA, segurança e requisitos](2026-10-31/qa-seguranca.md)
- [Interface (tasteskill)](2026-10-31/interface-tasteskill.md)

As capturas de tela ficaram no diretório temporário da sessão e não foram versionadas.

## 1. Resumo

| Indicador | 05/10 | 31/10 |
|---|---|---|
| Nota Nielsen | 19/40 | **23/40** |
| typecheck, lint, testes (65), build | — | **Passam** |
| `npm audit` de produção | — | 0 vulnerabilidades |
| Endpoints com teste automatizado | — | **0 de 7** |
| Itens críticos da auditoria anterior resolvidos | — | 7 de 10 |

As Stories 3.x resolveram o que era de segurança e de integridade:

- Tutor por aluno.
- Juiz sem o falso positivo do "não é 11".
- Rotas separadas por papel.
- QR real.
- Tokens em cookie HttpOnly.
- Aluno sem acesso ao painel.

Os cookies, a autorização por endpoint e as consultas SQL estão corretos: não foi encontrada injeção.

O que não avançou foi a parte pedagógica do PRD: FR6 Níveis, FR8 Reflexão, FR9 XP e FR11 Sugestão. Também continua igual a distância entre o que a tela promete e o que o app faz.

**Veredito do @qa:** CONCERNS para a apresentação à banca e FAIL para uso com alunos reais.

## 2. Críticos (P0)

1. **Os termos da Gemini API proíbem uso por menores** (`api/tutor/turn.ts:15-18`, `lib/tutor/gemini.ts:41-46`).
   - Os termos exigem 18 anos e vedam apps "likely to be accessed by individuals under 18".
   - No plano gratuito, pode haver revisão humana do que é enviado.
   - A verificação marcada como pendente em 05/10 nunca foi registrada. Agora está respondida, e a resposta é **não pode**.
   - Para a banca, que é adulta, o risco fica contido se o link não circular entre alunos. Para alunos reais, é preciso usar o stub ou um provedor que permita menores, com contrato de tratamento de dados (DPA).
2. **A turma fica bloqueada a partir do 21º aluno** (`lib/http/rateLimit.ts:5`, `api/sessions/join/index.ts:30`).
   - O limite é de 20 entradas a cada 10 minutos por IP e conta também as entradas que dão certo.
   - No Wi-Fi da escola, todos os alunos saem pelo mesmo IP.
   - **Correção:** contar só códigos errados e liberar quem já tem um cookie válido. ~2 h.
3. **A reflexão não é gravada** (`App.tsx:821-842`). A tela diz "Sua resposta ajuda o professor", mas nada sai do aparelho. Este problema já estava na auditoria de 05/10.
   - **Correção:** gravar a reflexão e mostrá-la no painel, ou retirar a frase.

## 3. Lógica de funcionamento (P1)

| # | Problema | Onde | Esforço |
|---|---|---|---|
| L1 | O juiz rejeita respostas certas que mostram a conta: "8 + 3 = 11", "troquei x por 4 e deu 11", "11,0". O chat pede ao aluno que explique, e quem obedece recebe dicas e a explicação de algo que já acertou. | `lib/tutor/provider.ts:16-22` | 3 h |
| L2 | Depois do acerto, a explicação do aluno recebe "já está resolvido", e o exercício muda em silêncio para f(2). O enunciado novo só aparece na lateral do desktop, então no celular o aluno responde a um exercício que não vê. | `lib/tutor/turn.ts:49-57, 79` | 3 h |
| L3 | A "Competência" do painel é inflada. O aluno recebe a resposta pronta, volta ou recarrega a página, digita "11" e passa a contar como quem resolveu. O servidor aceita o `exerciseId` enviado pelo cliente. | `turn.ts:79`, `App.tsx:633` | 4 h |
| L4 | O tutor não tem limite de chamadas. Um script esgota a cota do Gemini e a turma recebe erro 503 no meio da aula. | `api/tutor/turn.ts` | 1 h |
| L5 | A criação de sessão é aberta e não tem limite. Só existem 10 mil códigos, que valem por 90 dias, então dá para esgotá-los. | `api/sessions/index.ts` | 2 h |
| L6 | A retenção depende de tráfego: a limpeza de 90 dias só roda quando alguém cria uma sessão. A tabela `rate_limits` guarda o IP dos alunos para sempre e não aparece na política do app. | `api/sessions/index.ts:28`, `rateLimit.ts` | 3 h |
| L7 | `PRODUCT.md`, `docs/architecture/arquitetura-mvp.md`, `CLAUDE.md` e `AGENTS.md` estão desatualizados: falam em stub, em "nenhum dado pessoal", em endpoints inexistentes e em "figma-make-app". | docs | 2 h |

**P2 (~24 h).** Estes estão no relatório de lógica:

- Criação de tabelas em quase toda requisição, inclusive `ALTER TABLE`; a camada de banco precisa de migração.
- O gabarito dos exercícios vai no código do navegador: `dist/` contém "8 + 3 = 11".
- O filtro anti-vazamento só detecta algarismos, então "o resultado é onze" passa.
- Uma falha do Gemini vira erro 503, sem resposta de reserva.
- Não há chaves estrangeiras, então uma exclusão concorrente deixa dados órfãos.
- O chat trata um 401 como "tente de novo" para sempre.
- O professor perde o acesso à turma anterior quando cria outra.
- Não há headers de segurança no `vercel.json`.
- O logo SVG tem 1,24 MB, mais que dez vezes o JavaScript do app.

## 4. Interface (tasteskill + @ux-design-expert)

**Ferramentas da skill:**

- **Lint:** 5 falhas, todas de emoji usado como interface (`App.tsx:802-805, 838`), e 9 avisos.
- **Inspector:**
  - Três telas sem `h1`.
  - `lang` do HTML vazio: é um placeholder do Figma (`index.html:2`).
  - Nenhuma região `aria-live`.
  - De 48% a 60% do texto abaixo de 13 px no painel, no foco e nas trilhas.
  - De 33% a 60% de área vazia no desktop.
  - Seis textos com contraste reprovado, entre 2,9:1 e 4,1:1.

**Ainda em aberto desde 05/10:**

- Dois estilos de botão.
- Texto na cor da IA com ~3:1 de contraste.
- Nenhum anel de foco visível.
- Interruptor do foco e botão de envio sem nome acessível.
- Chips ocultos que continuam focáveis.

**As 10 melhorias de maior impacto:**

1. **Fazer a copy prometer só o que o app faz** (P1):
   - As trilhas prometem vídeo, comparar fontes e trabalho em grupo, mas todas levam ao mesmo chat de f(4) (`App.tsx:271-274`).
   - O Modo Foco diz que silencia notificações, mas é só um cronômetro (`:561`, `:573`).
   - A frase "tempo médio" não tem dado por trás (`:604`).
   - O objetivo sugere temas livres, como clima e desigualdade, mas o exercício é fixo em matemática (`:144`, `:165`).
2. **Corrigir o botão "Nova sessão" do painel** (P1). Hoje ele chama `onBack` e volta ao QR da mesma sessão (`:1104`).
3. **Foco visível e idioma** (P1). Uma regra `:focus-visible` global no estilo cartoon, com anel marinho de 3 px, e `lang="pt-BR"`.
4. **Acessibilidade do chat** (P1):
   - Nomes acessíveis no envio, no campo de texto, no interruptor do foco e no campo de objetivo.
   - `role="log" aria-live="polite"` nas mensagens.
5. **Rodapé do chat** (P1):
   - "Encerrar conversa" deve pedir confirmação.
   - O "Encerrar" do foco deve virar "Parar foco".
   - Mostrar "Pensando…" durante o envio.
   - Não apagar o texto do aluno quando o envio falha.
6. **Painel vivo** (P1/P2):
   - Botão "Atualizar" com o horário da última leitura e "Tentar de novo" no erro.
   - O achado principal (25% "não entendi ainda") sobe da legenda de 12 px para o título.
   - Usar o espaço vazio do desktop.
   - O código não pode quebrar em "SOC-/4821" no celular.
7. **Modo de projeção da sessão** (P1). Código entre 64 e 160 px, QR grande e botão "Copiar link". Hoje são um QR de 192 px e um código de 30 px numa tela feita para projetar.
8. **Um único botão cartoon** (P2). Secundário ativo diferente do desabilitado, sem esticar no desktop.
9. **Contraste e escala** (P1/P2):
   - Token `--ai-ink` (~`#3D5BD9`) para texto na cor da IA e `--success-ink` (~`#17734C`) para o código.
   - "OBJETIVO DE HOJE" em marinho.
   - Conteúdo de 12 px sobe para 14–16 px.
   - Alvos de 44 px no Voltar, no envio, nos links e nos chips.
10. **Movimento e "tells" de interface feita por IA** (P2):
    - `prefers-reduced-motion` na entrada de tela, no bounce e nos confetes.
    - Tirar emoji, `text-shadow`, ícones em quadrado colorido, os 11 rótulos em caixa alta e os números de métrica em quatro cores.
    - **Manter** as cenas desenhadas por trilha, os balões do chat e o QR marinho: são do produto.

**Itens da identidade cartoon mantidos de propósito:** sombra de adesivo, bordas marinhas e fundo creme. A skill os sinaliza, mas foram decididos em 05/10 e não contam como problema.

## 5. Requisitos funcionais (PRD)

| FR | 05/10 | 31/10 | Lacuna principal |
|---|---|---|---|
| FR1 Objetivo | Parcial | Parcial | O objetivo não guia o tutor; as sugestões não são de matemática |
| FR2 Código | Parcial | Feito, com ressalvas | O limite por IP (P0-2); só 10 mil códigos |
| FR3 Check-in | Feito | Feito | A missão só muda a primeira fala |
| FR4 Caminhos | Feito, com ressalvas | Feito | A trilha é salva, mas não muda a atividade |
| FR5 Tutor | Parcial | Feito, com ressalvas | L1–L3; filtro só numérico; Gemini (P0-1) |
| FR6 Níveis | Parcial | Parcial | Calculado no cliente, não persistido |
| FR7 Modo Foco | Parcial | Parcial | Só cronômetro, com copy que promete mais |
| FR8 Reflexão | Parcial | **Faltando** | Não grava (P0-3) |
| FR9 XP ético | Faltando | Faltando | Não existe |
| FR10 Painel | Parcial | Feito | Não atualiza sozinho; competência inflada (L3) |
| FR11 Sugestão da IA | Parcial | Parcial | Regra fixa |

**Gates de QA 3.4–3.9.** Expiraram e não foram reemitidos. Continuam abertos:

- Testes de autenticação, de exclusão e do limite de tentativas no SQL.
- Limite por NAT e limite na criação de sessão.
- Rotina de limpeza agendada (cron).
- Leitura do código de erro no cliente.
- Estado compartilhado entre abas.
- Criação de tabela por requisição.
- Análise jurídica.

## 6. Plano proposto

**Fase A, antes da banca (~16 h):**

1. P0-2: limite de entrada que não bloqueia a turma (2 h).
2. L4 e L5: limite no tutor e na criação de sessão (3 h).
3. L1 e L2: juiz que aceita a conta e transição de exercício visível no chat (6 h).
4. P0-3 e item 1 da interface: gravar a reflexão (ou tirar a promessa) e alinhar a copy das trilhas, do foco, do "tempo médio" e das sugestões de objetivo (3 h).
5. "Nova sessão", `lang="pt-BR"`, foco visível, nomes acessíveis e `aria-live` (2 h).

**Fase B, qualidade (~30 h):**

- L3: progresso do aluno no servidor, com marca de "revelado" (4 h).
- L6: rotina diária na Vercel, limpeza de `rate_limits` e IP com hash (3 h).
- Testes dos 7 endpoints e da autorização no banco (8 h).
- Itens 5 a 9 da interface: rodapé do chat, painel vivo, modo projeção, botão único, contraste e escala (12 h).
- Atualizar os docs (L7) e reemitir os gates (3 h).

**Fase C, estrutura e PRD (~40 h ou mais):**

- Migração do banco e camada única de dados, com chaves estrangeiras, sem criar tabela por requisição.
- Gabarito fora do bundle.
- Divisão do `App.tsx` em `features/professor` e `features/aluno` (~8 h).
- FR6 Níveis no servidor, FR9 XP ético e FR11 Sugestão com IA.
- Otimizar o logo SVG.

## 7. Decisões que dependem de você

1. **Provedor de IA para alunos reais.** Os termos do Gemini não permitem menores. As opções são manter o stub, contratar um provedor com DPA que permita menores ou limitar o app a demonstrações com adultos.
2. **Reflexão:** gravar e mostrar no painel (escopo de FR8) ou tirar a promessa da tela por enquanto.
3. **Trilhas:** dar a cada trilha uma atividade própria (escopo grande) ou reescrever a copy para dizer que elas mudam o jeito do tutor conduzir, não o formato.

Nenhuma correção de código foi feita nesta rodada.

## 8. Decisões tomadas

1. **Provedor de IA (2026-11-02): manter o Gemini.** O protótipo será usado só na apresentação para a banca, com adultos, e não com alunos reais. O P0-1 fica aceito para esse escopo. Uso com alunos reais exige trocar de provedor antes.
2. **Reflexão (Story 4.1):** a promessa saiu da tela; gravar continua fora do escopo.
3. **Trilhas (Story 4.1):** a copy foi reescrita para descrever o jeito de pensar.
