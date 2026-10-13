const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/LibreChat';

async function run() {
  console.log('Conectando a MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const companyId = new mongoose.Types.ObjectId('6ace58a30d48df267fe7d615');
  const userId = new mongoose.Types.ObjectId('6921e15be5ed2f3ebc3cde7a');

  const PerfilCargoData = mongoose.model('PerfilCargoData', new mongoose.Schema({}, { strict: false }));
  const GTC45Session = mongoose.model('GTC45WorkspaceSession', new mongoose.Schema({}, { strict: false }));
  const MatrizLegalData = mongoose.model('MatrizLegalData', new mongoose.Schema({}, { strict: false }));
  const SgsstChemicalData = mongoose.model('SgsstChemicalData', new mongoose.Schema({}, { strict: false }));
  const ProgramaCapacitacionesData = mongoose.model('ProgramaCapacitacionesData', new mongoose.Schema({}, { strict: false }));

  // 1. PERFILES DE CARGO (5 perfiles oficiales del profesiograma)
  const perfilesList = [
    {
      id: 'perfil-ayudante-obra',
      nombreCargo: 'Ayudante de Construcción',
      area: 'Operaciones / Obra Civil',
      nivelCargo: 'Operativo',
      sectorOrganizacion: 'Sector privado',
      tipoContrato: 'Contrato por obra o labor',
      jornada: 'Tiempo completo (8 horas/día)',
      jefeInmediato: 'Oficial de Construcción / Encargado de Obra',
      escalasSalarial: '1.0 - 1.5 SMMLV',
      numVacantes: '4',
      contextoAdicional: 'Labores de apoyo operativo en frentes de obra: mezcla y vaciado de concreto/mortero, transporte manual de materiales, excavación, acarreo de escombros y apoyo en armado de formaletas.',
      eppSeleccionados: [
        'Casco de seguridad con barbuquejo de 3 puntos (Tipo I)',
        'Gafas de seguridad con filtro UV y antiempañante',
        'Botas de seguridad con puntera de acero/composite y suela antideslizante',
        'Guantes de carnaza / vaqueta / nitrilo',
        'Protector auditivo de inserción',
        'Respirador N95 para material particulado'
      ],
      entrenamientosSeleccionados: [
        'Inducción y Reinducción en SST',
        'Higiene Postural y Levantamiento Manual de Cargas',
        'Trabajo Seguro en Alturas (Trabajador Autorizado - Res. 4272/2021)',
        'Uso Correcto de EPP y Autocuidado'
      ],
      controlesFuenteSeleccionados: ['Uso de carretillas y tolvas para mitigar sobreesfuerzos'],
      controlesMedioSeleccionados: ['Orden y aseo continuo en frentes de trabajo y señalización de senderos peatonales'],
      images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
      video: null,
      exigenciaFisica: 'Alta',
      exigenciaMental: 'Media',
      operaMaquinaria: 'No',
      createdAt: Date.now()
    },
    {
      id: 'perfil-oficial-obra',
      nombreCargo: 'Oficial de Construcción',
      area: 'Operaciones / Obra Civil',
      nivelCargo: 'Operativo',
      sectorOrganizacion: 'Sector privado',
      tipoContrato: 'Contrato por obra o labor',
      jornada: 'Tiempo completo (8 horas/día)',
      jefeInmediato: 'Encargado de Obra',
      escalasSalarial: '1.5 - 2.5 SMMLV',
      numVacantes: '2',
      contextoAdicional: 'Ejecución técnica calificada de obra: levantamiento de muros, mampostería, revoque, enchape, armado y desarmado de formaletas, instalación de aceros y supervisión directa de cuadrilla de ayudantes.',
      eppSeleccionados: [
        'Casco de seguridad con barbuquejo de 3 puntos',
        'Gafas de seguridad con filtro UV',
        'Botas de seguridad con puntera',
        'Guantes de vaqueta y carnaza',
        'Protector auditivo tipo copa / inserción',
        'Arnés de cuerpo entero dieléctrico multipropósito con eslinga en Y'
      ],
      entrenamientosSeleccionados: [
        'Trabajo Seguro en Alturas (Avanzado / Autorizado)',
        'Armado Seguro de Andamios Certificados',
        'Manejo Seguro de Herramientas Eléctricas y Manuales',
        'Primeros Auxilios Básicos'
      ],
      controlesFuenteSeleccionados: ['Mantenimiento preventivo de herramientas eléctricas y pulidoras'],
      controlesMedioSeleccionados: ['Andamios multidireccionales certificados con rodapiés y barandas perimetrales'],
      images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
      video: null,
      exigenciaFisica: 'Alta',
      exigenciaMental: 'Media',
      operaMaquinaria: 'No',
      createdAt: Date.now()
    },
    {
      id: 'perfil-encargado-obra',
      nombreCargo: 'Encargado de Obra',
      area: 'Operaciones / Supervisión de Campo',
      nivelCargo: 'Táctico / Mando Medio',
      sectorOrganizacion: 'Sector privado',
      tipoContrato: 'Término indefinido / Obra o labor',
      jornada: 'Tiempo completo (8 horas/día)',
      jefeInmediato: 'Gerente General / Representante Legal',
      escalasSalarial: '2.5 - 4.0 SMMLV',
      numVacantes: '1',
      contextoAdicional: 'Liderazgo y supervisión de la cuadrilla operativa de obra civil, control del cronograma diario, verificación de especificaciones de calidad, control de materiales y cumplimiento estricto de las normas de SST.',
      eppSeleccionados: [
        'Casco de seguridad tipo II con barbuquejo',
        'Gafas de seguridad oscuras y claras',
        'Botas de seguridad con puntera de fibra',
        'Chaleco reflectivo de alta visibilidad',
        'Protector solar y protección auditiva'
      ],
      entrenamientosSeleccionados: [
        'Coordinador de Trabajo en Alturas (Res. 4272/2021)',
        'Liderazgo y Supervisión en SST',
        'Identificación de Peligros y ATS Diario',
        'Plan de Emergencias y Evacuación'
      ],
      controlesFuenteSeleccionados: ['Planificación preventiva de tareas críticas'],
      controlesMedioSeleccionados: ['Inspecciones locativas diarias de orden y aseo'],
      images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
      video: null,
      exigenciaFisica: 'Media',
      exigenciaMental: 'Alta',
      operaMaquinaria: 'No',
      createdAt: Date.now()
    },
    {
      id: 'perfil-coordinador-sst',
      nombreCargo: 'Asesora Comercial / Coordinador SST',
      area: 'Gestión SST y Comercial',
      nivelCargo: 'Táctico / Mando Medio',
      sectorOrganizacion: 'Sector privado',
      tipoContrato: 'Término indefinido',
      jornada: 'Tiempo completo (8 horas/día)',
      jefeInmediato: 'Gerente General',
      escalasSalarial: '2.0 - 3.5 SMMLV',
      numVacantes: '1',
      contextoAdicional: 'Responsable de la documentación del SG-SST, emisión y control de Permisos de Trabajo en Alturas (PTA), inspecciones de seguridad, inducciones al personal y gestión comercial de proyectos.',
      eppSeleccionados: [
        'Casco de seguridad con barbuquejo en visitas de obra',
        'Botas de seguridad dieléctricas',
        'Gafas de seguridad',
        'Chaleco reflectivo'
      ],
      entrenamientosSeleccionados: [
        'Curso de 50 Horas en SG-SST (MinTrabajo)',
        'Coordinador de Trabajo Seguro en Alturas',
        'Investigación de Incidentes y Accidentes de Trabajo (Res. 1401/2007)',
        'Auditoría Interna del SG-SST'
      ],
      controlesFuenteSeleccionados: ['Estación ergonómica de trabajo en oficina técnica'],
      controlesMedioSeleccionados: ['Señalización preventiva y delimitación de accesos peatonales seguros en obra'],
      images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
      video: null,
      exigenciaFisica: 'Baja',
      exigenciaMental: 'Alta',
      operaMaquinaria: 'No',
      createdAt: Date.now()
    },
    {
      id: 'perfil-gerente-general',
      nombreCargo: 'Gerente General / Representante Legal',
      area: 'Dirección y Gerencia General',
      nivelCargo: 'Estratégico / Directivo',
      sectorOrganizacion: 'Sector privado',
      tipoContrato: 'Término indefinido',
      jornada: 'Tiempo completo (8 horas/día)',
      jefeInmediato: 'Junta de Socios',
      escalasSalarial: '> 5.0 SMMLV',
      numVacantes: '1',
      contextoAdicional: 'Máxima autoridad legal y administrativa de la constructora. Asigna los recursos financieros, humanos y técnicos para el SG-SST, aprueba la política y lidera la revisión anual por la alta dirección.',
      eppSeleccionados: [
        'Casco de seguridad tipo I (Visitas de obra)',
        'Botas de seguridad con puntera',
        'Gafas de seguridad',
        'Chaleco reflectivo institucional'
      ],
      entrenamientosSeleccionados: [
        'Responsabilidades Legales en SST (Decreto 1072/2015)',
        'Gestión del Riesgo Empresarial y Pólizas ARL',
        'Liderazgo Estratégico y Cultura de Autocuidado'
      ],
      controlesFuenteSeleccionados: ['Aseguramiento de recursos presupuestales y contractuales en SST'],
      controlesMedioSeleccionados: ['Comité de Gerencia mensual con informe de indicadores de SST'],
      images: { foto1: null, foto2: null, foto3: null, foto1Desc: '', foto2Desc: '', foto3Desc: '' },
      video: null,
      exigenciaFisica: 'Baja',
      exigenciaMental: 'Alta',
      operaMaquinaria: 'No',
      createdAt: Date.now()
    }
  ];

  await PerfilCargoData.findOneAndUpdate(
    { user: userId, companyId: companyId },
    { $set: { user: userId, companyId: companyId, perfilesList: perfilesList, updatedAt: new Date() } },
    { upsert: true, new: true }
  );
  console.log('✓ PerfilCargoData: 5 perfiles actualizados para Constructora Activos SAS');

  // 2. MATRIZ GTC 45 (Session Oficial vinculada a companyId)
  const officialConvoId = 'official-' + companyId.toString();
  const gtcRows = [
    {
      id: 'gtc45_alturas_01',
      proceso: 'Operaciones y Obra Civil',
      zona: 'Fachadas, losas superiores y armado de cubiertas',
      actividad: 'Armado de formaletas, encofrado y montaje de cubiertas metálicas',
      tareas: 'Instalación de formaleta vertical, vaciado de columnas y armado de cubierta en altura (> 2.0 m)',
      rutinaria: 'Sí',
      cargo: 'Oficiales y Ayudantes de Construcción',
      peligro_descripcion: 'Trabajo en Alturas: Caída de personas a diferente nivel desde andamios, losas perimetrales y cubiertas (> 2.0 m)',
      peligro_clasificacion: 'Condiciones de seguridad',
      efectos_posibles: 'Politraumatismos severos, fracturas múltiples, traumatismo craneoencefálico, invalidez permanente o muerte',
      controles_fuente: 'No aplica eliminación técnica por naturaleza del proyecto',
      controles_medio: 'Andamios multidireccionales certificados con doble baranda y rodapiés, líneas de vida horizontales',
      controles_individuo: 'Certificación en alturas vigente (Res. 4272/2021), examen médico de aptitud CEDISALUD, ATS diario y PTA',
      nd: 6,
      ne: 3,
      np: 18,
      interpretacion_np: 'Alto (A)',
      nc: 60,
      nr: 1080,
      interpretacion_nr: 'I',
      aceptabilidad: 'No Aceptable',
      peor_consecuencia: 'Muerte por caída de altura',
      requisito_legal: 'Resolución 4272 de 2021, Resolución 0312 de 2019, Decreto 1072 de 2015',
      nro_expuestos: 6,
      medida_eliminacion: 'No aplica',
      medida_sustitucion: 'No aplica',
      medida_ingenieria: 'Puntos de anclaje certificados de 5.000 lbf y barandas perimetrales rígidas',
      medida_administrativa: 'Permiso de Trabajo en Alturas (PTA), inspección preoperacional de arneses y eslingas, coordinador presente',
      medida_eppu: 'Arnés multipropósito de 4 argollas dieléctrico, eslinga en Y con absorbedor, casco con barbuquejo de 3 puntos',
      factores_reduccion: 'Andamios certificados y sistemas anticaídas fijos reducen el ND de 6 a 2 (Nivel II)'
    },
    {
      id: 'gtc45_biomecanico_02',
      proceso: 'Operaciones y Obra Civil',
      zona: 'Frentes de obra y acopio de materiales',
      actividad: 'Cargue, descargue y acarreo manual de bultos de cemento, varillas de acero y mampostería',
      tareas: 'Levantamiento manual de bultos (50 kg divididos / 25 kg máx), traslado de varillas y bloques',
      rutinaria: 'Sí',
      cargo: 'Ayudantes y Oficiales de Construcción',
      peligro_descripcion: 'Riesgo Biomecánico: Manipulación manual de cargas pesadas, posturas forzadas y movimientos repetitivos',
      peligro_clasificacion: 'Biomecánico',
      efectos_posibles: 'Lumbalgia aguda y crónica, espasmos musculares, hernias discales, fatiga osteomuscular',
      controles_fuente: 'Ayudas mecánicas (carretillas, diferenciales y malacates de obra)',
      controles_medio: 'Senderos de acarreo despejados, sin barro ni obstáculos',
      controles_individuo: 'Capacitación en higiene postural, pausas activas, faja de soporte ergonómico si aplica',
      nd: 6,
      ne: 3,
      np: 18,
      interpretacion_np: 'Alto (A)',
      nc: 25,
      nr: 450,
      interpretacion_nr: 'II',
      aceptabilidad: 'Aceptable con control específico',
      peor_consecuencia: 'Hernia discal lumbar con pérdida de capacidad laboral',
      requisito_legal: 'Resolución 2400 de 1979, Decreto 1072 de 2015, GATISO DME',
      nro_expuestos: 6,
      medida_eliminacion: 'No aplica',
      medida_sustitucion: 'Uso de carretillas buggies y malacate para elevación de bultos a pisos superiores',
      medida_ingenieria: 'Mesas y bancos de trabajo a altura de cintura para corte y figurado de varillas',
      medida_administrativa: 'Límite de carga manual a 25 kg por persona (levantamiento en equipo para cargas mayores), pausas activas cada 2 horas',
      medida_eppu: 'Guantes de vaqueta/carnaza con buen agarre, faja lumbar de advertencia biomecánica',
      factores_reduccion: 'El uso de ayudas mecánicas y rotación de cuadrillas reduce el ND a 2 (Nivel III)'
    },
    {
      id: 'gtc45_ruido_03',
      proceso: 'Operaciones y Obra Civil',
      zona: 'Área de mezclado, corte y pulido',
      actividad: 'Operación de mezcladoras de concreto, pulidoras, taladros rotomartillos y sierras circulares',
      tareas: 'Corte de varillas y baldosas con pulidora, percusión con rotomartillo, mezclado de trompo',
      rutinaria: 'Sí',
      cargo: 'Oficiales y Ayudantes de Obra',
      peligro_descripcion: 'Riesgo Físico: Ruido continuo e intermitente de impacto (> 85 dBA) por herramientas motorizadas',
      peligro_clasificacion: 'Físico',
      efectos_posibles: 'Hipoacusia neurosensorial inducida por ruido, fatiga auditiva, acúfenos, estrés y pérdida de concentración',
      controles_fuente: 'Mantenimiento preventivo, lubricación y cambio de rodamientos en mezcladoras',
      controles_medio: 'Aislamiento temporal de áreas de corte',
      controles_individuo: 'Protectores auditivos de inserción de silicona (NRR 27 dB) y tipo copa (NRR 25 dB) en cortes',
      nd: 2,
      ne: 3,
      np: 6,
      interpretacion_np: 'Medio (M)',
      nc: 25,
      nr: 150,
      interpretacion_nr: 'II',
      aceptabilidad: 'Aceptable con control específico',
      peor_consecuencia: 'Hipoacusia laboral irreversible bilateral',
      requisito_legal: 'Resolución 1792 de 1990, Resolución 2400 de 1979, Decreto 1072 de 2015',
      nro_expuestos: 8,
      medida_eliminacion: 'No aplica',
      medida_sustitucion: 'Adquisición de maquinaria con motores eléctricos silenciosos',
      medida_ingenieria: 'Cabina semi-acústica para la zona del trompo mezclador',
      medida_administrativa: 'Monitoreo de dosimetría de ruido, audiometrías de control periódico, rotación de operadores',
      medida_eppu: 'Protector auditivo tipo copa dieléctrico o de inserción con cordón',
      factores_reduccion: 'El EPP auditivo certificado atenúa hasta 20 dBA efectivos reduciendo el riesgo a Nivel III'
    },
    {
      id: 'gtc45_electrico_04',
      proceso: 'Operaciones y Mantenimiento',
      zona: 'Distribución provisional de energía en obra',
      actividad: 'Conexión de tableros provisionales, extensiones eléctricas y herramientas manuales',
      tareas: 'Tendido de cables, energización de mezcladoras y pulidoras, iluminación provisional',
      rutinaria: 'Sí',
      cargo: 'Oficiales, Encargado de Obra y Ayudantes',
      peligro_descripcion: 'Riesgo Eléctrico: Baja tensión (110V/220V), cables provisionales expuestos a humedad, pisoteo y roces',
      peligro_clasificacion: 'Condiciones de seguridad',
      efectos_posibles: 'Electrocución, quemaduras de 1°, 2° y 3° grado, fibrilación ventricular, caídas inducidas por descarga eléctrica',
      controles_fuente: 'Tableros eléctricos con interruptor termomagnético y disyuntor diferencial (GFCI)',
      controles_medio: 'Tomas y cables encauchetados elevados en ganchos aislantes a más de 2 metros del suelo',
      controles_individuo: 'Calzado dieléctrico certificado ASTM F2413 / NTC 2257, inspección visual previa',
      nd: 6,
      ne: 2,
      np: 12,
      interpretacion_np: 'Alto (A)',
      nc: 60,
      nr: 720,
      interpretacion_nr: 'I',
      aceptabilidad: 'No Aceptable',
      peor_consecuencia: 'Muerte por shock eléctrico o politraumatismo por caída',
      requisito_legal: 'RETIE (Reglamento Técnico de Instalaciones Eléctricas), Resolución 2400 de 1979',
      nro_expuestos: 8,
      medida_eliminacion: 'No aplica',
      medida_sustitucion: 'Uso de herramientas inalámbricas a batería en zonas húmedas',
      medida_ingenieria: 'Puesta a tierra provisional en tablero principal y protección GFCI sensible a 30 mA',
      medida_administrativa: 'Protocolo de 5 Reglas de Oro, prohibición de empates con cinta aislante sin vulcanizar, bloqueo/etiquetado',
      medida_eppu: 'Botas dieléctricas con puntera de fibra, guantes dieléctricos Clase 0 para energizaciones',
      factores_reduccion: 'La protección diferencial GFCI elimina el riesgo de fibrilación letal reduciendo el NR a Nivel II'
    },
    {
      id: 'gtc45_particulado_05',
      proceso: 'Operaciones y Obra Civil',
      zona: 'Zona de vaciado, pulimento de muros y mezclas',
      actividad: 'Mezcla de morteros, vaciado de cemento gris, lijado de estuco y demolición puntual',
      tareas: 'Vaciado de sacos de cemento, mezclado en seco, lijado de revoques secos',
      rutinaria: 'Sí',
      cargo: 'Ayudantes y Oficiales de Construcción',
      peligro_descripcion: 'Riesgo Químico: Exposición a material particulado (polvo de sílice libre cristalina, cal y cemento Portland)',
      peligro_clasificacion: 'Químico',
      efectos_posibles: 'Silicosis, bronquitis crónica, neumoconiosis, conjuntivitis química y dermatitis alcalina por contacto',
      controles_fuente: 'Humectación por nebulización en zonas de lijado y demolición',
      controles_medio: 'Ventilación natural cruzada en áreas de mezcla y acabados',
      controles_individuo: 'Respirador de media cara con filtros N95 / P100 para polvos y nieblas, monogafas herméticas',
      nd: 2,
      ne: 3,
      np: 6,
      interpretacion_np: 'Medio (M)',
      nc: 25,
      nr: 150,
      interpretacion_nr: 'II',
      aceptabilidad: 'Aceptable con control específico',
      peor_consecuencia: 'Silicosis pulmonar crónica incapacitante',
      requisito_legal: 'Resolución 2400 de 1979, Decreto 1072 de 2015, ACGIH TLVs',
      nro_expuestos: 8,
      medida_eliminacion: 'No aplica',
      medida_sustitucion: 'Uso de mezclas de concreto premezclado transportado en mixer para grandes vaciados',
      medida_ingenieria: 'Sistemas de lijado con aspiración ciclónica acoplada',
      medida_administrativa: 'Programa de Vigilancia Epidemiológica Respiratoria (PVE-R), fichas FDS en sitio',
      medida_eppu: 'Respirador desechable N95 termoformado o silicona con filtros P100, guantes de nitrilo/caucho',
      factores_reduccion: 'El uso de concreto premezclado y respiradores N95 disminuye el ND a 2 (Nivel III)'
    },
    {
      id: 'gtc45_locativo_06',
      proceso: 'Operaciones y Obra Civil',
      zona: 'Circulación peatonal, escaleras provisionales y pasillos',
      actividad: 'Tránsito por escaleras de obra, rampas provisionales y superficies con desniveles',
      tareas: 'Desplazamiento con materiales y herramientas entre pisos y campamento',
      rutinaria: 'Sí',
      cargo: 'Todos los colaboradores de obra y personal técnico',
      peligro_descripcion: 'Riesgo Locativo: Caídas a nivel por superficies irregulares, resbalosas, humedad y falta de orden y aseo',
      peligro_clasificacion: 'Condiciones de seguridad',
      efectos_posibles: 'Contusiones, esguinces de tobillo, caídas en escaleras (como el evento FURAT registrado), fracturas',
      controles_fuente: 'Retiro inmediato de escombros, madera con puntillas y sobrantes de obra (Campaña 5S)',
      controles_medio: 'Peldaños uniformes con huella antideslizante, pasamanos rígidos a doble altura y buena iluminación',
      controles_individuo: 'Calzado de seguridad antideslizante con suela de poliuretano / caucho con labrado profundo',
      nd: 2,
      ne: 3,
      np: 6,
      interpretacion_np: 'Medio (M)',
      nc: 25,
      nr: 150,
      interpretacion_nr: 'II',
      aceptabilidad: 'Aceptable con control específico',
      peor_consecuencia: 'Fractura osteomuscular de miembro inferior con incapacidad prolongada',
      requisito_legal: 'Resolución 2400 de 1979 (Art. 17-28), Decreto 1072 de 2015',
      nro_expuestos: 8,
      medida_eliminacion: 'No aplica',
      medida_sustitucion: 'Reemplazo de escaleras improvisadas de madera por escaleras metálicas modulares certificadas',
      medida_ingenieria: 'Bandas antiderrapantes fotoluminiscentes y barandas perimetrales rígidas en vanos de escalera',
      medida_administrativa: 'Inspección locativa diaria de vías peatonales, demarcación de zonas húmedas',
      medida_eppu: 'Botas de seguridad antideslizantes con puntera',
      factores_reduccion: 'Las escaleras metálicas con barandas y bandas antideslizantes bajan la probabilidad de caída al mínimo'
    }
  ];

  await GTC45Session.findOneAndUpdate(
    { $or: [{ conversationId: officialConvoId }, { user: userId, companyId: companyId, isOfficial: true }] },
    {
      $set: {
        conversationId: officialConvoId,
        user: userId,
        companyId: companyId,
        isOfficial: true,
        officialTitle: 'Matriz IPEVR Oficial SG-SST - Constructora Activos SAS',
        matrixRows: gtcRows,
        updatedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );
  console.log('✓ GTC45WorkspaceSession: Sesión oficial con 6 riesgos creada y vinculada');

  // 3. MATRIZ LEGAL (MatrizLegalData vinculada a companyId)
  const legalStatuses = [
    {
      id: 'leg_01',
      norma: 'Decreto 1072 de 2015',
      articulo: 'Libro 2, Parte 2, Título 4, Capítulo 6',
      descripcion: 'Obligación del empleador de implementar y mantener el SG-SST basado en el ciclo PHVA.',
      clasificacion: 'Seguridad y Salud en el Trabajo',
      evidencia: 'Política SG-SST, Matriz IPEVR, Plan de Trabajo Anual firmado y asignación de recursos.',
      status: 'cumple',
      responsable: 'Gerencia General / Responsable SG-SST',
      fechaActualizacion: new Date()
    },
    {
      id: 'leg_02',
      norma: 'Resolución 0312 de 2019',
      articulo: 'Artículos 16, 23 y siguientes (Empresas Riesgo IV y V)',
      descripcion: 'Cumplimiento de los 60 Estándares Mínimos del SG-SST para empresas clasificadas en Riesgo V.',
      clasificacion: 'Estándares Mínimos SG-SST',
      evidencia: 'Autoevaluación de Estándares Mínimos radicada en MinTrabajo / Plan de Mejoramiento (75%).',
      status: 'cumple',
      responsable: 'Responsable SG-SST',
      fechaActualizacion: new Date()
    },
    {
      id: 'leg_03',
      norma: 'Resolución 4272 de 2021',
      articulo: 'Completa (Requisitos mínimos para trabajo en alturas)',
      descripcion: 'Requisitos mínimos de seguridad para trabajo en alturas a partir de 2.0 metros.',
      clasificacion: 'Seguridad en Trabajos de Alto Riesgo',
      evidencia: 'Certificaciones de trabajo en alturas (autorizado y coordinador), inspección de arneses y PTA.',
      status: 'cumple',
      responsable: 'Coordinador de Trabajo en Alturas / Responsable SST',
      fechaActualizacion: new Date()
    },
    {
      id: 'leg_04',
      norma: 'Resolución 2400 de 1979',
      articulo: 'Título IV, Cap. I (Andamios y escaleras) y Título VI (EPP)',
      descripcion: 'Estatuto de Seguridad Industrial: Andamios, escaleras, orden y aseo y dotación de EPP en obras.',
      clasificacion: 'Seguridad Industrial en Construcción',
      evidencia: 'Inspecciones de andamios certificados, orden y aseo en frentes de obra y actas de EPP.',
      status: 'cumple',
      responsable: 'Encargado de Obra / Responsable SST',
      fechaActualizacion: new Date()
    }
  ];

  await MatrizLegalData.findOneAndUpdate(
    { user: userId, companyId: companyId },
    { $set: { user: userId, companyId: companyId, statuses: legalStatuses, updatedAt: new Date() } },
    { upsert: true, new: true }
  );
  console.log('✓ MatrizLegalData: 4 normas vinculadas');

  // 4. PRODUCTOS QUÍMICOS (SgsstChemicalData vinculada a companyId)
  const productosQuimicos = [
    {
      id: 'chem_01',
      nombre: 'Pintura Viniltex Arquitectónica Base Agua',
      fabricante: 'Pintuco',
      estadoFisico: 'Líquido',
      pictogramasSga: ['Signo de exclamación'],
      claseOnu: 'No clasificado peligroso transporte',
      ubicacion: 'Almacén de obra / Bodega de acabados',
      cantidadAlmacenada: '10 Cuñetes (50 Galones)',
      tieneFds: 'Sí',
      tieneRotuloSga: 'Sí',
      incompatibilidades: ['Ácidos fuertes', 'Agentes oxidantes fuertes'],
      observaciones: 'Uso de gafas de seguridad, guantes de nitrilo y buena ventilación.'
    },
    {
      id: 'chem_02',
      nombre: 'Esmalte Sintético Alquídico Doméstico e Industrial',
      fabricante: 'Pintuco / Pintuland',
      estadoFisico: 'Líquido',
      pictogramasSga: ['Llama (Inflamable)', 'Signo de exclamación', 'Peligro para la salud'],
      claseOnu: 'Clase 3 (Líquidos Inflamables)',
      ubicacion: 'Gabinete para inflamables / Bodega obra',
      cantidadAlmacenada: '15 Galones',
      tieneFds: 'Sí',
      tieneRotuloSga: 'Sí',
      incompatibilidades: ['Ácidos fuertes', 'Oxidantes fuertes', 'Fuentes de ignición'],
      observaciones: 'Almacenar en lugar fresco alejado de chispas. Respirador para vapores orgánicos.'
    },
    {
      id: 'chem_03',
      nombre: 'Thinner Corriente / Disolvente para Pintura',
      fabricante: 'Disolventes del Norte',
      estadoFisico: 'Líquido',
      pictogramasSga: ['Llama (Inflamable)', 'Signo de exclamación', 'Peligro para la salud'],
      claseOnu: 'Clase 3 (Líquidos Inflamables UN 1263)',
      ubicacion: 'Gabinete para inflamables / Bodega obra',
      cantidadAlmacenada: '10 Galones',
      tieneFds: 'Sí',
      tieneRotuloSga: 'Sí',
      incompatibilidades: ['Oxidantes fuertes', 'Ácidos concentrados', 'Fuentes de ignición'],
      observaciones: 'Altamente inflamable y volátil. Kit antiderrames cerca y ventilación adecuada.'
    },
    {
      id: 'chem_04',
      nombre: 'Cemento Gris Uso General Estructural',
      fabricante: 'Argos / Cemex',
      estadoFisico: 'Sólido',
      pictogramasSga: ['Corrosión', 'Signo de exclamación', 'Peligro para la salud'],
      claseOnu: 'No clasificado peligroso transporte',
      ubicacion: 'Centro de acopio de materiales / Zona de mezclado',
      cantidadAlmacenada: '150 Bultos (50 Kg c/u)',
      tieneFds: 'Sí',
      tieneRotuloSga: 'Sí',
      incompatibilidades: ['Ácidos fuertes', 'Humedad no controlada'],
      observaciones: 'Polvo alcalino irritante. Guantes de caucho/carnaza y respirador N95 obligatorio.'
    },
    {
      id: 'chem_05',
      nombre: 'Ácido Nítrico (Solución para limpieza técnica de fachadas)',
      fabricante: 'Químicos Industriales',
      estadoFisico: 'Líquido',
      pictogramasSga: ['Corrosión', 'Comburente (Llama sobre círculo)', 'Tóxico agudo'],
      claseOnu: 'Clase 8 (Sustancias Corrosivas UN 2031)',
      ubicacion: 'Bodega de sustancias químicas controladas',
      cantidadAlmacenada: '2 Garrafas (10 Litros)',
      tieneFds: 'Sí',
      tieneRotuloSga: 'Sí',
      incompatibilidades: ['Bases fuertes', 'Compuestos orgánicos', 'Metales reactivos'],
      observaciones: 'Sustancia corrosiva y oxidante severa. Uso obligatorio de guantes de butilo, careta facial y traje impermeable.'
    }
  ];

  await SgsstChemicalData.findOneAndUpdate(
    { user: userId, companyId: companyId },
    { $set: { user: userId, companyId: companyId, productos: productosQuimicos, updatedAt: new Date() } },
    { upsert: true, new: true }
  );
  console.log('✓ SgsstChemicalData: 5 productos químicos vinculados');

  // 5. PROGRAMA DE CAPACITACIONES (ProgramaCapacitacionesData vinculada a companyId)
  const sesiones = [
    {
      id: 'cap_01',
      tema: 'Trabajo Seguro en Alturas y Medidas de Protección contra Caídas',
      fecha: '2024-11-15',
      hora: '08:00 AM',
      duracion: '4 horas',
      responsable: 'Centro de Entrenamiento Autorizado / Coordinador Alturas',
      descripcion: 'Normativa Res. 4272/2021, inspección preoperacional de arnés y eslingas, anclajes seguros y rescate en obra.',
      estado: 'Programada',
      trabajadoresRegistrados: []
    },
    {
      id: 'cap_02',
      tema: 'Higiene Postural y Manipulación Manual de Cargas en Obra Civil',
      fecha: '2024-11-28',
      hora: '07:30 AM',
      duracion: '2 horas',
      responsable: 'Fisioterapeuta / ARL Sura',
      descripcion: 'Técnicas de levantamiento seguro de bultos y cargas pesadas, pausas activas y prevención de lumbalgias.',
      estado: 'Programada',
      trabajadoresRegistrados: []
    },
    {
      id: 'cap_03',
      tema: 'Manejo Seguro de Sustancias Químicas y Sistema Globalmente Armonizado (SGA)',
      fecha: '2024-12-05',
      hora: '08:00 AM',
      duracion: '2 horas',
      responsable: 'Responsable SG-SST',
      descripcion: 'Interpretación de pictogramas SGA, hojas FDS de cemento, solventes y pinturas, y control de derrames.',
      estado: 'Programada',
      trabajadoresRegistrados: []
    }
  ];

  await ProgramaCapacitacionesData.findOneAndUpdate(
    { user: userId, companyId: companyId },
    { $set: { user: userId, companyId: companyId, sesiones: sesiones, updatedAt: new Date() } },
    { upsert: true, new: true }
  );
  console.log('✓ ProgramaCapacitacionesData: 3 capacitaciones programadas');

  console.log('\n=== TODO SE HA SINCRONIZADO Y VINCULADO SATISFACTORIAMENTE A CONSTRUCTORA ACTIVOS S.A.S. ===');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
