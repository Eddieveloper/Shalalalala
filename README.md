# Rebalance

Rebalance is a productivity and recovery dashboard designed to track missed commitments, academic debt, recovery actions, and daily scheduling. It combines a calendar-driven timeline with automated logic for detecting missed tasks and surfacing recovery prompts.

## Features

- Dashboard overview for action-required items
- Calendar/timeline view for scheduling activity
- Missed activity detection logic
- Recovery flow for rebalancing tasks and goals
- Supabase-ready data layer and schema

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Supabase

## Project Structure

- `src/` — application source code
- `src/components/` — UI components
- `src/hooks/` — scheduling and detection hooks
- `src/engine/` — domain-specific calculation logic
- `src/store/` — state management
- `supabase/` — database schema and Supabase setup

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file in the project root if you are using Supabase or other local environment values:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Notes

This repository includes the app source and database schema. If you are using a Vite React project, you may need to add the standard frontend config files if they are not already present in your local environment.

## License

This project is provided as-is for personal or team use.
