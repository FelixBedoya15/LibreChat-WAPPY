/**
 * Tailwind para WAPPY Studio portable (/wappystudio y archivo HTML descargable).
 * Usa EXACTAMENTE el mismo tema del aplicativo, pero aislado dentro de #wappy-studio-root
 * (y del contenedor de menús flotantes #wappy-studio-portal) para no alterar la landing.
 */
const base = require('./tailwind.config.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...base,
  darkMode: 'class',
  content: [
    './src/components/Studio/**/*.{ts,tsx}',
    './src/components/Common/ExpandableButton.tsx',
    './src/components/SGSST/ModelSelector.tsx',
    './src/portable/studio/**/*.{ts,tsx}',
  ],
  important: ':is(#wappy-studio-root, #wappy-studio-portal)',
  corePlugins: {
    ...(base.corePlugins || {}),
    preflight: false,
  },
};
