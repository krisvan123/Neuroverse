# Multi-stage, same-origin full-stack release; no account credentials in images.
FROM node:22-alpine AS web-builder
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ENV VITE_API_BASE_URL=""
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    NEUROVERSE_STATIC_DIR=/app/site
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/backend/requirements.txt \
    && useradd --system --uid 10001 --home-dir /app neuroverse
COPY backend/app/ /app/backend/app/
COPY --from=web-builder /build/frontend/dist/ /app/site/
USER 10001
EXPOSE 10000
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
