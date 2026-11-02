# Auditoria de lógica e arquitetura — Socrates AI (estado em 31/10/2026)

Lentes: @architect (sistema, dados, segurança, contratos) + @dev (bugs reproduzíveis e correções). Auditoria somente leitura: nenhum arquivo do projeto foi alterado.

Base verificada: commit `8c5cb78` (main). Li `app/lib/**`, `app/api/**`, `app/src/api`, `app/src/shared`, o estado e o fluxo de `app/src/App.tsx`, `vercel.json`, `package.json`, a auditoria de 05/10, a arquitetura, o PRD, as stories 3.x e o registro de impacto.

Verificações executadas:
- `npx vitest run`: 10 arquivos, 65 testes, todos passam.
- O juiz (`isCorrectAnswer`) e o detector de vazamento (`leaksAnswer`) rodados em Node com entradas reais (resultados na seção B1 e na C4).
- `app/dist/assets/index-*.js` contém o texto `8 + 3 = 11` (seção C3).

Não tive acesso ao banco Neon nem aos logs da Vercel. O que depende disso está marcado como **suspeita**.

Severidade: **P0** quebra o fluxo principal no uso real · **P1** resultado errado visível ou risco legal · **P2** integridade, custo ou manutenção · **P3** baixo impacto.

---

## Resumo

| ID | Sev. | Achado | Horas |
|---|---|---|---|
| A1 | **P0** | Limite de tentativas por IP impede a turma de entrar: a partir do 21º aluno na mesma rede, todos recebem 429 | 2 |
| B1 | **P1** | O juiz rejeita respostas certas com raciocínio ("8 + 3 = 11", "troquei x por 4 e deu 11") | 3 |
| B2 | **P1** | Depois do acerto, a explicação pedida ao aluno é descartada e ele cai num exercício que não aparece na tela | 3 |
| B3 | **P1** | "Competência" conta alunos que receberam a resposta pronta (o exercício é escolhido pelo cliente e volta ao 1º ao reabrir o chat) | 4 |
| B4 | **P1** | A retenção de 90 dias depende de alguém criar sessão, e o IP fica guardado para sempre, sem constar da política | 3 |
| C1 | P2 | DDL (`CREATE`/`ALTER TABLE`) em quase toda requisição: latência e bloqueio exclusivo em `sessions` | 4 |
| C2 | P2 | Atualização perdida em `participant_attempts`: um "resolvido" pode voltar a falso | 2 |
| C3 | P2 | Respostas e passos dos exercícios vão no bundle do navegador | 1,5 |
| C4 | P2 | O detector de vazamento só pega algarismos e só na dica | 1,5 |
| C5 | P2 | Gemini sem fallback: qualquer falha ou resposta truncada vira 503 e o turno se perde | 2 |
| C6 | P2 | Sem limite em `/api/sessions` e `/api/tutor/turn`: custo do Gemini e esgotamento dos 10 mil códigos | 3 |
| C7 | P2 | Sem chaves estrangeiras: uma corrida com a exclusão deixa linhas órfãs que nenhuma limpeza apaga | 2 |
| C8 | P2 | O professor perde o acesso (painel e exclusão) à turma anterior ao criar outra | 3 |
| C9 | P2 | O cliente ignora o contrato de erro: 401 no chat vira "tente de novo" sem fim | 2 |
| C10 | P2 | A reflexão não é gravada, mas a tela diz que ajuda o professor | 0,25 (texto) ou 3 (gravar) |
| D1–D10 | P3 | Itens menores (seção D) | ~6 |

Total estimado: **P0+P1 ≈ 15 h**, P2 ≈ 24 h, P3 ≈ 6 h, refatoração estrutural (seção F) ≈ 14 h.

---

## A. P0

