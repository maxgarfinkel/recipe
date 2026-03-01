#!/usr/bin/env bash
set -euo pipefail

: "${VPS_USER:?VPS_USER is not set. Export it before running: export VPS_USER=<your-vps-user>}"
: "${VPS_HOST:?VPS_HOST is not set. Export it before running: export VPS_HOST=<your-vps-ip-or-hostname>}"
: "${REMOTE_DIR:?REMOTE_DIR is not set. Export it before running: export REMOTE_DIR=~/recipes}"

echo "==> Pushing local commits..."
git push

echo "==> Deploying to $VPS_HOST..."
ssh "$VPS_USER@$VPS_HOST" bash -l <<EOF
  set -euo pipefail
  cd $REMOTE_DIR
  git pull
  op run --env-file=.env --no-masking -- docker compose -f compose.prod.yaml up -d --build
  docker image prune -f
EOF

echo "==> Done. Tailing logs (Ctrl-C to stop)..."
ssh "$VPS_USER@$VPS_HOST" bash -l -c "cd $REMOTE_DIR && op run --env-file=.env --no-masking -- docker compose -f compose.prod.yaml logs --tail=50 -f"