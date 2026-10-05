# PRD: MVP AVIT — Demo funcional para a disciplina de IA

Status: **rascunho para validação** (@pm → @po). Escopo confirmado pelo usuário: *demo funcional para a disciplina*. Prazo: novembro de 2026.

Base do documento: pesquisa "Dados de pesquisa e proposta de solução" (aprendizado guiado com IA socrática e gamificada), `app/PRODUCT.md`, `app/DESIGN.md` e o protótipo atual em `app/src/App.tsx`.

---

## 1. Goals and Background Context

### Goals
- Entregar um fluxo completo, funcional e apresentável, em que um professor define um objetivo, um aluno escolhe uma trilha, conversa com um tutor de IA socrático real, reflete sobre a atividade, e o professor vê um painel com dados reais.
- Demonstrar o diferencial central: a IA **não entrega a resposta pronta** — ela pergunta, dá dicas em escada e só explica o passo a passo depois de três tentativas.
- Começar pelo conteúdo de **Matemática**, onde a pesquisa aponta a maior dificuldade dos alunos e onde o estudo de IA com proteções pedagógicas (Bastani et al., 2025) foi conduzido.

### Background Context
O protótipo atual (`app/`) tem todas as telas, mas é um **clique-protótipo**: o chat devolve respostas fixas, o painel mostra números fixos, o código de sessão é decorativo e não há backend, persistência nem entrada real de alunos. A pesquisa mostra que o problema não é a tecnologia, e sim a ausência de mediação pedagógica; por isso o MVP precisa provar a mediação, não só a interface.

### Change Log
| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-10-05 | 0.1 | Rascunho inicial a partir da pesquisa e do protótipo | @pm (Morgan) |

---

## 2. Requirements

### Functional
- **FR1 — Objetivo da sessão:** o professor escreve (ou escolhe entre sugestões) um objetivo de aula e ativa uma sessão.
- **FR2 — Código de sessão real:** a sessão gera um código curto e QR; alunos entram informando o código e recebem um identificador de sessão (sem login obrigatório no demo).
- **FR3 — Check-in do aluno:** antes da missão, o aluno responde em poucos cliques dificuldade, tempo disponível e sentimento. Isso personaliza a missão.
- **FR4 — Caminhos:** o aluno escolhe um dos quatro caminhos (Investigar, Criar, Resolver, Colaborar) para o mesmo objetivo. A escolha é persistida e aparece no chat.
- **FR5 — Tutor socrático com escada de dicas:**
  - a IA pergunta o que o aluno já sabe antes de qualquer conteúdo;
  - após cada tentativa errada, dá uma dica (pergunta ou pista);
  - após **três dicas** sem sucesso, explica passo a passo e propõe um exercício parecido;
  - nunca entrega a resposta final diretamente.
- **FR6 — Níveis de raciocínio:** o progresso (1/3, 2/3, 3/3) é calculado a partir do comportamento do aluno no chat, não de um valor fixo. "Concluí o desafio" só aparece no nível 3.
- **FR7 — Modo Foco:** opção de silenciar notificações com duração escolhida (já existe na UI; precisa de efeito real no app, não só visual).
- **FR8 — Reflexão:** ao final, o aluno responde sentimento, o que ajudou e **o que atrapalhou** (cansaço, distração, não entendeu). Hoje falta a última pergunta.
- **FR9 — XP ético:** pontos por aprender (concluir desafio, colaborar, criar, refletir, evoluir), sem ofensiva que "morre" e sem ranking individual público. Recompensa é mais escolha, não skin.
- **FR10 — Painel do professor com dados reais:** agregados e anônimos — engajamento, autonomia, competência, vínculo, distribuição de trilhas e onde a turma travou. Os números deixam de ser fixos.
- **FR11 — Sugestão da IA para a próxima aula:** a partir do painel agregado, a IA sugere ajustes (texto curto, sem decisão automática).

### Non Functional
- **NFR1 — Privacidade (LGPD art. 14 e ECA Digital, Lei 15.211/2025):** conversas não são guardadas por padrão; o professor só vê dados agregados; o demo não deve coletar dados pessoais de menores além do necessário.
- **NFR2 — Leveza:** o app deve funcionar em celular de entrada e com conexão instável (a pesquisa aponta exclusão digital); payloads pequenos e sem vídeo embutido.
- **NFR3 — Custo zero:** a IA usa API com plano gratuito (Google AI Studio/Gemini, Groq ou OpenRouter, conforme pesquisa). A escolha final é da arquitetura.
- **NFR4 — Chave de API fora do repositório:** credenciais ficam em `.env` (já ignorado pelo git).
- **NFR5 — Qualidade:** `npm run lint`, `npm run typecheck` e `npm run build` precisam passar antes de qualquer entrega (já configurados).
- **NFR6 — Estabilidade para a demo:** o fluxo principal precisa ser ensaiado ponta a ponta sem falhas; estados de erro (sem internet, IA indisponível) têm mensagem clara e retry.

---

## 3. UI Design Goals

