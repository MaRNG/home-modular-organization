#!/usr/bin/env bash
# Nasazení MOD na https://mod.marng.dev (statický web za Caddy).
#
#   deploy/deploy.sh setup      – jednorázově: adresáře na serveru + Caddy konfigurace (lze opakovat)
#   deploy/deploy.sh            – nahrání nové verze public/ (releases/<čas>, přepnutí symlinku current)
#   deploy/deploy.sh rollback   – návrat na předchozí verzi
#   deploy/deploy.sh status     – aktuální a dostupné verze
#
# Proměnné: HOST (výchozí marng-contabo), KEEP (počet ponechaných verzí, výchozí 5).
set -euo pipefail

HOST="${HOST:-marng-contabo}"
DOMAIN="mod.marng.dev"
BASE="/www/$DOMAIN"
KEEP="${KEEP:-5}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
remote() { ssh -o BatchMode=yes "$HOST" "$@"; }

setup() {
  log "Adresáře na $HOST:$BASE"
  # root:caddy – Caddy čte přes svou primární skupinu, není potřeba restart kvůli členství ve skupině.
  remote "install -d -o root -g caddy -m 750 '$BASE' '$BASE/releases'"
  log "Caddy konfigurace /etc/caddy/sites/$DOMAIN.caddy"
  scp -q "$ROOT/deploy/$DOMAIN.caddy" "$HOST:/etc/caddy/sites/$DOMAIN.caddy"
  # Log musí patřit uživateli caddy – `caddy validate` (běží jako root) by ho jinak založil s vlastníkem root
  # a následný reload by selhal na „permission denied“.
  remote "touch /var/log/caddy/$DOMAIN.log && chown caddy:caddy /var/log/caddy/$DOMAIN.log && chmod 600 /var/log/caddy/$DOMAIN.log \
    && chmod 644 /etc/caddy/sites/$DOMAIN.caddy \
    && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null \
    && chown caddy:caddy /var/log/caddy/$DOMAIN.log \
    && timeout 60 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile"
  log "Hotovo. Teď spusť: deploy/deploy.sh"
}

deploy() {
  cd "$ROOT"
  # Bez build kroku: nasazuje se přímo public/, závislosti v public/vendor/ doplní `npm run vendor`.
  if [[ ! -f public/vendor/openscad/openscad.wasm || ! -d public/vendor/fonts ]]; then
    log "Chybí public/vendor/, doplňuji (npm install && npm run vendor)"
    npm install --silent && npm run vendor
  fi
  if [[ -n "$(git status --porcelain -- public 2>/dev/null)" ]]; then
    echo "V public/ jsou necommitnuté změny – nejdřív je commitni (verze se jmenuje podle commitu)." >&2
    exit 1
  fi
  local rel
  rel="$(date +%Y%m%d-%H%M%S)"
  if git rev-parse --short HEAD >/dev/null 2>&1; then rel="$rel-$(git rev-parse --short HEAD)"; fi
  log "Nahrávám verzi $rel"
  remote "install -d -o root -g caddy -m 750 '$BASE/releases/$rel'"
  rsync -a --delete --chmod=D750,F640 --chown=root:caddy public/ "$HOST:$BASE/releases/$rel/www/"
  log "Přepínám current → releases/$rel"
  remote "cd '$BASE' && chown -h root:caddy releases/$rel && chmod 750 releases/$rel \
    && ln -sfn 'releases/$rel' current.tmp && mv -Tf current.tmp current \
    && ls -1dt releases/*/ | grep -v backup | tail -n +$((KEEP + 1)) | xargs -r rm -rf"
  log "Nasazeno: https://$DOMAIN"
}

rollback() {
  local prev
  prev="$(remote "cd '$BASE' && cur=\$(readlink current) && ls -1d releases/*/ | sed 's#/\$##' | sort | grep -B1 -x \"\$cur\" | head -1")"
  if [[ -z "$prev" || "$prev" == "$(remote "readlink '$BASE/current'")" ]]; then
    echo "Není na co se vrátit." >&2
    exit 1
  fi
  remote "cd '$BASE' && ln -sfn '$prev' current.tmp && mv -Tf current.tmp current"
  log "Vráceno na $prev"
}

status() {
  remote "cd '$BASE' && echo \"current -> \$(readlink current)\" && ls -1d releases/*/"
}

case "${1:-deploy}" in
  setup) setup ;;
  deploy) deploy ;;
  rollback) rollback ;;
  status) status ;;
  *) echo "Použití: $0 [setup|deploy|rollback|status]" >&2; exit 1 ;;
esac
