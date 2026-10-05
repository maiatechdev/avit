# Arquitetura do MVP AVIT (demo para a disciplina)

Status: rascunho do @architect (Aria) para revisão. Base: `docs/prd/prd-mvp-avit.md`, seção 7 (decisões confirmadas).

## 1. Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Frontend | Vite + React 19 + Tailwind v4, já em `app/` | Já existe e builda |
| Hospedagem | Vercel, mesmo projeto do frontend, com Root Directory `socrates-ai/app` | Um deploy, um domínio |
| Backend | Funções serverless em `app/api/` (Vercel Functions) | Sem servidor próprio para manter |
| IA | Google Gemini via API (AI Studio), plano gratuito | Decisão do usuário |
| Chave da IA | Variável de ambiente `GEMINI_API_KEY` no Vercel; nunca no repositório | `.env` já é ignorado pelo git |
| Persistência | Banco pequeno gerenciado (Postgres gratuito da Neon ou Vercel Postgres) | Sessões e contadores precisam sobreviver a cold start |
| Dados | Apenas fictícios na demo; sem histórico de conversa guardado por padrão | PRD, NFR1 |
| Autenticação | Nenhuma para alunos (código de sessão); professor sem login no MVP | PRD, Epic 2 |

## 2. Componentes

```
app/ (SPA React)                    app/api/ (Vercel Functions)
  telas (Intro → Ativar → ...)  →   POST /api/sessions           cria sessão, devolve código
                                    POST /api/sessions/join      aluno entra com código
                                    POST /api/tutor/turn         um turno do tutor socrático
                                    POST /api/reflections        reflexão do aluno
                                    GET  /api/dashboard/:code    agregados anônimos
                                         │
                                         ├── Gemini API (geração do tutor)
                                         └── Postgres (sessões, tentativas, reflexões)
```

## 3. Regras do tutor (núcleo do produto)

O servidor é quem controla a escada de dicas, nunca o cliente.

- Estado por par (`sessionId`, `exercicioId`): contador de tentativas erradas (`0..3`).
- Prompt de sistema fixo: a IA pergunta, dá pistas e não escreve a resposta final.
- Quando o contador chega a 3: a IA explica passo a passo e propõe um exercício parecido. O contador reinicia no exercício novo.
- Resposta do aluno é classificada como correta/incorreta pela própria IA com um formato de saída estruturado (JSON com `resultado`, `resposta_ao_aluno`), validado no servidor antes de ser devolvido.
- Nível de raciocínio (1/2/3) é derivado de acertos e de tentativas, calculado no servidor.

## 4. Modelo de dados mínimo

- `sessions(id, code UNIQUE, objective, created_at)`
- `participations(id, session_id, anon_id, path, checkin_difficulty, checkin_time, checkin_feeling, level, xp, created_at)`
- `attempts(id, participation_id, exercise_id, tries, solved, created_at)` — sem texto de conversa
- `reflections(id, participation_id, feeling, helped, hindered, created_at)`

O painel do professor só lê agregados por `session_id`; nenhuma consulta devolve linhas individuais.

## 5. Erros e limites

- Gemini indisponível ou acima do limite gratuito: o servidor responde com erro claro; o cliente mostra mensagem e botão de tentar de novo (NFR6).
- Timeout de função Vercel: resposta da IA com timeout de 10 s; se passar, erro com retry.
- Limite gratuito da IA é o principal risco da demo: a equipe deve testar o fluxo completo antes da apresentação.

## 6. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Limite do plano gratuito do Gemini | Demo para no meio | Testar o roteiro inteiro uma vez antes; manter um roteiro de respostas de contingência |
| Cold start das funções | Primeira resposta lenta | Aquecer a função antes da apresentação |
| IA devolver a resposta pronta | Quebra do princípio socrático | Validação no servidor do formato e teste automatizado da escada de dicas |
| Persistência sem configurar | Dados perdidos entre chamadas | Banco definido na Story 1.1 antes de qualquer tela depender dele |

## 7. Fora do escopo do MVP

- Login de professor e de aluno.
- Ranking, ofensiva e notificações.
- Carga simultânea de muitos alunos.
- Armazenamento de conversas.
