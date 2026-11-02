# Auditoria de UI/UX: Socrates AI (tasteskill v2, lente @ux-design-expert)

Data: 2026-10-31. Escopo: `socrates-ai/app` (React 19, Vite, Tailwind 4), commit `8c5cb78`. É só auditoria: nenhum arquivo do projeto foi alterado.

## 0. Método e o que foi verificado de fato

- **Régua:** skill `design-taste-frontend` v2 no modo *app screen* (`references/app-screens.md`), com `critique.md`, `tells.md`, `copy.md`, `type.md` e `colour.md`. A identidade cartoon (traço marinho de 3px, raio de 22px, sombra de adesivo `0 5px 0 #142463`, creme/azul/marinho/dourado) é decisão tomada (`app/DESIGN.md`, decisão 1 da auditoria de 05/10). Os alertas da skill contra essa identidade estão separados na seção 2.3 e não viraram achados. `draw.mjs` não foi usado.
- **Lint:** `lint.mjs --app src`, rodado em `app/`.
- **Navegador real:** o app subiu com `npx vite --port 5199`, usando uma config de auditoria no scratchpad (`taste/vite.mock.config.mts`). Ela estende o `vite.config.ts` do projeto sem alterá-lo e **simula as rotas `/api`** com dados fictícios. Com `?seed=<estado>`, ela grava uma sessão de demonstração no `localStorage` (`socrates-state`) antes de o app carregar. Por isso **todas as 11 telas renderizaram**, inclusive as que exigem sessão, e os estados do painel (vazio, poucas respostas, erro, bloqueado).
- **Inspector:** `inspect.mjs --app` em 11 rotas, a 1440, 768 e 390px. As capturas estão em `scratchpad/taste/inspect/<tela>/` e os relatórios em `scratchpad/taste/inspect-<tela>.txt`.
- **Estados interativos:** um script CDP próprio (`taste/drive.mjs`, que usa o `lib/cdp.mjs` da skill) clicou e digitou por 17 estados a 390 e 1440px: objetivo preenchido, código inválido, check-in completo, trilha escolhida, foco ligado, chat com conversa, falha do tutor, reflexão enviada, confirmação de apagar, foco por teclado. O script também mediu alvos de toque e nomes acessíveis (`taste/states/audit.json`). As capturas estão em `scratchpad/taste/states/`.
- **Contraste:** calculado pela fórmula WCAG 2.x a partir dos tokens de `src/index.css` e das cores fixas no código (tabela na seção 3).
- **Limites:** o inspector olhou o **servidor de desenvolvimento** (WARN `dev-server`), não o build de produção. As respostas da API são simuladas, então o conteúdo do tutor e os números do painel são fictícios: avalio forma e estados, não a pedagogia. A ida e volta do teclado virtual no celular não foi testada. Os itens marcados **(por código)** foram lidos no fonte e não vistos em captura. O servidor foi encerrado no fim, e o `git status` mostra o projeto intacto.

## 1. Saída do lint

```
TASTESKILL · LINT   11 file(s)
FAIL  [emoji] Emoji usado como UI (5×): App.tsx:802 😄, :803 🙂, :804 😐, :805 😓, :838 🎉
WARN  [numbering] padStart(2,"0") App.tsx:22 (relógio do foco: defensável)
WARN  [transition-all] App.tsx:146, :714, :847
WARN  [shadow] index.css:94, :100, :105, :108 (sombra de adesivo: identidade decidida)
WARN  [em-dash] 6 travessões no código
RESULT: 5 FAIL, 9 WARN
```

## 2. Saída do inspector (`inspect.mjs --app`, 1440/768/390)

### 2.1 Resumo por tela

| Tela (rota) | FAIL | WARN | Achados que valem como problema |
|---|---|---|---|
| Escolha de papel `/` | 3 | 3 | `text-shadow` no slogan; sem `h1`; 13% de cor saturada na primeira tela a 390px |
| Entrada do aluno `/aluno` | 1 | 3 | 60% da tela desktop vazia (`hero-void`) |
| Objetivo do professor `/professor` | 0 | 3 | contraste: "Uso pedagógico ativo — Lei 15.100/2025" **2,9:1** |
| Sessão ativa `/professor/sessao` | 1 | 3 | **sem `h1`** (o título é `h2`) |
| Painel `/professor/painel` | 2 | 6 | contraste: código "SOC-4821" **3,8:1**; 60% do texto abaixo de 13px; linha irregular (34px) |
| Check-in `/aluno/checkin` | 2 | 3 | 33% da tela desktop vazia |
| Trilhas `/aluno/trilhas` | 1 | 6 | contraste: "OBJETIVO DE HOJE" **4,1:1**; 48% do texto abaixo de 13px; 6 matizes |
| Modo foco `/aluno/foco` | 0 | 6 | contraste: "Baseado no tempo médio…" **2,9:1**, "20 min" e "sugerido" **3,1:1**; 53% do texto abaixo de 13px |
| Chat `/aluno/chat` | 3 | 5 | **sem `h1`**; 53% da tela desktop vazia com uma mensagem só |
| Reflexão `/aluno/reflexao` | 1 | 4 | **emoji**; `h1` de 36px no desktop (régua de app: 18–32px) |
| Privacidade `/privacidade` | 1 | 3 | nenhum além dos da identidade |

### 2.2 Medições globais

