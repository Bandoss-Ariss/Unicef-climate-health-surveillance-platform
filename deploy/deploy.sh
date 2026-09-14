#!/usr/bin/env bash
# Déploiement / mise à jour sur le VPS (Ubuntu/Debian).
# Usage : sudo bash deploy/deploy.sh   (à lancer depuis le dossier du projet cloné sur le VPS)
set -euo pipefail
trap 'echo "!! Échec à la ligne $LINENO : $BASH_COMMAND" >&2' ERR

APP_DIR=/var/www/unicef-climat-sante
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Prérequis système"
apt-get update -qq
apt-get install -y -qq nginx python3 python3-venv python3-pip git curl rsync >/dev/null
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi

echo "==> Copie du code vers $APP_DIR"
mkdir -p "$APP_DIR"
rsync -a --delete --exclude node_modules --exclude .git --exclude dist "$SRC_DIR/" "$APP_DIR/"

echo "==> Backend : environnement Python"
cd "$APP_DIR/server"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

echo "==> Frontend : build de production (API en même origine)"
cd "$APP_DIR"
npm ci || npm install
VITE_API_URL="" npm run build

echo "==> Droits"
chown -R www-data:www-data "$APP_DIR"

echo "==> Vérification du port API (63000)"
if ss -ltn 2>/dev/null | grep -q ':63000 '; then
  echo "   !! Le port 63000 est déjà utilisé par un autre processus :"; ss -ltnp | grep ':63000 '
  echo "   Changez le port dans deploy/unicef-api.service et deploy/nginx.conf, puis relancez."; exit 1
fi

echo "==> Services"
cp "$APP_DIR/deploy/unicef-api.service" /etc/systemd/system/unicef-api.service
systemctl daemon-reload
systemctl enable --now unicef-api
systemctl restart unicef-api

if [ ! -f /etc/nginx/sites-available/unicef-climat-sante ]; then
  cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/unicef-climat-sante
  ln -sf /etc/nginx/sites-available/unicef-climat-sante /etc/nginx/sites-enabled/unicef-climat-sante
  rm -f /etc/nginx/sites-enabled/default
  echo "   -> Pensez à mettre votre domaine dans /etc/nginx/sites-available/unicef-climat-sante (server_name)"
fi
nginx -t && systemctl reload nginx

echo
echo "==> Terminé. Vérification :"
curl -s http://127.0.0.1/health && echo
echo "   Frontend : http://$(hostname -I | awk '{print $1}')/"
echo "   API docs : http://$(hostname -I | awk '{print $1}')/docs"
