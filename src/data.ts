// All portfolio copy lives here — edit this file to update the site.

export const profile = {
  first: 'POLAGOUNI',
  last: 'BALAKRISHNA',
  role: 'Full-stack developer & agent builder',
  location: 'Hyderabad, India',
  coords: '17.3616° N · 78.4747° E',
  company: 'Genpact',
  email: 'balu2446madhu@gmail.com',
  linkedin: 'https://www.linkedin.com/in/polagouni-balakrishna-04a4641a9',
  github: 'https://github.com/JavaDeveloper24',
  intro:
    'I build enterprise AI platforms end to end — React 19 frontends, FastAPI services, multi-agent LLM workflows and RAG pipelines, shipped across Azure, GCP and AWS.',
  about:
    "I'm an AI engineer and full-stack developer at Genpact in Hyderabad. I take LLM ideas from a first prompt to a product people use every day: LangGraph agents and RAG pipelines on the backend, React 19 interfaces on the front, secured with Okta and shipped through CI/CD to Azure, GCP and AWS. The part I care about most is the part demos skip — evaluation, guardrails and keeping token costs under control.",
}

export const stats = [
  { value: 4, pad: 2, suffix: '+', label: 'Years shipping at Genpact' },
  { value: 4, pad: 2, suffix: '', label: 'Enterprise AI platforms shipped' },
  { value: 3, pad: 2, suffix: '', label: 'Clouds in production' },
]

export const experience = [
  {
    key: 'ORIGIN',
    period: '2019 — 2022',
    kicker: 'Bachelor of Computer Applications',
    title: ['THE', 'FOUNDATION'],
    body: 'Three years at Osmania University learning programming, databases and the web — and picking up the habit of building things to understand them.',
    milestones: [
      { k: 'Degree', v: 'Bachelor of Computer Applications' },
      { k: 'University', v: 'Osmania University, Hyderabad' },
      { k: 'Graduated', v: 'Class of 2022' },
    ],
  },
  {
    key: 'GENPACT',
    period: 'OCT 2022 — PRESENT',
    kicker: 'AI engineer · full-stack developer',
    title: ['AI ENGINEER', 'AT GENPACT'],
    body: 'I design and build enterprise AI platforms end to end — from AI training simulations to ad-creative and campaign tooling — with React 19, FastAPI, LangGraph and Azure OpenAI / Gemini.',
    milestones: [
      { k: 'Agents', v: 'Multi-agent pipelines with parallel evaluators and RAG over PGVector — ~65% fewer tokens.' },
      { k: 'Security', v: 'Okta OAuth 2.0 / OIDC — confidential token exchange and RS256 JWKS verification.' },
      { k: 'Delivery', v: 'Docker + Azure DevOps CI/CD across Azure, GCP and AWS EC2.' },
    ],
  },
  {
    key: 'CERTIFIED',
    period: 'ALWAYS LEARNING',
    kicker: 'Generative AI & cloud credentials',
    title: ['CERTIFIED IN', 'GENAI & CLOUD'],
    body: 'Certifications on the platforms I build with every day — Databricks, Google Cloud, AWS and Genpact’s own agent program.',
    milestones: [
      { k: 'Databricks', v: 'Generative AI Engineer Associate' },
      { k: 'Google Cloud', v: 'Generative AI Leader' },
      { k: 'AWS', v: 'Cloud Practitioner · AI Practitioner' },
      { k: 'Genpact', v: 'Agent Builder' },
    ],
  },
]

export type Project = {
  id: string
  name: string
  short: string
  tagline: string
  /** base path of the HD WebP size ladder: <image>-<width>.webp */
  image: string
  stack: string[]
  points: string[]
  metric: { value: string; label: string }
  tint: string
}

