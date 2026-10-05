---
name: AVIT
description: Trilhas de aprendizagem guiadas por IA socrática para salas de aula brasileiras
colors:
  paper-cream: "#FDFAF5"
  ink-brown: "#2A1F10"
  card-white: "#FFFFFF"
  terracota-argila: "#D96B38"
  mint-suave: "#EEF6F4"
  verde-agua-profundo: "#2A6B62"
  areia-quente: "#F2EBE0"
  marrom-areia: "#8A7460"
  verde-agua-sereno: "#3EA89A"
  indigo-pensativo: "#656CC7"
  indigo-pensativo-tint: "rgba(101, 108, 199, 0.12)"
  areia-borda: "#E8DDD0"
  ambar-curiosidade: "#F59E0B"
  violeta-parceria: "#8B5CF6"
  lilas-competencia: "#A07CC5"
  verde-vinculo: "#4BAA6E"
  verde-confirmacao: "#3D9A5C"
  verde-confirmacao-tint: "#EEF8F0"
typography:
  display:
    fontFamily: "Nunito, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.2
  title:
    fontFamily: "Nunito, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.02em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.terracota-argila}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-primary-disabled:
    backgroundColor: "{colors.areia-quente}"
    textColor: "{colors.marrom-areia}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  chip-selected:
    backgroundColor: "{colors.indigo-pensativo}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  chip-unselected:
    backgroundColor: "{colors.areia-quente}"
    textColor: "{colors.ink-brown}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  card-surface:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: AVIT

## Overview

**Creative North Star: "A Trilha de Aprendizagem"**

Todo aluno caminha até o mesmo destino — o objetivo que o professor definiu — mas cada um escolhe sua própria trilha para chegar lá. Essa ideia de "mesmo destino, caminhos diferentes" não é só um conceito de produto: ela é o princípio que organiza o sistema visual inteiro. Cada trilha (Investigar, Criar, Resolver, Colaborar) tem sua própria cor e sua própria ilustração, mas todas vivem dentro da mesma paleta terrosa e quente, no mesmo grid de cantos arredondados, com a mesma tipografia — variação dentro de uma identidade única, nunca fragmentação.

A superfície é calorosa e tátil, pensada para adolescentes em sala de aula: fundo em creme de papel, acentos em terracota e verde-água, ilustrações planas e geométricas sem rosto nem expressão (o "Spark" — uma faísca de 4 pontas — representa a IA sem antropomorfizá-la). O movimento é propositalmente brincalhão: botões e chips reagem ao toque com uma leve "mordida" elástica, reforçando que isso é um ambiente de aprendizagem ativa, não um painel administrativo frio.

Uma única cor — o índigo "Pensativo" — está reservada exclusivamente para tudo que vem da IA (avatar do chat, modo foco, insight do painel). Ela nunca aparece em navegação, botões de ação do produto ou branding; é um código de cor que o aluno aprende a reconhecer: *quando aparece índigo, é a IA falando*.

**Key Characteristics:**
- Paleta terrosa e quente (creme, terracota, areia) com dois acentos de "ação" (terracota) e "reflexão/sucesso" (verde-água) claramente distintos.
- Uma cor reservada exclusivamente para presença da IA (índigo), nunca reutilizada para outra função.
- Cada uma das 4 trilhas de aprendizagem tem identidade cromática própria, mas dentro da mesma família tonal pastel.
- Geometria arredondada e suave em todos os níveis — do raio dos cartões ao formato das bolhas de chat.
- Motion tátil e brincalhão: toques respondem com uma leve saliência elástica, não com feedback neutro/corporativo.

## Colors

A paleta é terrosa e quente na base (papel, terracota, areia), com dois acentos frios (verde-água e índigo) usados para marcar significado, não decoração.

