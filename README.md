Markdown
# ⚡ Danex Pre-Meeting Intelligence

> **Turn 30 days of web noise into high-impact executive meeting prep in seconds.**

Danex is an AI-powered pre-meeting briefing agent that researches any company or prominent executive and generates structured, context-aware intelligence reports. Built for high-stakes **Sales Calls, Partnerships, Investor Pitches, Business Development, and General Strategy**.

---

## ✨ Features

- 🎯 **Contextual Intelligence:** Tailors briefings based on meeting type (*Sales Call, Investor Pitch, Partnership, Business Development, or General*).
- ✍️ **Custom Meeting Context:** Describe a custom meeting in up to 1,000 words and let the AI infer the right briefing style.
- 📍 **Location-Aware Research:** Add a location to the company or person search to help disambiguate results.
- 🕒 **30-Day Recency Filter:** Captures only recent news, releases, and strategic shifts to ensure relevant, up-to-date context.
- 📊 **Structured Executive Briefings:** Outputs five core components:
  - 📝 **Executive Summary**
  - 🚀 **Recent Developments**
  - 💬 **Key Discussion Points**
  - ❓ **Strategic Questions**
  - 🔗 **Verified Sources**
- 🔀 **Multi-Model Orchestration:** Leverages model routing to balance latency, reasoning depth, and throughput.
- 📄 **One-Click Export:** Instantly download formatted PDF briefings ready for client meetings.
- 🔖 **Mobile Briefing Shortcut:** Jump directly to saved briefings on smaller screens.

---

## 🏗 Architecture & System Flow

```text
┌──────────────────────────┐
│  User Input (Hero UI)    │ ──> Target Name + Scheduled Meeting Time
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Next.js API Route       │ ──> /api/research
└────────────┬─────────────┘
             │
             ├─────────────────────────────────────────┐
             │ 1. Fetch 30-Day News                    │ 2. Format & Synthesize
             ▼                                         ▼
┌──────────────────────────┐             ┌──────────────────────────┐
│    Tavily Search API     │             │    LLM Engine (Bifrost)  │
│  (days: 30, depth: adv)  │ ──────────> │  Extracts summary, hires,│
└──────────────────────────┘             │  launches & questions    │
                                         └────────────┬─────────────┘
                                                      │
                                                      ▼
                                         ┌──────────────────────────┐
                                         │  Executive Briefing UI   │
                                         │  + One-Click PDF Export  │
                                         └──────────────────────────┘
🛠 Tech Stack
Frontend / Framework: Next.js, React, Tailwind CSS

Search & Web Retrieval: Tavily Search API (Advanced Search, 30-day time boundary)

AI Gateway & LLM Orchestration: Bifrost AI Gateway & OpenRouter

Database & Auth: Supabase

🚀 Getting Started
1. Clone the repository
Bash
git clone [https://github.com/Dera-Unegbu/danex-meetings.git](https://github.com/Dera-Unegbu/danex-meetings.git)
cd danex-meetings
2. Install dependencies
Bash
npm install
# or
pnpm install
3. Environment Setup
Create a .env.local file in the root directory and add your credentials:

Code snippet
# Tavily API
TAVILY_API_KEY=your_tavily_api_key

# Bifrost AI Gateway / OpenRouter
BIFROST_AI_GATEWAY_URL=your_bifrost_gateway_url
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
Apply the SQL files in `supabase/migrations` to your Supabase project before running the app.
4. Run the development server
Bash
npm run dev
Open http://localhost:3000 in your browser to see the app.

🛡 License
Distributed under the MIT License. See LICENSE for more information.


---

### Highlights of this design:
1. **Clean Hierarchy:** Visual badges, clean ASCII workflow diagram, and structured sections make it easy for recruiters and developers to scan.
2. **Clear Tech Breakdown:** Clearly attributes Tavily, Bifrost, OpenRouter, and Supabase so the architectural choices stand out.
3. **Quick Onboarding:** Includes standard environment variable configuration and local setup instructions.
