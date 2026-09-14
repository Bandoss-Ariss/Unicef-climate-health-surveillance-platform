# Déploiement sur un VPS

Deux options. La première (Nginx + systemd) est la plus simple à maintenir ; la seconde (Docker) tient en une commande.

Prérequis communs : un VPS Ubuntu 22.04/24.04 (ou Debian 12), 1 vCPU / 1 Go suffisent, un accès SSH `root` ou `sudo`, et idéalement un nom de domaine pointant sur l'IP (nécessaire pour le HTTPS).

Architecture déployée :

```
Internet ──► Nginx :80/443 ──┬── /            → fichiers statiques (dist/)
                             └── /api, /docs… → uvicorn 127.0.0.1:63000 (FastAPI)
```

L'API écoute sur **127.0.0.1:63000** (modifiable dans `deploy/unicef-api.service` et `deploy/nginx.conf` si ce port est pris). Le frontend est compilé avec `VITE_API_URL=""` : il appelle l'API sur la même origine (`/api/v1/...`), donc pas de CORS ni d'URL à changer.

---

## Option A — Nginx + systemd (recommandée)

### 1. Pousser le code sur le VPS

Depuis votre machine (VPS : `77.37.124.86`, domaine : `unicef-climat-sante.goaicorporation.org`) :

```bash
# Le dépôt contient node_modules/ : on l'exclut pour ne pas envoyer 200 Mo inutiles
rsync -az --exclude node_modules --exclude dist --exclude .git ./ root@77.37.124.86:/opt/unicef-src/
```

ou, si le projet est sur GitHub :

```bash
ssh root@77.37.124.86
git clone https://github.com/VOTRE_COMPTE/Unicef_2026.git /opt/unicef-src
```

### 2. Lancer le script d'installation

```bash
ssh root@77.37.124.86
cd /opt/unicef-src
sudo bash deploy/deploy.sh
```

Le script installe Nginx, Python, Node 20, crée l'environnement virtuel, compile le frontend, installe le service `unicef-api` et la configuration Nginx, puis affiche l'URL. Il est **ré-exécutable** : pour mettre à jour, renvoyez le code (étape 1) et relancez-le.

### 3. DNS et domaine

Chez le registrar de `goaicorporation.org`, ajouter un enregistrement **A** :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| A | `unicef-climat-sante` | `77.37.124.86` | 300 |

Vérifier la propagation : `nslookup unicef-climat-sante.goaicorporation.org` doit renvoyer `77.37.124.86`.

Le fichier `deploy/nginx.conf` (copié par le script dans `/etc/nginx/sites-available/unicef-climat-sante`) contient déjà `server_name unicef-climat-sante.goaicorporation.org 77.37.124.86;`. Si vous l'aviez modifié, vérifiez et rechargez :

```bash
sudo nano /etc/nginx/sites-available/unicef-climat-sante
sudo nginx -t && sudo systemctl reload nginx
```

### 4. HTTPS (Let's Encrypt, 2 minutes)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d unicef-climat-sante.goaicorporation.org
```

Certbot modifie la configuration Nginx et renouvelle le certificat automatiquement.

### Commandes utiles

```bash
systemctl status unicef-api          # état de l'API
journalctl -u unicef-api -f          # logs de l'API en direct
tail -f /var/log/nginx/error.log     # logs Nginx
curl http://127.0.0.1/health         # doit répondre {"status":"healthy",...}
```

---

## Option B — Docker

Sur un VPS avec Docker installé (`curl -fsSL https://get.docker.com | sh`) :

```bash
rsync -az --exclude node_modules --exclude dist --exclude .git ./ root@77.37.124.86:/opt/unicef-src/
ssh root@77.37.124.86
cd /opt/unicef-src
docker compose up -d --build
```

L'application est servie sur le port 80. La base SQLite est conservée dans le volume `api-data`. Pour mettre à jour : renvoyez le code puis `docker compose up -d --build`.

Pour le HTTPS avec Docker, le plus simple est de mettre un reverse proxy devant (Caddy ou Traefik) ou d'utiliser l'option A.

---

## Vérifications après déploiement

1. `https://unicef-climat-sante.goaicorporation.org/` → page de connexion avec le logo UNICEF.
2. Connexion avec le compte de démo → l'en-tête affiche **« API connectée · xx ms »** (vert). Si « Mode autonome » : `systemctl status unicef-api`.
3. `https://unicef-climat-sante.goaicorporation.org/docs` → Swagger de l'API.
4. Page **Carte** : le fond OpenStreetMap se charge (le VPS n'a rien à faire, c'est le navigateur du visiteur qui charge les tuiles).

## Points d'attention

- **Authentification** : le compte de démo est codé en dur dans le frontend (`src/context/AuthContext.tsx`). C'est acceptable pour une démo sur une URL non publique ; avant toute mise en production réelle, brancher le SSO UNICEF (Azure AD) côté API.
- **Ne pas exposer le port 63000** : uvicorn écoute sur 127.0.0.1 uniquement, Nginx est la seule porte d'entrée. Si un pare-feu est actif : `ufw allow 80,443/tcp`.
- **Sauvegarde** : la base SQLite est dans `/var/www/unicef-climat-sante/server/climate_health.db` (ou le volume Docker). Un `cp` quotidien suffit pour le pilote.
- **Mémoire** : le build du frontend consomme ~1 Go de RAM. Sur un VPS à 512 Mo, compilez en local (`VITE_API_URL="" npm run build`) et envoyez `dist/` avec le code.