- `<html lang="en">` em todas as telas, inclusive no `dist/index.html` de produção. Vem de `.figma/make/site.json`, que não define `language`.
- **Nenhum** `aria-live`, `role="status"` ou `role="alert"` em todo o app (contagem 0 em 11 telas).
- Alvos abaixo de 44px a 390px: "← Voltar" 56×28 em 9 telas (56×20 na entrada); "Política de privacidade" 342×16; "Apagar dados desta turma" 171×20; envio do chat 40×40; interruptor do foco 56×32; chips de duração 73×40; chips "O que mais ajudou" 36px de altura.
- Controles sem nome acessível: interruptor do Modo Foco, botão de envio do chat, campo de objetivo e campo do chat (os dois só têm placeholder).

### 2.3 Alertas da skill que contrariam a identidade decidida (mantidos, com a defesa em uma frase)

| Alerta | Defesa |
|---|---|
| `heavy-shadow`, `button-fx` (sombra sólida de 5px em cartões e botões) | É o "adesivo" da logo, decidido em `DESIGN.md`. A sombra é sólida e sem desfoque, então funciona como contorno e não como elevação. |
| `heavy-borders` (marinho 14:1 em cartões) | O traço marinho de 3px é a assinatura da marca. |
| `palette-cream` (`#FBF7EE`) | É a cor de papel da marca. Não há terracota nem violeta como destaque, que é a combinação que a skill bane. |
| `blank-gap` no chat a 768px | É uma conversa com uma só mensagem, o que é natural nesse estado. |
| `rainbow-chart` (6 matizes) | Cor por trilha e cor por métrica estão em `DESIGN.md`. A seção 5 propõe reduzir o ruído sem abandonar a regra. |

## 3. Contraste real dos tokens (WCAG 2.x)

| Par | Razão | Onde aparece | Resultado |
|---|---|---|---|
| marinho `#142463` / creme `#FBF7EE` | 13,43 | texto principal | passa |
| texto-suave `#4A5A8A` / creme | 6,29 | apoio | passa |
| texto-suave / `#E9EEFB` | 5,80 | botões desabilitados, rótulos | passa |
| branco / azul-royal `#2F6BE8` | 4,78 | botão principal | passa (justo) |
| azul-royal / `#E9EEFB` | **4,12** | "OBJETIVO DE HOJE" (App.tsx:447) | **falha** para 12px |
| azul-IA `#6C8CFF` / creme | **2,87** | "Uso pedagógico ativo…" (App.tsx:121) | **falha** |
| azul-IA / ai-muted sobre creme `#E4E6F1` | **2,47** | chip "Foco · 19:57" (App.tsx:701), aviso do foco (App.tsx:604) | **falha** |
| branco / azul-IA | **3,07** | chip de duração ativo (App.tsx:589) | **falha** para 14px |
| azul-IA / branco | **3,07** | timer "MODO FOCO" no aside (App.tsx:790) | passa só como texto grande (18px/800) |
| verde `#1F8F5F` / verde-tint `#E9FAF2` | **3,77** | código no painel (App.tsx:989) | **falha** para 12px |
| lilás `#8A5CF0` / branco | 4,31 | valor "Competência" (30px/800) | passa como texto grande |
| verde `#1F8F5F` / branco | 4,08 | valor "Vínculo" (30px/800) | passa como texto grande |
| ocre `#A16A00` / branco | 4,59 | valor "Autonomia" | passa |
| marrom `#5C4300` / `#FFF1C7` | 8,26 | sugestão, objetivo | passa |
| vermelho `#B42318` / creme | 6,15 | erros | passa |
| ícone dourado `#F5B82E` / `#FFF1C7` | **1,58** | ícone "!" do objetivo (App.tsx:250) | **falha** (não-texto, mínimo 3:1) |
| ponto verde `#2FB67C` / creme | **2,42** | "Sessão ativa" (App.tsx:223) | **falha** (não-texto) |
| campo `#E9EEFB` / creme | **1,09** | campo do chat sem borda (App.tsx:758) | **falha**: o limite do campo some |

**Correção de tokens:** criar `--ai-ink: #3D5BD9` (cerca de 5,2:1 sobre branco e cerca de 4,6:1 sobre `--ai-muted`) para todo **texto** na cor da IA, e manter `#6C8CFF` só em preenchimentos e ícones grandes. Criar `--success-ink: #17734C` (cerca de 5,4:1 sobre `#E9FAF2`). Em "OBJETIVO DE HOJE", trocar `var(--primary)` por `var(--foreground)`. **(As razões dos tokens novos são estimadas; confirmar antes de aplicar.)**

## 4. O que mudou desde a auditoria de 05/10

