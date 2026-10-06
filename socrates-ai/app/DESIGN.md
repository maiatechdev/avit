---
name: Socrates AI
description: Trilhas de aprendizagem guiadas por IA socrática, com identidade cartoon, para salas de aula brasileiras
colors:
  fundo-creme: "#FBF7EE"
  marinho-tinta: "#142463"
  azul-royal: "#2F6BE8"
  dourado-sol: "#F5B82E"
  azul-ia: "#6C8CFF"
  card-branco: "#FFFFFF"
  creme-secundario: "#FFF1C7"
  marrom-secundario: "#5C4300"
  cinza-azulado: "#E9EEFB"
  texto-suave: "#4A5A8A"
  borda-suave: "#C9D4F2"
  trilha-investigar: "#F5B82E"
  trilha-criar: "#FF7A59"
  trilha-resolver: "#2FB67C"
  trilha-colaborar: "#8E6CFF"
  verde-confirmacao: "#1F8F5F"
  verde-tint: "#E9FAF2"
  ocre-metrica: "#A16A00"
  lilas-metrica: "#8A5CF0"
  vermelho-erro: "#B42318"
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
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Nunito, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.04em"
rounded:
  card: "22px"
  control: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.azul-royal}"
    textColor: "{colors.card-branco}"
    rounded: "{rounded.card}"
    padding: "16px 24px"
  card:
    backgroundColor: "{colors.card-branco}"
    rounded: "{rounded.card}"
  chip:
    backgroundColor: "{colors.card-branco}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
---

# Socrates AI — Sistema de design

## Visão geral

A identidade parte do desenho da logo: traço marinho grosso, cantos arredondados, cores de papel (creme, azul royal, dourado) e um "adesivo" com sombra sólida. O público são estudantes do ensino médio, então a interface é lúdica, mas sem infantilizar o conteúdo.

A ideia central é "mesmo destino, caminhos diferentes": todos os alunos chegam ao objetivo do professor, e cada um escolhe a trilha. As cores das trilhas expressam essa escolha.

Este documento descreve o que está no código. Os tokens vêm de `src/index.css`. O sistema anterior, terracota e plano, foi descartado e não deve voltar.

## Cores

### Primárias
- **Marinho tinta** (`#142463`): traço de contorno, texto principal e sombra de adesivo.
- **Azul royal** (`#2F6BE8`): ação principal, botões e progresso.
- **Dourado sol** (`#F5B82E`): destaque, numeração de trilhas e o ponto de controle do mapa.

### Secundárias
- **Azul IA** (`#6C8CFF`): o tutor. Usado no modo foco, no ícone da IA e na sugestão do painel.
- **Creme** (`#FBF7EE`): fundo da aplicação.
- **Creme secundário** (`#FFF1C7`, texto `#5C4300`): cartões de sugestão e chamadas.

### Trilhas
Cada trilha tem uma cor própria, usada na borda ativa e no fundo claro: Investigar dourado, Criar coral (`#FF7A59`), Resolver verde (`#2FB67C`), Colaborar violeta (`#8E6CFF`).

### Painel
Cada métrica tem cor fixa: engajamento azul royal, autonomia ocre (`#A16A00`), competência lilás (`#8A5CF0`) e vínculo verde (`#1F8F5F`).

### Estados
- Confirmação: verde `#1F8F5F` sobre `#E9FAF2`.
- Erro: vermelho `#B42318`. Nunca depende só da cor: sempre há texto.

### Regras de cor
- O marinho é a única cor de contorno. Não usar cinza ou borda colorida nos cartões.
- Texto de apoio usa `#4A5A8A` sobre fundo claro, com contraste suficiente para leitura.

## Tipografia

- **Nunito** (800 e 700) para títulos e rótulos de destaque. É a voz do adesivo.
- **Outfit** (400 a 600) para o texto corrido e as mensagens do chat.
- Corpo em 16px. Rótulos em caixa alta, 12px, peso 800, com espaçamento de 0,04em.

## Formas e profundidade

- Cartões e botões: contorno de 3px marinho, raio de 22px, sombra sólida de 5px (`0 5px 0 #142463`). Essa sombra é o "adesivo".
- Botão pressionado: a sombra cai para 2px, dando a sensação de apertar.
- Controles de texto: raio de 16px, contorno suave (`#C9D4F2`).
- Chips e seleções: formato de pílula.

## Layout

- **Aluno:** coluna de até 3xl no celular. No desktop, cada tela tem layout próprio (duas colunas no foco e na reflexão, painel lateral no chat), sem apenas centralizar a coluna do celular.
- **Professor:** área própria, com largura máxima de 6xl no painel e no mapa da turma, para os cartões não esticarem no desktop.
- Não há barra de navegação fixa. Cada tela tem "← Voltar" no topo, e o navegador também volta e avança pelas rotas `/professor/*` e `/aluno/*`.
- Margem lateral de 20px no celular e de 40 a 64px no desktop.

## Componentes

### Botões
Botão principal: largura total no celular, azul royal, texto branco, raio de 22px e sombra de adesivo. Botão secundário: fundo branco com o mesmo contorno. Botão desabilitado: fundo `#E9EEFB` e texto suave, sem sombra.

### Chips
Pílulas com contorno marinho. Ativo: fundo azul royal e texto branco, sem sombra. Inativo: fundo branco com sombra de 3px.

### Cartões
Fundo branco, contorno marinho de 3px, raio de 22px e sombra de adesivo.

### Campos
Fundo `#E9EEFB`, texto marinho, raio de 16px. Sem contorno até o foco.

### Navegação
Sem barra inferior. Links de voltar no topo de cada tela, em texto suave.

### Balões do chat (componente de assinatura)
- Tutor: cartão branco, cantos superior esquerdo quase retos (6px) e os demais em 22px. Ícone de ponto de interrogação em marinho.
- Aluno: fundo azul royal, texto branco, cantos superior direito quase retos (6px).

### Ilustrações de trilha (componente de assinatura)
Cada trilha tem uma cena desenhada no mesmo traço da logo. No celular a cena fica com 84px de altura; no desktop, 170px.

## Movimento

- Toque em chips e cartões: escala de 0,95 em 150ms, com curva elástica (`tap-scale`).
- Botão principal: escala de 0,94 em 180ms ao tocar (`btn-bounce`).
- Botão de adesivo (`cartoon-btn`): desce 3px e a sombra encolhe ao tocar.
- Entrada de tela: fade e subida de 12px em 280ms (`screen-enter`).
- Confete só na reflexão enviada.

## Regras

### Fazer
- Usar o marinho como contorno e sombra de adesivo em todo cartão e botão.
- Mostrar uma cor por trilha e uma por métrica, sempre as mesmas.
- Limitar a largura dos conteúdos no desktop.
- Deixar o aluno e o professor em áreas separadas, cada uma com seu layout.

### Não fazer
- Voltar a usar terracota ou a estética plana do sistema antigo.
- Usar sombras difusas no lugar da sombra sólida.
- Esticar cartões ou botões para ocupar a largura total do desktop.
- Pôr a barra de navegação sobre o conteúdo.
- Usar cor como única forma de indicar erro ou estado.
