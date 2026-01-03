<p align="center">
  <img src="public/branding/bloom-studio_logo.png" alt="Bloom Studio" height="100" />
  &nbsp;&nbsp;&nbsp;
  <b><sub>✕</sub></b>
  &nbsp;&nbsp;&nbsp;
  <img src="public/branding/pollinations/logo-white.svg" alt="Pollinations AI" height="80" />
</p>

<h1 align="center">Bloom Studio</h1>

<p align="center">
  <strong>Professional AI image generation — affordably.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#acknowledgements">Acknowledgements</a>
</p>

---

## Features

- 🎨 **10+ Image Models** — Choose from NanoBanana, GPT-Image, Seedream, and more
- ⚡ **Generous Limits** — Up to 140 GPT-powered generations per day
- 📐 **Full Dimension Control** — Create logos, banners, or any custom image size
- 💾 **Cloud History** — Access your generated images from any device
- 🔐 **Secure Auth** — Powered by Clerk with SSO support

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Backend** | Convex |
| **Auth** | Clerk |
| **UI** | shadcn/ui + Tailwind CSS |
| **3D** | React Three Fiber |
| **Testing** | Vitest + React Testing Library |

## Getting Started

```bash
# Install dependencies
bun install

# Start the Convex backend
bunx convex dev

# Start the dev server (separate terminal)
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Create production build |
| `bun test` | Run test suite |
| `bun lint` | Lint codebase |

## Acknowledgements

<a href="https://github.com/pollinations">
  <img src="public/branding/pollinations/logo-white.svg" alt="Pollinations.AI" width="180" />
</a>

Built with [Pollinations.AI](https://pollinations.ai) — open-source, free-to-use generative AI infrastructure.

---

<p align="center">
  <sub>Made with ❤️</sub>
</p>
