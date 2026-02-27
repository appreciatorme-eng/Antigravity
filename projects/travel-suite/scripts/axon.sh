#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${PROJECT_ROOT}/.venv-axon"
AXON_BIN="${VENV_DIR}/bin/axon"
PIP_BIN="${VENV_DIR}/bin/pip"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/axon.sh analyze [--full] [--with-embeddings]
  ./scripts/axon.sh status
  ./scripts/axon.sh query "<text>"
  ./scripts/axon.sh context "<symbol>"
  ./scripts/axon.sh impact "<symbol>" [depth]
  ./scripts/axon.sh dead-code
  ./scripts/axon.sh watch
  ./scripts/axon.sh mcp

Notes:
  - Index data is stored in ./.axon (gitignored).
  - Default analyze mode uses --no-embeddings for fast local runs.
EOF
}

ensure_axon() {
  if [[ -x "${AXON_BIN}" ]]; then
    return
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required but was not found." >&2
    exit 1
  fi

  python3 -m venv "${VENV_DIR}"
  "${PIP_BIN}" install --upgrade pip >/dev/null
  "${PIP_BIN}" install axoniq >/dev/null
}

main() {
  local cmd="${1:-help}"
  shift || true

  if [[ "${cmd}" == "help" || "${cmd}" == "--help" || "${cmd}" == "-h" ]]; then
    usage
    exit 0
  fi

  ensure_axon
  cd "${PROJECT_ROOT}"

  case "${cmd}" in
    analyze)
      local full_flag=""
      local embeddings_flag="--no-embeddings"
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --full)
            full_flag="--full"
            shift
            ;;
          --with-embeddings)
            embeddings_flag=""
            shift
            ;;
          *)
            echo "Unknown analyze option: $1" >&2
            usage
            exit 1
            ;;
        esac
      done
      "${AXON_BIN}" analyze . ${full_flag} ${embeddings_flag}
      ;;
    status)
      "${AXON_BIN}" status
      ;;
    query)
      if [[ $# -lt 1 ]]; then
        echo "query requires a search string." >&2
        exit 1
      fi
      "${AXON_BIN}" query "$*"
      ;;
    context)
      if [[ $# -ne 1 ]]; then
        echo "context requires exactly one symbol name." >&2
        exit 1
      fi
      "${AXON_BIN}" context "$1"
      ;;
    impact)
      if [[ $# -lt 1 || $# -gt 2 ]]; then
        echo "impact requires a symbol and optional depth." >&2
        exit 1
      fi
      if [[ $# -eq 2 ]]; then
        "${AXON_BIN}" impact "$1" -d "$2"
      else
        "${AXON_BIN}" impact "$1"
      fi
      ;;
    dead-code)
      "${AXON_BIN}" dead-code
      ;;
    watch)
      "${AXON_BIN}" watch
      ;;
    mcp)
      "${AXON_BIN}" serve --watch
      ;;
    *)
      echo "Unknown command: ${cmd}" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
