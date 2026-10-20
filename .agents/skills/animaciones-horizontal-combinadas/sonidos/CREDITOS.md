# Efectos de sonido

- **Sintetizados** (`golpe`, `golpe-corto`, `aire`, `aire-salida`, `tick`, `tick-suave`, `nota`, `nota-doble`, `swell`,
  `descarte`, `corte`, `bip`): generados por `scripts/biblioteca_sonidos.py`. Sin derechos de terceros.
- **Pixabay** (`golpe-grave`, `impacto`, `barrido`, `transicion`, `click`, `tecla`, `tecleo`, `campana`, `ping`,
  `brillo`, `notificacion`, `subida`, `fallo`, `glitch`, `glitch-fuerte`, `pop`): de la biblioteca de la skill
  media-use, con la [Pixabay Content License](https://pixabay.com/service/license-summary/): uso comercial y en
  vídeos sin atribución.

Todos van a 48 kHz, sin silencio inicial y con el pico a −1 dBFS. `sonidos.json` guarda de cada uno la duración,
dónde está su golpe (`pico`, en s), con qué se alinea (`ancla`: `pico` = el golpe cae en el instante del evento;
`fin` = termina en él) y la ganancia por defecto (`gain_db`) que iguala las familias bajo la voz.
