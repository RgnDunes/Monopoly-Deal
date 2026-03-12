# CLAUDE.md

> Read this file in full before doing anything else.
> These are your permanent operating instructions for this entire project.
> You execute every phase autonomously, back to back, without stopping.

---

## 🤖 AUTONOMY DIRECTIVE

You run **completely autonomously** from start to finish.

- You do NOT stop between phases to ask the user anything
- You do NOT wait for confirmation before proceeding to the next phase
- You do NOT ask "should I continue?" — you always continue
- You do NOT ask for clarification — you make reasonable decisions and proceed
- You do NOT report "done, awaiting instructions" — you move immediately to the next phase
- The only time you stop is when ALL 9 phases are fully complete and deployed

If you encounter an ambiguity, pick the most reasonable interpretation and keep going. Log your decision in the commit message if relevant.

If a command fails, diagnose it, fix it, and retry. Do not stop and ask the user.

If a test fails, fix the code, re-run, and only commit when green. Do not skip tests.

---

## ⚡ SUBAGENT DIRECTIVE

You have access to subagents. **Use them aggressively and constantly.**

Every phase has parallel workstreams. Identify them and spawn subagents immediately.
Never do sequentially what can be done in parallel.

**Standard subagent splits:**
- Logic subagent → engine, reducers, state machines
- UI subagent → React components, layout, CSS
- Test subagent → unit tests, integration tests
- Assets subagent → card data JSON, constants, design tokens

After subagents complete, you (orchestrator) integrate, resolve conflicts, run gates, commit.

**Spawn a reviewer subagent** after each phase to read all new code and flag issues before merge.

---

## 🌿 GIT RULES — ABSOLUTE

### Branches
```
main                            ← always green, always deployable
feature/phase-0-setup
feature/phase-1-engine
feature/phase-2-actions
feature/phase-3-state
feature/phase-4-ui
feature/phase-5-game-flow
feature/phase-6-backend
feature/phase-7-multiplayer
feature/phase-8-ai-bot
feature/phase-9-polish-deploy
```

Create each branch from main at phase start:
```bash
git checkout main && git pull origin main
git checkout -b feature/phase-N-name
```

### Commit format (Conventional Commits — mandatory)
```
feat(engine): add rent calculation with house and hotel modifiers
feat(ui): add animated card draw from deck
fix(engine): correct just-say-no chain termination
fix(ui): prevent playing cards when not your turn
test(engine): add 100% coverage for all action resolvers
refactor(store): extract action resolvers into dedicated module
chore: configure vitest, eslint, prettier
docs: update README with setup and deploy instructions
style(cards): apply exact monopoly deal color palette
```

### Commit rules
1. Run lint + build + test before EVERY commit — never skip
2. One logical unit per commit
3. Push immediately after every commit: `git push origin <branch>`
4. Never commit with `--no-verify`
5. Never force push

### Phase completion
```bash
git checkout main
git merge --no-ff feature/phase-N-name -m "feat: complete phase N — <description>"
git push origin main
git tag vX.Y.Z
git push origin --tags
```

### Tags
- Phase 0 done → `git tag v0.1.0`
- Phase 1 done → `git tag v0.2.0`
- Phase 2 done → `git tag v0.3.0`
- Phase 3 done → `git tag v0.4.0`
- Phase 4 done → `git tag v0.5.0`
- Phase 5 done → `git tag v0.6.0`
- Phase 6 done → `git tag v0.7.0`
- Phase 7 done → `git tag v0.8.0`
- Phase 8 done → `git tag v0.9.0`
- Phase 9 done → `git tag v1.0.0`

---

## 🏗️ BUILD & TEST GATES

Before **every single commit**, run ALL of these and fix any failures:
```bash
npm run lint      # 0 errors, 0 warnings
npm run build     # must succeed, no warnings about missing files
npm test          # all tests pass, 0 failures
```

Fix failures before committing. Never proceed with a red gate.

---

## 🎨 DESIGN SYSTEM

### Visual language
- Premium, clean, minimalist — a luxury card game feel
- Dark felt table, cards as the hero, purposeful animations
- Font: Nunito (load from Google Fonts in index.html)

