#!/bin/bash
# Convenient wrapper to run init-session.sh from the skill directory
SCRIPT_DIR="$(dirname "$0")"
bash "$SCRIPT_DIR/init-session.sh" "$@"
