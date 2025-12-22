# LinguaFlow - Language Learning App

A modern language learning application built with React, TypeScript, and Supabase.

## Features

- 📚 Interactive reading with clickable words
- 🌍 Support for multiple languages (Spanish, French, German, Italian, Portuguese, English, Turkish)
- 📝 Vocabulary tracking and spaced repetition system
- 🎯 Customizable translation preferences per language
- 🎤 AI-powered text-to-speech
- 📊 Progress tracking and statistics
- 🔄 Import lessons from various sources

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Edge Functions)
- **AI**: OpenAI API (GPT-4o-mini for translations, TTS-1 for audio)
- **Build Tool**: Vite
- **UI Components**: Radix UI, shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lingua-spark-86
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:
- Run the migrations in `supabase/migrations/`
- Configure the edge functions in `supabase/functions/`
- Add your `OPENAI_API_KEY` to Supabase edge function secrets

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Project Structure

```
lingua-spark-86/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, Language)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   └── integrations/   # Third-party integrations (Supabase)
├── supabase/
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
