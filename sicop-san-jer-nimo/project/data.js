// data.js — Sample data for SICOP San Jerónimo
// Municipalidad Distrital de San Jerónimo — Ejercicio fiscal 2026
// Estructura inspirada en el SIAF Web (MEF, Perú)

window.SICOP_DATA = (function () {
  // Órganos y unidades orgánicas
  const ORGANOS = [
    { codigo: '01', nombre: 'Alta Dirección', nivel: 'organo', padre: null },
    { codigo: '01.01', nombre: 'Alcaldía', nivel: 'unidad', padre: '01' },
    { codigo: '01.02', nombre: 'Gerencia Municipal', nivel: 'unidad', padre: '01' },
    { codigo: '02', nombre: 'Órgano de Control Institucional', nivel: 'organo', padre: null },
    { codigo: '02.01', nombre: 'OCI', nivel: 'unidad', padre: '02' },
    { codigo: '03', nombre: 'Órganos de Apoyo', nivel: 'organo', padre: null },
    { codigo: '03.01', nombre: 'Secretaría General', nivel: 'unidad', padre: '03' },
    { codigo: '03.02', nombre: 'Sub Gerencia de Recursos Humanos', nivel: 'unidad', padre: '03' },
    { codigo: '03.03', nombre: 'Sub Gerencia de Logística', nivel: 'unidad', padre: '03' },
    { codigo: '03.04', nombre: 'Sub Gerencia de Tesorería', nivel: 'unidad', padre: '03' },
    { codigo: '03.05', nombre: 'Sub Gerencia de Contabilidad', nivel: 'unidad', padre: '03' },
    { codigo: '03.06', nombre: 'Sub Gerencia de Tecnologías de Información', nivel: 'unidad', padre: '03' },
    { codigo: '04', nombre: 'Órganos de Asesoramiento', nivel: 'organo', padre: null },
    { codigo: '04.01', nombre: 'Gerencia de Planeamiento y Presupuesto', nivel: 'unidad', padre: '04' },
    { codigo: '04.02', nombre: 'Oficina de Asesoría Jurídica', nivel: 'unidad', padre: '04' },
    { codigo: '05', nombre: 'Órganos de Línea', nivel: 'organo', padre: null },
    { codigo: '05.01', nombre: 'Gerencia de Desarrollo Urbano e Infraestructura', nivel: 'unidad', padre: '05' },
    { codigo: '05.02', nombre: 'Gerencia de Servicios Públicos', nivel: 'unidad', padre: '05' },
    { codigo: '05.03', nombre: 'Gerencia de Desarrollo Social', nivel: 'unidad', padre: '05' },
    { codigo: '05.04', nombre: 'Gerencia de Desarrollo Económico Local', nivel: 'unidad', padre: '05' },
    { codigo: '05.05', nombre: 'Gerencia de Gestión Ambiental', nivel: 'unidad', padre: '05' },
  ];

  const GENERICAS = [
    { codigo: '2.1', nombre: 'Personal y Obligaciones Sociales' },
    { codigo: '2.2', nombre: 'Pensiones y Otras Prestaciones Sociales' },
    { codigo: '2.3', nombre: 'Bienes y Servicios' },
    { codigo: '2.5', nombre: 'Otros Gastos' },
    { codigo: '2.6', nombre: 'Adquisición de Activos No Financieros' },
  ];

  const RUBROS = [
    { codigo: '00', nombre: 'Recursos Ordinarios', fuente: '1' },
    { codigo: '07', nombre: 'Fondo de Compensación Municipal', fuente: '5' },
    { codigo: '08', nombre: 'Impuestos Municipales', fuente: '5' },
    { codigo: '09', nombre: 'Recursos Directamente Recaudados', fuente: '2' },
    { codigo: '18', nombre: 'Canon, Sobrecanon, Regalías y Participaciones', fuente: '5' },
  ];

  const FUENTES = [
    { codigo: '1', nombre: 'Recursos Ordinarios' },
    { codigo: '2', nombre: 'Recursos Directamente Recaudados' },
    { codigo: '5', nombre: 'Recursos Determinados' },
  ];

  // Finalidades presupuestales (códigos representativos)
  const FINALIDADES = [
    { codigo: '0001253', nombre: 'Conducción y orientación superior' },
    { codigo: '0046828', nombre: 'Gestión administrativa' },
    { codigo: '0048129', nombre: 'Acciones de control y auditoría' },
    { codigo: '0066722', nombre: 'Mantenimiento de vías locales' },
    { codigo: '0066850', nombre: 'Limpieza pública' },
    { codigo: '0067082', nombre: 'Seguridad ciudadana — Serenazgo' },
    { codigo: '0067149', nombre: 'Parques y jardines' },
    { codigo: '0067203', nombre: 'Programa de complementación alimentaria' },
    { codigo: '0067411', nombre: 'Atención integral del menor' },
    { codigo: '0067598', nombre: 'Promoción del desarrollo económico local' },
    { codigo: '0148321', nombre: 'Mejoramiento de pistas y veredas Av. Cusco' },
    { codigo: '0149007', nombre: 'Construcción puente peatonal Sector Ccollana' },
    { codigo: '0149845', nombre: 'Ampliación red de agua potable Picol Orconpujio' },
    { codigo: '0150112', nombre: 'Mejoramiento I.E. N° 50574 Sucso Auccaylle' },
    { codigo: '0150488', nombre: 'Rehabilitación Mercado Vinocanchón' },
    { codigo: '0150992', nombre: 'Recuperación riberas río Huatanay' },
  ];

  // Clasificadores específicos detalle (muestra representativa)
  const CLASIFICADORES = [
    // 2.1
    { codigo: '2.1.1 1.1 1', nombre: 'Personal administrativo', generica: '2.1' },
    { codigo: '2.1.1 1.1 2', nombre: 'Personal obrero', generica: '2.1' },
    { codigo: '2.1.1 9.1 3', nombre: 'Aguinaldos', generica: '2.1' },
    { codigo: '2.1.1 9.2 1', nombre: 'Vacaciones truncas', generica: '2.1' },
    { codigo: '2.1.3 1.1 5', nombre: 'Contribuciones a EsSalud', generica: '2.1' },
    // 2.2
    { codigo: '2.2.1 1.1 1', nombre: 'Régimen de pensiones D.L. 20530', generica: '2.2' },
    // 2.3
    { codigo: '2.3.1 1.1 1', nombre: 'Alimentos para personas', generica: '2.3' },
    { codigo: '2.3.1 5.1 2', nombre: 'Papelería en general, útiles', generica: '2.3' },
    { codigo: '2.3.1 5.3 1', nombre: 'Aseo, limpieza y tocador', generica: '2.3' },
    { codigo: '2.3.1 99.1 4', nombre: 'Otros bienes', generica: '2.3' },
    { codigo: '2.3.2 1.2 1', nombre: 'Pasajes y gastos de transporte', generica: '2.3' },
    { codigo: '2.3.2 2.4 4', nombre: 'Servicio de impresiones', generica: '2.3' },
    { codigo: '2.3.2 4.1 3', nombre: 'Mantenimiento de vehículos', generica: '2.3' },
    { codigo: '2.3.2 7.11 99', nombre: 'Servicios diversos', generica: '2.3' },
    { codigo: '2.3.2 8.1 1', nombre: 'Contrato Administrativo de Servicios', generica: '2.3' },
    // 2.5
    { codigo: '2.5.1 1.1 99', nombre: 'Otras transferencias', generica: '2.5' },
    // 2.6
    { codigo: '2.6.2 3.1 1', nombre: 'Edificios e instalaciones', generica: '2.6' },
    { codigo: '2.6.2 3.2 1', nombre: 'Infraestructura vial', generica: '2.6' },
    { codigo: '2.6.2 3.4 1', nombre: 'Infraestructura agrícola', generica: '2.6' },
    { codigo: '2.6.3 2.1 1', nombre: 'Maquinaria y equipo', generica: '2.6' },
    { codigo: '2.6.3 2.3 1', nombre: 'Equipos informáticos', generica: '2.6' },
  ];

  // Helpers
  const rand = (seed) => {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  };
  const r = rand(42);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const between = (a, b) => Math.round((a + r() * (b - a)) * 100) / 100;

  // Genera registros — combinaciones realistas
  const registros = [];
  let rid = 1;

  // Pre-defined high-level rows for the principal report (deterministic distribution)
  const seeds = [
    // unidad, finalidad, rubro, clasificadores, PIA aproximado
    ['01.01', '0001253', '00', ['2.1.1 1.1 1', '2.1.3 1.1 5', '2.3.2 7.11 99'], 850000],
    ['01.02', '0046828', '00', ['2.1.1 1.1 1', '2.3.1 5.1 2', '2.3.2 8.1 1'], 1200000],
    ['02.01', '0048129', '00', ['2.1.1 1.1 1', '2.3.2 1.2 1'], 320000],
    ['03.01', '0046828', '00', ['2.3.1 5.1 2', '2.3.2 2.4 4', '2.3.2 8.1 1'], 480000],
    ['03.02', '0046828', '00', ['2.1.1 1.1 1', '2.1.1 9.1 3', '2.1.1 9.2 1', '2.1.3 1.1 5', '2.2.1 1.1 1'], 5800000],
    ['03.03', '0046828', '00', ['2.3.1 5.1 2', '2.3.2 4.1 3', '2.3.2 8.1 1', '2.6.3 2.1 1'], 720000],
    ['03.04', '0046828', '00', ['2.1.1 1.1 1', '2.3.2 8.1 1'], 380000],
    ['03.05', '0046828', '00', ['2.1.1 1.1 1', '2.3.2 8.1 1'], 360000],
    ['03.06', '0046828', '09', ['2.3.2 8.1 1', '2.6.3 2.3 1'], 540000],
    ['04.01', '0046828', '00', ['2.1.1 1.1 1', '2.3.2 8.1 1'], 420000],
    ['04.02', '0046828', '00', ['2.3.2 8.1 1', '2.3.2 7.11 99'], 280000],
    ['05.01', '0066722', '07', ['2.3.1 99.1 4', '2.3.2 7.11 99', '2.6.2 3.2 1'], 2400000],
    ['05.01', '0148321', '18', ['2.6.2 3.1 1', '2.6.2 3.2 1'], 3800000, 'CUI-2548721', 'Mejoramiento del servicio de transitabilidad en la Av. Cusco — San Jerónimo'],
    ['05.01', '0149007', '18', ['2.6.2 3.1 1'], 1850000, 'CUI-2611204', 'Construcción del puente peatonal en el Sector Ccollana'],
    ['05.01', '0149845', '07', ['2.6.2 3.1 1', '2.6.2 3.4 1'], 980000, 'CUI-2598033', 'Ampliación de la red de agua potable Picol Orconpujio'],
    ['05.02', '0066850', '07', ['2.1.1 1.1 2', '2.3.1 5.3 1', '2.3.2 8.1 1', '2.6.3 2.1 1'], 1850000],
    ['05.02', '0067082', '08', ['2.1.1 1.1 1', '2.3.2 8.1 1', '2.6.3 2.1 1'], 1620000],
    ['05.02', '0067149', '07', ['2.1.1 1.1 2', '2.3.1 99.1 4', '2.3.2 8.1 1'], 720000],
    ['05.03', '0067203', '00', ['2.3.1 1.1 1', '2.3.2 8.1 1'], 540000],
    ['05.03', '0067411', '00', ['2.3.1 1.1 1', '2.3.2 8.1 1'], 380000],
    ['05.03', '0150112', '18', ['2.6.2 3.1 1'], 1450000, 'CUI-2702455', 'Mejoramiento del servicio educativo I.E. N° 50574 Sucso Auccaylle'],
    ['05.04', '0067598', '09', ['2.3.2 8.1 1', '2.5.1 1.1 99'], 420000],
    ['05.04', '0150488', '18', ['2.6.2 3.1 1'], 2200000, 'CUI-2715009', 'Rehabilitación del Mercado Vinocanchón — San Jerónimo'],
    ['05.05', '0066850', '07', ['2.3.1 99.1 4', '2.6.3 2.1 1'], 1080000],
    ['05.05', '0150992', '18', ['2.6.2 3.4 1'], 1620000, 'CUI-2728811', 'Recuperación del servicio ecosistémico en las riberas del río Huatanay'],
  ];

  // Monthly distribution profile (cumulative-ready). Sums roughly to 1.
  const monthProfile = [0.04, 0.06, 0.09, 0.10, 0.10, 0.10, 0.10, 0.10, 0.09, 0.08, 0.08, 0.06];

  seeds.forEach((seed) => {
    const [unidadCod, finCod, rubroCod, clasifs, piaBase, cui, inversion] = seed;
    clasifs.forEach((clCod) => {
      const cl = CLASIFICADORES.find((x) => x.codigo === clCod);
      const pia = Math.round(piaBase * (0.5 + r() * 0.6) / clasifs.length / 100) * 100;
      const modif = Math.round(pia * (-0.05 + r() * 0.25));
      const pim = pia + modif;
      const cert = Math.round(pim * (0.55 + r() * 0.35));
      const comp = Math.round(cert * (0.80 + r() * 0.18));
      const dev = Math.round(comp * (0.85 + r() * 0.13));
      const gir = Math.round(dev * (0.88 + r() * 0.10));
      const pag = Math.round(gir * (0.92 + r() * 0.07));

      // Distribute monthly (only completed months — assume current month is May, idx 4)
      const currentMonthIdx = 4; // mayo
      const monthlyComp = monthProfile.map((_, i) => i <= currentMonthIdx ? Math.round(comp * monthProfile[i] / monthProfile.slice(0, currentMonthIdx + 1).reduce((a, b) => a + b, 0)) : 0);
      const monthlyDev = monthProfile.map((_, i) => i <= currentMonthIdx ? Math.round(dev * monthProfile[i] / monthProfile.slice(0, currentMonthIdx + 1).reduce((a, b) => a + b, 0)) : 0);
      const monthlyGir = monthProfile.map((_, i) => i <= currentMonthIdx ? Math.round(gir * monthProfile[i] / monthProfile.slice(0, currentMonthIdx + 1).reduce((a, b) => a + b, 0)) : 0);
      const monthlyPag = monthProfile.map((_, i) => i <= currentMonthIdx ? Math.round(pag * monthProfile[i] / monthProfile.slice(0, currentMonthIdx + 1).reduce((a, b) => a + b, 0)) : 0);

      const unidad = ORGANOS.find((x) => x.codigo === unidadCod);
      const organoCod = unidad.padre;
      const organo = ORGANOS.find((x) => x.codigo === organoCod);
      const finalidad = FINALIDADES.find((x) => x.codigo === finCod);
      const rubro = RUBROS.find((x) => x.codigo === rubroCod);
      const fuente = FUENTES.find((x) => x.codigo === rubro.fuente);

      registros.push({
        id: rid++,
        anio: 2026,
        organoCod, organoNom: organo.nombre,
        unidadCod, unidadNom: unidad.nombre,
        secFunc: String(10000 + rid * 7),
        meta: String(rid).padStart(4, '0'),
        finCod, finNom: finalidad.nombre,
        rubroCod, rubroNom: rubro.nombre,
        fuenteCod: fuente.codigo, fuenteNom: fuente.nombre,
        genericaCod: cl.generica,
        genericaNom: GENERICAS.find((g) => g.codigo === cl.generica).nombre,
        clasifCod: cl.codigo,
        clasifNom: cl.nombre,
        cui: cui || null,
        inversion: inversion || null,
        uei: cui ? 'Sub Gerencia de Obras Públicas' : null,
        pia, modif, pim, cert,
        saldoCert: pim - cert,
        comp, dev, gir, pag,
        saldoEjec: pim - dev,
        certNoDev: cert - dev,
        devNoGir: dev - gir,
        monthlyComp, monthlyDev, monthlyGir, monthlyPag,
      });
    });
  });

  return {
    anio: 2026,
    pliego: 'Municipalidad Distrital de San Jerónimo',
    departamento: 'Cusco',
    provincia: 'Cusco',
    ultimaCarga: '13/05/2026 08:30 a. m.',
    archivo: 'ReporteGasto_13.05.26.xlsx',
    organos: ORGANOS,
    genericas: GENERICAS,
    rubros: RUBROS,
    fuentes: FUENTES,
    finalidades: FINALIDADES,
    clasificadores: CLASIFICADORES,
    registros,
    historial: [
      { id: 5, archivo: 'ReporteGasto_13.05.26.xlsx', fecha: '13/05/2026 08:30', usuario: 'jvargas@munisanjeronimo.gob.pe', anio: 2026, filas: 1248, creados: 12, actualizados: 1236, errores: 0, estado: 'procesado' },
      { id: 4, archivo: 'ReporteGasto_12.05.26.xlsx', fecha: '12/05/2026 08:42', usuario: 'jvargas@munisanjeronimo.gob.pe', anio: 2026, filas: 1248, creados: 0, actualizados: 1248, errores: 0, estado: 'procesado' },
      { id: 3, archivo: 'ReporteGasto_09.05.26.xlsx', fecha: '09/05/2026 09:15', usuario: 'mquispe@munisanjeronimo.gob.pe', anio: 2026, filas: 1246, creados: 4, actualizados: 1242, errores: 2, estado: 'observado' },
      { id: 2, archivo: 'ReporteGasto_08.05.26.xlsx', fecha: '08/05/2026 08:28', usuario: 'jvargas@munisanjeronimo.gob.pe', anio: 2026, filas: 1244, creados: 8, actualizados: 1236, errores: 0, estado: 'procesado' },
      { id: 1, archivo: 'ReporteGasto_07.05.26.xlsx', fecha: '07/05/2026 08:33', usuario: 'jvargas@munisanjeronimo.gob.pe', anio: 2026, filas: 1244, creados: 1244, actualizados: 0, errores: 0, estado: 'procesado' },
    ],
  };
})();
