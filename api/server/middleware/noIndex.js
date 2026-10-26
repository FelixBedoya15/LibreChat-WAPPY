const noIndex = (req, res, next) => {
  const reqPath = (req.path || '').toLowerCase();

  // 1. Rutas estrictamente PRIVADAS (Módulos de empresas, chats con IA, datos internos y administración)
  const isStrictlyPrivate =
    reqPath.startsWith('/c/') ||                  // Chats personales con IA
    reqPath === '/c' ||
    reqPath.startsWith('/sgsst') ||               // Módulos SG-SST privados de las empresas
    reqPath.startsWith('/sgsst-public') ||        // Registros internos por empresa
    reqPath.startsWith('/api') ||                 // Endpoints de API
    reqPath.startsWith('/admin') ||               // Paneles de administración
    reqPath.includes('/admin') ||
    reqPath.startsWith('/dashboard') ||           // Dashboards de usuario/facturación
    reqPath === '/billing' ||
    reqPath === '/auditoria' ||
    reqPath === '/kanban' ||
    reqPath === '/control' ||
    reqPath === '/tareas' ||
    reqPath === '/live' ||
    reqPath === '/chat-sst' ||
    reqPath === '/huella-biocentrica' ||
    reqPath === '/bateria-psicosocial' ||
    reqPath.startsWith('/embajadores/dashboard') ||
    reqPath === '/login' ||
    reqPath === '/register' ||
    reqPath === '/signup' ||
    reqPath === '/forgot-password' ||
    reqPath === '/reset-password';

  // 2. Rutas PÚBLICAS autorizadas para SEO (Landing, Blog, Tienda/Marketplace, Academia WAPPY, Quiénes somos, Políticas)
  const isPublicRoute =
    reqPath === '/' ||
    reqPath === '/landing' ||
    reqPath === '/inicio' ||
    reqPath === '/planes' ||
    reqPath === '/quibi' ||
    reqPath === '/qb' ||
    reqPath === '/wappyvital' ||
    reqPath === '/blog' ||
    reqPath.startsWith('/blog/') ||
    reqPath === '/academia' ||
    reqPath.startsWith('/training/') ||
    reqPath.startsWith('/ruta-aprendizaje/') ||
    reqPath === '/marketplace' ||
    reqPath === '/tienda' ||
    reqPath === '/about' ||
    reqPath === '/quienes-somos' ||
    reqPath === '/contactanos' ||
    reqPath === '/comunidad' ||
    reqPath === '/comunidadmp' ||
    reqPath === '/portafolio' ||
    reqPath === '/hoja-de-ruta' ||
    reqPath === '/privacy' ||
    reqPath === '/privacy-policy' ||
    reqPath === '/terms' ||
    reqPath === '/terminos' ||
    reqPath === '/sitemap.xml' ||
    reqPath === '/robots.txt' ||
    reqPath.endsWith('.xml') ||
    reqPath.endsWith('.txt') ||
    reqPath.startsWith('/assets/') ||
    reqPath.startsWith('/images/') ||
    reqPath.startsWith('/marketing/') ||
    reqPath.includes('matrizipvr') ||
    reqPath.includes('propuesta-curso-ia-sgsst') ||
    reqPath.includes('clase1') ||
    reqPath.includes('cursowappy');

  if (isStrictlyPrivate) {
    // Protección absoluta de datos de clientes, empresas y chats
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  } else if (isPublicRoute) {
    // Indexación prioritaria para motores de búsqueda y motores de respuesta con IA
    res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1');
  } else {
    // Por defecto, ante cualquier ruta no catalogada después del login, proteger con noindex
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }

  next();
};

module.exports = noIndex;
