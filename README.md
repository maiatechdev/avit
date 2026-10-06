# Socrates AI

Tutor socrático para sala de aula: o professor define o objetivo da aula, cada aluno escolhe seu caminho e um tutor de IA guia o raciocínio com perguntas, sem entregar a resposta pronta.

Projeto desenvolvido para o uso pedagógico mediado pelo professor previsto na Lei 15.100/2025, que restringe o uso de celulares pessoais na educação básica.

> **Status:** protótipo de demonstração. Não há uso com dados reais de alunos até que a análise jurídica seja concluída. Veja [Privacidade](#privacidade).

## Como funciona

1. **Professor** cria uma sessão com um objetivo. A sessão recebe um código e um QR code.
2. **Aluno** entra pelo código ou pelo QR e responde um check-in rápido: dificuldade, tempo disponível e como está se sentindo.
3. **Aluno** escolhe uma trilha para chegar ao objetivo: Investigar, Criar, Resolver ou Colaborar.
4. **Tutor de IA** conduz o raciocínio com dicas em escada, sem revelar a resposta. Depois de três dicas sem sucesso, explica o passo a passo e propõe um exercício parecido.
5. **Modo Foco** é opcional e silencia notificações por um tempo escolhido pelo próprio aluno.
6. **Reflexão** final do aluno.
7. **Painel do professor** mostra indicadores agregados da turma: engajamento, autonomia, competência e vínculo, com uma sugestão para a próxima aula.

O professor só vê totais da turma. Cada aluno vê apenas a própria sessão.

## Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 19, Vite 8, Tailwind CSS 4, TypeScript |
| API | Funções edge da Vercel (`app/api/`) |
| Banco de dados | Postgres serverless (Neon), com tabelas criadas na primeira execução |
| Tutor de IA | Google Gemini, uma chamada por turno, com saída JSON validada |
| Testes | Vitest |
| Qualidade | ESLint (configuração plana) e checagem de tipos com `tsc` |

## Estrutura do repositório

```
.
├── socrates-ai/
│   ├── app/              # Aplicação: interface, API e regras de negócio
│   │   ├── api/          # Funções edge (sessões, check-in, participações, tutor, painel)
│   │   ├── lib/          # Regras de negócio: tutor, sessões, check-in, painel, privacidade
│   │   ├── src/          # Interface React
│   │   └── vercel.json   # Reescrita para rotas de página
│   ├── docs/             # Requisitos, arquitetura, stories, auditoria e registro de impacto
│   └── package.json      # Atalhos para a aplicação
└── LICENSE
```

## Rodando localmente

Requisitos: Node.js 22 e a [Vercel CLI](https://vercel.com/docs/cli) para as rotas de API.

```bash
cd socrates-ai
npm install --prefix app
```

Crie o arquivo `app/.env.local` com as variáveis abaixo. Os valores ficam com quem administra o projeto; não os versione.

| Variável | Obrigatória | Para que serve |
|---|---|---|
| `DATABASE_URL` | Sim | Conexão com o Postgres |
| `GEMINI_API_KEY` | Não | Chave da API do Gemini. Sem ela, o tutor usa um provedor de teste local |
| `GEMINI_MODEL` | Não | Modelo do Gemini. O padrão está em `app/lib/tutor/gemini.ts` |

Para subir a aplicação com as rotas de API:

```bash
cd socrates-ai/app
vercel dev
```

Ou, só a interface, sem as rotas de API:

```bash
npm run dev
```

## Scripts

Execute a partir de `socrates-ai/`:

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento da interface |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos |
| `npm test` | Testes com Vitest |
| `npm run format` | Formatação com oxfmt |

## Testes

```bash
cd socrates-ai
npm test
```

Os testes cobrem as regras de negócio: juiz das respostas, escada de dicas, check-in, cálculo do painel, tokens e cookies, limite de tentativas, formato de erro, rotas da interface e prazo de retenção. Os acessos ao banco e o fluxo completo no navegador são verificados manualmente.

## Deploy

A aplicação é publicada na Vercel com a raiz em `socrates-ai/app`. As variáveis de ambiente ficam configuradas no painel da Vercel. O lockfile do pnpm (`pnpm-lock.yaml`) é o usado no build.

## Privacidade

- Não são coletados nome, e-mail, documento, foto ou localização.
- Cada aluno recebe uma credencial emitida pelo servidor, guardada em cookie `HttpOnly`. O servidor guarda apenas o hash dela.
- As mensagens do chat não são gravadas pelo app. Elas são enviadas ao Gemini para gerar a resposta do tutor.
- Os dados de cada sessão são apagados após 90 dias, ou antes, pelo professor.
- A política de privacidade está disponível na própria aplicação, em `/privacidade`.
- O registro de impacto e as análises pendentes estão em `socrates-ai/docs/privacidade/`.

## Documentação

Os requisitos, a arquitetura e as stories de desenvolvimento estão em `socrates-ai/docs/`:

- `prd/`: requisitos do produto
- `architecture/`: arquitetura da solução
- `stories/`: histórico de stories, com validação e revisão de QA
- `auditoria/`: auditoria de UI/UX, funcionalidades e arquitetura
- `privacidade/`: registro de impacto à privacidade

## Contribuindo

1. Crie uma branch a partir de `main`.
2. Escreva os testes da mudança e confirme que `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam.
3. Abra um pull request descrevendo o que mudou e por quê.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