### CSS variables — define in `:root`, use everywhere, no hardcoding
```css
:root {
  /* Table & surfaces */
  --bg-table:            #0a3d2e;
  --bg-surface:          #0f172a;
  --bg-overlay:          rgba(0,0,0,0.78);
  --bg-card:             #ffffff;
  --bg-card-back:        #1a237e;

  /* Property colors */
  --color-brown:         #955436;
  --color-lightblue:     #aae0fa;
  --color-pink:          #d93a96;
  --color-orange:        #f7941d;
  --color-red:           #ed1b24;
  --color-yellow:        #fef200;
  --color-green:         #1fb25a;
  --color-darkblue:      #0072bb;
  --color-railroad:      #2d2d2d;
  --color-utility:       #9e9e9e;

  /* Card type accents */
  --color-money-bg:      #f1f8e9;
  --color-money-accent:  #2e7d32;
  --color-action-bg:     #fff8f0;
  --color-action-accent: #e65100;
  --color-rent-bg:       #f3e5f5;
  --color-rent-accent:   #6a1b9a;

  /* UI */
  --color-primary:       #6366f1;
  --color-primary-hover: #4f46e5;
  --color-success:       #10b981;
  --color-danger:        #ef4444;
  --color-warning:       #f59e0b;
  --color-text:          #f8fafc;
  --color-text-muted:    #94a3b8;
  --color-border:        rgba(255,255,255,0.1);

  /* Cards */
  --card-w:              76px;
  --card-h:              106px;
  --card-w-md:           100px;
  --card-h-md:           140px;
  --card-w-lg:           130px;
  --card-h-lg:           182px;
  --card-radius:         10px;
  --card-shadow:         0 4px 16px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3);
  --card-shadow-hover:   0 16px 40px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.4);

  /* Motion */
  --t-fast:  150ms cubic-bezier(0.4,0,0.2,1);
  --t-base:  250ms cubic-bezier(0.4,0,0.2,1);
  --t-slow:  400ms cubic-bezier(0.4,0,0.2,1);
  --font-game: 'Nunito', system-ui, sans-serif;
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px;
}
```

### Card anatomy
- **Property:** top 35% = solid property color with white card name; bottom = white with rent table
- **Money:** soft green background, giant $ amount centered, subtle pattern
- **Action:** warm cream background, bold action name, icon, clear description
- **Rent:** light purple background, colored swatches showing applicable colors
- **All cards:** rounded 10px, drop shadow, money value badge top-left, type badge top-right

### Animation specs (Framer Motion)
- Card draw: slide up + fade in 300ms
- Card play: arc from hand to destination 380ms ease-in-out
- Card hover: translateY(-18px) + shadow boost 150ms
- Card discard: scale down + fade 250ms
- Just Say No: red flash overlay 400ms + "BLOCKED!" text
- Rent collected: coin burst toward collector 550ms
- Win: confetti + scale-bounce overlay 800ms
- Modal: scale(0.9)+opacity(0) → scale(1)+opacity(1) 220ms

---

## 📁 FOLDER STRUCTURE — CREATE EXACTLY THIS

