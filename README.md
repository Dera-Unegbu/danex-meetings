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
│  Netlify Function        │ ──> /.netlify/functions/briefing-api
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
Set these variables in the Netlify site dashboard. Keep Tavily and Bifrost keys as server-only variables; do not prefix them with `NEXT_PUBLIC_` and do not add them to Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DATABASE_URL=your_supabase_transaction_pooler_url
TAVILY_API_KEY=your_tavily_api_key
BIFROST_API_KEY=your_bifrost_api_key
```

Use the Supabase transaction pooler connection string for `SUPABASE_DATABASE_URL` (or `DATABASE_URL`); the Netlify function uses it for PostgreSQL reads and writes. This is a PostgreSQL connection string, not the Supabase project URL, and must remain server-only. The browser Auth client uses the Supabase project URL and anon/publishable key as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not pass the database connection string to `createClient`. The server uses `SUPABASE_SERVICE_ROLE_KEY` to validate Auth tokens. Keep the service-role key, database URL, Tavily key, and Bifrost key server-only in Netlify.

4. Configure Supabase
- Apply every SQL migration in `supabase/migrations` in timestamp order.
- The `briefings.user_id` and `briefing_usage.user_id` columns reference `auth.users.id`; briefings are saved only for signed-in accounts, while both guests and members have usage tracked by their Supabase user ID.
- Enable Email and Anonymous sign-ins in Authentication providers.
- Disable email confirmation if you want email sign-ups to be usable immediately. If confirmation is enabled, new users must verify their address before signing in.
- Set the Site URL and allowed redirect URLs to your Netlify site.

5. Run the development server
Run `npx netlify dev` to serve the Next.js app and its Netlify Functions together locally.

Guest briefings are not stored. Guests receive 5 generations per anonymous Supabase session; email accounts receive 50 generations and have their briefings saved to their account. Paid plans and Google sign-in are not included yet.

🛡 License
Distributed under the MIT License. See LICENSE for more information.


---

### Highlights of this design:
1. **Clean Hierarchy:** Visual badges, clean ASCII workflow diagram, and structured sections make it easy for recruiters and developers to scan.
2. **Clear Tech Breakdown:** Clearly attributes Tavily, Bifrost, OpenRouter, and Supabase so the architectural choices stand out.
3. **Quick Onboarding:** Includes standard environment variable configuration and local setup instructions.