| Item de 05/10 | Situação hoje | Evidência |
|---|---|---|
| Sem voltar/avançar | **Resolvido** | Rotas por URL (`shared/routes.ts`) e "← Voltar" em 10 de 11 telas |
| Barra inferior sobre o conteúdo | **Resolvido** | Não há barra |
| Chat sem layout de desktop | **Parcial** | Há aside de 384px, mas os balões chegam a ~810px de largura (medida longa) |
| Painel esticado | **Parcial** | `max-w-6xl` aplicado; a faixa "24 alunos" e o botão "Nova sessão" continuam em largura total |
| Aluno cai no painel | **Resolvido** | Reflexão volta para `/` |
| QR decorativo | **Resolvido** | QR real com `?codigo=` |
| Recarregar perde estado | **Parcial** | Sessão, missão e trilha persistem; o foco e o histórico do chat se perdem |
| **Reflexão não é salva** | **Não resolvido** | `handleSubmit` (App.tsx:821) não chama a API, e a tela continua dizendo "Sua resposta ajuda o professor" |
| **"Tempo médio de desafios como esse"** | **Não resolvido** | App.tsx:604 |
| Dois estilos de botão | **Não resolvido** | `cartoon-btn` (7 usos) e `btn-bounce rounded-2xl` plano (6 usos) |
| Texto em `#6C8CFF` ~3:1 | **Não resolvido** | 4 lugares (seção 3) |
| Envio do chat sem nome acessível | **Não resolvido** | App.tsx:759 |
| Sem anel de foco | **Não resolvido** | Visto em captura: o campo de código focado só mostra o cursor, e o chip focado tem um contorno preto fino sobre a borda marinha |
| Interruptor do foco sem nome | **Não resolvido** | primitives.tsx:14 |
| Sem `aria-live` no chat | **Não resolvido** | 0 regiões vivas |
| Chips ocultos focáveis | **Não resolvido** | App.tsx:583 (só `max-height: 0`) |
| Alvos abaixo de 44px | **Parcial** | Abas sumiram; envio (40px) e "Encerrar" do foco (~24px) continuam |
| Texto de 12px em conteúdo | **Não resolvido** | 48–60% do texto abaixo de 13px em trilhas, foco e painel |
| `DESIGN.md` divergente | **Resolvido** | Reescrito para o cartoon |

## 5. Crítica tela a tela

Severidade: **P0** quebra a confiança ou a promessa central; **P1** bloqueia uma tarefa, falha em acessibilidade de nível A/AA ou engana; **P2** atrito claro ou inconsistência; **P3** polimento.

### 5.1 Global (todas as telas)

| Sev. | Arquivo:linha | Problema | Correção concreta |
|---|---|---|---|
| P1 | `.figma/make/site.json` (sem `language`) → `<html lang="en">` | O leitor de tela lê português com voz inglesa (WCAG 3.1.1, nível A). A `description` também está em inglês. | Em `site.json`, `"language": "pt-BR"` e `description` em PT-BR. Como o plugin sanitiza `[^a-zA-Z0-9_-]`, `pt-BR` passa. |
| P1 | `index.css` (nenhuma regra de foco); `outline-none` em App.tsx:146, :321, :757 | Sem foco visível para teclado (WCAG 2.4.7). Confirmado em captura. | Adicionar em `index.css`: `:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }` e `.cartoon-btn:focus-visible, .cartoon-card:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }`. Trocar `outline-none` por `focus-visible:outline-[3px] focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`. |
| P2 | `index.css:52–110` | Não há `prefers-reduced-motion`: a entrada de tela sobe 12px, os botões fazem bounce, há 28 confetes e `scrollIntoView({behavior:"smooth"})`. | `@media (prefers-reduced-motion: reduce){ .screen-enter{animation:none} .btn-bounce:active,.tap-scale:active{transform:none!important} *{scroll-behavior:auto!important; transition-duration:.01ms!important} }`. Em `Confetti`, retornar `null` se `matchMedia('(prefers-reduced-motion: reduce)').matches`. |
| P2 | Botões planos App.tsx:179, :259, :525, :611, :874; `cartoon-btn` em :66, :78, :328, :424, :1089, :1104 | Dois sistemas de botão (já apontado em 05/10). Fere o próprio `DESIGN.md` ("sombra de adesivo em todo cartão e botão"). | Um único `<Button variant="primary|secondary|danger">` em `components/primitives.tsx` sobre `.cartoon-btn`, com `py-4 text-base font-extrabold` e Nunito. Remover `btn-bounce rounded-2xl` como estilo de botão. |
| P2 | App.tsx:259 ("Ver painel da turma", ativo, fundo `--muted`) contra os desabilitados em :181, :329, :425, :526, :876 (também `--muted`) | O botão secundário ativo tem a mesma cara de um desabilitado. | Secundário ativo: `background: var(--card)` com `cartoon-btn`. Desabilitado: `--muted`, sem sombra e com `cursor-not-allowed`. Hoje só o primeiro é diferente. |
| P2 | Medido a 390px | Alvos abaixo de 44px (lista na seção 2.2). | `BackLink`: `min-h-11 px-2 -ml-2 inline-flex items-center`. Links de texto (Política, Apagar): `min-h-11 inline-flex items-center`. Envio: `w-11 h-11`. Chips: `min-h-11`. |
| P2 | Inspector: 48–60% do texto abaixo de 13px em trilhas, foco e painel | `text-xs` (12px) em conteúdo: descrições de trilha, legendas de métrica, ajudas. `DESIGN.md` diz que o corpo é 16px. | Conteúdo e ajuda em `text-sm` (14px); 12px só em rótulos de dado. Ver as linhas de cada tela abaixo. |
| P3 | App.tsx:15 contra :306 e :688 | O "Voltar" está reimplementado em 3 variações (`mb-6`, `mb-8`, com e sem `py-1`). | Usar `BackLink` em todas as telas. |
| P3 | `#B42318` (6×), `#1F8F5F`, `#E9FAF2` e cores de trilha fixas no código | Cores fora dos tokens. | Tokens `--danger`, `--success`, `--success-bg` e `--path-*` em `:root`. |
| P3 | Rótulos em caixa alta: :163, :447, :584, :771, :775, :779, :789, :985, :1035, :1051, :1060 | Há três estilos de rótulo (600 sem tracking, 800 sem tracking, 800 via `toUpperCase`). `DESIGN.md` pede 12px/800/0,04em. Pela régua de app screens, o máximo é um rótulo em caixa alta por tela. | Unificar numa classe `.label` (Nunito 12px/800/0,04em) e usá-la só em rótulos de dado. Títulos de bloco ("Sugestão para a próxima aula", "Escolhas por trilha") viram `h2` em caixa normal, 16px/800. |

