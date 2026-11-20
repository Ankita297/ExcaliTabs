# ExcaliTabs

Self-hostable [Excalidraw](https://excalidraw.com) with multiple saved tabs, accounts, and sharing.

The web app (Vite + React) stores drawings per tab. The API (Go + Gin) handles register, login, tab CRUD, and sharing, and persists data in SQLite (`server/excalidraw.db`).

## Run locally

Frontend (port 5173):

```bash
pnpm install
pnpm dev
```

API (port 8080):

```bash
cd server
go run .
```

The API allows CORS from `http://localhost:5173`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Typecheck and build the static app |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm preview` | Preview the production build |

## License

MIT
