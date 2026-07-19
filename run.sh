#!/usr/bin/env bash
# run.sh — Lives in project root. Launches backend and frontend dev servers,
# each in its own terminal window. Installs node_modules automatically if missing.

set -e

RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[1;32m'
CYAN='\033[1;36m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
BLUE='\033[1;34m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

echo -e "${BOLD}${BLUE}============================================${RESET}"
echo -e "${BOLD}${BLUE}   🚀  Starting Dev Environment Launcher${RESET}"
echo -e "${BOLD}${BLUE}============================================${RESET}"

check_dir() {
  local dir="$1"
  local label="$2"
  if [ ! -d "$dir" ]; then
    echo -e "${RED}✖ ${label} directory not found at: ${dir}${RESET}"
    exit 1
  fi
}

check_dir "$FRONTEND_DIR" "frontend"
check_dir "$BACKEND_DIR" "backend"

build_cmd() {
  local dir="$1"
  local label="$2"
  local color="$3"
  cat <<EOF
cd "$dir" && \
echo -e "${color}${BOLD}=== ${label} ===${RESET}" && \
if [ ! -d "node_modules" ]; then \
  echo -e "${YELLOW}⚠ node_modules not found. Installing dependencies for ${label}...${RESET}"; \
  npm install; \
  echo -e "${GREEN}✔ ${label} dependencies installed.${RESET}"; \
else \
  echo -e "${GREEN}✔ ${label} dependencies already present.${RESET}"; \
fi && \
echo -e "${CYAN}▶ Starting ${label} (npm run dev)...${RESET}" && \
npm run dev; \
echo -e "${RED}${label} process exited. Press Enter to close.${RESET}"; \
read
EOF
}

BACKEND_CMD=$(build_cmd "$BACKEND_DIR" "BACKEND" "$GREEN")
FRONTEND_CMD=$(build_cmd "$FRONTEND_DIR" "FRONTEND" "$CYAN")

launch_terminal() {
  local title="$1"
  local cmd="$2"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"$cmd\"" \
              -e "tell application \"Terminal\" to set custom title of front window to \"$title\" " >/dev/null
  elif command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="$title" -- bash -c "$cmd; exec bash"
  elif command -v konsole &> /dev/null; then
    konsole --new-tab -p tabtitle="$title" -e bash -c "$cmd; exec bash"
  elif command -v xterm &> /dev/null; then
    xterm -T "$title" -e bash -c "$cmd; exec bash" &
  else
    echo -e "${RED}✖ No supported terminal emulator found (tried Terminal.app, gnome-terminal, konsole, xterm).${RESET}"
    echo -e "${YELLOW}Falling back to running ${title} in background with a log file.${RESET}"
    nohup bash -c "$cmd" > "$ROOT_DIR/${title}.log" 2>&1 &
  fi
}

echo -e "${YELLOW}Launching BACKEND terminal...${RESET}"
launch_terminal "BACKEND" "$BACKEND_CMD"

sleep 1

echo -e "${YELLOW}Launching FRONTEND terminal...${RESET}"
launch_terminal "FRONTEND" "$FRONTEND_CMD"

echo -e "${GREEN}${BOLD}✔ Both terminals launched. Check the new windows for logs.${RESET}"