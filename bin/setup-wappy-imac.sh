#!/usr/bin/env bash
# ==============================================================================
# WAPPY IA — Instalador Maestro de Estación Principal en iMac (1 Clic)
# ==============================================================================
# Configura automáticamente en el iMac:
# 1. El Puente Reactivo WAPPY <-> Google Antigravity (wappy-push-daemon.js)
# 2. El Monitor y Auto-Reconectador (7:00 AM, 2:00 PM, 6:00 PM y al prender el Mac)
# 3. El Asistente de Apagado / Reposo con aviso de 10 minutos (6:10 PM)
# 4. La clave API maestra (wpy_live_...) y los permisos MCP de WAPPY
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGY_DIR="$HOME/.gemini/antigravity"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
API_KEY="${1:-wpy_live_f487a9da14bbd25d768e408172443f3fcf157c0f0bf6c084}"
WAPPY_URL="https://wappy.club"

echo "🚀 Iniciando configuración de Estación Principal WAPPY IA en este Mac..."
mkdir -p "$AGY_DIR" "$LAUNCH_DIR"

# Localizar binario de Node.js
NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node /usr/local/Cellar/node/*/bin/node; do
    if [ -x "$candidate" ]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

if [ -z "$NODE_BIN" ]; then
  echo "❌ No se encontró Node.js instalado. Instálalo primero desde https://nodejs.org o con 'brew install node'."
  exit 1
fi

echo "✅ Node.js detectado en: $NODE_BIN"

# 1. Copiar scripts oficiales a ~/.gemini/antigravity/
cp "$REPO_DIR/bin/wappy-antigravity-daemon.js" "$AGY_DIR/wappy-push-daemon.js"
cp "$REPO_DIR/bin/wappy-antigravity-daemon.js" "$AGY_DIR/wappy-tenshi-listener.js"
cp "$REPO_DIR/bin/wappy-connectors-healthcheck.js" "$AGY_DIR/wappy-connectors-healthcheck.js"
cp "$REPO_DIR/bin/wappy-auto-shutdown.js" "$AGY_DIR/wappy-auto-shutdown.js"
chmod 755 "$AGY_DIR/wappy-push-daemon.js" "$AGY_DIR/wappy-tenshi-listener.js" "$AGY_DIR/wappy-connectors-healthcheck.js" "$AGY_DIR/wappy-auto-shutdown.js"

# 2. Instalar y activar el Daemon Reactivo de Antigravity con la API Key
"$NODE_BIN" "$AGY_DIR/wappy-push-daemon.js" --install --key="$API_KEY" --url="$WAPPY_URL"

# 3. Crear LaunchAgent para el HealthCheck (Lunes a Sábado: 7:00 AM, 2:00 PM, 6:00 PM + Al Prender)
cat > "$LAUNCH_DIR/club.wappy.connectors.healthcheck.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>club.wappy.connectors.healthcheck</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>for n in '$NODE_BIN' /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node "\$HOME"/.volta/bin/node "\$HOME"/.nvm/versions/node/*/bin/node; do if [ -x "\$n" ]; then exec "\$n" '$AGY_DIR/wappy-connectors-healthcheck.js' --trigger=schedule; fi; done; exit 1</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>6</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>6</integer><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>6</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>/dev/null</string>
  <key>StandardErrorPath</key>
  <string>$AGY_DIR/wappy-healthcheck.log</string>
</dict>
</plist>
EOF

# 4. Crear LaunchAgent para el Aviso de Apagado / Reposo (Lunes a Sábado: 6:10 PM)
cat > "$LAUNCH_DIR/club.wappy.auto.shutdown.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>club.wappy.auto.shutdown</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>for n in '$NODE_BIN' /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node "\$HOME"/.volta/bin/node "\$HOME"/.nvm/versions/node/*/bin/node; do if [ -x "\$n" ]; then exec "\$n" '$AGY_DIR/wappy-auto-shutdown.js'; fi; done; exit 1</string>
  </array>
  <key>RunAtLoad</key>
  <false/>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>10</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>10</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>10</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>10</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>10</integer></dict>
    <dict><key>Weekday</key><integer>6</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>10</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>/dev/null</string>
  <key>StandardErrorPath</key>
  <string>$AGY_DIR/wappy-healthcheck.log</string>
</dict>
</plist>
EOF

# 5. Cargar LaunchAgents y Crontab
launchctl unload "$LAUNCH_DIR/club.wappy.connectors.healthcheck.plist" 2>/dev/null || true
launchctl load -w "$LAUNCH_DIR/club.wappy.connectors.healthcheck.plist"
launchctl unload "$LAUNCH_DIR/club.wappy.auto.shutdown.plist" 2>/dev/null || true
launchctl load -w "$LAUNCH_DIR/club.wappy.auto.shutdown.plist"

(crontab -l 2>/dev/null | grep -v "wappy-connectors-healthcheck" || true ; echo "@reboot $NODE_BIN $AGY_DIR/wappy-connectors-healthcheck.js --trigger=boot >/dev/null 2>&1" ; echo "0 7,14,18 * * 1-6 $NODE_BIN $AGY_DIR/wappy-connectors-healthcheck.js --trigger=cron >/dev/null 2>&1") | crontab -

echo ""
echo "✅ ¡Estación Principal WAPPY IA configurada con éxito en tu iMac!"
echo "👉 Paso siguiente opcional para encender el iMac a las 6:50 AM:"
echo "   sudo pmset repeat wakeorpoweron MTWRFS 06:50:00"
echo "👉 Para vincular la sesión de Chrome de NotebookLM y Google Flow en este iMac:"
echo "   node ~/.gemini/antigravity/wappy-push-daemon.js --notebooklm"
echo "   node ~/.gemini/antigravity/wappy-push-daemon.js --googleflow"
