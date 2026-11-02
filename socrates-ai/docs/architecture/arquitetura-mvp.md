# Arquitetura do MVP AVIT (demo para a disciplina)

Status: atualizado em 2026-11-02 para refletir o código (Stories 3.1 a 4.2). Base: `docs/prd/prd-mvp-avit.md`, seção 7, e `docs/auditoria/auditoria-completa-2026-10-31.md`.

## 1. Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Frontend | Vite + React 19 + Tailwind v4, já em `app/` | Já existe e builda |
| Hospedagem | Vercel, mesmo projeto do frontend, com Root Directory `socrates-ai/app` | Um deploy, um domínio |
| Backend | Funções serverless em `app/api/` (Vercel Functions) | Sem servidor próprio para manter |
| IA | Google Gemini via API (AI Studio), plano gratuito | Decisão do usuário |
| Chave da IA | Variável de ambiente `GEMINI_API_KEY` no Vercel; nunca no repositório | `.env` já é ignorado pelo git |
| Persistência | Banco pequeno gerenciado (Postgres gratuito da Neon ou Vercel Postgres) | Sessões e contadores precisam sobreviver a cold start |
| Dados | Apenas fictícios na demo; o texto das conversas não é guardado | PRD, NFR1 |
| Autenticação | Sem login. Professor e aluno recebem um token aleatório em cookie HttpOnly; o banco guarda só o hash | Story 3.5 e 3.9 |
| Tempo de execução | Funções edge (`export const config = { runtime: "edge" }`) | Latência baixa e sem servidor |

## 2. Componentes

```
app/src (SPA React)                 app/api (funções edge da Vercel)
  /            escolha de papel →   POST /api/sessions            cria sessão; cookie do professor
  /professor/* objetivo, QR, painel POST /api/sessions/join       aluno entra com código; cookie do aluno
  /aluno/*     código, check-in,    POST /api/sessions/erase      professor apaga a turma
               trilhas, foco,       POST /api/checkins            check-in do aluno
               chat, reflexão       POST /api/participations      trilha escolhida
                                    POST /api/tutor/turn          um turno do tutor socrático
                                    GET  /api/dashboard?sessionId agregados para o professor
                                    GET  /api/cron/retention      rotina diária (Vercel Cron)
                                         │
                                         ├── Gemini API (só o texto da resposta do tutor)
                                         └── Postgres na Neon
```

## 3. Regras do tutor (núcleo do produto)

O servidor controla a escada de dicas e o juiz; o cliente só envia a mensagem e o exercício atual.

- Estado por (`session_id`, `participant_id`, `exercise_id`): erros (`0..3`), `solved` e `revealed`.
- Juiz (`lib/tutor/provider.ts`): determinístico, olha o último número que o aluno declarou e recusa negação, alternativa, pergunta ou dúvida. O Gemini não julga; ele só escreve a resposta.
- Três dicas; no quarto erro, o tutor explica passo a passo, marca o exercício como `revealed` e propõe o próximo. Um acerto depois disso não conta como competência no painel.
- Depois do acerto, a próxima mensagem do aluno é tratada como a explicação do raciocínio: o tutor agradece e mostra o próximo exercício no chat.
- Dica que vaza o número da resposta é trocada por uma dica segura (`leaksAnswer`).
- O nível de raciocínio (1/2/3) ainda é calculado no cliente (pendência de FR6).

## 4. Modelo de dados

Criado sob demanda pelas próprias funções (`CREATE TABLE IF NOT EXISTS`); migração formal é pendência.

- `sessions(id, code UNIQUE, objective, teacher_token_hash, created_at)`
- `participants(token_hash PK, session_id, participant_id, created_at)`
- `checkins(session_id, participant_id, difficulty, time_available, feeling, created_at)`
- `participations(session_id, participant_id, path, created_at)`
- `participant_attempts(session_id, participant_id, exercise_id, wrong_count, solved, revealed, updated_at)`
- `rate_limits(key PK, hits, window_start)`: a chave leva o hash do IP ou o id do participante, nunca o IP em texto.

O painel lê só agregados por sessão e só conta quem fez check-in. Não há tabela de reflexões: a reflexão não é enviada.

## 5. Erros, limites e retenção

- Erros no formato `{ error, message? }` (`lib/http/response.ts`).
- Tempo limite do tutor: 22 s no turno e 20 s na chamada ao Gemini. Falha vira `503 tutor_unavailable`, e o cliente devolve o texto ao campo.
- Limites (`lib/http/rateLimit.ts`): entrada conta só códigos errados (30 a cada 10 min por IP); criação de sessão, 10 por hora por IP; tutor, 30 turnos por aluno e 600 por sessão a cada 10 min.
- Retenção: sessões e dados dos alunos saem após 90 dias pela rotina diária `/api/cron/retention` (exige `CRON_SECRET`) e, antes disso, pelo botão do professor. Contadores de tentativas saem após 1 hora.
- Cabeçalhos de segurança no `vercel.json`: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` e `Permissions-Policy`.

## 6. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Limite do plano gratuito do Gemini | Demo para no meio | Limite de turnos por aluno e por sessão; testar o roteiro inteiro antes |
| Termos do Gemini vedam menores | Uso com alunos reais fica proibido | Decisão de 2026-11-02: protótipo só para a banca, com o Gemini mantido; trocar de provedor antes de qualquer uso com alunos |
| Cold start das funções | Primeira resposta lenta | Aquecer a função antes da apresentação |
| IA devolver a resposta pronta | Quebra do princípio socrático | Validação no servidor do formato e teste automatizado da escada de dicas |
| Persistência sem configurar | Dados perdidos entre chamadas | Banco definido na Story 1.1 antes de qualquer tela depender dele |

## 7. Fora do escopo do MVP

- Login de professor e de aluno (há só tokens por sessão).
- Ranking, ofensiva e notificações.
- Carga simultânea de muitos alunos.
- Armazenamento de conversas.