- Manter o sistema visual já documentado em `app/DESIGN.md` (paleta terracota/verde-água/creme, Nunito + Outfit, índigo reservado à IA, bounce tátil).
- Mudanças de UI nesta fase são **funcionais**; refinamentos visuais passam pelo Impeccable depois que o fluxo estiver estável.
- Telas a manter: Intro, Ativar sessão, Sessão ativada (com código real), Caminhos, Modo Foco, Chat, Reflexão, Painel.
- Telas removidas do fluxo de usuário: navegação de protótipo entre telas (a barra inferior hoje serve só para demonstração).
- Plataforma: web responsivo em largura de celular (já é o caso).
- Acessibilidade: contraste e foco visível são pendências conhecidas do relatório de crítica (`app/.impeccable/critique/`); entram no escopo de polimento, não bloqueiam a demo.

---

## 4. Technical Assumptions (a validar pelo @architect)

- **Repositório:** monorepo no `socrates-ai/` com `app/` (frontend Vite + React + Tailwind v4) e um backend pequeno para IA, sessões e agregação. Decisão de hospedagem do backend pendente.
- **IA:** uma chamada de LLM por turno do tutor, com prompt de sistema que impõe a escada de dicas. Contador de tentativas por exercício mantido no servidor.
- **Persistência:** mínima. Sessões, participações agregadas e eventos anônimos. Sem histórico de conversa por padrão.
- **Autenticação:** no demo, código de sessão e identificador anônimo. Login do professor é opcional e fica para depois.
- **Testes:** typecheck e lint no CI; testes do fluxo do tutor (escada de dicas) são obrigatórios antes da demo.

---

## 5. Epic List

1. **Epic 1 — Tutor socrático com escada de dicas (Matemática).** Núcleo do produto. Sem isso não há o que demonstrar.
2. **Epic 2 — Sessão real e caminhos.** Código de sessão, entrada do aluno, check-in, persistência da trilha escolhida e níveis calculados.
3. **Epic 3 — Reflexão e painel do professor com dados reais.** Pergunta "o que atrapalhou", agregação anônima, sugestão da IA e XP ético.
4. **Epic 4 — Privacidade e preparo da demo.** Política de dados no app, limpeza de dados de demonstração, ensaio ponta a ponta e estados de erro.

Ordem de prioridade: Epic 1 → Epic 2 → Epic 3 → Epic 4. Se o prazo apertar, Epic 3 é reduzido a um painel com dados reais mínimos, e Epic 4 é feito à medida que cada epic fecha.

---

## 6. Epic Details

As stories serão criadas pelo @sm a partir de cada épico, seguindo o fluxo Story Development Cycle (@sm → @po → @dev → @qa → @devops para o push).

### Epic 1 — Tutor socrático com escada de dicas
- Objetivo: a IA responde com perguntas e dicas, e só explica após três tentativas sem sucesso.
- Critérios de aceite de alto nível:
  - nenhuma resposta final é entregue na primeira ou na segunda tentativa;
  - após a terceira dica, a explicação passo a passo vem seguida de um exercício parecido;
  - o contador de tentativas é mantido no servidor, não no cliente;
  - cobre pelo menos um tópico de Matemática do ensino médio.

### Epic 2 — Sessão real e caminhos
- Objetivo: alunos entram com código de sessão, fazem check-in e seguem uma trilha que fica registrada.
- Critérios de aceite de alto nível:
  - um código gerado ao ativar a sessão permite a entrada de alunos;
  - o check-in altera a missão proposta;
  - a trilha escolhida aparece no cabeçalho do chat e fica registrada na sessão;
  - o nível de raciocínio é calculado a partir das interações.

### Epic 3 — Reflexão e painel do professor
- Objetivo: o professor vê dados reais e anônimos da turma e recebe uma sugestão.
- Critérios de aceite de alto nível:
  - a reflexão inclui "o que atrapalhou";
  - o painel mostra apenas agregados (nenhum dado individual);
  - os números vêm de eventos reais da sessão, não de valores fixos;
  - a sugestão da IA é texto curto e não altera nada automaticamente.

### Epic 4 — Privacidade e preparo da demo
- Objetivo: o demo cumpre o mínimo de LGPD/ECA e é apresentável sem falhas.
- Critérios de aceite de alto nível:
  - política de privacidade curta acessível no app;
  - conversas não são armazenadas por padrão;
  - estados de erro (sem internet, IA indisponível) com retry;
  - roteiro de demo ensaiado do início ao fim.

---

## 7. Open Questions (decisões do usuário antes da validação)

1. **Provedor de IA:** Gemini (Google AI Studio), Groq ou OpenRouter? Decisão do @architect com base em limite gratuito e latência.
2. **Hospedagem do backend:** Vercel (funções serverless) ou outro serviço? O frontend já está no Vercel.
3. **Conteúdo do piloto de Matemática:** qual tópico do ensino médio será usado na demo?
4. **Dados na demo:** a demonstração usará dados reais de alunos ou apenas dados fictícios criados pela equipe?
5. **Público da demo:** só a banca da disciplina ou também alunos reais?
6. **XP e níveis na demo:** entram com regras completas ou com uma versão simplificada?

---

## 8. Next Steps

- @po valida este PRD (checklist de completude e consistência com a pesquisa).
- @architect define a arquitetura do backend com base nas respostas da seção 7.
- @sm cria as stories do Epic 1 primeiro.
- Cada story passa por @po → @dev → @qa antes de qualquer commit. O push fica com o usuário.
