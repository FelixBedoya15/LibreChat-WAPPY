---
trigger: glob
globs: "**/client/src/**/*.ts, **/client/src/**/*.tsx, **/packages/client/**/*.ts, **/packages/client/**/*.tsx"
description: "Reglas obligatorias de UI WAPPY 14-Group Design System, ExpandableButton, autenticación en apps portables y compilación local de client/dist."
---

# Reglas Contextuales — Frontend & UI WAPPY (`client/src/**`)

1. **Botones `ExpandableButton.tsx` (Regla Inquebrantable):**
   - Usar siempre `client/src/components/Common/ExpandableButton.tsx` con los 14 Grupos Semánticos de Color (bordes `/30`, fondos `/10`, inclinación `sm:hover:-rotate-3 sm:hover:scale-105`).
   - Mantener siempre la contracción en reposo (`max-w-0 opacity-0`) y expansión suave al pasar el cursor (`group-hover:max-w-[280px] group-hover:opacity-100 group-hover:ml-2`). **Prohibido** desactivar el hover o forzar `w-full` que deforme o desborde la tarjeta.
2. **Estética, Responsive y Defensiva:**
   - 100% responsive (`md:flex-row`), `0px` horizontal overflow (`scrollWidth <= clientWidth`), código defensivo ante nulos (`x?.trim() || ''`, `Array.isArray(arr) ? arr : []`).
   - Paleta oficial: `#C7F303` Verde Lima Eléctrico (texto `#0E1300`), `#0D9488` Turquesa SST, `#F6F5EF` Crema Editorial, `#0C192E` Dark Tech HUD (`#00D4FF`).
   - Tablas de `LiveEditor`: editables y exportables limpias a Word/PDF (`html-docx`).
3. **Apps Portables y Sesión Activa (`/wappystudio`, `/wappypodcast`, `/matrizipvr`, etc.):**
   - Al iniciar, consultar `POST /api/auth/refresh` (`credentials: 'include'`) y exponer `window.platformUser`, `window.platformUserToken`, `window.isPlatformLoggedIn` + evento `wappy-auth-updated`.
   - Botón superior derecho `#navCtaEnterWappy`: usuario logueado muestra avatar + `Entrar a WAPPY →` hacia `/c/new`; visitante muestra `Ir a WAPPY` hacia `/login`.
   - Jamás degradar un usuario autenticado con una clave `wpy_guest_...` residual.
4. **Compilación Local Obligatoria (`client/dist`):**
   - `Dockerfile.multi` en Dokploy **no compila el frontend en el servidor**.
   - Antes de hacer commit con cambios en `client/src/**` o `packages/client/**`, ejecutar `npm run build:client` e incluir `client/dist` en `git add`.
