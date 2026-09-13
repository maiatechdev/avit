# AVIT 🔆

> Transformando o celular de distração em ferramenta de aprendizagem — dentro da janela que a lei já permite.

Projeto do time **Sprint** para o **HACKTUDO 2026** (11–19 de setembro de 2026), festival de cultura digital 100% online.

---

## 🎯 O desafio

> Desenvolver soluções inovadoras que permitam a utilização consciente dos smartphones nas escolas, integrando tecnologia, metodologias educacionais e estratégias de promoção da saúde mental.

As propostas devem demonstrar como o celular pode deixar de ser um elemento de distração para se tornar uma ferramenta efetiva de aprendizagem, colaboração, criatividade e bem-estar.

## 🧭 Contexto

Desde janeiro de 2025, a **Lei 15.100/2025** restringe o uso de celulares pessoais na educação básica brasileira, liberando exceção apenas para **uso pedagógico mediado pelo professor**. Um ano depois, pesquisas mostram adesão alta (92% das escolas já implementam) e ganhos reais de concentração e participação — mas a própria janela pedagógica que a lei abre ainda não tem ferramenta nenhuma desenhada especificamente pra ela.

## 🔬 Causa raiz

Não é falta de regra, nem falta de mediação institucional. É que **nenhuma solução hoje dá ao aluno um motivo que seja dele** para usar a tecnologia com consciência. Tudo que existe fala a língua do controle — proibir, bloquear, vigiar — quando o que muda comportamento de adolescente de verdade é **autonomia, competência percebida e senso de pertencimento** (Teoria da Autodeterminação, Deci & Ryan).

## 💡 A solução

Uma plataforma que ajuda o professor a transformar um momento da aula em uma experiência de aprendizagem mais autônoma, desafiadora e colaborativa, usando o próprio smartphone como ferramenta — dentro da janela que a Lei 15.100 já autoriza.

**Como funciona:**

1. O **professor** define o objetivo da aula e ativa a sessão para a turma
2. O **aluno** escolhe como quer chegar lá — Investigar, Criar, Resolver ou Colaborar
3. Um **mentor de IA socrático** guia o raciocínio do aluno sem nunca entregar a resposta pronta
4. Um **Modo Foco opcional** silencia notificações por tempo limitado, sempre por escolha do próprio aluno
5. O aluno **reflete** sobre a experiência ao final
6. O **professor** recebe um painel com indicadores de engajamento, autonomia, competência e vínculo — não só nota

### O que a solução não é

❌ Bloqueador de celular · ❌ App de monitoramento/vigilância · ❌ Mais uma plataforma de conteúdo genérica · ❌ Gamificação vazia

### Diferencial

Ao contrário de tutores de IA genéricos (ex: Khanmigo), esta solução só existe **dentro do minuto exato que a lei já autoriza**: o professor ativa, é sobre o que ele está ensinando naquele momento, e não depende de uma biblioteca de conteúdo pronta nem guarda histórico pessoal por padrão.

## 🛠️ Stack técnica

- **Frontend / protótipo de telas**: Figma Make (mockup navegável mobile-first)
- **IA conversacional**: API de LLM (Google Gemini / Groq — free tier, sem necessidade de cartão de crédito) com engenharia de prompt baseada em método socrático
- **Persistência**: nenhuma por padrão no MVP (sessão efêmera, sem histórico pessoal salvo)

## ⚖️ Conformidade e privacidade

Pensado desde o início para caber nas exigências brasileiras de proteção de dados de menores (LGPD art. 14, ECA Digital — Lei 15.211/2025): sem conta persistente nem coleta de dado pessoal por padrão no MVP; vínculo de conta com responsável fica como evolução futura, não bloqueio para o hackathon.

## 👥 Time Sprint

Projeto desenvolvido para o HACKTUDO 2026.

## 📄 Licença

Este projeto foi desenvolvido para fins de competição no HACKTUDO 2026.
