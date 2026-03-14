# Studio Assistant

Studio Assistant is an AI-powered chat application built with **Next.js 14** featuring a modern, sleek Dark Mode UI inspired by ChatGPT. The application integrates the **OpenAI API** to provide an intelligent, fast, and highly interactive conversational assistant.

## ✨ Key Features

- **ChatGPT-Style UI**: Minimalist and elegant design using Tailwind CSS (Zinc palette), complete with a clean sidebar, seamless chat separators, and full mobile responsiveness.
- **Streaming Responses**: Utilizes the **Web Streams API** to render AI responses in real-time (typing effect), eliminating the need to wait for the entire response to generate.
- **Adjustable Model Settings**:
  - A settings modal (accessible via the gear icon) allows you to tweak AI parameters on the fly.
  - **Temperature**: Controls the creativity and randomness of the responses (0.0 - 2.0).
  - **Max Tokens**: Sets the limit for the maximum length of the generated response (100 - 4096).
- **Multiple Conversation Threads**: Ability to create new chats or revisit previous conversations at any time from the sidebar.
- **Local State Persistence**: Chat history, active sessions, and AI parameter settings are persisted locally using `sessionStorage`, ensuring data isn't lost upon page refresh within the same session.
- **Markdown Rendering**: The AI's responses are parsed as Markdown, beautifully rendering code blocks, bold text, tables, and lists.
- **Export to Markdown**: Quickly export your active conversation into a structured `.md` file, useful for saving documentation, code snippets, or offline reading.
- **Custom Slash Commands 🚀**: Specialized routing for hidden prompts:
  - `/write-dialogue [character] [scenario]`: The AI acts as a professional game narrative writer.
  - `/asset-description [type] [style]`: The AI focuses on highly detailed visual descriptions intended for Art/Design teams.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router / React Server Components)
- **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Integration**: [OpenAI Node SDK](https://github.com/openai/openai-node)
- **Markdown**: `react-markdown` and `remark-gfm`

---

## 🤖 AI Tools Used

This project was built rapidly by leveraging advanced AI tools to accelerate development, plan architecture, and verify functionality.

### **1. Antigravity (Google DeepMind AI Assistant)**
*   **How it was used**: Acted as the primary autonomous pair-programming agent. It analyzed the initial codebase, resolved Next.js hydration hydration errors, refactored the entire UI using Tailwind CSS to match the requested ChatGPT aesthetic, and implemented complex features like Web Streams and Markdown Export.
*   **Impact on Workflow**: Drastically reduced development time. Instead of manually writing boilerplate React code or debugging component lifecycles, I provided high-level objectives (e.g., "Implement a Settings modal to control temperature"), and the agent autonomously wrote the code, ran terminal commands (`npm run lint`), and committed the changes.

### **2. Browser Subagent (Visual Verification)**
*   **How it was used**: An autonomous browser testing agent within Antigravity that spun up a headless Chrome instance to visually interact with `localhost:3000`. It physically clicked the Settings icon, typed prompts into the chat, and captured screenshots to verify the real-time text streaming and modal rendering.
*   **Impact on Workflow**: Eliminated the need for manual QA. The agent proved visually that the streaming tokens were rendering correctly without the developer having to context-switch to a browser window.

### **3. OpenAI API (gpt-4o-mini)**
*   **How it was used**: Powering the core feature of the application. It was integrated via the official Node SDK to handle the chat completions, utilizing the `stream: true` flag to return native Server-Sent Events (SSE).
*   **Impact on Workflow**: Provided the underlying intelligence of the "Studio Assistant." By utilizing the OpenAI API, we seamlessly brought advanced LLM capabilities (like custom system prompts for `/write-dialogue`) into a custom-built interface in a matter of minutes.

By combining an autonomous coding agent (Antigravity) to write and test the infrastructure with a powerful LLM (OpenAI) driving the application's logic, we delivered a highly polished, production-ready feature set within an extremely constrained timeframe.

---

## 🚀 Getting Started

Ensure you have **Node.js** (v18+) and your preferred package manager (`npm`, `yarn`, `pnpm`, or `bun`) installed.

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd 3-STUDIO-ASSISTANT
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory. Add your OpenAI API key:
```env
OPENAI_API_KEY="sk-your-openai-secret-key"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** (or `:3001` depending on port availability indicated in your terminal).

---

## 📂 Project Structure

- `src/app/page.tsx`: The main client component containing the UI layout, sidebar, chat input, settings modal, and browser state management.
- `src/app/api/chat/route.ts`: The server-side API route that handles requests to the language model. It streams raw text (`ReadableStream`) back to the frontend.
- `src/lib/llm.ts`: The interface to the OpenAI SDK where the streaming is initialized and messages are structured.
- `src/lib/commands.ts`: Parses user input to detect `/write-dialogue` or `/asset-description` and injects the appropriate System Prompts.
- `src/components/`: Reusable UI components including `ChatMessage`, `ChatInput`, and `ChatSidebar`.
