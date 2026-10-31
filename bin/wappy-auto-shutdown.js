#!/usr/bin/env node
/**
 * WAPPY IA — Asistente de Apagado / Reposo Programado con Confirmación en Pantalla
 * =================================================================================
 * Muestra un cuadro de diálogo nativo en macOS (con alerta sonora) preguntando si
 * deseas apagar el equipo, ponerlo en reposo o cancelar para seguir trabajando.
 *
 * - Si haces clic en "Cancelar (Seguir trabajando)": aborta el apagado.
 * - Si haces clic en "Apagar ahora" o si transcurren 10 minutos (600s) sin respuesta:
 *   ejecuta el apagado automático (o entra en reposo seguro si alguna app bloquea el cierre).
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_FILE = path.join(os.homedir(), '.gemini', 'antigravity', 'wappy-healthcheck.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] [WAPPY AutoShutdown] ${msg}\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (_) {}
  process.stdout.write(line);
}

function runShutdownDialog() {
  log('🔔 Mostrando ventana de confirmación de apagado (espera máxima: 10 minutos / 600s)...');

  const appleScript = `
    beep 2
    set dialogResult to display dialog "🌙 Jornada finalizada en WAPPY IA.\\n\\n¿Deseas apagar tu Mac ahora o prefieres seguir trabajando?\\n\\n⏳ Si no respondes en 10 minutos, el equipo se apagará automáticamente." buttons {"Cancelar (Seguir trabajando)", "Modo Reposo", "Apagar ahora"} default button "Apagar ahora" with title "WAPPY IA — Apagado Automático Programado" with icon caution giving up after 600
    if gave up of dialogResult is true then
      return "TIMEOUT_SHUTDOWN"
    else
      return button returned of dialogResult
    end if
  `;

  let choice = '';
  try {
    choice = execFileSync('/usr/bin/osascript', ['-e', appleScript], {
      encoding: 'utf8',
      timeout: 620000,
    }).trim();
  } catch (err) {
    // Si el usuario presiona ESC o cierra la ventana, se interpreta como Cancelar
    log('🛑 Usuario canceló el apagado (ESC / cierre de ventana). El equipo permanece encendido.');
    return;
  }

  log(`Respuesta del cuadro de diálogo: "${choice}"`);

  if (choice === 'Cancelar (Seguir trabajando)') {
    log('🟢 Apagado cancelado por el usuario. Puedes seguir trabajando normalmente.');
    return;
  }

  if (choice === 'Modo Reposo') {
    log('💤 Poniendo el Mac en Modo Reposo por elección del usuario...');
    try {
      execFileSync('/usr/bin/osascript', ['-e', 'tell application "System Events" to sleep']);
    } catch (_) {
      try {
        execFileSync('/usr/bin/pmset', ['sleepnow']);
      } catch (_) {}
    }
    return;
  }

  if (choice === 'Apagar ahora' || choice === 'TIMEOUT_SHUTDOWN') {
    log(
      choice === 'TIMEOUT_SHUTDOWN'
        ? '⏰ Transcurrieron 10 minutos sin respuesta. Ejecutando apagado automático del Mac...'
        : '🔌 Usuario confirmó "Apagar ahora". Ejecutando apagado del Mac...'
    );
    try {
      execFileSync('/usr/bin/osascript', ['-e', 'tell application "System Events" to shut down']);
    } catch (err) {
      log(`⚠️ No se pudo apagar por System Events (${err.message}). Poniendo en Modo Reposo como respaldo...`);
      try {
        execFileSync('/usr/bin/pmset', ['sleepnow']);
      } catch (_) {}
    }
  }
}

runShutdownDialog();
