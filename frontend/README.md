# Frontend - Daadaar Platform

Next.js 16 frontend with Tailwind CSS v4, Biome, and Bun.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React version
- **Tailwind CSS v4** - CSS-first configuration with `@theme` blocks
- **next-intl** - Internationalization (Persian primary, RTL support)
- **Biome** - Fast linter and formatter
- **Bun** - Fast JavaScript runtime and package manager
- **TypeScript** - Type safety

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## Code Quality

```bash
# Lint code
bun run lint

# Auto-fix linting issues
bun run lint:fix

# Format code
bun run format

# Type check
bun run type-check
```

## Tailwind CSS v4

This project uses Tailwind CSS v4 with CSS-first configuration:

- Configuration is done in `app/globals.css` using `@theme` blocks
- No `tailwind.config.js` file needed
- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- Custom theme values defined as CSS variables in `@theme`

## Project Structure

```
frontend/
├── app/              # Next.js App Router
│   ├── [locale]/    # Locale-aware routes
│   ├── globals.css   # Global styles with Tailwind v4
│   └── i18n/        # next-intl configuration
├── components/       # React components
├── messages/         # Translation files (fa.json, en.json)
└── middleware.ts     # Next.js middleware for i18n
```

