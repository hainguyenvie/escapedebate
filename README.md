# ESCAPE AI DEBATE

AI-powered debate platform - tranh luận cùng AI trên nhiều chủ đề khác nhau.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI API

## Setup

### 1. Clone repo

```bash
git clone https://github.com/hainguyenvie/escapedebate.git
cd escapedebate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy file `.env.example` thanh `.env` va dien cac key:

```bash
cp .env.example .env
```

Sau do mo file `.env` va dien:

- `SUPABASE_URL` - Project URL tu Supabase Dashboard > Settings > API
- `SUPABASE_ANON_KEY` - anon/public key tu Supabase Dashboard > Settings > API
- `OPENAI_API_KEY` - API key tu https://platform.openai.com/api-keys

### 4. Setup Supabase database

Vao Supabase Dashboard > SQL Editor va chay doan SQL sau:

```sql
CREATE TABLE debates (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  side TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  debate_id INTEGER NOT NULL REFERENCES debates(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 5. Run

```bash
npm run dev
```

App se chay tai `http://localhost:5000`.
