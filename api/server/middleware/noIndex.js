const noIndex = (req, res, next) => {
  const reqPath = (req.path || '').toLowerCase();

  // Rutas públicas que SIEMPRE deben ser indexables para Googlebot / Bing / AEO
  const isPublicRoute =
    reqPath === '/' ||
    reqPath === '/landing' ||
    reqPath === '/blog' ||
    reqPath.startsWith('/blog/') ||
    reqPath === '/quibi' ||
    reqPath.startsWith('/quibi/') ||
    reqPath === '/terms' ||
    reqPath === '/privacy' ||
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

  const globalNoIndex = process.env.NO_INDEX === 'true';

  if (isPublicRoute) {
    // Para rutas públicas, explicitamente indexable para buscadores y motores de IA
    res.setHeader('X-Robots-Tag', 'index, follow');
  } else if (globalNoIndex || reqPath.startsWith('/c/') || reqPath.startsWith('/admin/')) {
    // Proteger privacidad de chats personales y paneles internos
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }

  next();
};

module.exports = noIndex;
