---
name: tool-gestor-automatizaciones
description: Guía de uso, acciones y estructura de la herramienta gestor_automatizaciones para la programación y control de tareas autónomas de agentes en LibreChat-WAPPY.
---

# Skill: Herramienta Gestor de Automatizaciones (`gestor_automatizaciones`)

Esta herramienta permite a los agentes de WAPPY interactuar con el módulo de automatizaciones del sistema (`/sgsst/automatizaciones`).

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
