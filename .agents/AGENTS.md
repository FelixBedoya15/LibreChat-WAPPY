# Wappy Project Rules

- **Sincronización en Producción:** Cuando el usuario necesite sincronizar o actualizar los agentes en el servidor de producción VPS (`srv999875`), el comando exacto que SIEMPRE se debe recordar y recomendar es:
  ```bash
  docker exec -it LibreChat node scripts/restore-and-sync-all.js
  ```
  Antes de ejecutarlo, el usuario debe realizar un `git pull` en la carpeta correspondiente del VPS (usualmente `cd /root/LibreChat-WAPPY && git pull`) para descargar los últimos cambios de GitHub.
