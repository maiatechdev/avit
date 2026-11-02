# Socrates AI (app)

Tutor socrático para a sala de aula. React 19 + Vite 8 + Tailwind CSS v4 no cliente, funções edge da Vercel em `api/` e Postgres (Neon) no servidor. O projeto nasceu de um modelo do Figma Make; os plugins do Figma continuam no `vite.config.ts`, mas o deploy é na Vercel.

## Comandos

Rode a partir desta pasta (`socrates-ai/app`):

- `npm run dev`: servidor de desenvolvimento (porta 8443). As rotas `/api` não rodam no Vite; use `vercel dev` ou uma API simulada.
- `npm run typecheck`, `npm run lint`, `npm test` (vitest) e `npm run build`: os quatro precisam passar antes de um commit.

## Estrutura

- `src/App.tsx`: todas as telas (professor e aluno) e o roteamento por URL (`src/shared/routes.ts`).
- `src/components/`: `Shell`, primitivas (`Toggle`, `Confetti`, `QuestionBubble`) e cenas desenhadas das trilhas.
- `src/api/client.ts`: chamadas à API. As credenciais vão em cookies HttpOnly; o cliente não guarda tokens.
- `src/index.css`: tokens de cor (`:root`), superfícies cartoon (`.cartoon-card`, `.cartoon-btn`), foco visível e movimento reduzido.
- `api/`: um arquivo por rota (`sessions`, `sessions/join`, `sessions/erase`, `checkins`, `participations`, `tutor/turn`, `dashboard`, `cron/retention`). Todo arquivo dentro de `api/` vira função na Vercel: testes ficam em `tests/`.
- `lib/`: regras do servidor. `tutor/` (escada de dicas, juiz, Gemini), `sessions/`, `participants/`, `checkins/`, `dashboard/`, `privacy/` (retenção e exclusão), `http/` (respostas, limites de tentativas, cron), `auth/` (tokens e cookies).
- `tests/api.test.ts`: testes dos endpoints com os módulos de banco simulados.

## Regras

- O servidor decide tudo o que importa: o juiz, a escada de dicas, quem é professor ou aluno. O cliente nunca envia o próprio id de participante.
- Erros de API seguem `{ error, message? }` via `lib/http/response.ts`.
- Identidade visual cartoon (traço marinho, sombra de adesivo, creme, azul e dourado): ver `DESIGN.md`. Texto na cor da IA usa `--ai-ink`, não `--ai`.
- Variáveis de ambiente: `DATABASE_URL`, `GEMINI_API_KEY` (opcional; sem ela, o tutor usa o stub), `CRON_SECRET` (rotina diária), `IP_HASH_SECRET` (opcional, protege o hash do IP).
- Strings com apóstrofo vão entre aspas duplas. Componentes são exportados como default.