export const projects: Project[] = [
  {
    id: 'coach',
    name: 'AI COACH',
    short: 'AI Coach',
    tagline: 'Enterprise AI simulation & multi-agent coaching platform',
    image: '/work/hd/coach-v2',
    stack: ['React 19', 'FastAPI', 'LangGraph', 'Azure OpenAI', 'PGVector'],
    points: [
      'GPT-4o + Pydantic structured outputs simulate dynamic customer personas with live coaching.',
      'LangGraph evaluation engine — 4 parallel LLM evaluators audit transcripts against compliance rubrics.',
      'Adaptive RAG over PGVector across multi-turn history, CRM profiles and domain documents.',
      'Real-time neural voice with Microsoft Speech SDK — dynamic SSML and custom prosody.',
    ],
    metric: { value: '4×', label: 'Parallel LLM evaluators' },
    tint: '#ff4d1a',
  },
  {
    id: 'adpilot',
    name: 'ADPILOT',
    short: 'AdPilot',
    tagline: 'Ad creative intelligence & operations platform',
    image: '/work/hd/adpilot-v2',
    stack: ['React 19', 'Vite', 'FastAPI', 'Gemini', 'Cloud Vision', 'PostgreSQL'],
    points: [
      'Creative-workflow SPA with in-browser PDF / DOCX / XLSX rendering — no desktop software.',
      'Multimodal editing: Cloud Vision OCR + Gemini image models with automatic fallback and cost tracking.',
      'Admin console with TanStack Query optimistic updates, debounced audit search, RBAC and Okta OIDC.',
      'Excel translation service — Cloud Translation v3 in 128-cell batches with enterprise glossaries.',
    ],
    metric: { value: '128', label: 'Cell translation batches' },
    tint: '#f5b70a',
  },
  {
    id: 'optimizer',
    name: 'CAMPAIGN OPTIMIZER',
    short: 'Campaign Optimizer',
    tagline: 'Agentic ad-tech diagnostic platform',
    image: '/work/hd/optimizer-v2',
    stack: ['React 19', 'TypeScript', 'FastAPI', 'Vertex AI', 'Google ADK', 'BigQuery'],
    points: [
      'React 19 + Tailwind frontend with custom SVG pacing curves and a 5-stage audit flow.',
      'Async multi-track reasoning on Vertex AI (Gemini 2.5) via Google ADK — ~65% fewer tokens.',
      '1,280-line guardrail engine: ±20% budget limits, runway rules and 7-day Redis cooldowns.',
      'BigQuery cost governance — byte tracking, dry-run estimates and a 250 GB circuit breaker.',
    ],
    metric: { value: '250GB', label: 'BigQuery circuit breaker' },
    tint: '#7c8cff',
  },
  {
    id: 'rewards',
    name: 'CONTEST & REWARDS',
    short: 'Contest & Rewards',
    tagline: 'Internal engagement platform at Genpact',
    image: '/work/hd/rewards-v2',
    stack: ['React', 'Node.js', 'Express.js', 'MongoDB', 'Framer Motion'],
    points: [
      'End-to-end contest platform with ticket-allocation logic for fair, auditable draws.',
      'Animated Framer Motion rewards wheel that turns a spreadsheet process into an event.',
      'Automated email notifications for winners and participants.',
    ],
    metric: { value: '0', label: 'Spreadsheets left' },
    tint: '#2bd9a0',
  },
]

export const method = [
  {
    word: 'RETRIEVE',
    body: 'Ground every answer in real data first — RAG over PGVector, CRM profiles and domain documents.',
    tools: 'PGVector · embeddings · hybrid context',
  },
  {
    word: 'REASON',
    body: 'Agents built with LangGraph and Google ADK that return structured, typed outputs instead of free text.',
    tools: 'LangGraph · Google ADK · Pydantic',
  },
  {
    word: 'EVALUATE',
    body: 'Parallel LLM evaluators and deterministic guardrails check every turn before it reaches a user.',
    tools: 'LLM-as-judge · rubrics · guardrails',
  },
  {
    word: 'SHIP',
    body: 'Secured with Okta OIDC and shipped through Docker CI/CD to Azure, GCP and AWS — with cost limits switched on.',
    tools: 'Okta OIDC · Docker · Azure DevOps',
  },
]

export const skills = [
  { group: 'Agentic AI & LLM', items: 'LangGraph, LangChain, Google ADK, Azure OpenAI (GPT-4o), Gemini, RAG, PGVector, Pydantic' },
  { group: 'Frontend', items: 'React 19, TypeScript, Vite, Tailwind CSS, TanStack Query v5, Zustand, Framer Motion' },
  { group: 'Backend & security', items: 'Python, FastAPI, Node.js, Express.js, asyncio, Okta OAuth 2.0 / OIDC, JWT, JWKS, RBAC' },
  { group: 'Data', items: 'PostgreSQL, MongoDB, MySQL, Redis, BigQuery' },
  { group: 'Cloud & DevOps', items: 'Azure, GCP (Vertex AI, Vision, Translation, App Engine), AWS EC2, Docker, Nginx, CI/CD' },
]

export const marqueeTech = [
  'LangGraph', 'Azure OpenAI', 'Gemini', 'FastAPI', 'React 19', 'PGVector', 'Google ADK', 'Vertex AI',
  'TypeScript', 'BigQuery', 'Redis', 'Okta OIDC', 'Docker', 'TanStack Query', 'Python', 'AWS',
]

// The agents that build the page.
export const agents = [
  { name: 'Planner', color: '#ff5a1f' },
  { name: 'Layout', color: '#4d8dff' },
  { name: 'Typeset', color: '#2bd9a0' },
  { name: 'Retriever', color: '#a58bff' },
  { name: 'Evaluator', color: '#ff6fb5' },
  { name: 'Guardrail', color: '#f5b70a' },
]