### Primary
- **Terracota Argila** (#D96B38): cor de ação do produto — todo botão primário, CTA de "avançar", indicadores de sessão ativa do professor. É a cor que diz "toque aqui para seguir em frente".

### Secondary
- **Verde-Água Sereno** (#3EA89A): acento de reflexão e conclusão — barra de progresso de raciocínio, trilha "Resolver", botão de "concluí o desafio". Também aparece diluído como fundo (#EEF6F4, "Menta Suave") para caixas informativas calmas (ex.: card de objetivo ativo).

### Tertiary (acentos por trilha e por métrica)
- **Índigo Pensativo** (#656CC7): reservado exclusivamente para a presença da IA — avatar do chat, badge "Modo Foco", card de insight do painel. Nunca usado fora desse contexto.
- **Âmbar Curiosidade** (#F59E0B): identidade da trilha "Investigar".
- **Violeta Parceria** (#8B5CF6): identidade da trilha "Colaborar".
- **Lilás Competência** (#A07CC5): usado só na métrica "Competência" do painel do professor.
- **Verde Vínculo** (#4BAA6E): usado só na métrica "Vínculo" do painel do professor.

### Neutral
- **Creme Papel** (#FDFAF5): fundo de toda a aplicação — nunca branco puro.
- **Branco Cartão** (#FFFFFF): fundo de cartões, inputs e superfícies elevadas sobre o creme.
- **Marrom Tinta** (#2A1F10): cor de texto principal — um marrom quase preto, nunca preto puro.
- **Areia Quente** (#F2EBE0): fundo de blocos secundários (chips não selecionados, banners informativos, trilha de barras de progresso).
- **Marrom Areia** (#8A7460): texto secundário/legendas — nunca cinza puro; mantém a temperatura quente mesmo em texto de apoio.
- **Areia Borda** (#E8DDD0): toda borda de 1–1.5px do sistema.

### Named Rules
**A Regra da Cor Única da IA.** Índigo Pensativo (#656CC7) só pode representar a IA. Se um elemento não é gerado ou mediado pela IA, ele não pode usar essa cor — nem para decoração, nem "porque combinou".

**A Regra do Verde Duplicado (pendência a resolver).** Hoje existem dois verdes de "sucesso" quase idênticos e não relacionados por token: Verde Vínculo (#4BAA6E, métrica do painel) e Verde Confirmação (#3D9A5C, usado no ponto de "sessão ativa" e no selo "sessão encerrada"). Até serem unificados, trate-os como papéis diferentes (métrica vs. status do sistema) e não introduza um terceiro verde.

## Typography

**Display/Headline Font:** Nunito (com fallback sans-serif)
**Body/UI Font:** Outfit (com fallback sans-serif)

**Character:** Nunito é redonda, cheia e amigável — carrega a personalidade do produto nos títulos. Outfit é mais neutra e legível — carrega o texto de trabalho (corpo, botões, campos) sem competir com os títulos.

### Hierarchy
- **Display** (Nunito, peso 800, 22–26px, line-height ~1.2): títulos de tela ("O que a turma vai explorar hoje?", "Mesmo destino pra todo mundo."). Aparece uma vez por tela, no topo.
- **Title** (Nunito, peso 700, 18–20px, line-height ~1.3): títulos de seção dentro de uma tela (ex.: "Sessão ativada!", cabeçalhos do painel).
- **Body** (Outfit, peso 400–500, 14–16px, line-height ~1.5–1.6): parágrafos, mensagens de chat, descrições de trilha.
- **Label** (Outfit, peso 600, 12px, letter-spacing leve): rótulos curtos e em maiúsculas escritas no próprio texto — "IDEIAS DE HOJE", "OBJETIVO DE HOJE", "PAINEL DO PROFESSOR" — sempre em `--muted-foreground` ou na cor do papel/acento correspondente.

### Named Rules
**A Regra do Rótulo Falado.** Textos de rótulo (categoria/seção) são escritos em maiúsculas diretamente na string em português, não via `text-transform`. Ao adicionar rótulos novos, siga esse padrão — não introduza `uppercase` via CSS nesse nível, para manter a acentuação e a leitura em PT-BR previsíveis.

## Layout

A aplicação é uma casca única de largura fixa (max-width: 430px), centralizada na tela, com altura mínima de 100svh — simula um smartphone mesmo quando visualizada num navegador maior; não há grid responsivo além disso (é uma superfície mobile-only, não adaptável a desktop). O conteúdo interno usa padding horizontal de 20–24px (`px-5`/`px-6`) e ritmo vertical por `gap`/`mb` em múltiplos de 4px, seguindo a escala do Tailwind.

Grids 2×2 aparecem em dois lugares com o mesmo padrão: as quatro trilhas de aprendizagem e as quatro métricas do painel do professor — sempre `grid-cols-2` com `gap-3` (12px).

Toda tela reserva `pb-24` (96px) na parte inferior para não ser coberta pela barra de navegação flutuante fixa. Telas entram com uma transição sutil de fade + slide-up (0.28s).

## Elevation & Depth

O sistema é majoritariamente plano: a maior parte da profundidade vem de camadas de cor (cartão branco sobre fundo creme, blocos em areia quente sobre branco), não de sombra. Sombra é usada com moderação, sempre suave e de baixo contraste, reservada a dois papéis: um leve "descolamento" em cartões sobre o fundo (não sobre fundos já tonais) e uma elevação real nos dois elementos verdadeiramente flutuantes da interface — a casca do app inteiro e a barra de navegação inferior.

### Shadow Vocabulary
- **Ambiente-cartão** (`box-shadow: 0 1px 3-5px rgba(0,0,0,0.05-0.09)`): usada em cartões brancos sobre o fundo creme (cartões de métrica, cartão do QR code, bolhas de chat da IA).
- **Flutuante** (`box-shadow: 0 4px 24px rgba(0,0,0,0.18)`): reservada à barra de navegação inferior, o único elemento que "flutua" sobre o conteúdo.
- **Casca do app** (`box-shadow: 0 0 60px rgba(0,0,0,0.08)`): moldura ambiente ao redor de toda a aplicação, simulando o aparelho.

### Named Rules
**A Regra do Cartão sem Sombra.** Um bloco colorido sobre um fundo já tonal (ex.: card branco dentro de um bloco `--muted`) não recebe sombra — a mudança de cor já comunica a camada; sombra ali seria redundante.

## Shapes

Geometria arredondada e suave em toda a interface, com uma escala de raio clara: `12px` (elementos pequenos), `16px` (padrão — botões, cartões, inputs, `--radius` do tema), `24px` (badges de ícone grandes, cartão do QR code, banners) e `9999px`/pill (chips, toggle, avatares, barra de navegação).

Bolhas de mensagem do chat quebram esse padrão de propósito: usam raio assimétrico (`4px` no canto "de origem", `18px` nos demais) para imitar uma seta de balão de fala sem desenhar uma seta de verdade — mensagens da IA têm o canto reto embaixo à esquerda, mensagens do aluno embaixo à direita.

### Named Rules
**A Regra do Canto Cortado.** Qualquer bolha de conversa (chat, tooltip conversacional) usa o raio assimétrico 4px/18px apontando para quem "enviou" a mensagem, em vez de uma seta literal.

## Components

### Buttons
- **Shape:** `rounded-2xl` (16px) em todos os botões de largura cheia; ícones circulares usam `rounded-full`.
- **Primary:** fundo Terracota Argila, texto branco, `py-4` (16px vertical), peso de fonte bold/extrabold. É sempre full-width nas telas em que aparece.
- **Disabled:** fundo Areia Quente, texto Marrom Areia — nunca opacidade reduzida sobre a cor ativa; é uma troca de cor completa.
- **Hover/Active (`.btn-bounce`):** ao toque, escala para 0.94 com easing elástico (`cubic-bezier(0.34, 1.56, 0.64, 1)`) — a "mordida" tátil característica do sistema.
- **Secondary/Ghost (`.tap-scale`):** mesma família de easing, escala mais sutil (0.95), usada em botões e chips secundários (sugestões de objetivo, envio de chat).

### Chips
- **Style:** `rounded-full`, padding ~10px×16px, peso de fonte 500–600.
- **State:** não selecionado = fundo Areia Quente / texto Marrom Tinta; selecionado = fundo Índigo Pensativo ou Verde-Água Sereno (conforme o contexto — duração de foco usa índigo por ser uma configuração ligada ao "Modo Foco"; sentimentos de reflexão usam terracota) / texto branco.

### Cards / Containers
- **Corner Style:** `16px` (padrão) a `24px` (cartões de destaque, ex.: QR code).
- **Background:** branco sobre fundo creme; areia quente quando o cartão é ele mesmo um "bloco de agrupamento" (não um item individual).
- **Shadow Strategy:** ver Elevation & Depth — sombra só sobre fundo creme, nunca sobre fundo já tonal.
- **Border:** 1.5px em Areia Borda quando o cartão precisa de contorno em vez de sombra (ex.: cartão de sessão ativada).
- **Internal Padding:** 16–20px.

### Inputs / Fields
- **Style:** fundo branco (ou areia quente para textarea de chat), borda 1.5px em Areia Borda, raio 16px.
- **Focus:** a borda muda para Terracota Argila e ganha um halo suave (`box-shadow: 0 0 0 3px rgba(217,107,56,0.1)`) — nunca apenas um outline do navegador.

### Navigation
- **Estilo:** pill flutuante escura (`rgba(42,31,16,0.92)` com `backdrop-filter: blur(12px)`), fixa na base da tela, com item ativo preenchido em Terracota Argila e itens inativos em branco 50% de opacidade.
- **Atenção:** no código atual essa barra lista as 7 telas do protótipo (Ativar, Caminhos, Foco, IA Chat, Reflexão, Painel) como abas clicáveis — isso é um **navegador de protótipo para demonstração**, não a navegação real do produto. Nem professor nem aluno veriam, no produto final, uma aba que pula direto de "Ativar" para "Painel"; cada papel (professor/aluno) segue seu próprio fluxo linear. Não estenda esse componente como se fosse IA de produto.

### Chat Bubbles (componente de assinatura)
Bolha da IA: fundo Branco Cartão, texto Marrom Tinta, avatar circular em Índigo Pensativo com o ícone "Spark" (faísca geométrica de 4 pontas, sem rosto) à esquerda. Bolha do aluno: fundo Terracota Argila, texto branco, alinhada à direita, sem avatar. Ambas usam o raio assimétrico da Regra do Canto Cortado.

### Ilustrações de Trilha (componente de assinatura)
Cada trilha (Investigar/Criar/Resolver/Colaborar) e a tela de reflexão têm uma ilustração SVG plana e geométrica própria: fundo em elipse pastel na cor da trilha, silhuetas de pessoas sem rosto, e um objeto simbólico (lupa, câmera, lâmpada, documento compartilhado). Nunca usa fotografia ou ilustração 3D/realista — o vocabulário visual é sempre plano e simbólico.

## Do's and Don'ts

### Do:
- **Do** reservar Índigo Pensativo (#656CC7) exclusivamente para elementos gerados ou mediados pela IA.
- **Do** manter o motion tátil e brincalhão (`btn-bounce`/`tap-scale` com easing elástico) como personalidade proposital do sistema — é uma escolha confirmada para o público infanto-juvenil, não algo a "corrigir" por padrão.
- **Do** usar o raio assimétrico 4px/18px em qualquer bolha de conversa nova.
- **Do** dar a cada nova "trilha" ou categoria sua própria cor de acento dentro da mesma família tonal pastel, nunca uma cor fora da paleta.
- **Do** escrever rótulos em maiúsculas diretamente no texto em português, não via `text-transform: uppercase`.

### Don't:
- **Don't** usar Índigo Pensativo fora do contexto de IA — nem em navegação, nem em branding, nem "porque combina".
- **Don't** introduzir um terceiro verde de "sucesso"; unifique Verde Vínculo e Verde Confirmação antes de adicionar qualquer novo tom de verde.
- **Don't** adicionar sombra a um bloco colorido que já está sobre um fundo tonal (ex.: cartão branco dentro de um bloco `--muted`) — a camada de cor já comunica a elevação.
- **Don't** animar `max-height` ou `width` para efeitos de revelação/progresso (usado hoje na revelação da duração do Modo Foco e implicitamente na barra de progresso) — prefira `transform`/`opacity` ou `grid-template-rows`, que evitam layout thrash. Isso foi confirmado pelo detector mecânico do Impeccable como pendência técnica do build atual.
- **Don't** confundir a barra de navegação inferior (hoje um navegador de telas do protótipo) com a navegação real do produto ao construir novas telas.
