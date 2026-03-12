# Monopoly Deal

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://rgndunes.github.io/Monopoly-Deal/)
[![CI](https://github.com/RgnDunes/Monopoly-Deal/actions/workflows/ci.yml/badge.svg)](https://github.com/RgnDunes/Monopoly-Deal/actions/workflows/ci.yml)

A premium digital implementation of the Monopoly Deal card game, built with React and real-time multiplayer support.

## Features

- Complete Monopoly Deal rule set (110 cards)
- Local hot-seat mode (2–5 players)
- Real-time online multiplayer with room codes
- AI bots for empty player slots
- Premium card design with smooth animations
- Mobile responsive
- Deployed on GitHub Pages with CI/CD

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, Zustand           |
| Animation | Framer Motion                     |
| Drag/Drop | @dnd-kit/core                     |
| Routing   | React Router v6                   |
| Backend   | Node.js, Express, Socket.IO 4     |
| Testing   | Vitest, @testing-library/react    |
| Deploy    | GitHub Pages + GitHub Actions      |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with multiplayer server
npm run dev:all

# Run tests
npm test

# Build for production
npm run build
```

## Game Rules

See [GAME_DESIGN.md](./GAME_DESIGN.md) for complete rules reference.

## Live Demo

Play now: [https://rgndunes.github.io/Monopoly-Deal/](https://rgndunes.github.io/Monopoly-Deal/)

## License

MIT