### 5.2 Escolha de papel (`/`): `Intro`, App.tsx:29–96

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P2 | :74 | "Entrar no app" não diz que é o caminho do professor, enquanto o outro botão diz "Sou aluno". A escolha fica assimétrica. | "Sou professor: criar sessão" e "Sou aluno: entrar com código". |
| P2 | :40–59 | Sem `h1` (FAIL do inspector). | `<h1 className="sr-only">Socrates AI</h1>`, ou o slogan como `h1` em caixa normal. |
| P2 | :49–58 | Slogan em caixa alta com tracking e `textShadow` (FAIL `text-shadow`). | Tirar `uppercase` e `textShadow`; usar `text-lg font-extrabold` em caixa normal. |
| P3 | :89 | "Política de privacidade" com 16px de altura. | `min-h-11`. |

### 5.3 Professor: objetivo (`/professor`), App.tsx:100–195

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P1 | :144, :165–167 | O exemplo ("mudanças climáticas") e as "Ideias de hoje" (desigualdade, redes sociais, resíduos) prometem qualquer tema, mas o chat sempre pergunta `f(x) = 2x + 3` (App.tsx:628). O professor que escrever "mudanças climáticas" verá a turma resolver f(4). | Enquanto o tutor for fixo: dizer "Piloto: Matemática, funções do 1º grau", usar exemplo e ideias de matemática ("Calcular f(x) para um valor dado", "Interpretar o coeficiente angular") ou fixar o objetivo. |
| P1 | :141 | O `textarea` não tem rótulo (só placeholder). | `aria-labelledby` apontando para o `id` do `h1` (`id="objetivo-titulo"`), e a dica de :157 em `aria-describedby`. |
| P2 | :120–123 | Ponto de status com texto `#6C8CFF` (2,87:1), acima do título como eyebrow. É uma *tell* (ponto decorativo e rótulo acima do título). | Mover para uma linha de rodapé abaixo do botão, em `--muted-foreground`, sem o ponto. |
| P2 | :127–133 | Ícone de livro num quadrado azul e "Painel do professor" como eyebrow (*tells*: ícone em quadrado colorido, rótulo acima do título). | Remover o quadrado; o `h1` basta. Se o contexto for necessário, usar breadcrumb "Professor › Nova sessão". |
| P2 | :163 | "IDEIAS DE HOJE" a 12px/600 em caixa alta; os chips (:169) têm `py-1.5`, cerca de 32px. | "Ideias para começar" em sentença, 14px/700; chips com `min-h-11 py-2.5`. |
| P3 | :149 e :154 | A borda e o halo azuis aparecem quando há texto, não no foco. | Mover a lógica para `:focus-visible`/`:focus-within`. |
| P3 | :188–190 | O erro não é anunciado. | `role="alert"`. |

### 5.4 Professor: sessão ativa (`/professor/sessao`), App.tsx:216–266

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P1 | :210, :245 | A tela é projetada para a turma, mas o QR tem 192px e o código 30px. A 4–6 m (estimativa) o código fica ilegível. A tarefa principal do professor nessa tela é mostrar o código. | Botão "Mostrar para a turma" que abre a tela cheia com o código em `clamp(64px, 12vw, 160px)` 800 e o QR em `min(60vh, 480px)`. No desktop padrão, QR com 280px e código em `text-5xl`. |
| P2 | :235 | O título é `h2` e não há `h1` (FAIL). | `h1` "Sessão ativada". |
| P2 | :250–254 | Ícone "!" de alerta (1,58:1) para um dado neutro (o objetivo). | Sem ícone, ou o ícone de livro da :128 em marinho; texto "Objetivo da aula:". |
| P2 | :259 | O botão "Ver painel da turma" parece desabilitado (`--muted`). | `cartoon-btn` secundário (fundo branco). |
| P3 | — | Não há "Copiar link" para turmas sem câmera. | Botão "Copiar link" ao lado do código (`navigator.clipboard.writeText(joinUrl)`), com retorno "Link copiado". |
| P3 | :222–224 | Ponto verde de status (2,42:1) em cima do título. | Mesma correção de 5.3: rodapé sem ponto. |

