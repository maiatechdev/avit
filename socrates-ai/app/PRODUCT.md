# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brazilian public-school teachers and their K-12 students, using personal or shared smartphones inside the classroom during a live lesson. The current MVP demo is presented to the instructors of an AI course (the "banca"), not to real students.

## Product Purpose

Socrates AI turns a teacher's learning objective into a short, AI-guided classroom activity. The teacher states what the class should understand; each student works toward that same objective through an AI tutor conversation, then reflects, while the teacher gets a post-session view of how the class engaged. Success means students reason more deeply about the objective (not just retrieve an answer) and teachers get a legible signal of engagement, autonomy, competence, and relatedness across the class.

## Positioning

Two mechanisms a competitor could not casually copy:

- **Socratic AI tutor, not an answer engine.** The AI never states the answer — it responds to the student's reasoning with a further question that pushes them one step deeper (visible in the chat's "Nível de raciocínio" progression). After three hints without success, it explains step by step and proposes a similar exercise.
- **Student-chosen path to a shared destination.** Every student in the class works toward the same teacher-set objective, but each picks their own route in — Investigar, Criar, Resolver, or Colaborar — so autonomy is structural, not a settings toggle.

Teacher analytics (Engajamento / Autonomia / Competência / Vínculo) exist to make the effect of those two mechanisms visible to the teacher, not as a differentiator on their own.

## Operating Context

- Brazil's Lei 15.100/2025 restricts personal phone use in schools; Socrates AI's sessions are explicitly framed in-product as sanctioned "active pedagogical use" under that law (persistent status banner). This is real operating context and rationale for the product's existence, but the user has confirmed it is not itself a core mechanism to protect in redesigns — treat it as a fact to preserve accurately, not a positioning angle to amplify.
- Flow: teacher states an objective and activates a session (QR code / short session code) → students join and choose a path → optional distraction-free "Modo Foco" timer → AI tutor chat working toward the objective → student reflection (feeling + what helped) → teacher dashboard with class-level metrics and an AI-generated insight.
- The MVP's pilot content is Matemática, funções do 1º grau (f(x) = 2x + 3, f(4)).

## Capabilities and Constraints

- Current stage: MVP demo for the AI course. The public deployment is a functional demo, not a live classroom service. Live use with real students is out of scope for this stage.
- Tutor backend: a serverless endpoint on Vercel with a Postgres database (Neon). The AI provider is currently a deterministic test implementation; the final integration uses Google Gemini (AI Studio, free tier). The rules of the hint ladder live on the server.
- Demo data is fictitious and created by the team. No personal data of students is collected.
- Device/connectivity floor (shared or low-end Android phones, unreliable school wifi) is explicitly **undecided** — do not assume or design against a specific hardware/network baseline until this is confirmed.

## Brand Commitments

- Name: **Socrates AI**.
- Logo: `src/imports/logoSocratesAi.svg`, drawn by the user. It shows Socrates thinking with a hand on the chin, a question bubble, and the wordmark "Sócrates" in navy. Its palette is royal blue, navy, gold and white. The logo is the brand's primary visual reference.
- Voice: acolhedora e curiosa — a warm, curious tone, like an older colleague who asks good questions. Never condescending, never giving the answer away.

## Evidence on Hand

- Research summary: `socrates-ai/docs/research/resumo-pesquisa.md`. It cites TIC Kids Online 2023, PISA 2022, Ward et al. (2017), Castelo et al. (2025), TIC Educação 2024, Bastani et al. (2025, PNAS), Inep/Alana/UNESCO (2026) and Pinto et al. (2023).
- Internal survey of students (formulário): 48.9% report difficulty concentrating, 51.1% struggle with Matemática, 42.6% struggle to organize study time, 70.2% would use an AI like this, and only 19.1% say they have received guidance about AI. These are self-reported figures from our own form, not a controlled study.
- No real classroom usage data, testimonials, or outcomes exist yet. The app's numbers (objectives, chat exchanges, dashboard metrics, student counts) are illustrative. Future work must not present them as evidence.

## Product Principles

1. Guide, don't answer — the AI's job is to advance the student's reasoning, never to hand over the answer.
2. Same objective, chosen path — autonomy is built into how a student reaches the teacher's goal, not bolted on as an option.
3. Make classroom engagement legible — the teacher-facing dashboard exists to turn what happened during the session into something a teacher can act on.
4. Honest data — nothing in the demo is treated or presented as real usage data, users, or outcomes.

## Accessibility & Inclusion

No product-specific requirement established yet. Known gaps from the critique (low text contrast in secondary labels, missing visible focus rings) are tracked for the polish pass.
