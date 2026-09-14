# ---------- Étape 1 : build du frontend ----------
FROM node:20-alpine AS web
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=""
RUN npm run build

# ---------- Étape 2 : image finale (API + fichiers statiques servis par nginx) ----------
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends nginx && rm -rf /var/lib/apt/lists/*
WORKDIR /srv/server
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ .
COPY --from=web /app/dist /var/www/unicef-climat-sante/dist
COPY deploy/nginx.conf /etc/nginx/sites-available/unicef-climat-sante
RUN ln -sf /etc/nginx/sites-available/unicef-climat-sante /etc/nginx/sites-enabled/unicef-climat-sante \
 && rm -f /etc/nginx/sites-enabled/default \
 && sed -i 's/server_name .*/server_name _;/' /etc/nginx/sites-available/unicef-climat-sante
EXPOSE 80
CMD sh -c "uvicorn main:app --host 127.0.0.1 --port 63000 & nginx -g 'daemon off;'"
