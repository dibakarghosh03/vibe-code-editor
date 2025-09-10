# 🚀 VibeCode Editor

A full-featured **browser-based coding environment** with AI-powered assistance.  
Built with **Next.js**, **WebContainer**, **Monaco Editor** and **TypeScript**, VibeCode Editor lets you instantly spin up projects, edit code, run it in the browser and get AI suggestions & completions — just like a personal Copilot.

---

## ✨ Features

- 🌐 **In-browser runtime** using [WebContainer](https://webcontainers.io/) — run Node.js projects entirely in your browser.
- 📝 **Rich code editor** powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/).
- 🧠 **AI Copilot**:
  - Chat with the AI about your code.
  - Get real-time code completions.
  - Model: `qwen/qwen3-coder` via [OpenRouter](https://openrouter.ai/).
- 📦 **Project Templates** (TypeScript):
  - React
  - Next.js
  - Express
  - Hono
  - Vue
  - Angular  
  *(choose a template and start coding instantly)*

- 🗄 **Database**: MongoDB Atlas + Prisma ORM for user/projects metadata.
- ⚡ Run, edit and save projects all inside the browser — no local setup required.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, ShadCN, XTerm, Zustand
- **Editor**: Monaco Editor
- **Runtime**: WebContainer (Node.js in the browser)
- **AI**: qwen/qwen3-coder via OpenRouter (chat + completions)
- **Database**: MongoDB Atlas
- **ORM**: Prisma

---

## 🚀 Getting Started

```bash
git clone https://github.com/dibakarghosh03/vibe-code-editor
cd vibe-code-editor
npm install
npm run dev

```

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory and set the following variables:

```env
# Database (MongoDB Atlas)
DATABASE_URL=

# Auth secret for NextAuth (or custom auth)
AUTH_SECRET=

# GitHub OAuth credentials
GITHUB_ID=
GITHUB_SECRET=

# Google OAuth credentials
GOOGLE_ID=
GOOGLE_SECRET=

# OpenRouter API key for AI assistant
OPENROUTER_API_KEY=
```

## 🧠 How It Works

1. **Template Selection**  
   User picks a template (**React**, **Next.js**, **Express**, **Hono**, **Vue**, **Angular**) — all in TypeScript.

2. **WebContainer**  
   Spins up a full **Node.js environment** directly in the browser with the chosen template.

3. **Monaco Editor**  
   Loads the project files with:
   - Syntax highlighting  
   - IntelliSense  
   - Rich editing features

4. **AI Assistant**  
   Powered by [OpenRouter](https://openrouter.ai/) **qwen/qwen3-coder** model:  
   - 💡 Code completions  
   - 💬 In-editor chat & help

5. **Prisma + MongoDB Atlas**  
   Stores:
   - User sessions  
   - Project metadata  
   - File structures


## 🤝 Contributing

Contributions, issues and feature requests are welcome!  
Feel free to check [issues page](./issues) or open a pull request.


## 👨‍💻 Author

Made with ❤️ by [Dibakar Ghosh](https://github.com/dibakarghosh03)