### 5.5 Professor: painel (`/professor/painel`), App.tsx:919–1111

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P1 | :1104–1107 | "Nova sessão" chama `onBack`, que leva ao QR **da mesma sessão** (App.tsx:1201), e não cria sessão nova. O rótulo mente; o "← Voltar" faz a mesma coisa. | Levar a `teacher-activate` (`go("teacher-activate")`) ou renomear para "Mostrar código da turma". Em largura de desktop, `lg:w-auto lg:px-10 lg:self-start` (o `DESIGN.md` proíbe esticar botões). |
| P1 | :939–959 | O painel busca os dados **uma vez**, ao montar. Durante a aula o professor vê números parados e precisa recarregar a página. Não há marca de atualização. | Botão "Atualizar" no topo e "Atualizado às 10:42" ao lado. Opcionalmente, buscar a cada 20s enquanto a aba estiver visível (`document.visibilityState`). Na atualização, manter os valores antigos até os novos chegarem. |
| P2 | :1002–1006 | O erro não tem ação: "Não consegui carregar o painel agora." | "Tentar de novo" (botão de texto que refaz o fetch) e, quando houver, "Últimos dados às HH:MM". |
| P2 | :1025–1030 | A faixa "24 alunos no check-in" usa `justify-between` com um filho só. A 1440px sobra ~1000px vazios dentro de uma borda (visto em captura). | Levar o número para a linha do título: "24 alunos fizeram o check-in" em 16px, ao lado do código, e remover a caixa. |
| P2 | :989 | O chip do código quebra em "SOC-/4821" a 390px (captura) e tem 3,77:1. | `whitespace-nowrap shrink-0`; cor `--success-ink`. |
| P2 | :964–967, :1036 | O percentual não diz a base: "Autonomia 100%" para "trilhas diferentes usadas" pode ser 4 alunos ou 40. | Valor e base juntos: "22 de 24" com "92%" em 14px cinza; "4 de 4 trilhas". |
| P2 | :1053–1055 | O achado da sessão ("25% marcaram não entendi ainda") está numa legenda de 12px abaixo da sugestão. | Abrir o cartão com o achado em 16px/800 ("1 em cada 4 alunos ainda não entendeu") e a sugestão abaixo. |
| P2 | :1035, :1040, :1066, :1070 | Rótulos e legendas a 12px; a linha "7 · 32%" tem números proporcionais. | Legendas em `text-sm`; números com `tabular-nums text-right`. |
| P3 | :1036 | Quatro valores de 30px em quatro matizes, mais quatro matizes nas trilhas (8 cores numa tela). | Respeitando a regra "cor fixa por métrica": valor em marinho e a cor só na barra. Isso também resolve o lilás em 4,31:1. |
| P3 | :995 | O carregamento é uma linha de texto; o layout pula quando os dados chegam. | Esqueleto com os 4 cartões e barras cinza do tamanho final. |
| P3 | :1045 | Sugestão e trilhas terminam com 34px de diferença (`ragged-row`). | `lg:items-stretch` com o conteúdo no topo, ou empilhar. |

### 5.6 Aluno: entrada com código (`/aluno`), App.tsx:277–337

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P2 | :318–322 | O placeholder "SOC-1234" em 24px/800 cinza parece um código já preenchido (captura). O aluno pode achar que basta tocar em entrar. | Placeholder "Ex.: SOC-1234" em `placeholder:text-base placeholder:font-medium`, ou o prefixo "SOC-" fixo à esquerda e só 4 dígitos digitados. |
| P2 | :314 | Teclado de texto num código numérico; sem `autoComplete="off"` e sem `maxLength`. | Com prefixo fixo: `inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="one-time-code"`. Senão, `autoCorrect="off" spellCheck={false}`. |
| P2 | :324 | O erro não é anunciado nem ligado ao campo. | `role="alert"` e `aria-describedby` no `input`; borda `--danger` quando houver erro. |
| P3 | Desktop | 60% da tela vazia (`hero-void`). | Aceitável para um formulário de um campo. Se quiser preencher, pôr a logo/ilustração à direita a partir de `lg`. |

### 5.7 Aluno: check-in (`/aluno/checkin`), App.tsx:358–432

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P2 | :381 | As perguntas são o conteúdo principal e estão em 12px/800 cinza. | `text-base font-extrabold` em marinho. |
| P2 | :380–404 | A escolha única é feita com `aria-pressed`; o leitor de tela não entende que é um grupo exclusivo. | `role="radiogroup" aria-labelledby` no grupo e `role="radio" aria-checked` em cada chip, ou `<fieldset><legend>`. |
| P3 | :420 | O erro está acima do botão, sem `role="alert"`. | Adicionar `role="alert"`. |

### 5.8 Aluno: trilhas (`/aluno/trilhas`), App.tsx:434–533

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P1 | :271–274 | As descrições prometem atividades que o app não oferece: "Produzir um vídeo curto", "Pesquisar e comparar fontes", "Desenvolver solução em grupo". Todas as trilhas levam ao mesmo chat individual sobre f(4). | Descrever como o tutor vai conduzir: "Investigar: descobrir o padrão testando valores"; "Criar: inventar sua própria função"; "Resolver: ir direto ao cálculo, passo a passo"; "Colaborar: pensar em dupla com um colega". |
| P2 | :494–499 | Números de 1 a 4 nos cartões sugerem ordem ou ranking numa escolha livre ("o caminho, você escolhe"). É a *tell* de numeração. | Remover os números; a cor e a cena já identificam cada trilha. |
| P2 | :463–478 | A linha pontilhada do "mapa" fica escondida atrás dos cartões e aparece como traços soltos no celular. No desktop é um S grande no espaço vazio (captura). | Desenhar a rota **entre** os cartões (ou de cada cartão até o selo "Destino"), ou remover. No desktop, encurtar a área (`flex-1` → altura do conteúdo). |
| P2 | :500 | A cena (viewBox 120×90) aparece com faixas laterais creme dentro do cartão no celular (captura). | `preserveAspectRatio="xMidYMid slice"` nas cenas, ou a altura no celular em `aspect-[4/3]`. |
| P2 | :447 | "OBJETIVO DE HOJE" com 4,12:1. | Usar `var(--foreground)`. |
| P2 | :505 | Descrições a 12px. | `text-sm`. |
| P2 | :522–529 | "Bora lá!" é plano (não segue o sistema) e ocupa 1056px no desktop. | `<Button>` cartoon, `lg:w-auto lg:min-w-80 lg:self-center`. |

