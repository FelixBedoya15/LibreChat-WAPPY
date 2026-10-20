import React from 'react';

// Piezas propias de este proyecto. `reel.py preparar` crea este archivo una vez y no lo vuelve a tocar.
//
// Cuando una idea del guion no cabe en ninguna pieza del catálogo, se diseña aquí una pieza nueva con los bloques
// del sistema (./base: Ficha, Cabecera, IcoCuadro, Chip, Pastilla, Cerrojo, Pie, Placa, Escena, TituloEscena,
// Ventana; ./sistema: zonas, colores, resorte, enciende, rampa, titular, rotulo…) y se apunta abajo con el nombre
// que se usará como "tipo" en guion_pro.json. Guía y ejemplo en references/guion-pro.md de la skill.
// Si la pieza sirve para más reels, pásala a la plantilla de la skill (plantilla/src/pro/).
//
// Toda pieza recibe sus datos del guion más "logos" (clave → ruta del logo). Reglas: lo que aún no se ha dicho
// espera apagado y se enciende en su palabra; letra de 26 px o más; nada que haya que leer más allá de x≈940 por
// debajo de y≈1000; nada sobre la cara.

/* eslint-disable @typescript-eslint/no-explicit-any */
// Sobre el pecho, en el plano de cara (ZONA: x 80–1000, y 916–1376)
export const CARA: Record<string, React.FC<any>> = {};
// A pantalla completa (envuelve tu contenido en <Escena i={i} f={f}>)
export const ESCENAS: Record<string, React.FC<any>> = {};
// Cuerpos para la pieza "escena" (reciben y0, y1, desde y logos además de sus datos)
export const CUERPOS: Record<string, React.FC<any>> = {};
