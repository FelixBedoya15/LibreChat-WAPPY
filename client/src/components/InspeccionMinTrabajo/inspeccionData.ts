export interface InspeccionItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'info' | 'laboral' | 'genero' | 'sgsst';
  criteria: string;
  normativeText?: string;
  points: number;
  isInformative?: boolean;
}

export const INSPECCION_ITEMS: InspeccionItem[] = [
  // PARTE II: DERECHO INDIVIDUAL Y COLECTIVO - Programas y sellos
  { id:'imt_1', code:'A-01', name:'Trabajadores mayores de edad protegida', description:'¿Tiene trabajadores/as mayores de 57 años mujeres y/o mayores de 62 años hombres?', category:'laboral', criteria:'Ley 2040 de 2020', normativeText:'Artículo 7 de la Ley 2040 del 2020 – Sello Amigable Adulto Mayor.', points:2, isInformative:true },
  { id:'imt_2', code:'A-02', name:'Certificado Sello Amigable Adulto Mayor', description:'¿Cuenta con el Certificado de Sello Amigable Adulto Mayor?', category:'laboral', criteria:'Art. 7 Ley 2040/2020', points:3 },
  { id:'imt_3', code:'A-03', name:'Sello EQUIPARES', description:'¿Cuenta con el sello EQUIPARES?', category:'laboral', criteria:'EQUIPARES', points:3 },
  { id:'imt_4', code:'A-04', name:'Sello Segundas Oportunidades', description:'¿Cuenta con sello "segundas oportunidades"? (Ley 2208 de 2022)', category:'laboral', criteria:'Ley 2208/2022', points:2 },
  { id:'imt_5', code:'A-05', name:'Mujeres víctimas de violencia de género', description:'¿Laboran mujeres víctimas de violencias de género? ¿Se encuentra inscrito para recibir la deducción tributaria?', category:'laboral', criteria:'Ley 1257/2008, Decreto 2733/2012', normativeText:'Ley 1257 de 2008 y Decreto 2733 de 2012', points:2, isInformative:true },
  // PARTE II-B: Derecho colectivo
  { id:'imt_6', code:'B-01', name:'Organización Sindical', description:'¿Existe Organización Sindical en la Empresa?', category:'laboral', criteria:'CST Art. 353', normativeText:'Código Sustantivo del Trabajo, artículos 353 y siguientes sobre libertad sindical.', points:2, isInformative:true },
  { id:'imt_7', code:'B-02', name:'Convención Colectiva vigente', description:'¿Existe Convención Colectiva? (revisar soportes)', category:'laboral', criteria:'CST Art. 467', points:2 },
  { id:'imt_8', code:'B-03', name:'Pacto Colectivo no superior a convención', description:'¿Los pactos colectivos o planes de beneficios son superiores a la convención colectiva?', category:'laboral', criteria:'CST Art. 481', points:2 },
  // PARTE II-C: Salario
  { id:'imt_9', code:'C-01', name:'Presentación de nómina', description:'¿Presenta nómina de pago?', category:'laboral', criteria:'CST Art. 62', points:3 },
  { id:'imt_10', code:'C-02', name:'Pago oportuno de salarios', description:'¿Paga oportunamente los salarios?', category:'laboral', criteria:'CST Art. 65', normativeText:'CST artículo 65 sobre mora en el pago de salarios.', points:4 },
  { id:'imt_11', code:'C-03', name:'Pago salario integral conforme a ley', description:'¿Paga salario integral conforme a la ley?', category:'laboral', criteria:'CST Art. 132', points:3 },
  { id:'imt_12', code:'C-04', name:'Sin descuentos no autorizados', description:'¿Efectúa descuentos no autorizados?', category:'laboral', criteria:'CST Art. 149', normativeText:'CST artículo 149 – prohibición de deducciones no autorizadas.', points:4 },
  { id:'imt_13', code:'C-05', name:'Igualdad salarial género', description:'¿El salario de las mujeres trabajadoras es igual al de los hombres que ejercen la misma labor?', category:'laboral', criteria:'Ley 1496/2011', normativeText:'Ley 1496 de 2011 – Igualdad salarial entre hombres y mujeres.', points:4 },
  // PARTE II-D: Vacaciones
  { id:'imt_14', code:'D-01', name:'Concesión de vacaciones conforme CST Art. 187', description:'¿Concede vacaciones en los términos del art. 187 del CST?', category:'laboral', criteria:'CST Art. 187', points:3 },
  { id:'imt_15', code:'D-02', name:'Registro de vacaciones', description:'¿Lleva registro de vacaciones conforme a la legislación?', category:'laboral', criteria:'CST Art. 187', points:2 },
  // PARTE II-E: Descansos remunerados
  { id:'imt_16', code:'E-01', name:'Trabajo dominical remunerado', description:'¿Concede descanso dominical y/o festivos remunerados?', category:'laboral', criteria:'CST Art. 179', normativeText:'CST artículos 172–180 sobre descanso dominical obligatorio.', points:3 },
  { id:'imt_17', code:'E-02', name:'Recargos legales dominicales/festivos', description:'¿Los liquida y paga con los recargos legales?', category:'laboral', criteria:'CST Art. 180', points:3 },
  // PARTE II-F: Jornada laboral
  { id:'imt_18', code:'F-01', name:'Control horas extras', description:'¿Los trabajadores/as laboran horas extras? ¿Cuántos?', category:'laboral', criteria:'CST Art. 161', points:2, isInformative:true },
  { id:'imt_19', code:'F-02', name:'Autorización horas extras MinTrabajo', description:'¿Cuenta con autorización del Ministerio del Trabajo para horas extras?', category:'laboral', criteria:'CST Art. 162', normativeText:'CST artículo 162 – autorización ministerial para trabajo suplementario.', points:3 },
  { id:'imt_20', code:'F-03', name:'Registro diario trabajo suplementario', description:'¿Lleva registro diario de trabajo suplementario con: nombre, edad, sexo, actividad, N° horas, liquidación?', category:'laboral', criteria:'CST Art. 162', points:3 },
  { id:'imt_21', code:'F-04', name:'Recargo nocturno conforme a ley', description:'¿Reconoce pago por recargo nocturno conforme a la Ley?', category:'laboral', criteria:'CST Art. 168', points:3 },
  { id:'imt_22', code:'F-05', name:'Reducción horaria Ley 2101/2021', description:'¿Implementó reducción horaria según Ley 2101 de 2021?', category:'laboral', criteria:'Ley 2101/2021', normativeText:'Ley 2101 de 2021 – Reducción progresiva de la jornada laboral.', points:3 },
  // PARTE II-G: Teletrabajo
  { id:'imt_23', code:'G-01', name:'Aplicación Ley desconexión laboral', description:'¿Aplica Ley de desconexión laboral? (Ley 2191 de 2022)', category:'laboral', criteria:'Ley 2191/2022', normativeText:'Ley 2191 de 2022 – Derecho a la desconexión digital.', points:3 },
  // PARTE II-H: Auxilio de transporte
  { id:'imt_24', code:'H-01', name:'Pago auxilio de transporte', description:'¿Reconoce el pago del Auxilio de Transporte conforme a la Ley?', category:'laboral', criteria:'Ley 15/1959', points:3 },
  { id:'imt_25', code:'H-02', name:'Auxilio transporte en prestaciones sociales', description:'¿El Auxilio de Transporte se incluye para liquidar prestaciones sociales?', category:'laboral', criteria:'Ley 15/1959', points:3 },
  // PARTE II-I: Dotación
  { id:'imt_26', code:'I-01', name:'Entrega dotación en periodos legales', description:'¿Entrega calzado y vestido de labor dentro de los periodos legales?', category:'laboral', criteria:'CST Art. 230', normativeText:'CST artículo 230 – Entrega de dotación en calzado y vestido de labor.', points:3 },
  // PARTE II-J: Seguridad social integral
  { id:'imt_27', code:'J-01', name:'Aportes parafiscales SENA/ICBF/Caja', description:'¿Efectúa aportes con destino al SENA, ICBF y Caja de Compensación Familiar?', category:'laboral', criteria:'Ley 21/1982', normativeText:'Ley 21 de 1982 – Aportes parafiscales obligatorios.', points:4 },
  { id:'imt_28', code:'J-02', name:'Pago oportuno de aportes', description:'¿Realiza pago oportuno de aportes de seguridad social?', category:'laboral', criteria:'Ley 100/1993', points:4 },
  { id:'imt_29', code:'J-03', name:'Nómina real para aportes', description:'¿La nómina sobre la cual se aporta corresponde a la real?', category:'laboral', criteria:'Ley 100/1993', points:4 },
  // PARTE II-K: EPS
  { id:'imt_30', code:'K-01', name:'Afiliación EPS desde vinculación', description:'¿Afilia al trabajador/a a EPS desde su vinculación?', category:'laboral', criteria:'Ley 100/1993 Art. 157', normativeText:'Ley 100 de 1993 artículo 157 – Afiliación obligatoria al Sistema de Salud.', points:4 },
  { id:'imt_31', code:'K-02', name:'Cotización EPS sobre salario real', description:'¿Cotizan a la EPS sobre el salario real devengado?', category:'laboral', criteria:'Ley 100/1993', points:3 },
  { id:'imt_32', code:'K-03', name:'Pago oportuno EPS', description:'¿Cancela cotización a EPS dentro de los plazos legales?', category:'laboral', criteria:'Ley 100/1993', points:3 },
  // PARTE II-L: Pensiones
  { id:'imt_33', code:'L-01', name:'Afiliación Pensiones desde vinculación', description:'¿Afilia al trabajador/a a fondo de pensiones desde su vinculación?', category:'laboral', criteria:'Ley 100/1993 Art. 15', points:4 },
  { id:'imt_34', code:'L-02', name:'Cotización pensiones sobre salario real', description:'¿Cotizan pensiones sobre el salario real devengado?', category:'laboral', criteria:'Ley 100/1993', points:3 },
  // PARTE II-M: ARL
  { id:'imt_35', code:'M-01', name:'Afiliación y aportes ARL', description:'¿La empresa está afiliada a una ARL y cotiza oportunamente?', category:'laboral', criteria:'Dec 1072/2015', normativeText:'Decreto 1072 de 2015 – Afiliación y aportes al Sistema General de Riesgos Laborales.', points:4 },
  { id:'imt_36', code:'M-02', name:'Aportes ARL sobre nómina real', description:'¿La nómina sobre la cual se aporta a ARL corresponde al pago real?', category:'laboral', criteria:'Dec 1072/2015', points:3 },
  // PARTE II-N: Prima de servicios
  { id:'imt_37', code:'N-01', name:'Liquidación correcta prima de servicios', description:'¿Liquida correctamente la Prima de Servicios?', category:'laboral', criteria:'CST Art. 306', normativeText:'CST artículo 306 – Prima de servicios obligatoria.', points:3 },
  { id:'imt_38', code:'N-02', name:'Pago oportuno prima de servicios', description:'¿Paga oportunamente la Prima de Servicios?', category:'laboral', criteria:'CST Art. 306', points:3 },
  // PARTE II-O: Cesantías
  { id:'imt_39', code:'O-01', name:'Consignación de cesantías a fondo', description:'¿Consigna cesantías a un Fondo de Cesantías oportunamente?', category:'laboral', criteria:'Ley 50/1990', normativeText:'Ley 50 de 1990 – Consignación de cesantías a fondo privado.', points:4 },
  { id:'imt_40', code:'O-02', name:'Liquidación correcta de cesantías', description:'¿Liquida correctamente las cesantías?', category:'laboral', criteria:'Ley 50/1990', points:3 },
  // PARTE II-P: Intereses cesantías
  { id:'imt_41', code:'P-01', name:'Pago intereses de cesantías', description:'¿Paga oportunamente los intereses de cesantías conforme a la Ley?', category:'laboral', criteria:'Ley 52/1975', normativeText:'Ley 52 de 1975 – Intereses de cesantías (12% anual).', points:3 },

  // PARTE III: ENFOQUE DIFERENCIAL Y DE GÉNERO
  { id:'imt_42', code:'AG-01', name:'Requisitos de ingreso sin discriminación de género', description:'¿El sexo o el género constituyen requisito para acceder a ciertos cargos de la empresa?', category:'genero', criteria:'Ley 1496/2011', normativeText:'Ley 1496 de 2011 – Igualdad salarial y no discriminación.', points:3 },
  { id:'imt_43', code:'AG-02', name:'Requisitos de acceso igualitarios', description:'¿Los requisitos para acceder a ciertos cargos se aplican de manera igualitaria a todos los aspirantes?', category:'genero', criteria:'Ley 1496/2011', points:3 },
  { id:'imt_44', code:'AG-03', name:'Sin preguntas discriminatorias en entrevistas', description:'¿En la entrevista se realizan preguntas sobre composición familiar, planificación familiar o planes reproductivos?', category:'genero', criteria:'Ley 1257/2008', normativeText:'Ley 1257 de 2008 – Protección contra discriminación en el trabajo.', points:3 },
  { id:'imt_45', code:'AG-04', name:'Sin pruebas de embarazo como requisito', description:'¿La empresa ordena la práctica de prueba de embarazo como requisito para ingresar?', category:'genero', criteria:'Ley 1257/2008', points:4 },
  { id:'imt_46', code:'AG-05', name:'Protocolos contra acoso laboral', description:'¿Cuenta con mecanismos/protocolos para identificar, prevenir y atender conductas de acoso laboral?', category:'genero', criteria:'Ley 1010/2006', normativeText:'Ley 1010 de 2006 – Prevención, corrección y sanción del acoso laboral.', points:4 },
  { id:'imt_47', code:'AG-06', name:'Protocolos contra acoso sexual laboral', description:'¿Cuenta con mecanismos para identificar, prevenir y atender conductas de acoso sexual laboral?', category:'genero', criteria:'Ley 1010/2006', points:4 },
  { id:'imt_48', code:'AG-07', name:'Política contra violencias de género', description:'¿Cuenta con una política institucional contra las violencias de género en el trabajo?', category:'genero', criteria:'Ley 1257/2008', points:3 },
  { id:'imt_49', code:'AG-08', name:'Comité de Convivencia Laboral activo', description:'¿Tiene Comité de Convivencia Laboral conformado y en funcionamiento?', category:'genero', criteria:'Res 652/2012', normativeText:'Resolución 652 de 2012 – Comités de Convivencia Laboral.', points:4 },

  // PARTE IV: SG-SST
  { id:'imt_50', code:'SS-01', name:'SG-SST implementado Dec 1072/2015', description:'¿Tiene implementado el Sistema de Gestión de Seguridad y Salud en el Trabajo – SG-SST?', category:'sgsst', criteria:'Dec 1072/2015 Libro 2 Parte 2 Título 4', normativeText:'Decreto 1072 de 2015, artículo 2.2.4.6.1 y siguientes – Implementación del SG-SST.', points:5 },
  { id:'imt_51', code:'SS-02', name:'Responsable del SG-SST certificado', description:'¿El responsable del SG-SST tiene la formación y certificación requerida?', category:'sgsst', criteria:'Res 0312/2019', normativeText:'Resolución 0312 de 2019 – Estándares mínimos del SG-SST.', points:4 },
  { id:'imt_52', code:'SS-03', name:'Política de SST documentada y comunicada', description:'¿Cuenta con Política de SST documentada, firmada por la alta dirección y comunicada?', category:'sgsst', criteria:'Dec 1072/2015 Art. 2.2.4.6.5', normativeText:'Decreto 1072 de 2015, artículo 2.2.4.6.5 – Política de SST.', points:4 },
  { id:'imt_53', code:'SS-04', name:'Evaluación inicial (Autoevaluación)', description:'¿Realizó la autoevaluación de Estándares Mínimos conforme a la Resolución 0312?', category:'sgsst', criteria:'Res 0312/2019', points:4 },
  { id:'imt_54', code:'SS-05', name:'Plan Anual de Trabajo SST', description:'¿Cuenta con Plan Anual de Trabajo del SG-SST definido y aprobado?', category:'sgsst', criteria:'Dec 1072/2015 Art. 2.2.4.6.17', normativeText:'Decreto 1072 de 2015, artículo 2.2.4.6.17 – Plan Anual de Trabajo.', points:4 },
  { id:'imt_55', code:'SS-06', name:'Identificación de peligros y evaluación de riesgos (GTC-45)', description:'¿Realiza identificación de peligros, evaluación y valoración de riesgos (Matriz de Riesgos)?', category:'sgsst', criteria:'Dec 1072/2015 Art. 2.2.4.6.15', normativeText:'GTC-45:2012 – Guía para la identificación de los peligros y la valoración de los riesgos.', points:5 },
  { id:'imt_56', code:'SS-07', name:'Programa de capacitación SST', description:'¿Tiene programa de capacitación en SST documentado y ejecutado?', category:'sgsst', criteria:'Dec 1072/2015 Art. 2.2.4.6.11', points:3 },
  { id:'imt_57', code:'SS-08', name:'COPASST conformado y activo', description:'¿El Comité Paritario de Seguridad y Salud en el Trabajo (COPASST) está conformado, registrado y en funcionamiento?', category:'sgsst', criteria:'Dec 1072/2015 Art. 2.2.4.6.8', normativeText:'Decreto 1072 de 2015, artículo 2.2.4.6.8 – COPASST.', points:4 },
  { id:'imt_58', code:'SS-09', name:'Investigación de accidentes de trabajo', description:'¿Investiga los Accidentes de Trabajo y Enfermedades Laborales dentro de los plazos legales?', category:'sgsst', criteria:'Dec 1072/2015 Art. 2.2.4.1.6', normativeText:'Decreto 1072 de 2015, artículo 2.2.4.1.6 – Investigación de incidentes y accidentes de trabajo.', points:5 },
  { id:'imt_59', code:'SS-10', name:'Reporte de AT y EL a ARL/Mintrabajo', description:'¿Reporta los Accidentes de Trabajo a la ARL dentro de los 2 días hábiles?', category:'sgsst', criteria:'Dec 1295/1994 Art. 62', normativeText:'Decreto 1295 de 1994, artículo 62 – Obligación de reporte de accidentes de trabajo.', points:5 },
  { id:'imt_60', code:'SS-11', name:'Exámenes médicos ocupacionales', description:'¿Realiza exámenes médicos ocupacionales de ingreso, periódicos y de egreso?', category:'sgsst', criteria:'Res 2346/2007', normativeText:'Resolución 2346 de 2007 – Práctica de evaluaciones médicas ocupacionales.', points:4 },
];

export const CATEGORIA_LABELS: Record<string, string> = {
  laboral: 'Derecho Individual y Colectivo',
  genero: 'Enfoque Diferencial y de Género',
  sgsst: 'Sistema de Gestión SST',
};

export const CATEGORIA_COLORS: Record<string, string> = {
  laboral: 'border-blue-500 text-blue-600',
  genero: 'border-purple-500 text-purple-600',
  sgsst: 'border-teal-500 text-teal-600',
};

export const MAX_SCORE = INSPECCION_ITEMS.reduce((sum, item) => sum + item.points, 0);