### 5.9 Aluno: Modo Foco (`/aluno/foco`), App.tsx:543–619

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P1 | :561, :573 | "Silencia as notificações" é falso: o app web não silencia nada, só conta o tempo (`setInterval`). | "Quer um cronômetro de foco enquanto resolve?" e "Mostra quanto tempo falta. Para silenciar o celular, ative o Não Perturbe." |
| P1 | :604 | "Baseado no tempo médio de desafios como esse." não tem dado por trás (já apontado em 05/10) e tem 2,9:1. | Remover a frase. "sugerido" pode ficar, ligado à resposta de tempo do check-in. |
| P1 | primitives.tsx:14 | O interruptor não tem nome acessível. | `aria-labelledby` apontando para o "Modo Foco" (`id`), ou `aria-label="Modo Foco"`. |
| P2 | :583 | Os chips de duração escondidos (`max-height:0`) continuam focáveis por Tab. | Renderizar só quando `enabled`, ou `inert={!enabled}`. |
| P2 | primitives.tsx:16 | O interruptor desligado é marinho escuro e o ligado é azul-claro (captura): o estado "off" parece mais ativo. | Desligado: trilho `#C9D4F2` com borda marinha de 2px. Ligado: `var(--primary)`. Botão de 24px com borda marinha. |
| P2 | :589, :593 | Chip ativo branco sobre `#6C8CFF` (3,07:1); "sugerido" 3,1:1. | Ativo em `var(--primary)` (4,78:1). |
| P3 | Desktop | O conteúdo fica centrado verticalmente com ~360px vazios no topo (captura). | `lg:items-start lg:pt-24`. |

### 5.10 Aluno: chat (`/aluno/chat`), App.tsx:626–797

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| P1 | :749–752 | "Encerrar conversa" ocupa a largura toda **acima** do campo, maior que o envio, e sai sem confirmação. É fácil tocar sem querer, e a conversa se perde. | Tirar do rodapé. Antes do nível 3: botão de texto "Sair do desafio" no cabeçalho, com confirmação ("Sair agora? Sua conversa não fica salva."). No nível 3: "Concluí o desafio!" como `cartoon-btn` dourado acima do campo. |
| P1 | :703–706 e :751 | Dois botões "Encerrar" com sentidos diferentes (parar o foco e sair da conversa) na mesma tela (captura). | O do foco vira "Parar foco". |
| P1 | :659–680 | Não há indicador de "tutor pensando". Com o Gemini real (até 10s), o aluno fica sem retorno. | Enquanto `sending`, mostrar um balão do tutor com "Pensando…" (três pontos, estáticos quando houver redução de movimento) e `aria-busy` na lista. |
| P1 | :719–745 | Novas mensagens não são anunciadas. | `role="log" aria-live="polite" aria-relevant="additions"` no contêiner das mensagens. |
| P1 | :754, :759 | O campo e o envio não têm nome acessível. | `aria-label="Sua resposta"` no `textarea`; `aria-label="Enviar resposta"` no botão, com `w-11 h-11`. |
| P1 | :701, :790 | O timer está em `#6C8CFF` sobre `ai-muted` (2,47:1). | Usar `--ai-ink`. |
| P2 | :672–676 | Na falha, o texto do aluno já foi apagado (:663); "Tente enviar de novo" obriga a redigitar (captura). | Restaurar `setInput(text)` no `catch` e mostrar o erro como linha discreta com "Tentar de novo" (não como fala do tutor). |
| P2 | :758 | O campo `#E9EEFB` sobre creme tem 1,09:1, sem borda: o limite do campo some. | `border: 2px solid var(--border-soft)` e, no foco, `var(--primary)`. |
| P2 | :691 | No celular, o enunciado ("Se f(x) = 2x + 3, quanto vale f(4)?") só aparece na primeira fala e some ao rolar. O cabeçalho mostra o objetivo longo a 12px. | No cabeçalho móvel, o enunciado em 14px/800 no lugar de "trilha — objetivo"; a trilha vira um chip. |
| P2 | :729 | No desktop o balão chega a ~810px (~110 caracteres por linha) a 14px. | `max-w-[78%] lg:max-w-[38rem]` e `text-[15px] lg:text-base`. |
| P2 | — | A tela não tem `h1` (FAIL). | `<h1 className="sr-only">Conversa com o tutor</h1>`, ou o enunciado como `h1` visível. |
| P3 | :709 | Avatar "A" sem significado (não é a inicial do aluno). | Remover, ou usar a mini cena da trilha. |
| P3 | :714 | A barra de nível começa em 33% antes de qualquer raciocínio. | `(level - 1) / 2 * 100`, ou três segmentos discretos como no aside. |
| P3 | :649 | O foco termina em silêncio quando chega a 0. | Mensagem do sistema: "Seu tempo de foco terminou. Pode continuar se quiser." |

### 5.11 Aluno: reflexão (`/aluno/reflexao`), App.tsx:809–885

