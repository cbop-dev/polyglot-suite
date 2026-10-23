#!/usr/bin/env bash
set -e

# Parse command line flags
CUSTOM_ENV_FILE=""
SKIP_BUILD=false
PROMOTE=false
ROLLBACK=false
SHOW_HISTORY=false
CLEAN_ONLY=false

while [ $# -gt 0 ]; do
  case "$1" in
    --env=*)
      CUSTOM_ENV_FILE="${1#*=}"
      shift
      ;;
    --env)
      CUSTOM_ENV_FILE="$2"
      shift 2
      ;;
    --no-build|--skip-build|-n)
      SKIP_BUILD=true
      shift
      ;;
    --promote)
      PROMOTE=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    --history)
      SHOW_HISTORY=true
      shift
      ;;
    --clean)
      CLEAN_ONLY=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --env <file>          Path to custom .env file (e.g., .env.vps, .env.deploy)"
      echo "  --promote             Promote staging release to live"
      echo "  --rollback            Roll back live release to previous stack release"
      echo "  --history             Show live deployment history stack and active targets"
      echo "  --clean               Clean up old releases (keeps top 5 + protected)"
      echo "  --no-build, -n        Skip local build step and deploy existing build/www/"
      echo "  --help, -h            Show this help message"
      exit 0
      ;;
    *)
      echo "⚠️ Unknown argument: $1 (ignoring)"
      shift
      ;;
  esac
done

# Load environment variables
if [ -n "$CUSTOM_ENV_FILE" ]; then
  if [ -f "$CUSTOM_ENV_FILE" ]; then
    echo "Using environment file: $CUSTOM_ENV_FILE"
    export $(grep -v '^#' "$CUSTOM_ENV_FILE" | xargs)
  else
    echo "❌ Error: Specified environment file '$CUSTOM_ENV_FILE' not found."
    exit 1
  fi
elif [ -f .env.deploy ]; then
  export $(grep -v '^#' .env.deploy | xargs)
elif [ -f ../.env.deploy ]; then
  export $(grep -v '^#' ../.env.deploy | xargs)
fi

# Verify required environment variables
if [ -z "$VPS_USER" ] || [ -z "$VPS_HOST" ] || [ -z "$VPS_PATH" ]; then
  echo "❌ Error: Missing configuration in .env.deploy"
  echo "Please make sure .env.deploy exists with VPS_USER, VPS_HOST, and VPS_PATH set."
  exit 1
fi

VPS_PORT="${VPS_PORT:-22}"
VPS_ROOT="${VPS_PATH%/}"
SSH_CMD="ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}"

