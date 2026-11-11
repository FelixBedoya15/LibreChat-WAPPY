'use strict';

/**
 * Servicio centralizado de invocación Gemini para SG-SST y Pipelines de Automatización.
 * Re-exporta íntegramente el motor canónico con rotación de claves y traducción directa
 * de alias de modelo ('gemini-3.8-flash' -> 'gemini-3.6-flash') definido en sgsstGemini.
 */
module.exports = require('~/server/routes/sgsst/sgsstGemini');