```
monopoly-deal/
├── public/
│   ├── favicon.svg
│   └── 404.html                    ← SPA routing fix for GitHub Pages
├── src/
│   ├── components/
│   │   ├── Card/
│   │   │   ├── Card.jsx
│   │   │   ├── CardBack.jsx
│   │   │   ├── PropertyCard.jsx
│   │   │   ├── MoneyCard.jsx
│   │   │   ├── ActionCard.jsx
│   │   │   ├── RentCard.jsx
│   │   │   └── Card.module.css
│   │   ├── Hand/
│   │   │   ├── Hand.jsx
│   │   │   └── Hand.module.css
│   │   ├── Bank/
│   │   │   ├── Bank.jsx
│   │   │   └── Bank.module.css
│   │   ├── PropertyArea/
│   │   │   ├── PropertyArea.jsx
│   │   │   ├── PropertySet.jsx
│   │   │   └── PropertyArea.module.css
│   │   ├── GameBoard/
│   │   │   ├── GameBoard.jsx
│   │   │   ├── PlayerZone.jsx
│   │   │   ├── CenterPile.jsx
│   │   │   └── GameBoard.module.css
│   │   ├── Modals/
│   │   │   ├── TargetSelectModal.jsx
│   │   │   ├── PayDebtModal.jsx
│   │   │   ├── JustSayNoModal.jsx
│   │   │   ├── WildColorModal.jsx
│   │   │   ├── PassDeviceModal.jsx
│   │   │   └── Modals.module.css
│   │   ├── HUD/
│   │   │   ├── TurnIndicator.jsx
│   │   │   ├── ActionLog.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── HUD.module.css
│   │   └── WinScreen/
│   │       ├── WinScreen.jsx
│   │       └── WinScreen.module.css
│   ├── engine/
│   │   ├── cards.js
│   │   ├── deck.js
│   │   ├── gameState.js
│   │   ├── actions.js
│   │   ├── rent.js
│   │   ├── properties.js
│   │   ├── winCondition.js
│   │   └── ai.js
│   ├── store/
│   │   ├── gameStore.js
│   │   └── uiStore.js
│   ├── hooks/
│   │   ├── useGame.js
│   │   ├── useSocket.js
│   │   └── useSound.js
│   ├── multiplayer/
│   │   ├── socket.js
│   │   └── events.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Lobby.jsx
│   │   └── Game.jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── animations.css
│   ├── App.jsx
│   └── main.jsx
├── server/
│   ├── index.js
│   ├── Room.js
│   └── events.js
├── tests/
│   ├── setup.js
│   ├── engine/
│   │   ├── cards.test.js
│   │   ├── deck.test.js
│   │   ├── actions.test.js
│   │   ├── rent.test.js
│   │   └── winCondition.test.js
│   └── components/
│       └── Card.test.jsx
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── CLAUDE.md
├── GAME_DESIGN.md
├── vite.config.js
├── package.json
└── README.md
```

---

## 🌐 GITHUB PAGES — MANDATORY SETUP

### Detect the repo name automatically:
```bash
# Run this to get the repo name for vite base config
git remote get-url origin
# e.g. https://github.com/username/monopoly-deal → base is '/monopoly-deal/'
```

### `vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/monopoly-deal/',   // auto-detect from git remote, replace if different
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: true,
  },
})
```

### `public/404.html` (required for SPA routing on GitHub Pages):
```html
<!DOCTYPE html>
<html>
<head>
  <script>
    var l = window.location;
    l.replace(l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + 1).join('/') + '/?/' +
      l.pathname.slice(1).replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash);
  </script>
</head>
</html>
```

### Add to `index.html` inside `<head>` before other scripts:
```html
<script type="text/javascript">
  (function(l) {
    if (l.search[1] === '/') {
      var decoded = l.search.slice(1).split('&').map(function(s) {
        return s.replace(/~and~/g, '&')
      }).join('?');
      window.history.replaceState(null, null,
        l.pathname.slice(0, -1) + decoded + l.hash
      );
    }
  }(window.location))
</script>
```

### `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: ''
```

### `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: ['feature/**']
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### GitHub Pages activation (do this via CLI in Phase 9):
```bash
# The deploy workflow handles gh-pages branch creation automatically.
# After first deploy workflow runs, GitHub Pages will serve from gh-pages branch.
# The URL will be: https://<username>.github.io/<repo-name>/
```

---

## 📦 PACKAGE.JSON SCRIPTS — MUST INCLUDE ALL OF THESE

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .js,.jsx --max-warnings 0",
    "lint:fix": "eslint src --ext .js,.jsx --fix",
    "format": "prettier --write src",
    "server": "node server/index.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run server\""
  }
}
```

---

## 🧪 TESTING STANDARDS

- Engine: >90% line coverage required — use `npm run test:coverage` to verify
- Components: render tests + key interaction tests
- Never use `it.skip` or `describe.skip`
- Tests live in `tests/` mirroring `src/` structure
- `tests/setup.js`:
```js
import '@testing-library/jest-dom'
```

---

## ❌ ABSOLUTE PROHIBITIONS

- No `console.log` in committed code (use a `logger.js` util)
- No inline styles — CSS modules or CSS variables only
- No magic numbers — named constants only
- No `!important` in CSS
- No `any` if TypeScript is ever added
- No committing with failing tests
- No stopping between phases to ask the user
- No skipping phases
- No skipping the build/test gate before commits