# ---------- FRONTEND BUILD ----------
FROM node:20-alpine AS frontend

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build


# ---------- BACKEND ----------
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY --from=frontend /frontend/dist ./frontend/dist

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "10000"]
