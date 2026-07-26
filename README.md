# PulseHR AI

PulseHR AI is a final-year Computer Science project for workforce intelligence and employee-retention decision support. It combines a React.js frontend, an Express.js API, and carefully scoped ML and AI capabilities in later phases.

## Current status

Step 3 — Database foundation is complete. The repository includes a minimal React/Vite frontend with routing and Tailwind CSS, an Express API with a health endpoint, MongoDB connection setup, and Mongoose data models. Authentication, workforce CRUD features, ML, and AI are intentionally not implemented yet.

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
