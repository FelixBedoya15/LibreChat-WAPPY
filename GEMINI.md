# Antigravity AI Assistant - Reglas Obligatorias del Proyecto LibreChat-WAPPY

> [!CRITICAL]
> **REGLA ESTRICTA DE COMPILACIÓN LOCAL DEL FRONTEND (`client/dist`):**
> El despliegue de este proyecto en Dokploy usa `Dockerfile.multi`, el cual **NO compila el frontend en el servidor**; simplemente copia la carpeta local:
> `COPY client/dist ./client/dist`
>
> Por esta razón, **SIEMPRE** que Antigravity (o cualquier agente de codificación) modifique, cree o elimine cualquier archivo dentro de `client/src/**/*` o toque configuraciones/dependencias del frontend:
> 1. Antigravity **DEBE** ejecutar localmente antes de finalizar el turno o antes de hacer commit:
>    ```bash
>    npm run build:client
>    ```
> 2. Antigravity **DEBE** incluir en el commit tanto los archivos fuente de `client/src` como los bundles compilados de `client/dist`:
>    ```bash
>    git add client/src client/dist
>    ```
> 3. **ESTÁ TERMINANTEMENTE PROHIBIDO** hacer commit únicamente de `client/src` sin haber compilado e incluido `client/dist`. Si no se compila localmente, Dokploy desplegará la versión anterior y los cambios del usuario no se verán reflejados en el navegador.

---

## 2. Comandos de Sincronización en el VPS de Producción (`srv999875`)
Cuando el usuario solicite desplegar o actualizar cambios en el servidor VPS de producción (`srv999875`):
```bash
cd /root/LibreChat-WAPPY && git pull
docker exec -it LibreChat node scripts/restore-and-sync-all.js
```

---

## 3. Prácticas de Desarrollo en este Repositorio
- **Componentes SGSST / Hitos:** Mantener diseño responsive (`md:flex-row`), vistas móviles con selector condicional y botón volver, y manejo defensivo ante campos nulos (`x?.trim() || ''`, `Array.isArray(arr) ? arr : []`).
- **Rutas de API:** Toda modificación en `api/server/routes/**/*.js` debe verificarse sintácticamente con `node -c <archivo.js>` antes de dar por completada la tarea.
- **Git Commits:** Mensajes claros siguiendo Conventional Commits (`fix: ...`, `feat: ...`, `build(client): ...`).