| Sev. | Linha | Problema | Correção |
|---|---|---|---|
| **P0** | :821–825, :841 | **A reflexão não é enviada a lugar nenhum**, mas a tela diz "Sua resposta ajuda o professor a entender o que funcionou". Fere o princípio 4 do `PRODUCT.md` (dados honestos). Vinha apontado como crítico em 05/10. | Enviar `{feeling, helped}` para um endpoint (`/api/reflections`) e somar ao painel. Até lá, trocar a frase por "Isso fica só com você por enquanto." ou remover a tela do fluxo. |
| P2 | :801–806, :838 | Emoji (FAIL no lint e no inspector). Renderizam diferente no Android e no iOS e destoam do traço da marca. | Quatro rostos desenhados com o `CartoonFigure` (boca e sobrancelha variando) em 40px, no estilo de `scenes.tsx`; tirar o 🎉 do título. |
| P2 | :838 | "Boa! Você mandou bem" aparece mesmo para quem saiu no nível 1 e marcou "Desmotivado". | "Valeu por contar!" (neutro). |
| P2 | :824 | Depois de 1,6s o app volta sozinho para a tela inicial, sem fechamento. | Tela final "Pronto! Você pode guardar o celular." com o botão "Voltar ao início"; sem timer. |
| P2 | :846, :865 | Os cartões de sentimento e os chips não têm `aria-pressed`/`role="radio"`. Os chips têm 36px. | Sentimento: `role="radiogroup"` e `role="radio" aria-checked`. Ajudou: `aria-pressed`, `min-h-11`. |
| P3 | :847–851 | Borda de 2px com sombra difusa `0 1px 3px` (fora do sistema de adesivo). | `cartoon-card` com sombra de 3px, como os chips do check-in. |
| P3 | :837 | `h1` de 36px no desktop (régua de app: até 32px). | `lg:text-3xl`. |
| P3 | — | Única tela sem "Voltar": não há como reabrir o chat. | `BackLink` para o chat. |

### 5.12 Privacidade (`/privacidade`), App.tsx:889–914

Sem problemas de interface além dos globais (alvo do Voltar). O texto é claro e consistente com o que o app faz, com uma exceção: a privacidade diz que o professor vê "os totais da turma", e a reflexão diz que ajuda o professor, mas a reflexão não chega ao painel (ver 5.11). P3: o título dos cinco cartões em `h2` está correto.

## 6. Tells de interface feita por IA encontrados (régua `tells.md` e `app-screens.md` §14)

1. **Emoji como UI** (reflexão): banido, FAIL.
2. **Ícone em quadrado colorido** acima do título: livro (professor), lua (foco), check em quadrado verde (sessão) e balão no cartão de sugestão.
3. **Ponto de status decorativo com eyebrow** ("• Uso pedagógico ativo — Lei…", "• Sessão ativa — Lei…") e **rótulo acima do título** ("Painel do professor", "PAINEL DO PROFESSOR").
4. **Rótulos pequenos em caixa alta**: 11 ocorrências em 3 estilos.
5. **Numeração de índice** 1–4 nos cartões de trilha.
6. **Caixa "info" com ícone** e frase sem dado ("Baseado no tempo médio…").
7. **KPI grande na cor da marca** com barra de progresso em cada cartão (quatro cores).
8. **Texto com `text-shadow`** no slogan.
9. **Excesso de travessão** na copy (6).
10. **Bounce em todos os botões** (`cubic-bezier(.34,1.56,.64,1)`). Está documentado no `DESIGN.md`, então é decisão da marca, mas some quando o usuário pede menos movimento só depois da correção global.

O que **não** é tell e dá identidade própria: as cenas desenhadas por trilha, os balões do chat com canto reto do lado de quem fala e o QR em marinho. Esses são os "elementos que só este produto tem" que a régua de app screens pede.

## 7. Copy (PT-BR, tom para alunos)

- O tom é bom e acolhedor ("Três perguntas rápidas para a sua missão ficar do seu tamanho", "Me conta como você pensaria"). Mantenha.
- **Promessas que o produto não cumpre** são o maior problema de copy: trilhas (vídeo, fontes, grupo), "silencia notificações", "tempo médio", "ajuda o professor" (reflexão) e "Nova sessão". Corrigir isso vale mais que qualquer ajuste visual diante da banca.
- Registro: "pra" (:186, :454) e "Bora lá!" combinam com alunos. No lado do professor, "Ativar sessão pra turma" pode virar "Ativar sessão para a turma" (público adulto).
- "Encerrar" duplicado; "Entrar no app" ambíguo; "Nova sessão" errado (ver acima).

## 8. Desktop contra celular

- **Celular (390px):** é a melhor forma do app. As colunas se resolvem e os cartões de adesivo funcionam. Os problemas são de alvo de toque, de texto a 12px e o chip do código quebrando no painel.
- **Desktop (1440px):** melhorou desde 05/10 (aside no chat, duas colunas em foco e reflexão, quatro trilhas em linha, painel limitado a `max-w-6xl`). Ainda há botões principais esticados (trilhas 1056px, painel 1072px, chat 1024px), vazios grandes (entrada 60%, chat 53%, foco 33%, check-in 33%), uma ilustração pequena e solta na reflexão e uma medida longa no chat.

## 9. Nota Nielsen: 23/40 (antes 19/40)