do_cleanup() {
  $SSH_CMD bash -s <<EOF
    set -e
    HISTORY_FILE="${VPS_ROOT}/live_history.txt"
    PROTECTED=()
    [ -d "${VPS_ROOT}/staging" ] && PROTECTED+=("\$(readlink -f ${VPS_ROOT}/staging)")
    [ -d "${VPS_ROOT}/live" ] && PROTECTED+=("\$(readlink -f ${VPS_ROOT}/live)")
    if [ -f "\$HISTORY_FILE" ]; then
      while IFS= read -r line; do
        [ -n "\$line" ] && PROTECTED+=("\$line")
      done < "\$HISTORY_FILE"
    fi
    for dir in ${VPS_ROOT}/releases/*; do
      [ -d "\$dir" ] || continue
      REAL_DIR="\$(readlink -f "\$dir")"
      KEEP=false
      for p in "\${PROTECTED[@]}"; do
        if [ "\$REAL_DIR" = "\$p" ]; then
          KEEP=true
          break
        fi
      done
      if [ "\$KEEP" = false ]; then
        echo "Removing unreferenced release: \$dir"
        rm -rf "\$dir"
      fi
    done
EOF
}

if [ "$CLEAN_ONLY" = true ]; then
  echo "🧹 Cleaning unreferenced releases on remote VPS..."
  do_cleanup
  echo "✅ Remote cleanup complete."
  exit 0
fi

if [ "$SHOW_HISTORY" = true ]; then
  echo "📜 Deployment History on ${VPS_HOST}:"
  $SSH_CMD bash -s <<EOF
    echo "--- Active Targets ---"
    echo "Staging: \$(readlink ${VPS_ROOT}/staging || echo 'none')"
    echo "Live:    \$(readlink ${VPS_ROOT}/live || echo 'none')"
    echo ""
    echo "--- Live Rollback Stack (most recent first) ---"
    if [ -f "${VPS_ROOT}/live_history.txt" ]; then
      cat -n "${VPS_ROOT}/live_history.txt"
    else
      echo "(no history file found)"
    fi
EOF
  exit 0
fi

if [ "$ROLLBACK" = true ]; then
  echo "⏪ Rolling back live release on ${VPS_HOST}..."
  $SSH_CMD bash -s <<EOF
    set -e
    HISTORY_FILE="${VPS_ROOT}/live_history.txt"
    if [ ! -f "\$HISTORY_FILE" ] || [ \$(wc -l < "\$HISTORY_FILE") -lt 2 ]; then
      echo "❌ Error: No previous release to rollback to in history stack."
      exit 1
    fi
    CURRENT_LIVE="\$(head -n 1 "\$HISTORY_FILE")"
    PREVIOUS_LIVE="\$(sed -n '2p' "\$HISTORY_FILE")"
    if [ ! -d "\$PREVIOUS_LIVE" ]; then
      echo "❌ Error: Target rollback directory does not exist: \$PREVIOUS_LIVE"
      exit 1
    fi
    ln -sfn "\$PREVIOUS_LIVE" "${VPS_ROOT}/live"
    sed -i '1d' "\$HISTORY_FILE"
    echo "✅ Successfully rolled back live to: \$(basename "\$PREVIOUS_LIVE")"
EOF
  exit 0
fi

if [ "$PROMOTE" = true ]; then
  echo "🚀 Promoting staging to live on ${VPS_HOST}..."
  $SSH_CMD bash -s <<EOF
    set -e
    if [ ! -d "${VPS_ROOT}/staging" ]; then
      echo "❌ Error: No staging release found to promote."
      exit 1
    fi
    TARGET_DIR="\$(readlink -f "${VPS_ROOT}/staging")"
    ln -sfn "\$TARGET_DIR" "${VPS_ROOT}/live"
    HISTORY_FILE="${VPS_ROOT}/live_history.txt"
    touch "\$HISTORY_FILE"
    sed -i "\#^\$TARGET_DIR\\\$#d" "\$HISTORY_FILE"
    { echo "\$TARGET_DIR"; cat "\$HISTORY_FILE"; } > "\${HISTORY_FILE}.tmp"
    head -n 5 "\${HISTORY_FILE}.tmp" > "\$HISTORY_FILE"
    rm -f "\${HISTORY_FILE}.tmp"
    echo "✅ Successfully promoted to live: \$(basename "\$TARGET_DIR")"
EOF
  do_cleanup
  exit 0
fi

# Standard Staging Deployment
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="${VPS_ROOT}/releases/${TIMESTAMP}"

if [ "$SKIP_BUILD" = false ]; then
  echo "📦 Building static application..."
  npm run build:static
else
  echo "⏩ Skipping build step (--no-build specified)"
fi

BUILD_DIR="build/www"
if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Error: Build directory '$BUILD_DIR' not found."
  exit 1
fi

echo "🚀 Deploying to staging on ${VPS_HOST}:${VPS_PORT}..."
$SSH_CMD "mkdir -p ${VPS_ROOT}/releases"
rsync -avz --delete -e "ssh -p ${VPS_PORT}" "${BUILD_DIR}/" "${VPS_USER}@${VPS_HOST}:${RELEASE_DIR}/"

$SSH_CMD bash -s <<EOF
  set -e
  ln -sfn "${RELEASE_DIR}" "${VPS_ROOT}/staging"
EOF

echo ""
echo "✅ Staging deployment successful!"
echo "Target release: ${RELEASE_DIR}"
echo "To promote to live, run:"
echo "  npm run deploy:www:promote"