### A1. O limite por IP bloqueia uma turma na mesma rede
- **Onde:** `app/lib/http/rateLimit.ts:5` (`JOIN_LIMIT = { hits: 20, windowSeconds: 600 }`), `:11-15` (chave = IP), `app/api/sessions/join/index.ts:30` (conta **toda** entrada, inclusive as bem-sucedidas).
- **Cenário:** uma turma de 30 alunos no Wi-Fi da escola sai pela internet com um único IP público (NAT). O mesmo acontece com o CGNAT das operadoras de celular. Os alunos 1 a 20 entram. Do 21º ao 30º, todos recebem `429 too_many_attempts` por 10 minutos. Quem recarrega e entra de novo gasta mais uma tentativa. A Story 3.8 (risco 2) diz que o limite "reduz o efeito", mas numa turma acima de 20 alunos o bloqueio é certo.
- **Correção:** contar só as falhas (código inexistente), que é o que protege contra a enumeração. Mover o `registerAttempt` para o ramo `SessionNotFoundError`, com chave `join-fail:${ip}` e cerca de 30 falhas por 10 minutos. Quem já tem um cookie válido da sessão não deve ser contado. Opcional: um limite generoso para entradas válidas (cerca de 300 por 10 minutos por IP), só contra automação.
- **Teste:** 25 entradas válidas do mesmo IP passam; 31 códigos errados geram 429.
- **Estimativa:** 2 h.

---

## B. P1

### B1. O juiz rejeita respostas certas que mostram o raciocínio
- **Onde:** `app/lib/tutor/provider.ts:16-22`.
- A regra só aceita um número, ou dois números com `=`. Com três ou mais números, a resposta é sempre incorreta. Rodei a função real:

| Entrada (resposta = 11) | Resultado |
|---|---|
| `11`, `f(4) = 11` | correta |
| `2*4+3 = 11` | **incorreta** |
| `8 + 3 = 11` | **incorreta** |
| `troquei x por 4 e deu 11` (2 números, sem `=`) | **incorreta** |
| `x = 11 né?` | **incorreta** (`?`) |
| `é 11 sim, não tenho dúvida` | **incorreta** (`não`) |
| `11,0` | **incorreta** |
| `deu 11, ou seja onze` | **incorreta** (`ou`) |

- **Cenário:** a primeira mensagem do tutor pede "Me conta como você pensaria para resolver" (`App.tsx:628`). O aluno que obedece e escreve a conta inteira recebe uma dica, e depois de quatro respostas assim recebe a explicação de algo que já tinha acertado. O efeito pedagógico é o inverso do esperado, e a métrica de competência fica subestimada.
- **Correção:** julgar pelo **resultado final declarado**, não pela quantidade de números:
  1. pegar o último número depois do último `=`, `deu`, `é`, `resultado` ou `dá`;
  2. aplicar a negação só na oração que contém esse número;
  3. comparar numericamente (`Number("11,0".replace(",", ".")) === 11`).
  
  Manter os casos da Story 3.2 ("não é 11", "11 ou 10" e "é 11?" incorretas) e somar os da tabela acima aos testes. Alternativa: usar o Gemini como juiz, com o juiz local como trava.
- **Estimativa:** 3 h.

### B2. Depois do acerto, a explicação do aluno é descartada
- **Onde:** `app/lib/tutor/turn.ts:49-57` e `:79`; `app/src/App.tsx:669` e `:776`.
- **Cenário:**
  1. O aluno responde `11`. O servidor salva `solved=true` e devolve `exerciseId = f1-avaliacao-1` (o mesmo, `turn.ts:79`). O tutor diz: "Isso mesmo! Agora explica com suas palavras como você chegou nesse resultado."
  2. O aluno explica: "multipliquei 2 por 4 e somei 3". Esse turno cai em `state.solved` e o tutor responde "Esse exercício já está resolvido. Quer tentar um parecido?". O `exerciseId` muda em silêncio para `f1-avaliacao-2`.
  3. O enunciado do exercício 2 ("f(2) com 3x+1") só aparece no `aside`, que é `hidden lg:flex` (`App.tsx:769`). No celular, o aluno nunca o vê. Se ele responde "sim", isso é julgado contra f(2) e vira uma dica sobre um exercício invisível.
- **Correção:**
  - no `solved`, devolver já o próximo exercício e o enunciado dele (`nextStatement`) e mostrá-lo como mensagem no chat;
  - tratar a explicação pedida como uma etapa "reflexão", sem julgamento;
  - pelo menos, incluir o enunciado na resposta de "já resolvido".
- **Estimativa:** 3 h.

