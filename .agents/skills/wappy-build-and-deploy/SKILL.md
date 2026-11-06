---
name: wappy-build-and-deploy
description: "Procedimiento obligatorio de compilación local del frontend (npm run build:client), control de client/dist en Git y despliegue en Dokploy / VPS (srv999875)."
category: devops-and-governance
bundle: wappy-ops-and-governance
risk: critical
source: self
source_type: self
date_added: "2026-10-28"
author: wappy-ia
agents: [wappy-qa-devops]
tags: [build, deploy, dokploy, vps, docker, client-dist, git]
---

# Compilación Local (`client/dist`) & Despliegue en Dokploy / VPS (`wappy-build-and-deploy`)

## Overview

Esta skill define el flujo obligatorio de compilación local del frontend (`client/dist`), control de versiones en Git y sincronización en el servidor de producción (`srv999875`) para **LibreChat-WAPPY**.

## When to Use

- **Usar SIEMPRE** que se cree, modifique o elimine cualquier archivo en `client/src/**/*` o `packages/client/**/*`, o cuando el usuario solicite desplegar cambios a producción (`srv999875`).

## Prerequisites

- Entorno Node.js local con dependencias instaladas para `npm run build:client`.
- Verificación sintáctica previa (`node -c <archivo.js>`) si también se modificaron archivos del backend.

---

## How It Works

### 1. Compilación Local Obligatoria (`Dockerfile.multi`)

En producción (`srv999875` / `72.60.124.130`), Dokploy usa `Dockerfile.multi`, el cual **NO ejecuta `npm run build` en el servidor**, sino que copia directamente:
```dockerfile
COPY client/dist ./client/dist
```

Por lo tanto, siempre que se cree, edite o elimine cualquier archivo en `client/src/**/*` o `packages/client/**/*`:
1. **Ejecutar compilación local:**
   ```bash
   npm run build:client
   ```
2. **Incluir código fuente y bundle compilado en el commit:**
   ```bash
   git add client/src client/dist
   git commit -m "feat/fix(...): descripción + build client/dist"
   git push origin main
   ```
3. **Prohibido** hacer commit solo de `client/src` sin actualizar `client/dist`.

---

### 2. Sincronización en el VPS de Producción (`srv999875`)

Cuando el usuario solicite desplegar o sincronizar en el servidor VPS (`srv999875`):

```bash
cd /root/LibreChat-WAPPY && git pull
docker cp /root/LibreChat-WAPPY/client/dist/. LibreChat:/app/client/dist/
docker exec -it LibreChat node scripts/restore-and-sync-all.js
```

- Si hubo cambios en planes o esquemas:
  ```bash
  docker exec -it LibreChat node update_plans.js
  ```
- Si se requiere disparar el webhook de Dokploy:
  ```bash
  curl -X GET "http://72.60.124.130:3000/api/deploy/compose/gqcBaGhm5xDAuXlgop-PA"
  ```

---

## Verification

- Comprobar que `npm run build:client` finalice con código de salida `0`.
- En despliegues a producción, verificar el estado y los logs del contenedor:
  ```bash
  docker ps --filter "name=LibreChat"
  docker logs --tail 50 LibreChat
  ```

## Safety and Side Effects

- **Risk level:** `critical` — Modifica el bundle de producción (`client/dist`) y actualiza el contenedor activo en el VPS. Confirmar con el usuario antes de desplegar a producción si no lo solicitó explícitamente.

## Sources and Related Skills

- [`wappy-ui-design-system`](../wappy-ui-design-system/SKILL.md)
- [`verify-ai-models`](../verify-ai-models/SKILL.md)
- [`wappy-procedural-memory`](../wappy-procedural-memory/SKILL.md)
