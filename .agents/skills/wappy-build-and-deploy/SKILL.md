---
name: wappy-build-and-deploy
description: >-
  Procedimiento maestro de compilación local del frontend (`npm run build:client`), control de `client/dist` en Git y despliegue/sincronización en Dokploy y VPS de producción (`srv999875`). Úsala SIEMPRE que se modifique `client/src/**` o se solicite hacer deploy al servidor.
---

# Compilación Local (`client/dist`) & Despliegue en Dokploy / VPS (`srv999875`)

Esta skill consolida el flujo obligatorio de compilación frontend y sincronización en producción de **LibreChat-WAPPY**.

---

## 1. Compilación Local Obligatoria (`Dockerfile.multi`)

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

## 2. Sincronización en el VPS de Producción (`srv999875`)

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
- Verificación post-deploy:
  ```bash
  docker ps --filter "name=LibreChat"
  docker logs --tail 50 LibreChat
  ```