### B3. "Competência" conta quem recebeu a resposta pronta
- **Onde:** `turn.ts:79-84`; `escada.ts:15-19` (o 3º passo é "8 + 3 = 11"); `App.tsx:633` (o `exerciseId` volta a `EXERCISE_ID` sempre que o chat é montado) e `:688` (o "← Voltar" desmonta o chat); `api/tutor/turn.ts:30` (o `exerciseId` vem do cliente, sem conferência); `dashboard/summary.ts:100-103`.
- **Cenário:**
  1. O aluno erra quatro vezes no exercício 1 e recebe a explicação com "8 + 3 = 11". O servidor zera `wrong_count` do exercício 1 e deixa `solved=false`.
  2. O aluno toca em "← Voltar" e depois em "Continuar" (ou recarrega a página). O chat volta ao exercício 1.
  3. Ele digita `11`. O exercício fica `solved=true`, e o aluno entra em "Competência: alunos que resolveram pelo menos um exercício".
- O mesmo vale para qualquer requisição montada à mão com o `exerciseId` de um exercício já explicado.
- **Correção:**
  - coluna `revealed BOOLEAN` em `participant_attempts`, marcada no `explain`;
  - a competência conta só `solved AND NOT revealed`;
  - o servidor guarda o exercício corrente por participante (`participant_progress`) e rejeita ou ignora um `exerciseId` diferente;
  - o chat busca o exercício corrente ao montar.
- **Estimativa:** 4 h.

### B4. Retenção que depende de tráfego e IP guardado sem prazo
- **Onde:** `app/api/sessions/index.ts:28` (a limpeza só roda quando alguém cria uma sessão); `app/lib/http/rateLimit.ts:20-24` (a tabela `rate_limits` guarda o IP e nunca é limpa, nem por `purgeExpired` nem por `eraseSession`); a política em `App.tsx:905-908` diz "Os dados abaixo são os que o app realmente guarda" e "são apagados automaticamente após 90 dias", e não cita o IP; `docs/privacidade/registro-de-impacto.md:11-17` também não.
- **Cenário:** depois da apresentação, ninguém cria outra sessão. Os check-ins (dificuldade e sentimento de menores), as trilhas e as tentativas ficam no banco indefinidamente. Os IPs de todos os alunos ficam em `rate_limits` para sempre. As duas afirmações públicas da política são falsas.
- **Correção:**
  - um cron diário da Vercel (`vercel.json` → `crons`) chamando um endpoint `/api/cron/purge` protegido por `CRON_SECRET`;
  - `DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'` dentro de `purgeExpired`;
  - guardar o hash do IP com sal (`hashToken(ip + salt)`) em vez do IP;
  - incluir o "endereço IP (hash), por até 1 dia" na política e no registro de impacto.
- **Estimativa:** 3 h.

---

## C. P2

