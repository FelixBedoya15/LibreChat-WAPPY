# Antigravity Frontend Rules (`client/`)

> [!CRITICAL]
> **COMPILACIÓN OBLIGATORIA DEL FRONTEND:**
> Dokploy NO compila el frontend en el servidor; copia directamente `client/dist`.
> Siempre que se modifique cualquier archivo en `client/src/**/*`:
> 1. Ejecutar localmente antes de terminar o hacer commit:
>    ```bash
>    npm run build:client
>    ```
> 2. Versionar ambos:
>    ```bash
>    git add client/src client/dist
>    ```
> 3. NUNCA hacer commit solo de `client/src` sin `client/dist`.