| # | Heurística | Nota (0–4) | Justificativa |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Há "Criando sessão…", "Entrando…", "Salvando…", nível 1/3 e timer. Faltam o indicador de tutor pensando, a atualização do painel e a marca de horário; o carregamento é só texto. |
| 2 | Correspondência com o mundo real | 2 | A voz em PT-BR é natural, mas várias promessas não correspondem ao sistema: trilhas, "silencia notificações", objetivo livre com exercício fixo, "Nova sessão". |
| 3 | Controle e liberdade | **3** (antes 1) | Rotas, voltar em quase todas as telas, voltar do navegador, recuperação ao recarregar e apagar com confirmação. Perde ponto por "Encerrar conversa" sem confirmação e pelo redirecionamento automático da reflexão. |
| 4 | Consistência e padrões | **2** (antes 1) | O `DESIGN.md` agora bate com o código. Seguem dois sistemas de botão, dois "Encerrar", três "Voltar", três estilos de rótulo e o secundário com cara de desabilitado. |
| 5 | Prevenção de erros | 2 | Botões ficam desabilitados até a entrada ser válida, e apagar pede confirmação. O fim do chat não pede, o campo de código aceita qualquer formato, e a falha do tutor apaga o texto. |
| 6 | Reconhecer em vez de lembrar | 3 | O objetivo aparece nas trilhas e o enunciado no aside do desktop. No celular, o enunciado some ao rolar o chat. |
| 7 | Flexibilidade e eficiência | 2 | O QR preenche o código e há ideias prontas e Enter para enviar. Faltam modo de projeção, copiar link e atualizar o painel. |
| 8 | Estética e design minimalista | **3** (igual) | A identidade cartoon é coerente e própria. Perde por vazios no desktop, pela faixa de um número no painel, por 8 matizes no painel e pelos tells da seção 6. |
| 9 | Reconhecer, diagnosticar e recuperar erros | 2 | As mensagens são claras e distinguem 404 e 429 na entrada. Falta "Tentar de novo" no painel; o erro do chat perde o texto; nenhum erro é anunciado. |
| 10 | Ajuda e documentação | **2** (antes 1) | Há página de privacidade, dicas nos campos e legendas das métricas. Não se explica o que é cada trilha de fato nem o que significa "nível de raciocínio". |

**Total: 23/40.** O ganho de 4 pontos vem de controle e liberdade (+2), consistência (+1) e ajuda (+1), que acompanham as Stories 3.6 e 3.7. O teto atual é a **honestidade da interface** (heurística 2) e a **acessibilidade** (foco, nomes, regiões vivas, `lang`), que pesam nas heurísticas 1, 4 e 9.

## 10. As 10 melhorias de maior impacto

1. **Gravar a reflexão ou parar de dizer que ela ajuda o professor** (P0, App.tsx:821/:841).
2. **Alinhar a copy ao que o app faz**: descrições das trilhas (:271–274), Modo Foco como cronômetro (:561, :573), remover "tempo médio" (:604) e mostrar o piloto de Matemática no objetivo do professor (:144, :165) (P1).
3. **Corrigir "Nova sessão"** no painel, que hoje volta ao QR da mesma sessão (:1104) (P1).
4. **Foco visível e `lang="pt-BR"`**: uma regra `:focus-visible` global e `language` em `site.json` (P1).
5. **Nomes acessíveis e regiões vivas**: envio, campo do chat, interruptor, campo de objetivo e `role="log" aria-live="polite"` no chat (P1).
6. **Rodapé do chat**: tirar "Encerrar conversa" de cima do campo, confirmar a saída, renomear o "Encerrar" do foco e mostrar "Pensando…" durante o envio (P1).
7. **Painel ao vivo**: "Atualizar" com marca de horário (ou busca a cada 20s), "Tentar de novo" no erro, o achado em destaque e o número de alunos na linha do título no lugar da faixa vazia (P1/P2).
8. **Modo de projeção da sessão**: código em 64–160px e QR grande em tela cheia, mais "Copiar link" (P1).
9. **Um único componente de botão** cartoon com estados distintos (ativo, secundário, desabilitado), sem esticar no desktop (P2).
10. **Contraste e escala**: token `--ai-ink` para texto na cor da IA, `--success-ink` no código, "OBJETIVO DE HOJE" em marinho, conteúdo em 14–16px no lugar de 12px e alvos de 44px (`BackLink`, envio, links de texto, chips) (P1/P2).

## 11. Arquivos de trabalho

- Lint: `C:\Users\andre\AppData\Local\Temp\claude\c--Users-andre-OneDrive-Documentos-Educa--o-Mobile-com-IA\3fd1d9e9-21d1-4a1e-8650-7281bcd35c9a\scratchpad\taste\lint.txt`
- Inspector (relatórios e capturas): `C:\Users\andre\AppData\Local\Temp\claude\c--Users-andre-OneDrive-Documentos-Educa--o-Mobile-com-IA\3fd1d9e9-21d1-4a1e-8650-7281bcd35c9a\scratchpad\taste\inspect\` e `...\scratchpad\taste\inspect-<tela>.txt`
- Estados interativos e medição de alvos: `C:\Users\andre\AppData\Local\Temp\claude\c--Users-andre-OneDrive-Documentos-Educa--o-Mobile-com-IA\3fd1d9e9-21d1-4a1e-8650-7281bcd35c9a\scratchpad\taste\states\` (`audit.json` e 34 capturas)
- Config de auditoria com API simulada: `C:\Users\andre\AppData\Local\Temp\claude\c--Users-andre-OneDrive-Documentos-Educa--o-Mobile-com-IA\3fd1d9e9-21d1-4a1e-8650-7281bcd35c9a\scratchpad\taste\vite.mock.config.mts`
- Script de navegação: `C:\Users\andre\AppData\Local\Temp\claude\c--Users-andre-OneDrive-Documentos-Educa--o-Mobile-com-IA\3fd1d9e9-21d1-4a1e-8650-7281bcd35c9a\scratchpad\taste\drive.mjs`