### C1. DDL em toda requisição
- **Onde:**
  - `lib/sessions/store.ts:13-22` (`CREATE TABLE` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` em cada criação e entrada);
  - `lib/tutor/attempts.ts:27`; `lib/checkins/checkin.ts:65`; `lib/http/rateLimit.ts:33`;
  - `api/sessions/join/index.ts:38`; `api/participations/index.ts:32`;
  - `lib/dashboard/summary.ts:84-85`; `lib/privacy/retention.ts:10-15`.
- O cache `schemaReady` vive no objeto store, que é criado a cada requisição, então não serve de nada.
- **Custo por requisição:**

| Requisição | Idas ao banco | Das quais DDL |
|---|---|---|
| Turno do tutor | 5 | 1 |
| Entrada na sessão | ~8 | 4 |
| Criação de sessão | ~14 (inclui `purgeExpired`) | 7 |

- **Risco (suspeita, sem banco para medir):** no PostgreSQL, `ALTER TABLE` pega o lock `ACCESS EXCLUSIVE` antes de checar o `IF NOT EXISTS`. Com 30 alunos entrando ao mesmo tempo, as entradas se enfileiram em `sessions`. Há ainda um acoplamento frágil: `readDashboard` lê `checkins` sem garantir a tabela (`summary.ts:88-90`) e só funciona porque `purgeExpired` a cria como efeito colateral.
- **Correção:** um arquivo `app/db/schema.sql`, idempotente, com tabelas, índices e chaves estrangeiras (ver C7), rodado uma vez por `npm run db:migrate` no deploy. Remover todos os `ensure*` do caminho da requisição.
- **Estimativa:** 4 h.

### C2. Atualização perdida no estado do tutor
- **Onde:** `turn.ts:47` (lê o estado) → até 20 s de Gemini → `turn.ts:81` (`attempts.ts:48-51` grava valores absolutos).
- **Cenário:** com duas abas, a aba A acerta e grava `solved=true`. A aba B, com uma requisição que começou antes, grava `wrong_count=3, solved=false` e desfaz o acerto. O mesmo vale para dois envios rápidos de contagem.
- **Correção:** `UPDATE ... SET solved = solved OR ${solved}, wrong_count = ${wc} WHERE ... AND updated_at = ${lido}` (concorrência otimista), ou uma coluna de versão.
- **Estimativa:** 2 h.

### C3. As respostas vão para o navegador
- **Onde:** `App.tsx:8` importa `../lib/tutor/escada`, e `EXERCISES` inclui `answer` e `steps`. Conferido: `app/dist/assets/index-BZmIYUXt.js` contém "8 + 3 = 11".
- **Cenário:** o aluno abre "ver código-fonte" e procura `answer`. Isso contradiz o princípio socrático e o `leaksAnswer` do servidor.
- **Correção:** separar um catálogo público (`shared/exercises.public.ts`, com `id` e `statement`) do privado (`lib/tutor/escada.ts`). Ou o servidor devolve `statement` junto com cada `exerciseId`, o que também resolve B2.
- **Estimativa:** 1,5 h.

### C4. Detector de vazamento limitado
- **Onde:** `escada.ts:53-56` e `turn.ts:75`.
- Ele só pega o número em algarismos, só na ação `hint` e só a resposta do exercício atual. Teste: "o resultado é onze" → não detectado.
- Na ação `explain`, o Gemini recebe o enunciado do exercício parecido e pode resolvê-lo ("...f(2) = 7"), e isso não é checado.
- **Correção:** um mapa de números por extenso de 0 a 100; no `explain`, checar `next.answer`; no `hint`, checar também a conta final ("8 + 3").
- **Estimativa:** 1,5 h.

### C5. Gemini sem fallback e com orçamento curto
- **Onde:** `gemini.ts:59` (`maxOutputTokens: 400`), `gemini.ts:100-101`, `turn.ts:64-73`, `api/tutor/turn.ts:54`.
- **Comportamento:** qualquer erro do Gemini vira 503 e o aluno perde o turno. O estado não é salvo, o que está correto. Mas cota esgotada (429), conteúdo bloqueado ou JSON inválido param o chat.
- **Suspeita (não medi):** modelos com raciocínio contam os tokens de "pensamento" no `maxOutputTokens`. Uma explicação com três passos e o exercício seguinte pode ser truncada → `invalid_json` → 503 exatamente na etapa de explicação.
- **Orçamento de tempo:** o tempo limite do provedor é de 22 s, mais 5 idas ao banco, contra cerca de 25 s até o primeiro byte na função edge. Pode haver um 504 da plataforma sem JSON.
- **Correção:**
  - no `TutorUnavailableError` do `reply`, cair para `StubProvider.reply` (as respostas determinísticas já existem) e registrar o motivo;
  - `maxOutputTokens: 1024` e `thinkingConfig: { thinkingBudget: 0 }`, se o modelo aceitar;
  - tempo limite de 12 s.
- **Estimativa:** 2 h.

### C6. Sem limite de criação de sessão nem de turnos do tutor
- **Onde:** `api/sessions/index.ts` e `api/tutor/turn.ts` (a Story 3.8 adiou os dois); `lib/sessions/service.ts:7-9` (10 mil códigos, com `Math.random`).
- **Cenários:**
  1. Um script faz 10 mil `POST /api/sessions`. Cada um roda `purgeExpired` e o espaço de códigos se esgota: as criações legítimas passam a receber `503 code_unavailable`.
  2. Qualquer pessoa com o código vira participante sem limite e envia turnos em laço, consumindo a cota ou o custo da chave do Gemini.
- **Correção:**
  - reaproveitar `registerAttempt`: 10 criações por hora por IP e 30 turnos por 10 minutos por participante;
  - códigos com 6 caracteres de um alfabeto sem ambiguidade (cerca de 10⁹), gerados com `crypto.getRandomValues`.
- **Estimativa:** 3 h.

### C7. Sem chaves estrangeiras: órfãos depois da exclusão
- **Onde:** os esquemas em `checkin.ts:50-59`, `summary.ts:61-68`, `attempts.ts:12-21` e `participants.ts:6-12` não têm `REFERENCES`. `retention.ts:18-28` e `:31-41` apagam pela lista de `sessions`.
- **Cenário:** um turno em andamento já passou por `resolveParticipant`. O professor apaga a turma. Em seguida, `attempts.get` faz `INSERT` (`attempts.ts:35-38`) de uma linha com o `session_id` apagado. Essa linha nunca mais é apagada, porque `purgeExpired` busca os ids em `sessions`. O mesmo vale para check-ins e trilhas gravados durante a exclusão.
- **Correção:** `REFERENCES sessions(id) ON DELETE CASCADE` em todas as tabelas filhas (na migração de C1). `eraseSession` passa a ser um único `DELETE FROM sessions`. Uma limpeza de órfãos roda uma vez.
- **Estimativa:** 2 h.

### C8. O professor perde a turma anterior
- **Onde:** `App.tsx:1115-1149` (um único `session` em `localStorage['socrates-state']`, compartilhado por professor e aluno), `:1194` e `:1201`.
- **Cenário:** o professor cria a sessão da turma A, toca em "Voltar" e cria a da turma B. O estado passa a guardar só B. O cookie de A continua válido, mas não existe caminho no app para o painel nem para "Apagar dados desta turma" de A. O direito de exclusão fica dependente dos 90 dias.
- O mesmo acontece se o professor testar a entrada como aluno no mesmo navegador com outro código: o painel passa a mostrar "locked".
- **Correção:**
  - estado separado por papel (`socrates-teacher-sessions`: lista; `socrates-student`: atual);
  - rota `/professor/painel/:sessionId`;
  - na tela do professor, uma lista "Minhas sessões".
- **Estimativa:** 3 h.

### C9. O contrato de erro é ignorado no cliente
- **Onde:** `App.tsx:667` e `:672-676`, `:369`, `:942-955`; `api/client.ts:6-18`. O servidor devolve `{ error, message }` (`lib/http/response.ts`), mas o cliente só olha o status.
- **Cenário:** o professor apaga a turma enquanto os alunos estão no chat. Cada envio recebe `401 invalid_participant` e o aluno vê "Não consegui falar com o tutor agora. Tente enviar de novo" para sempre. O correto seria levá-lo a entrar de novo. O mesmo acontece quando o cookie expira (30 dias) com o `localStorage` ainda presente.
- `handleChoosePath` (`App.tsx:1179`) usa `.catch` num `fetch`, que não rejeita em 401/500. A trilha some do painel em silêncio.
- **Correção:**
  - `api/client.ts` com funções tipadas para todos os endpoints e uma classe `ApiError { status, code, message }`;
  - no 401 da área do aluno, limpar o estado e ir para `/aluno?codigo=...`;
  - mostrar `message` quando houver.
- **Estimativa:** 2 h.

### C10. A reflexão não é gravada (item 5 da auditoria anterior)
- **Onde:** `App.tsx:821-825`, que só faz `setSubmitted(true)` e `setTimeout(onSend, 1600)`; `:841` diz "Sua resposta ajuda o professor a entender o que funcionou."
- O FR8 do PRD também pede a pergunta "o que atrapalhou", que não existe.
- **Correção:** trocar o texto (0,25 h) ou criar `POST /api/reflections` com a tabela correspondente e um agregado no painel (3 h).

---

## D. P3

| ID | Onde | Problema e cenário | Correção | h |
|---|---|---|---|---|
| D1 | `gemini.ts:30` × `escada.ts:49` | O prompt diz "O aluno errou três vezes", mas a explicação vem na 4ª resposta errada (3 dicas + 1). O comportamento segue o PRD FR5; o texto do prompt, não. A arquitetura (§3) diz "quando o contador chega a 3". | Ajustar o texto e a arquitetura | 0,25 |
| D2 | `App.tsx:1104-1106` e `:1201` | O botão "Nova sessão" do painel chama `onBack`, que leva a `teacher-activated` e mostra a sessão **atual**. | Ir para `teacher-activate` | 0,25 |
| D3 | `shared/routes.ts:103-111`; `summary.ts:87-103` | O aluno que entra e abre `/aluno/trilhas` direto (ou recarrega antes do check-in) pula o check-in. A trilha e os acertos dele não entram em nenhum percentual. | Guardar `checkedIn` no estado ou exigir o check-in no servidor | 1 |
| D4 | `App.tsx:939-959` | O painel carrega uma vez só. Durante a aula, o professor precisa sair e voltar. | Botão "Atualizar" ou consulta a cada 15 s | 1 |
| D5 | `summary.ts:39-56` | Com `enough=false`, a API devolve todos os percentuais; a trava existe só na tela. | Zerar as métricas quando `!enough` | 0,5 |
| D6 | `service.ts:35-37` | O `catch {}` trata qualquer erro do banco como colisão de código: com o banco fora, são 5 tentativas e depois `503 code_unavailable`. | Capturar só o código `23505` | 0,5 |
| D7 | Story 3.2, "Fora do escopo" | **Suspeita:** a tabela antiga `attempts` (por sessão) pode existir em produção e não é tocada pela retenção. | Conferir no Neon; `DROP` ou incluir na limpeza | 0,5 |
| D8 | `App.tsx:1087` | A confirmação diz que a exclusão apaga "as conversas", mas as conversas não são gravadas. | Ajustar o texto | 0,1 |
| D9 | `App.tsx:671` | O nível de raciocínio é calculado no cliente (2 em qualquer resposta, 3 no acerto) e se perde ao recarregar. O PRD FR6 e a arquitetura §3 dizem que ele é calculado no servidor. | Derivar no servidor a partir de `participant_progress` (ver F) | 1,5 |
| D10 | `cookies.ts:5-6`, `:23-25` | **Suspeita:** há um cookie por sessão, com 30 dias. Num computador compartilhado do laboratório, eles se acumulam e aumentam o cabeçalho de toda requisição; o navegador descarta os mais antigos depois de cerca de 180. | Apagar o cookie do aluno ao sair (reflexão) | 0,5 |

Itens verificados e **corretos**:
- **SQL parametrizado:** todo SQL usa template `neon` com parâmetros, sem concatenação. Não há injeção SQL.
- **Cookies:** `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, nomes por sessão, valor limitado a 128 caracteres na leitura.
- **Tokens:** 256 bits aleatórios, guardados como SHA-256.
- **Autorização:** checada em todos os endpoints. Check-in, trilha e tutor exigem o cookie do participante com o `session_id` certo; painel e exclusão exigem o hash do professor; criação e entrada são públicas por desenho.
- **Exclusão:** feita numa transação.
- **Validação de entrada:** limites de tamanho e listas fechadas em todos os corpos.
- **Ordem de gravação:** o estado do tutor não é gravado quando o Gemini falha.
- **IP do cliente:** a Vercel sobrescreve o `x-forwarded-for`, então o IP não pode ser falsificado. Isso é suposição sobre a plataforma, documentada por ela.

---

## E. Divergências entre a documentação e o código

| Documento | Diz | Código |
|---|---|---|
| `docs/architecture/arquitetura-mvp.md` §2 | `POST /api/reflections` e `GET /api/dashboard/:code` | Não existe `reflections`. O painel é `GET /api/dashboard?sessionId=`. Faltam `/checkins`, `/participations` e `/sessions/erase`. |
| idem §3 | Estado por (`sessionId`, `exercicioId`); a IA classifica a resposta com JSON `resultado`; nível calculado no servidor | Estado por (sessão, participante, exercício); juiz local por regex; Gemini só redige; nível no cliente |
| idem §4 | Tabelas `participations(anon_id, checkin_*, level, xp)`, `attempts`, `reflections` | `sessions(+teacher_token_hash)`, `participants`, `checkins`, `participations`, `participant_attempts`, `rate_limits` |
| idem §1 e §5 | Sem autenticação; tempo limite da IA de 10 s; "Vercel Functions" | Tokens em cookie HttpOnly; 20 s (Gemini) e 22 s (turno); runtime **edge** |
| PRD FR8, FR9, FR6 | Reflexão com "o que atrapalhou"; XP ético; nível calculado | Ausentes ou feitos no cliente (C10, D9) |
| Política no app (`App.tsx:905-908`) e registro de impacto | Lista completa do que é guardado; apagado automaticamente em 90 dias | O IP não consta; a limpeza depende de alguém criar sessão (B4) |
| Story 3.8, risco 2 | O limite por IP "reduz o efeito" em rede compartilhada | Numa turma com mais de 20 alunos, o bloqueio é certo (A1) |
| Stories 1.1–3.9 | Status "Done" | 1.1 tem 14 checkboxes abertos; 3.8 ainda tem aberto "testar o limite em banco"; a File List da 3.2 está vazia |
| `app/CLAUDE.md` e `app/AGENTS.md` | Projeto "figma-make-app" rodando no Figma Make, com `.mise.toml` | Não descrevem `api/`, `lib/`, Neon nem os testes. O `package.json` ainda se chama `figma-make-app`. |
| Decisão 3 da auditoria (termos do Gemini) | Nenhuma mensagem real até verificar os termos | A Story 3.3 registra a autorização do usuário, mas `registro-de-impacto.md:51` ainda lista "registrar a verificação" como pendente. O código envia ao Gemini sempre que `GEMINI_API_KEY` existe. |

---

## F. Dívida estrutural e proposta

1. **Camada de dados (C1, C7).** Criar `app/lib/db/`:
   - `client.ts`, com um único `sql` por módulo (o driver HTTP do Neon não guarda estado);
   - `schema.sql`, com chaves estrangeiras `ON DELETE CASCADE` e índices em `participants(session_id)` e `sessions(created_at)`;
   - `scripts/migrate.ts`.
   
   Isso remove os 9 `ensure*` espalhados. **4 h** (já contadas em C1 e C7).
2. **Boilerplate dos handlers.** Os sete handlers repetem a checagem do método, `request.json()`, a checagem de `DATABASE_URL`, a resolução do participante e o `try/catch`. Proposta: `lib/http/handler.ts` com `post(schema, fn)`, `withParticipant(fn)` e `withTeacher(fn)`. Isso também centraliza a validação de `sessionId` (≤64), hoje repetida em 5 lugares (`checkin.ts:29`, `participations/index.ts:20`, `dashboard/index.ts:12`, `retention.ts:46`, `tutor/turn.ts:32`). **2 h.**
3. **Contratos compartilhados.**
   - `src/shared/contracts.ts::DashboardData` duplica `lib/dashboard/summary.ts::Dashboard`.
   - `PATHS` existe em `App.tsx:270` e em `summary.ts:4`.
   - O front importa `lib/tutor/escada` inteiro (C3).
   
   Proposta: `shared/` na raiz de `app/`, importado pelos dois lados, com tipos, `PATHS` e o catalogo público de exercícios. Os tipos do servidor passam a ser a fonte. **1,5 h.**
4. **Estado do tutor no servidor (B2, B3, D9).** Tabela `participant_progress(session_id, participant_id, current_exercise_id, level, revealed_ids)`. O cliente deixa de enviar `exerciseId` e passa a chamar `GET /api/tutor/state` ao montar o chat. Isso resolve o recarregamento, o "Voltar" e a métrica. **(incluído em B3)**
5. **`App.tsx` monolítico (1.204 linhas, 10 telas + roteador + persistência).** Dividir em etapas, sem mudar o comportamento, com um commit por etapa:
   - `src/app/useRoute.ts` (`go`, `popstate`, `replaceState` das linhas 1154-1174) e `src/app/savedState.ts` (linhas 1113-1134, com estado separado por papel; C8);
   - `src/features/teacher/{TeacherActivate,TeacherActivated,SessionQr,TeacherDashboard}.tsx`;
   - `src/features/student/{StudentJoin,StudentCheckin,StudentPaths,StudentFocus,StudentReflection}.tsx` e `student/chat/{StudentChat.tsx,useTutorChat.ts,useFocusTimer.ts}`;
   - `src/pages/{Intro,PrivacyPage}.tsx`, com `BackLink` em `components/`;
   - `App.tsx` fica só com a composição (cerca de 60 linhas).
   
   Testes: `useTutorChat` e `useRoute` com Vitest + Testing Library. **8 h.**
6. **Cliente de API.** `postJson`/`getRequest` crus estão em 4 telas. Trocar por funções tipadas com `ApiError` (C9). **(incluído em C9)**

---

## G. Status dos itens da auditoria de 05/10 (verificado no código)

| # | Item | Status | Evidência |
|---|---|---|---|
| 1 | Tutor guarda estado por sessão | **Resolvido** | `attempts.ts:13-21` (chave primária com `participant_id`); `api/tutor/turn.ts:43-45` resolve o participante pelo cookie |
| 2 | "Não é 11" conta como correta | **Resolvido**, com novo falso negativo | `provider.ts:14-22`; ver B1 |
| 3 | Aluno cai no painel do professor | **Resolvido** | `App.tsx:1200` → intro |
| 4 | Barra de navegação do protótipo para todos | **Resolvido** | `components/Shell.tsx` sem barra; rotas por área em `shared/routes.ts` |
| 5 | Reflexão não salva | **Não resolvido** | `App.tsx:821-825` e `:841` (C10) |
| 6 | QR decorativo | **Resolvido** | `App.tsx:200-217`, QR com `/aluno?codigo=` |
| 7 | "Tempo médio de desafios como esse" sem dado | **Não resolvido** | `App.tsx:604` |
| 8 | Qualquer um com o `sessionId` lê o painel | **Resolvido** | `api/dashboard/index.ts:15-24`, `lib/sessions/teacher.ts` |
| 9 | Privacidade: identificador persistente, sem retenção nem exclusão | **Parcial** | Token por sessão em hash (`participants.ts`), exclusão (`retention.ts:18`), 90 dias. Mas a limpeza só roda na criação de sessão e o IP fica sem prazo e fora da política (B4); há órfãos possíveis (C7). |
| 10 | Recarregar perde o estado | **Parcial** | `App.tsx:1113-1149` guarda a sessão, a missão e a trilha. O chat, o exercício corrente, o nível e o foco se perdem (B3, D9); há um único slot para os dois papéis (C8). |
| — | Separação de papéis por rota | **Resolvido** | `shared/routes.ts` (o estado continua compartilhado, C8) |
| — | Autenticação mínima por token | **Resolvido** | `lib/auth/*`, cookies HttpOnly (Story 3.9) |
| — | `App.tsx` monolítico | **Parcial** | Passou de 1.267 para 1.204 linhas; só `Shell`, primitivas, cenas e o cliente foram extraídos (F5) |
| — | Erros frouxos no cliente | **Parcial** | O servidor tem formato único (`lib/http/response.ts`); o cliente ignora `error`/`message` (C9) |
| — | Função JSON copiada em 7 arquivos | **Resolvido** | `lib/http/response.ts` |
| — | Criação de tabelas por requisição | **Não resolvido** (piorou) | São 9 `ensure*`, incluindo `ALTER TABLE` (C1) |
| — | Stories 1.1–2.4 em "Ready" e desmarcadas | **Parcial** | Agora "Done", mas com checkboxes abertos |
| — | Arquitetura descreve endpoints inexistentes | **Não resolvido** | `arquitetura-mvp.md` §2-4 (seção E) |
| FR2 | QR, 10 mil combinações, entrada sem limite | **Parcial** | QR resolvido. O limite existe mas bloqueia turmas (A1). Continuam 10 mil códigos com `Math.random` (C6). |
| FR5 | Stub, contador por sessão, exercício parecido não avaliado | **Resolvido**, com defeitos de fluxo | Gemini em `gemini.ts`; parecido avaliado em `turn.ts:79`. Ver B1, B2, B3 e C5. |
| FR6 | Níveis no cliente e não persistidos | **Não resolvido** | `App.tsx:671` (D9) |
| FR8 | Reflexão sem gravação e sem "o que atrapalhou" | **Não resolvido** | C10 |
| FR9 | XP ético | **Não resolvido** | Ausente |
| FR10 | Competência errada, engajamento acima de 100%, sem mínimo de respostas | **Resolvido** | `summary.ts:39-56` e `:87-103` (contagem restrita a quem fez check-in, `MIN_RESPONSES=5`). A competência ainda é inflada por B3. |
| FR11 | Sugestão por regra fixa | **Inalterado** | `summary.ts:33-37` |
| Dec. 3 | Termos do Gemini | **Parcial** | Autorização na Story 3.3; verificação ainda pendente no registro de impacto |

---

## H. Ordem sugerida

1. **A1** (2 h): antes de qualquer uso em sala.
2. **B1 + B2 + C3** (7,5 h): o fluxo socrático correto e as respostas fora do bundle.
3. **B3 + D9 + F4** (5,5 h): progresso no servidor e métrica de competência íntegra.
4. **C1 + C7 + B4** (9 h): migração única com chaves estrangeiras, cron de retenção e IP com hash. Atualizar a política e o registro de impacto.
5. **C5 + C6 + C2** (7 h): resiliência e custo.
6. **C8 + C9 + F5** (13 h): refatoração do `App.tsx` com estado por papel e cliente tipado.
7. Atualizar `arquitetura-mvp.md`, `app/CLAUDE.md` e `AGENTS.md` (2 h).
