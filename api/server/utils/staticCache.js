const path = require('path');
const express = require('express');
const expressStaticGzip = require('express-static-gzip');

const oneDayInSeconds = 24 * 60 * 60;
const oneYearInSeconds = 365 * 24 * 60 * 60;

const sMaxAge = process.env.STATIC_CACHE_S_MAX_AGE || oneDayInSeconds;
const maxAge = process.env.STATIC_CACHE_MAX_AGE || oneDayInSeconds * 7;

/**
 * Creates an Express static middleware with precompressed Brotli/Gzip serving and smart HTTP caching.
 *
 * @param {string} staticPath - The file system path to serve static files from
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.noCache=false] - If true, disables caching entirely for all files
 * @param {boolean} [options.skipGzipScan=false] - If true, skips expressStaticGzip middleware
 * @returns {ReturnType<expressStaticGzip>|ReturnType<express.static>} Express middleware function for serving static files
 */
function staticCache(staticPath, options = {}) {
  const { noCache = false, skipGzipScan = false } = options;

  const setHeaders = (res, filePath) => {
    // Only skip caching explicitly in local development (avoid disabling cache if NODE_ENV is unset in Docker)
    if (process.env.NODE_ENV?.toLowerCase() === 'development') {
      return;
    }
    if (noCache) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return;
    }
    if (filePath && filePath.includes('/dist/images/')) {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}`);
      return;
    }
    const normalizedPath = filePath ? filePath.replace(/\\/g, '/') : '';
    const fileName = normalizedPath ? path.basename(normalizedPath) : '';

    if (
      /^(index\.html|manifest\.json|sw\.js|registerSW\.js)(\.gz|\.br)?$/i.test(fileName) ||
      /\.(html|webmanifest)(\.gz|\.br)?$/i.test(fileName)
    ) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (
      normalizedPath.includes('/assets/') &&
      /\.[a-zA-Z0-9_-]{6,}\.(js|css|mjs|woff2?|ttf|otf|png|jpe?g|webp|svg|gif)(\.gz|\.br)?$/i.test(
        fileName,
      )
    ) {
      // Content-hashed Vite assets are immutable: cache for 1 year in browser + CDN
      res.setHeader(
        'Cache-Control',
        `public, max-age=${oneYearInSeconds}, s-maxage=${oneYearInSeconds}, immutable`,
      );
    } else {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}`);
    }
  };

  if (skipGzipScan) {
    return express.static(staticPath, {
      setHeaders,
      index: false,
    });
  } else {
    const gzipMiddleware = expressStaticGzip(staticPath, {
      enableBrotli: true,
      orderPreference: ['br', 'gz'],
      setHeaders,
      index: false,
    });
    const fallbackStatic = express.static(staticPath, {
      setHeaders,
      index: false,
    });
    return (req, res, next) => {
      gzipMiddleware(req, res, (err) => {
        if (err) return next(err);
        fallbackStatic(req, res, next);
      });
    };
  }
}

module.exports = staticCache;
