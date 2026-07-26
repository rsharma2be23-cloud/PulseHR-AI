# PulseHR AI

PulseHR AI is a final-year Computer Science project for workforce intelligence and employee-retention decision support. It will combine a React/TypeScript frontend, an Express/TypeScript API, and carefully scoped ML and AI capabilities in later phases.

## Current status

Step 2 — Project foundation is complete. The repository currently includes a minimal React/Vite frontend with routing and Tailwind CSS, plus an Express API with a health endpoint. Database, authentication, workforce features, ML, and AI are intentionally not implemented yet.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Run the backend

```bash
cd backend
npm install
npm run dev
```

The API starts at `http://localhost:5000` by default. Check `GET /api/v1/health` to confirm it is running.
