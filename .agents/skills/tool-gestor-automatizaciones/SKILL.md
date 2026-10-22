---
name: tool-gestor-automatizaciones
description: Guía de uso, acciones y estructura de la herramienta gestor_automatizaciones para la programación y control de tareas autónomas de agentes en LibreChat-WAPPY.
---

# Skill: Herramienta Gestor de Automatizaciones (`gestor_automatizaciones`)

Esta herramienta permite a los agentes de WAPPY interactuar con el módulo **Tareas** del sistema (antes "Automatizaciones IA"; ruta `/tareas`, historial en `/tareas?tab=historial`). Ya no es una pestaña del Centro de Control: tiene botón propio en el menú lateral debajo de "Centro de Control SST". Las rutas viejas (`/sgsst/automatizaciones`, `/sgsst/control?tab=automatizaciones`) redirigen a `/tareas`. **Acceso exclusivo: Administradores y cuentas Wappy Pro** (frontend `canAccessTareas` en `client/src/utils/planAccess.ts` y middleware en `api/server/routes/sgsst/automatizaciones.js`).

## Acciones Soportadas

1. **`crear`**: Crea una nueva automatización periódica con su prompt, horario y destinatarios.
2. **`listar`**: Consulta todas las tareas programadas de la empresa activa.
3. **`actualizar`**: Modifica una tarea o cambia su estado a `active`/`inactive`.
4. **`ejecutar_ahora`**: Dispara una ejecución inmediata en segundo plano.
5. **`eliminar`**: Borra una tarea de la base de datos.
6. **`ver_logs`**: Consulta el historial de ejecuciones y sus resultados.

## Sincronización en Producción (VPS `srv999875`)

```bash
cd /root/LibreChat-WAPPY && git pull
docker exec -it LibreChat node scripts/restore-and-sync-all.js
```
