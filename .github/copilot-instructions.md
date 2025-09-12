# VirtuRPG Copilot Instructions

## Architecture Overview
- **Full-stack RPG platform**: Backend (Node.js/Express/SQLite/Socket.IO) serves REST API + WebSocket; Frontend (React/Vite/TypeScript) consumes via fetch + Socket.IO client.
- **Key components**: AuthContext (JWT in sessionStorage), useSocket hook (manages Socket.IO connections), pages under `src/pages/` (e.g., Login, Campanhas, PaginaCampanha with nested routes).
- **Data flows**: API endpoints like `/campanha/:id` for CRUD; Socket events like `novaMensagem` for chat, `users_online` for real-time presence.
- **Structural decisions**: Strict separation of concerns; backend enforces auth, frontend mirrors checks; real-time features via Socket.IO for chat/salas.

## Critical Workflows
- **Development**: Run `npm run dev` in `frontend/` for hot-reload React app; `node server.js` in `backend/` for API/WebSocket server.
- **Build**: `npm run build` in `frontend/` outputs to `dist/`; backend has no build step.
- **Debugging**: Use browser dev tools for frontend; console.log in backend; Socket.IO debug via `socket.on('connect_error')`.
- **No tests**: Project lacks automated tests; validate manually via UI/API calls.

## Project-Specific Patterns
- **Authentication**: JWT stored in `sessionStorage`; use `useAuth` hook for `accessToken`/`user`; include `Authorization: Bearer ${token}` in API calls.
- **State management**: Local state for forms (e.g., `isEditing` toggles edit mode with save/cancel); `useOutletContext` shares `campanha` object across nested routes like `PaginaCampanha/*`.
- **Networking**: Use native `fetch` (no axios); handle errors with `.catch()`; Socket.IO for real-time (e.g., `socket.emit('entrarSalaChat', salaId)`).
- **Styling**: CSS modules/classes with CSS variables (e.g., `--accent-yellow`); responsive design with media queries; gradients for buttons/badges.
- **Data types**: Interfaces in `src/types.ts` (e.g., `Campanha` with `mestres: string[]`); arrays for multi-value fields like tags/jogadores.
- **Editing pattern**: Toggle `isEditing` state; render inputs vs. display; on save, PATCH to API; on cancel, revert local state.

## Integration Points
- **Socket.IO**: Connect to `http://localhost:3000` with auth token; listen for events like `users_online`; emit joins/leaves for campaigns/salas.
- **External deps**: SQLite via `better-sqlite3`; no external APIs beyond self-hosted.
- **Cross-component comms**: Context for global state (auth); props for component-specific data; WebSocket for real-time updates.

## Key Files
- `src/types.ts`: Core interfaces (User, Campanha).
- `src/context/AuthContext.tsx`: Auth logic and token management.
- `src/hooks/useSocket.ts`: Socket connection wrapper.
- `backend/server.js`: Main API/WebSocket server.
- `frontend/src/pages/PaginaCampanha/`: Campaign pages with shared context.