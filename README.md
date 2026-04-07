<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">artistlog-ai</h1>

<p align="center">A persistent creative log for artists.</p>
<p align="center">
  <a href="https://artistlog-ai.casey-digennaro.workers.dev">Live Demo</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#the-fleet">The Fleet</a>
</p>

---

artistlog-ai is an agent that learns from your project's commit history to provide context-aware feedback. It's designed to persist across your creative sessions without requiring you to re-explain your work.

Built on [Capitaine](https://github.com/Lucineer/capitaine) and deployed as a single-file Cloudflare Worker.

## Why this exists

Most AI creative tools are designed for quick generation, not long-term collaboration. This tool is built to accompany the iterative, non-linear process of making art—remembering your project's history so you can focus on the next iteration.

## What makes this different

This is a self-deployed agent:
- You deploy and control it. No third-party service can change or remove it.
- It reads from your Git repository to understand your project's context.
- Your data and conversations stay in your deployment.
- It uses Cloudflare Workers, which remain free for typical usage.

**Limitation:** It requires your project to be in a Git repository and for you to provide API keys for the LLM.

## Quick Start

Fork this repository and deploy it to Cloudflare Workers:

```bash
gh repo fork Lucineer/artistlog-ai --clone
cd artistlog-ai
npx wrangler login
echo "your-github-token" | npx wrangler secret put GITHUB_TOKEN
echo "your-llm-key" | npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler deploy
```

Your agent will be live at your Worker's URL.

## Features

- **Context Memory:** Reads your Git commit history to understand project evolution.
- **Multi-Model Support:** Works with DeepSeek, SiliconFlow, and other providers via BYOK v2.
- **Self-Contained:** Single-file Worker with no external runtime dependencies.
- **Privacy-Focused:** No data is used for training; sensitive data is automatically filtered.

## Architecture

The entire application is a single Cloudflare Worker (`src/worker.ts`). It serves a frontend and handles agent logic, with separate modules for model routing and session management.

## The Fleet

artistlog-ai is part of the Cocapn Fleet, a collection of autonomous, interoperable agents. Each vessel is a standalone intelligence designed for a specific domain.

<div align="center">
  <p>
    <a href="https://the-fleet.casey-digennaro.workers.dev">Explore The Fleet</a> · 
    <a href="https://cocapn.ai">Learn About Cocapn</a>
  </p>
</div>

---
Attribution: Superinstance & Lucineer (DiGennaro et al.) · MIT License · Cloudflare Workers