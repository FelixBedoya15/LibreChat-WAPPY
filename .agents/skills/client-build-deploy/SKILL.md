---
name: client-build-deploy
description: >-
  Regla y procedimiento obligatorio de compilación local del frontend (`npm run build:client`), actualización de `client/dist` en Git y despliegue en Dokploy/VPS.
---

# Compilación Local del Frontend & Despliegue en Dokploy / VPS

Esta skill es de **CUMPLIMIENTO OBLIGATORIO** para cualquier agente o desarrollador que modifique la interfaz de usuario (`client/src/**` o paquetes compartidos).

---

## 1. La Arquitectura de Despliegue en Dokploy

En nuestro servidor de producción (Dokploy en `srv999875` / `72.60.124.130`), los despliegues utilizan **`Dockerfile.multi`**:

```dockerfile
# Dockerfile.multi
COPY packages/data-provider/dist ./packages/data-provider/dist
COPY packages/data-schemas/dist ./packages/data-schemas/dist
COPY packages/api/dist ./packages/api/dist
COPY packages/client/dist ./packages/client/dist
COPY client/dist ./client/dist
```

> [!CAUTION]
> **Dokploy NO ejecuta `npm run build` en el servidor.**
> Dokploy simplemente clona el repositorio de GitHub y copia la carpeta precompilada `client/dist` al contenedor Docker.
> En `.gitignore`, `client/dist/` está explícitamente permitida (`!client/dist/`) para estar bajo control de versiones.

---

## 2. Regla de Oro: Compilar SIEMPRE en Local

Si realizas cambios en:
- `client/src/**/*` (componentes React, páginas, hooks, estilos CSS, constantes)
- `packages/client/**/*`
- Cualquier vista pública o privada (`SGSST`, `RutaAprendizaje`, etc.)

**ESTÁ ESTRICTAMENTE PROHIBIDO** hacer `git commit` y `git push` únicamente de los archivos `.tsx` / `.jsx`. Si lo haces, Dokploy desplegará el bundle compilado viejo y los usuarios en producción seguirán viendo la versión antigua.

---

## 3. Protocolo Obligatorio Paso a Paso

### Paso 1: Ejecutar la compilación local
Desde la raíz del proyecto (`LibreChat-WAPPY`), ejecuta:

```bash
npm run build:client
```

*Verifica que la salida termine con éxito (`✓ built in ...` y `✅ PWA icons... copied successfully`).*

### Paso 2: Verificar cambios en `client/dist`
Ejecuta:

```bash
git status
```

Debes ver archivos modificados y nuevos dentro de `client/dist/assets/`.

### Paso 3: Incluir `client/dist` en el Commit
Agrega tanto el código fuente como los archivos compilados:

```bash
git add client/src client/dist
git commit -m "feat/fix(...): descripción del cambio + compilación de client/dist"
git push origin main
```

### Paso 4: Auto-deploy en Dokploy
Una vez enviado a `origin/main`, Dokploy detectará el commit automáticamente y desplegará la versión que **ya contiene los archivos estáticos nuevos compilados**.

---

## 4. Comandos de Emergencia en el VPS (`srv999875`)

Si por alguna razón se requiere sincronización manual directa en el VPS:

```bash
cd /root/LibreChat-WAPPY && git pull
docker exec -it LibreChat npm run build:client
docker exec -it LibreChat node scripts/restore-and-sync-all.js
```
