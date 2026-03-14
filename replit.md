# ESCAPE AI DEBATE

## Overview
An AI-powered debate platform where users can engage in structured arguments on various topics with an AI opponent. Built with React frontend and Express backend, using Supabase as the database.

## Recent Changes
- **2026-02-07**: Migrated from Drizzle ORM (direct PostgreSQL) to Supabase JS Client for database operations. Uses SUPABASE_URL + SUPABASE_ANON_KEY for connection.

## Architecture

### Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: Supabase (PostgreSQL via JS Client)
- **AI**: OpenAI (via Replit AI Integrations)
- **Routing**: wouter (frontend), Express (backend)
- **Data Fetching**: TanStack React Query

### Project Structure
```
client/src/
  pages/          - Home.tsx, DebateSession.tsx
  components/     - Header.tsx, DebateHistory.tsx, UI components
  hooks/          - use-debates.ts, use-toast.ts
  lib/            - queryClient.ts, utils.ts
server/
  db.ts           - Supabase client initialization
  storage.ts      - SupabaseStorage class (CRUD operations)
  routes.ts       - Express API routes
  vite.ts         - Vite dev server integration (DO NOT MODIFY)
shared/
  schema.ts       - TypeScript interfaces + Zod schemas
  routes.ts       - API route definitions
```

### Database Schema (Supabase)
- **debates**: id (serial), topic (text), side (text), created_at (timestamptz)
- **messages**: id (serial), debate_id (int, FK→debates.id), role (text), content (text), created_at (timestamptz)

### Key APIs
- `GET /api/debates` - List all debates
- `POST /api/debates` - Create new debate
- `GET /api/debates/:id` - Get debate with messages
- `POST /api/debates/:id/messages` - Send message and get AI response

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `OPENAI_API_KEY` - OpenAI API key (user's own key)

## Authentication
- Google OAuth via Supabase (`supabase.auth.signInWithOAuth`)
- Frontend Supabase client initialized lazily via `/api/config` endpoint (reads server-side secrets)
- `AuthProvider` wraps the app in `App.tsx`
- Login page at `/login` — redirects to `/` after login
- Header shows user avatar + dropdown (name, email, sign out) when logged in
- Home page ENTER button → "Đăng nhập" when not logged in, "ENTER" when logged in
- **Supabase setup required**: Enable Google provider in Supabase Dashboard → Authentication → Providers → Google

## User Preferences
- Vietnamese language for UI text
- Simple, clean approach preferred
