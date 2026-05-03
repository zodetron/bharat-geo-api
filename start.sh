#!/usr/bin/env bash
# ============================================================
# BlueStock — Start all services (macOS)
# Usage: bash start.sh
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS=()

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[info]${RESET}  $*"; }
success() { echo -e "${GREEN}[ok]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }
step()    { echo -e "\n${BOLD}──────────────────────────────────────${RESET}"; echo -e "${BOLD}$*${RESET}"; }

# ── Cleanup on exit ───────────────────────────────────────────
cleanup() {
  echo ""
  info "Shutting down all services…"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Kill any child processes that might still be running
  kill 0 2>/dev/null || true
  success "All services stopped. Goodbye."
}
trap cleanup SIGINT SIGTERM EXIT

# ── Helper: run a service in background, stream its log ──────
# Usage: start_service <name> <port> <dir> <command>
LOG_DIR="$ROOT/.logs"
mkdir -p "$LOG_DIR"

start_service() {
  local name="$1" port="$2" dir="$3"
  shift 3
  local logfile="$LOG_DIR/${name}.log"

  info "Starting ${BOLD}$name${RESET} on port $port …"
  (cd "$dir" && "$@" > "$logfile" 2>&1) &
  PIDS+=($!)
  success "$name started  (pid=${PIDS[-1]})  log: .logs/${name}.log"
}

# ── Check prerequisites ───────────────────────────────────────
step "Checking prerequisites"

command -v node >/dev/null 2>&1 || { error "Node.js not found. Install from https://nodejs.org"; exit 1; }
NODE_VER=$(node -v)
success "Node.js $NODE_VER"

command -v npm >/dev/null 2>&1 || { error "npm not found."; exit 1; }
success "npm $(npm -v)"

# Python (optional — only needed for data import)
PYTHON=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON="$candidate"
    break
  fi
done
if [[ -n "$PYTHON" ]]; then
  success "Python $($PYTHON --version 2>&1)"
else
  warn "Python not found — data import (scripts/import_data.py) will not be available"
fi

# ── Check .env ────────────────────────────────────────────────
step "Checking environment"

if [[ ! -f "$ROOT/.env" ]]; then
  warn ".env not found — copying from .env.example"
  cp "$ROOT/.env.example" "$ROOT/.env"
  error "Please fill in DATABASE_URL and other values in .env, then re-run."
  exit 1
fi

DB_URL=$(grep -E "^DATABASE_URL=" "$ROOT/.env" | cut -d= -f2- | tr -d '"')
if [[ -z "$DB_URL" || "$DB_URL" == *"USER:PASSWORD"* ]]; then
  error "DATABASE_URL in .env is not configured. Please add your NeonDB connection string."
  exit 1
fi
success ".env looks good"

# ── Python venv setup (for import script) ────────────────────
step "Python virtual environment"

VENV_DIR="$ROOT/.venv"
VENV_PYTHON="$VENV_DIR/bin/python3"

if [[ -n "$PYTHON" ]]; then
  if [[ ! -d "$VENV_DIR" ]]; then
    info "Creating Python venv at .venv …"
    "$PYTHON" -m venv "$VENV_DIR"
    success "venv created"
  else
    success "venv already exists at .venv"
  fi

  # Install / verify Python packages
  REQUIRED_PKGS=(pandas xlrd openpyxl odfpy psycopg2-binary python-dotenv)
  MISSING=()
  for pkg in "${REQUIRED_PKGS[@]}"; do
    if ! "$VENV_PYTHON" -c "import ${pkg//-/_}" 2>/dev/null; then
      MISSING+=("$pkg")
    fi
  done

  if [[ ${#MISSING[@]} -gt 0 ]]; then
    info "Installing Python packages: ${MISSING[*]} …"
    "$VENV_DIR/bin/pip" install --quiet "${MISSING[@]}"
    success "Python packages installed"
  else
    success "All Python packages already installed"
  fi

  # Print activation reminder
  info "To run the import script manually:"
  echo -e "    ${CYAN}source .venv/bin/activate${RESET}"
  echo -e "    ${CYAN}python scripts/import_data.py${RESET}"
  echo -e "    ${CYAN}deactivate${RESET}"
else
  warn "Skipping venv setup (Python not found)"
fi

# ── Install root dependencies ─────────────────────────────────
step "Installing API server dependencies"

if [[ ! -d "$ROOT/node_modules" ]]; then
  info "Running npm install…"
  (cd "$ROOT" && npm install --silent)
else
  success "node_modules already present"
fi

# ── Generate Prisma client ────────────────────────────────────
step "Generating Prisma client"

(cd "$ROOT" && npx prisma generate --silent 2>/dev/null || npx prisma generate)
success "Prisma client generated"

# ── Install frontend dependencies ─────────────────────────────
step "Installing frontend dependencies"

for app in admin client-portal demo; do
  if [[ ! -d "$ROOT/$app/node_modules" ]]; then
    info "Installing $app dependencies…"
    (cd "$ROOT/$app" && npm install --silent)
    success "$app dependencies installed"
  else
    success "$app node_modules already present"
  fi
done

# ── Port availability check ───────────────────────────────────
step "Checking ports"

check_port() {
  local port="$1" name="$2"
  if lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
    warn "Port $port ($name) is already in use — skipping that service"
    return 1
  fi
  return 0
}

# ── Start services ────────────────────────────────────────────
step "Starting services"

# API server (uses nodemon if available, falls back to node)
if check_port 3000 "API"; then
  if (cd "$ROOT" && npx --yes nodemon --version >/dev/null 2>&1); then
    start_service "api" 3000 "$ROOT" npx nodemon server.js
  else
    start_service "api" 3000 "$ROOT" node server.js
  fi
fi

# Give the API a moment to bind before starting frontends
sleep 1

if check_port 5174 "admin"; then
  start_service "admin" 5174 "$ROOT/admin" npm run dev
fi

if check_port 5175 "client-portal"; then
  start_service "client-portal" 5175 "$ROOT/client-portal" npm run dev
fi

if check_port 5176 "demo"; then
  start_service "demo" 5176 "$ROOT/demo" npm run dev
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║         BlueStock — All services up          ║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║${RESET}  API Server      →  ${GREEN}http://localhost:3000${RESET}    ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  Admin Dashboard →  ${GREEN}http://localhost:5174${RESET}    ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  Client Portal   →  ${GREEN}http://localhost:5175${RESET}    ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  Demo App        →  ${GREEN}http://localhost:5176${RESET}    ${BOLD}║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║${RESET}  Health check:                               ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}curl http://localhost:3000/api/v1/health${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║${RESET}  Data import (run once):                     ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}source .venv/bin/activate${RESET}                 ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}python scripts/import_data.py${RESET}             ${BOLD}║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║${RESET}  Logs → ${YELLOW}.logs/<service>.log${RESET}              ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  Press ${RED}Ctrl+C${RESET} to stop all services          ${BOLD}║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""

# ── Wait ──────────────────────────────────────────────────────
# Keep script alive; cleanup trap fires on Ctrl+C
wait
