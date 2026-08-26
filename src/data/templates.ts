import type { PromptTemplate } from '../types';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-architect',
    title: 'Full-Stack Architecture Plan',
    category: 'Coding',
    description: 'Design a clean, modular system architecture with tech stack, APIs, and data models.',
    prompt: 'I want to build a [describe your application idea]. Please provide a comprehensive architecture plan including:\n1. Recommended modern tech stack & design choices\n2. Database schema & entity relationships\n3. Core API contract endpoints (REST/RPC)\n4. State management & security boundaries\n5. Key technical risks and how to mitigate them.',
    systemInstruction: 'You are a Principal Staff Software Architect. Provide precise, production-ready architectural diagrams (in clean markdown/ASCII), strict typing definitions, and clear modular breakdowns.',
    iconName: 'Cpu',
  },
  {
    id: 'code-refactor',
    title: 'TypeScript Refactor & Clean Code',
    category: 'Coding',
    description: 'Analyze code for anti-patterns, race conditions, type safety, and readability.',
    prompt: 'Please review and refactor the following TypeScript code:\n\n```ts\n// Paste your code here\n```\n\nFocus on:\n- Type safety & eliminating any/untyped holes\n- Immutability and pure functions\n- Robust error handling and edge cases\n- Performance & memory optimization',
    systemInstruction: 'You are a meticulous Senior TypeScript Engineer. Provide improved, clean code accompanied by a concise explanation of each key change.',
    iconName: 'Code2',
  },
  {
    id: 'first-principles',
    title: 'First Principles Reasoning',
    category: 'Reasoning',
    description: 'Deconstruct a complex problem into fundamental truths and re-synthesize a solution.',
    prompt: 'Analyze the problem of [insert problem or challenge] from first principles:\n1. What are the fundamental irreducible physical/logical constraints?\n2. What existing assumptions are taken for granted but might be false?\n3. What novel approach emerges when rebuilding the solution from scratch?',
    systemInstruction: 'You are an analytical philosopher and systems thinker. Strip away analogies and convention. Reason strictly from foundational truths and mechanical reality.',
    iconName: 'Lightbulb',
  },
  {
    id: 'decision-matrix',
    title: 'Tradeoff & Decision Matrix',
    category: 'Analysis',
    description: 'Compare multiple options across criteria with weighted evaluation and recommendations.',
    prompt: 'I am deciding between the following options: [Option A, Option B, Option C] for [Goal/Context].\n\nCreate a detailed decision matrix with:\n- Key criteria (cost, scalability, velocity, developer experience, risk)\n- Score table (1-5 with justifications)\n- Clear bottom-line recommendation based on different company/project stages.',
    systemInstruction: 'You are a Strategic Technology Consultant. Deliver objective, data-driven comparisons without hand-waving.',
    iconName: 'Scale',
  },
  {
    id: 'json-schema',
    title: 'Structured JSON Schema & Generator',
    category: 'Data',
    description: 'Extract or generate strict JSON payloads adhering to validation schemas.',
    prompt: 'Extract the structured data from the following text into a valid JSON object matching this structure:\n- entities with name, category, and metadata\n- timestamps and relational tags\n\nText:\n[Paste text or data here]',
    systemInstruction: 'You are a Data Engineering specialist. Output purely valid, strictly formatted JSON with zero markdown preamble if requested.',
    iconName: 'FileJson',
  },
  {
    id: 'executive-summary',
    title: 'Executive Brief & Summary',
    category: 'Writing',
    description: 'Transform complex reports or discussions into a concise executive briefing.',
    prompt: 'Please summarize the following information into an executive briefing:\n\n[Paste text/notes here]\n\nInclude:\n- TL;DR (3 bullet points max)\n- Core Findings & Strategic Impact\n- Action Items & Owner Deadlines\n- Unresolved Questions',
    systemInstruction: 'You are a Chief of Staff writing high-signal, zero-fluff briefs for leadership.',
    iconName: 'FileText',
  },
];

export const SYSTEM_PERSONAS = [
  {
    id: 'default',
    name: 'Helpful AI Studio Assistant',
    instruction: 'You are a highly capable, thoughtful, and precise AI assistant powered by Gemini. Provide well-structured, clear answers with actionable examples.',
  },
  {
    id: 'architect',
    name: 'Senior Software Architect',
    instruction: 'You are a Senior Principal Software Architect. Focus on robust distributed systems, type safety, API design, maintainability, clean code, and security best practices.',
  },
  {
    id: 'socratic',
    name: 'Socratic Tutor & Problem Solver',
    instruction: 'You are a Socratic tutor. Guide the user by breaking concepts into fundamental steps, asking clarifying questions, and encouraging deep comprehension.',
  },
  {
    id: 'concise',
    name: 'Ultra-Concise Direct Expert',
    instruction: 'You are an ultra-concise technical expert. Give direct, high-signal answers with zero preamble, no conversational fluff, and bullet points wherever possible.',
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist & Mathematical Analyst',
    instruction: 'You are an expert Data Scientist and applied mathematician. Emphasize statistical rigor, clean schemas, algorithmic complexity, and reproducible methodology.',
  },
];
