const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const MarketplaceProduct = require('~/models/MarketplaceProduct');
const MarketplaceOrder = require('~/models/MarketplaceOrder');
const MarketplaceCategory = require('~/models/MarketplaceCategory');
const MarketplaceCoupon = require('~/models/MarketplaceCoupon');
const { getAppConfig } = require('~/server/services/Config');
const { logger } = require('~/config');

// Default initial categories for Occupational Health & SG-SST
const DEFAULT_CATEGORIES = [
  { name: 'Medicina Laboral', slug: 'medicina_laboral', description: 'Exámenes médicos ocupacionales de ingreso, periódicos y retiro', icon: 'Stethoscope', order: 1 },
  { name: 'Matrices & Peligros', slug: 'gtc45_ipevar', description: 'Matrices IPEVAR, GTC-45 y evaluación técnica de riesgos', icon: 'FileSpreadsheet', order: 2 },
  { name: 'Seguridad Vial PESV', slug: 'pesv', description: 'Diseño e implementación del Plan Estratégico de Seguridad Vial', icon: 'Car', order: 3 },
  { name: 'Riesgo Psicosocial', slug: 'psicosocial', description: 'Baterías de riesgo psicosocial y diagnóstico de clima laboral', icon: 'HeartPulse', order: 4 },
  { name: 'Ergonomía & Biomecánica', slug: 'ergonomia', description: 'Estudios de puestos de trabajo y análisis de carga física', icon: 'Activity', order: 5 },
  { name: 'Auditoría & Consultoría', slug: 'auditoria', description: 'Auditorías de estándares mínimos Res. 0312 e inspecciones', icon: 'ClipboardCheck', order: 6 },
  { name: 'Capacitación Certificada', slug: 'capacitaciones', description: 'Formación normativa en SST, COPASST y brigadas', icon: 'GraduationCap', order: 7 }
];

// Default initial catalog products
const DEFAULT_PRODUCTS = [
  {
    title: 'Batería de Riesgo Psicosocial Completa (Res. 2764 / 2022)',
    slug: 'bateria-riesgo-psicosocial-completa',
    sku: 'SST-PSI-001',
    shortDescription: 'Aplicación digital y presencial de la batería oficial por psicólogo especialista con licencia SST.',
    description: 'Servicio integral de evaluación del riesgo psicosocial intra-laboral, extra-laboral y de estrés conforme a la Resolución 2764 de 2022 del Ministerio del Trabajo. Incluye plataforma digital asistida, informe general de la empresa, informe individual confidencial y plan de intervención recomendado.',
    category: 'psicosocial',
    tags: ['Psicosocial', 'Res. 2764', 'Salud Mental', 'Psicología SST'],
    serviceType: 'service_hybrid',
    regularPrice: 750000,
    salePrice: 650000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Número de Trabajadores',
        options: [
          { label: '1 a 20 trabajadores', priceDelta: 0, isDefault: true },
          { label: '21 a 50 trabajadores', priceDelta: 250000, isDefault: false },
          { label: '51 a 100 trabajadores', priceDelta: 550000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '7 a 10 días hábiles',
    deliverables: [
      'Informe epidemiológico general de la organización',
      'Informes individuales confidenciales',
      'Plan de intervención psicosocial priorizado',
      'Certificado de cumplimiento normativo firmado por Psicólogo Especialista en SST'
    ],
    requirements: [
      'Listado de trabajadores con correo y cargo',
      'Espacio u horario para responder el cuestionario (virtual o físico)',
      'Organigrama general de la empresa'
    ],
    faqs: [
      { question: '¿Quién firma el informe?', answer: 'Un psicólogo especialista en Seguridad y Salud en el Trabajo con licencia vigente.' },
      { question: '¿Con qué frecuencia debe realizarse?', answer: 'Cada año para empresas con riesgo medio/alto y cada 2 años para riesgo bajo.' }
    ],
    featuredImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 14
  },
  {
    title: 'Diseño y Actualización de Matriz IPEVAR (GTC-45)',
    slug: 'matriz-ipevar-gtc45-asistida',
    sku: 'SST-PEL-002',
    shortDescription: 'Identificación de peligros y valoración de riesgos bajo GTC-45 con asistencia técnica experta.',
    description: 'Levantamiento y actualización de la Matriz de Peligros, Evaluación y Valoración de Riesgos (IPEVAR) conforme a la Guía Técnica Colombiana GTC-45 y el Decreto 1072 de 2015. Diseñada a la medida de los procesos, áreas operativas y cargos de su empresa.',
    category: 'gtc45_ipevar',
    tags: ['IPEVAR', 'GTC-45', 'Peligros', 'Decreto 1072'],
    serviceType: 'service_virtual',
    regularPrice: 420000,
    salePrice: 350000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Complejidad y Sedes',
        options: [
          { label: '1 Sede / Administrativo-Comercial', priceDelta: 0, isDefault: true },
          { label: '1 Sede / Operativo-Manufactura', priceDelta: 120000, isDefault: false },
          { label: 'Múltiples Sedes (hasta 3)', priceDelta: 280000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '4 a 6 días hábiles',
    deliverables: [
      'Matriz IPEVAR completa en formato Excel formulado',
      'Jerarquía de controles (Eliminación, Sustitución, Ingeniería, Administrativos y EPP)',
      'Informe técnico ejecutivo con priorización de medidas preventivas',
      'Sesión de socialización virtual con el responsable SST de la empresa'
    ],
    requirements: [
      'Listado de procesos, actividades y cargos',
      'Inspección fotográfica o recorrido de áreas'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 22
  },
  {
    title: 'Plan Estratégico de Seguridad Vial (PESV - Res. 20223040040595)',
    slug: 'diseno-implementacion-pesv',
    sku: 'SST-VIA-003',
    shortDescription: 'Estructuración y diseño del PESV según nivel Básico, Estándar o Avanzado.',
    description: 'Estructuración técnica del Plan Estratégico de Seguridad Vial conforme a la metodología de la Resolución 20223040040595 de 2022. Cubre los 4 pasos y 24 pasos según el nivel de su organización (Liderazgo, Gestión del Riesgo Vial, Talento Humano y Vehículos Seguros).',
    category: 'pesv',
    tags: ['PESV', 'Seguridad Vial', 'Movilidad', 'Mintransporte'],
    serviceType: 'service_hybrid',
    regularPrice: 950000,
    salePrice: 850000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Nivel PESV',
        options: [
          { label: 'Nivel Básico (11 a 19 vehículos)', priceDelta: 0, isDefault: true },
          { label: 'Nivel Estándar (20 a 50 vehículos)', priceDelta: 350000, isDefault: false },
          { label: 'Nivel Avanzado (>50 vehículos)', priceDelta: 750000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '10 a 15 días hábiles',
    deliverables: [
      'Manual y Política de Seguridad Vial formalizada',
      'Matriz de Evaluación de Riesgos Viales en Rutas y Misión',
      'Plan Anual de Capacitación en Seguridad Vial',
      'Fichas técnicas y protocolos de mantenimiento de flota'
    ],
    requirements: [
      'Censo de vehículos propios, contratados y puestos a disposición',
      'Listado de conductores habituales y no habituales'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 9
  },
  {
    title: 'Paquete Exámenes Médicos Ocupacionales (x10 Trabajadores)',
    slug: 'paquete-examenes-medicos-ocupacionales-10',
    sku: 'SST-MED-004',
    shortDescription: 'Exámenes de ingreso o periódicos con énfasis osteomuscular, visiometría y audiometría.',
    description: 'Paquete de exámenes médicos ocupacionales en red de IPS aliadas con cobertura nacional. Incluye valoración médica con énfasis osteomuscular, agudeza visual (visiometría), tamiz auditivo (audiometría) y expedición de certificados de aptitud laboral en formato digital.',
    category: 'medicina_laboral',
    tags: ['Exámenes Médicos', 'Medicina del Trabajo', 'Certificado Aptitud', 'IPS'],
    serviceType: 'service_onsite',
    regularPrice: 690000,
    salePrice: 620000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Tipo de Énfasis',
        options: [
          { label: 'General / Administrativo (x10)', priceDelta: 0, isDefault: true },
          { label: 'Con Énfasis en Alturas / Confinados (x10)', priceDelta: 180000, isDefault: false },
          { label: 'Manipulación de Alimentos + Laboratorio (x10)', priceDelta: 150000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: 'Agendamiento inmediato (24 a 48h)',
    deliverables: [
      'Certificados de Aptitud Laboral emitidos por Médico Ocupacional',
      'Informe de condiciones de salud consolidado para la empresa',
      'Recomendaciones médico-laborales individuales'
    ],
    requirements: [
      'Datos de los trabajadores (Nombre, CC, Cargo, Ciudad)',
      'Profesiograma o perfil del cargo'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 31
  },
  {
    title: 'Estudio de Puesto de Trabajo Ergonómico (Método OWAS / REBA)',
    slug: 'estudio-puesto-trabajo-ergonomico',
    sku: 'SST-ERG-005',
    shortDescription: 'Evaluación biomecánica y postural para calificación de origen o prevención osteomuscular.',
    description: 'Análisis ergonómico detallado del puesto de trabajo mediante metodologías internacionales (OWAS, RULA, REBA o ROSA). Dirigido a casos de sospecha de enfermedad laboral, reintegros o rediseño preventivo de puestos operativos y de oficina.',
    category: 'ergonomia',
    tags: ['Ergonomía', 'OWAS', 'REBA', 'Biomecánica', 'Puesto de Trabajo'],
    serviceType: 'service_hybrid',
    regularPrice: 320000,
    salePrice: 280000,
    hasDiscount: true,
    hasVariants: false,
    estimatedDeliveryDays: '5 días hábiles tras visita/video',
    deliverables: [
      'Informe técnico ergonómico con registro fotográfico y ángulos biomecánicos',
      'Nivel de acción y valoración del riesgo de carga postural',
      'Recomendaciones de adecuación física, pausas activas y mobiliario',
      'Firma por Fisioterapeuta / Ergónomo especialista en SST con licencia'
    ],
    requirements: [
      'Videos o fotografías del colaborador en su ciclo de trabajo',
      'Dimensiones del plano de trabajo y silla utilizada'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 16
  },
  {
    title: 'Auditoría Externa de Estándares Mínimos (Res. 0312 / 2019)',
    slug: 'auditoria-externa-estandares-minimos-0312',
    sku: 'SST-AUD-006',
    shortDescription: 'Evaluación imparcial del cumplimiento legal de su SG-SST (7, 21 o 60 estándares).',
    description: 'Auditoría independiente para verificar el grado de implementación y cumplimiento de los Estándares Mínimos del SG-SST establecidos en la Resolución 0312 de 2019. Ideal para preparación de visitas del Ministerio del Trabajo, ARL o auditorías de clientes.',
    category: 'auditoria',
    tags: ['Auditoría', 'Res. 0312', 'Estándares Mínimos', 'Mintrabajo'],
    serviceType: 'service_virtual',
    regularPrice: 620000,
    salePrice: 520000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Tipo de Empresa',
        options: [
          { label: '7 Estándares (Menos de 10 trab. Riesgo I, II, III)', priceDelta: 0, isDefault: true },
          { label: '21 Estándares (11 a 50 trab. Riesgo I, II, III)', priceDelta: 160000, isDefault: false },
          { label: '60 Estándares (>50 trab. o Riesgo IV y V)', priceDelta: 380000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '5 a 7 días hábiles',
    deliverables: [
      'Informe detallado de auditoría con porcentaje de cumplimiento',
      'Matriz de hallazgos (No conformidades, Observaciones y Oportunidades de mejora)',
      'Plan de Mejoramiento formulado para radicación ante la ARL',
      'Certificado de auditoría externa realizada'
    ],
    requirements: [
      'Acceso a la documentación digital del SG-SST de la empresa'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 18
  },
  {
    title: 'Investigación Técnica de Accidente de Trabajo (ATEL)',
    slug: 'investigacion-tecnica-accidente-trabajo-atel',
    sku: 'SST-INV-007',
    shortDescription: 'Investigación formal con Árbol de Causas y radicación ante la ARL.',
    description: 'Acompañamiento especializado para la investigación de accidentes graves, leves o de alta potencialidad conforme a la Resolución 1401 de 2007. Se aplica la metodología de Árbol de Causas o 5 Porqués, determinando causas básicas e inmediatas.',
    category: 'auditoria',
    tags: ['Investigación ATEL', 'Res. 1401', 'Accidente Laboral', 'ARL'],
    serviceType: 'service_virtual',
    regularPrice: 380000,
    salePrice: 320000,
    hasDiscount: true,
    hasVariants: false,
    estimatedDeliveryDays: '48 a 72 horas hábiles',
    deliverables: [
      'Informe formal de investigación en formato institucional y formato ARL',
      'Diagrama de Árbol de Causas y análisis causal',
      'Plan de acción correctivo y preventivo con responsables',
      'Lección aprendida ilustrada para divulgación al personal'
    ],
    requirements: [
      'FURAT radicado ante la ARL',
      'Testimonios del accidentado y testigos',
      'Fotografías del lugar del evento'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 11
  }
];

// Helper: Ensure default data on boot/first request
const ensureSeedData = async () => {
  try {
    const catCount = await MarketplaceCategory.countDocuments();
    if (catCount === 0) {
      await MarketplaceCategory.insertMany(DEFAULT_CATEGORIES);
      logger.info('[Marketplace] Default categories seeded successfully.');
    }
    const prodCount = await MarketplaceProduct.countDocuments();
    if (prodCount === 0) {
      await MarketplaceProduct.insertMany(DEFAULT_PRODUCTS);
      logger.info('[Marketplace] Default SST products seeded successfully.');
    }
  } catch (err) {
    logger.error('[Marketplace] Error seeding default data:', err);
  }
};

// Auto-seed on load
ensureSeedData();

// ── Public Endpoints ──

// GET /api/marketplace/categories
const getCategories = async (req, res) => {
  try {
    let categories = await MarketplaceCategory.find({ active: true }).sort({ order: 1 }).lean();
    if (categories.length === 0) {
      await ensureSeedData();
      categories = await MarketplaceCategory.find({ active: true }).sort({ order: 1 }).lean();
    }
    return res.json({ success: true, categories });
  } catch (error) {
    logger.error('[Marketplace] getCategories error:', error);
    return res.status(500).json({ error: 'Error al obtener categorías.' });
  }
};

// GET /api/marketplace/products
const getProducts = async (req, res) => {
  try {
    const totalCount = await MarketplaceProduct.countDocuments();
    if (totalCount === 0) {
      await ensureSeedData();
    }
    const { category, search, tag, sort, featured } = req.query;
    const query = { status: 'published' };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (tag) {
      query.tags = tag;
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { shortDescription: regex },
        { tags: regex },
        { sku: regex }
      ];
    }

    let sortOption = { isFeatured: -1, createdAt: -1 };
    if (sort === 'price_asc') sortOption = { salePrice: 1, regularPrice: 1 };
    if (sort === 'price_desc') sortOption = { salePrice: -1, regularPrice: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'sales') sortOption = { salesCount: -1 };

    const products = await MarketplaceProduct.find(query).sort(sortOption).lean();
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    logger.error('[Marketplace] getProducts error:', error);
    return res.status(500).json({ error: 'Error al obtener servicios.' });
  }
};

// GET /api/marketplace/products/:idOrSlug
const getProductBySlugOrId = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product = null;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await MarketplaceProduct.findById(idOrSlug).lean();
    } else {
      product = await MarketplaceProduct.findOne({ slug: idOrSlug.toLowerCase() }).lean();
    }

    if (!product) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    // Related products in the same category
    const related = await MarketplaceProduct.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'published'
    }).limit(3).lean();

    return res.json({ success: true, product, related });
  } catch (error) {
    logger.error('[Marketplace] getProductBySlugOrId error:', error);
    return res.status(500).json({ error: 'Error al obtener detalle del servicio.' });
  }
};

// POST /api/marketplace/validate-coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount = 0 } = req.body;
    if (!code) return res.status(400).json({ error: 'Código requerido.' });

    const cleanCode = code.toUpperCase().trim();
    const coupon = await MarketplaceCoupon.findOne({ code: cleanCode, active: true }).lean();

    if (!coupon) {
      return res.status(404).json({ error: 'El cupón no es válido o ha expirado.' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Este cupón ha caducado.' });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'El cupón ha alcanzado el límite máximo de usos.' });
    }

    if (coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ error: `El monto mínimo para aplicar este cupón es de $${coupon.minOrderAmount.toLocaleString('es-CO')} COP.` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((orderAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(orderAmount, coupon.discountValue);
    }

    return res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: discount,
      message: `¡Cupón aplicado exitosamente! Descuento: $${discount.toLocaleString('es-CO')} COP`
    });
  } catch (error) {
    logger.error('[Marketplace] validateCoupon error:', error);
    return res.status(500).json({ error: 'Error al validar cupón.' });
  }
};

// POST /api/marketplace/checkout
const createCheckout = async (req, res) => {
  try {
    const { customer, items, paymentMethod = 'WOMPI', promoCode } = req.body;

    if (!customer || !customer.fullName || !customer.documentId || !customer.email || !customer.phone) {
      return res.status(400).json({ error: 'Faltan datos obligatorios del cliente o empresa.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito de compras está vacío.' });
    }

    // Recalculate prices directly from DB to prevent client-side manipulation
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await MarketplaceProduct.findById(item.productId).lean();
      if (!product || product.status !== 'published') {
        return res.status(400).json({ error: `El servicio "${item.title || 'seleccionado'}" no está disponible actualmente.` });
      }

      const basePrice = (product.hasDiscount && product.salePrice > 0) ? product.salePrice : product.regularPrice;
      let variantDelta = 0;
      let selectedVariantData = null;

      if (item.selectedVariant && item.selectedVariant.label) {
        // verify variant price
        const variantGroup = product.variants?.find(v => v.name === item.selectedVariant.name);
        const opt = variantGroup?.options?.find(o => o.label === item.selectedVariant.label);
        if (opt) {
          variantDelta = opt.priceDelta || 0;
          selectedVariantData = {
            name: variantGroup.name,
            label: opt.label,
            priceDelta: variantDelta
          };
        }
      }

      const finalUnitPrice = Math.max(0, basePrice + variantDelta);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineSubtotal = finalUnitPrice * qty;

      subtotal += lineSubtotal;
      verifiedItems.push({
        productId: product._id,
        title: product.title,
        sku: product.sku,
        unitPrice: finalUnitPrice,
        quantity: qty,
        selectedVariant: selectedVariantData,
        subtotal: lineSubtotal
      });
    }

    // Apply Promo Code
    let discountAmount = 0;
    let appliedPromo = '';

    if (promoCode) {
      const cleanCode = promoCode.toUpperCase().trim();
      const coupon = await MarketplaceCoupon.findOne({ code: cleanCode, active: true });
      if (coupon && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = Math.min(subtotal, coupon.discountValue);
        }
        appliedPromo = coupon.code;
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Generate readable Order Number
    const orderNumber = `ORD-WAP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create Order Document
    const order = new MarketplaceOrder({
      orderNumber,
      userId: req.user?._id || req.user?.id || undefined,
      customer: {
        fullName: customer.fullName.trim(),
        companyName: customer.companyName?.trim() || '',
        documentId: customer.documentId.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
        city: customer.city?.trim() || '',
        address: customer.address?.trim() || '',
        notes: customer.notes?.trim() || ''
      },
      items: verifiedItems,
      subtotal,
      discountAmount,
      promoCode: appliedPromo,
      totalAmount,
      currency: 'COP',
      paymentMethod,
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'NUEVO',
      serviceTimeline: [{
        status: 'NUEVO',
        comment: 'Pedido generado en tienda SST.',
        updatedAt: new Date(),
        updatedBy: 'Sistema Marketplace'
      }]
    });

    if (paymentMethod === 'WOMPI') {
      const reference = `WAP-MKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const amountInCents = Math.round(totalAmount * 100);

      order.wompiReference = reference;
      await order.save();

      const publicKey = process.env.WOMPI_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('WOMPI_PUBLIC_KEY no configurada en el servidor');
      }

      const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
      let signature = '';
      if (integritySecret) {
        // sha256(reference + amountInCents + currency + integritySecret)
        const stringToSign = `${reference}${amountInCents}COP${integritySecret}`;
        signature = crypto.createHash('sha256').update(stringToSign, 'utf-8').digest('hex');
      }

      return res.json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        wompi: {
          publicKey,
          reference,
          amountInCents,
          currency: 'COP',
          signature
        }
      });
    }

    // Manual transfer
    await order.save();
    return res.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: 'MANUAL_TRANSFER',
      message: 'Pedido registrado. Procede a adjuntar el comprobante de transferencia.'
    });

  } catch (error) {
    logger.error('[Marketplace] createCheckout error:', error);
    return res.status(500).json({ error: 'Error al procesar el pedido.', details: error.message });
  }
};

// POST /api/marketplace/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const { reference, transactionId } = req.body;
    if (!reference && !transactionId) {
      return res.status(400).json({ error: 'Referencia o ID de transacción requeridos.' });
    }

    const query = reference ? { wompiReference: reference } : { wompiTransactionId: transactionId };
    const order = await MarketplaceOrder.findOne(query);

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    if (order.paymentStatus === 'APPROVED') {
      return res.json({ success: true, paymentStatus: 'APPROVED', orderNumber: order.orderNumber });
    }

    // If transactionId provided, consult Wompi API
    let isApproved = false;
    if (transactionId) {
      order.wompiTransactionId = transactionId;
      try {
        const wompiRes = await axios.get(`https://production.wompi.co/v1/transactions/${transactionId}`, {
          timeout: 10000
        });
        const status = wompiRes.data?.data?.status;
        if (status === 'APPROVED') {
          isApproved = true;
        } else if (status === 'DECLINED' || status === 'ERROR') {
          order.paymentStatus = 'DECLINED';
        }
      } catch (err) {
        logger.warn('[Marketplace] Could not verify directly with Wompi API:', err.message);
      }
    }

    if (isApproved) {
      order.paymentStatus = 'APPROVED';
      order.serviceTimeline.push({
        status: 'PAGO_APROBADO',
        comment: `Pago aprobado por Wompi (${order.wompiTransactionId || 'Ref: ' + order.wompiReference})`,
        updatedAt: new Date(),
        updatedBy: 'Wompi Gateway'
      });

      // Increment salesCount for each product
      for (const item of order.items) {
        if (item.productId) {
          await MarketplaceProduct.findByIdAndUpdate(item.productId, { $inc: { salesCount: item.quantity } });
        }
      }
    }

    await order.save();
    return res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      orderNumber: order.orderNumber
    });

  } catch (error) {
    logger.error('[Marketplace] verifyPayment error:', error);
    return res.status(500).json({ error: 'Error al verificar pago.' });
  }
};

// POST /api/marketplace/webhook (Wompi Events)
const handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body || {};
    if (event === 'transaction.updated' && data?.transaction) {
      const tx = data.transaction;
      const reference = tx.reference;
      const status = tx.status; // 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'
      const transactionId = tx.id;

      if (reference) {
        const order = await MarketplaceOrder.findOne({ wompiReference: reference });
        if (order) {
          order.wompiTransactionId = transactionId;
          if (status === 'APPROVED' && order.paymentStatus !== 'APPROVED') {
            order.paymentStatus = 'APPROVED';
            order.serviceTimeline.push({
              status: 'PAGO_APROBADO',
              comment: `Pago confirmado vía webhook Wompi (${transactionId})`,
              updatedAt: new Date(),
              updatedBy: 'Wompi Webhook'
            });

            // Increment salesCount for each product
            for (const item of order.items) {
              if (item.productId) {
                await MarketplaceProduct.findByIdAndUpdate(item.productId, { $inc: { salesCount: item.quantity } });
              }
            }
          } else if (status === 'DECLINED' && order.paymentStatus === 'PENDING') {
            order.paymentStatus = 'DECLINED';
          }
          await order.save();
          logger.info(`[Marketplace Webhook] Order ${order.orderNumber} updated to ${status}`);
        }
      }
    }
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('[Marketplace Webhook] Error processing webhook:', error);
    return res.status(200).send('OK'); // always 200 for webhooks
  }
};

// GET /api/marketplace/orders/:orderNumber
const getOrderDetails = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await MarketplaceOrder.findOne({ orderNumber }).lean();
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    return res.json({ success: true, order });
  } catch (error) {
    logger.error('[Marketplace] getOrderDetails error:', error);
    return res.status(500).json({ error: 'Error al consultar pedido.' });
  }
};

// GET /api/marketplace/my-orders (Protected)
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email?.toLowerCase();

    const query = {
      $or: [
        { userId },
        { 'customer.email': userEmail }
      ]
    };

    const orders = await MarketplaceOrder.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (error) {
    logger.error('[Marketplace] getMyOrders error:', error);
    return res.status(500).json({ error: 'Error al obtener tus pedidos.' });
  }
};

// ── Admin Endpoints ──

// GET /api/marketplace/admin/orders
const adminGetOrders = async (req, res) => {
  try {
    const { paymentStatus, fulfillmentStatus, search } = req.query;
    const query = {};

    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    if (fulfillmentStatus && fulfillmentStatus !== 'all') query.fulfillmentStatus = fulfillmentStatus;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { 'customer.fullName': regex },
        { 'customer.companyName': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex }
      ];
    }

    const orders = await MarketplaceOrder.find(query).sort({ createdAt: -1 }).lean();

    // Stats
    const totalRevenue = await MarketplaceOrder.aggregate([
      { $match: { paymentStatus: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const approvedCount = await MarketplaceOrder.countDocuments({ paymentStatus: 'APPROVED' });
    const pendingReviewCount = await MarketplaceOrder.countDocuments({ paymentStatus: 'MANUAL_REVIEW' });
    const activeFulfillmentCount = await MarketplaceOrder.countDocuments({ fulfillmentStatus: { $in: ['NUEVO', 'CONTACTADO', 'EN_EJECUCION'] } });

    return res.json({
      success: true,
      count: orders.length,
      orders,
      stats: {
        totalRevenue: totalRevenue[0]?.total || 0,
        approvedCount,
        pendingReviewCount,
        activeFulfillmentCount
      }
    });
  } catch (error) {
    logger.error('[Marketplace Admin] adminGetOrders error:', error);
    return res.status(500).json({ error: 'Error al obtener pedidos.' });
  }
};

// PUT /api/marketplace/admin/orders/:id/status
const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, fulfillmentStatus, comment, assignedSpecialist } = req.body;

    const order = await MarketplaceOrder.findById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

    let updated = false;

    if (paymentStatus && order.paymentStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
      order.serviceTimeline.push({
        status: `PAGO_${paymentStatus}`,
        comment: comment || `Estado de pago actualizado manualmente a ${paymentStatus}`,
        updatedAt: new Date(),
        updatedBy: req.user?.name || req.user?.email || 'Administrador'
      });
      updated = true;
    }

    if (fulfillmentStatus && order.fulfillmentStatus !== fulfillmentStatus) {
      order.fulfillmentStatus = fulfillmentStatus;
      order.serviceTimeline.push({
        status: fulfillmentStatus,
        comment: comment || `Estado operativo actualizado a ${fulfillmentStatus}`,
        updatedAt: new Date(),
        updatedBy: req.user?.name || req.user?.email || 'Administrador'
      });
      updated = true;
    }

    if (assignedSpecialist !== undefined) {
      order.assignedSpecialist = assignedSpecialist;
      updated = true;
    }

    if (updated) {
      await order.save();
    }

    return res.json({ success: true, order });
  } catch (error) {
    logger.error('[Marketplace Admin] adminUpdateOrderStatus error:', error);
    return res.status(500).json({ error: 'Error al actualizar estado del pedido.' });
  }
};

// POST /api/marketplace/admin/orders/:id/notes
const adminAddOrderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note) return res.status(400).json({ error: 'Nota requerida.' });

    const order = await MarketplaceOrder.findById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

    order.internalNotes.push({
      note,
      author: req.user?.name || req.user?.email || 'Administrador',
      createdAt: new Date()
    });

    await order.save();
    return res.json({ success: true, internalNotes: order.internalNotes });
  } catch (error) {
    logger.error('[Marketplace Admin] adminAddOrderNote error:', error);
    return res.status(500).json({ error: 'Error al añadir nota.' });
  }
};

// POST /api/marketplace/admin/products
const adminCreateProduct = async (req, res) => {
  try {
    const productData = req.body;
    if (!productData.title || !productData.regularPrice || !productData.category) {
      return res.status(400).json({ error: 'Título, precio y categoría son obligatorios.' });
    }

    // Generate slug
    const cleanSlug = productData.slug
      ? productData.slug.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '-')
      : productData.title.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '-');

    const existing = await MarketplaceProduct.findOne({ slug: cleanSlug });
    if (existing) {
      productData.slug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    } else {
      productData.slug = cleanSlug;
    }

    productData.createdBy = req.user?._id || req.user?.id;
    const product = new MarketplaceProduct(productData);
    await product.save();

    return res.json({ success: true, product });
  } catch (error) {
    logger.error('[Marketplace Admin] adminCreateProduct error:', error);
    return res.status(500).json({ error: 'Error al crear producto.', details: error.message });
  }
};

// PUT /api/marketplace/admin/products/:id
const adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await MarketplaceProduct.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });

    return res.json({ success: true, product });
  } catch (error) {
    logger.error('[Marketplace Admin] adminUpdateProduct error:', error);
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
};

// DELETE /api/marketplace/admin/products/:id
const adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await MarketplaceProduct.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Producto eliminado correctamente.' });
  } catch (error) {
    logger.error('[Marketplace Admin] adminDeleteProduct error:', error);
    return res.status(500).json({ error: 'Error al eliminar producto.' });
  }
};

// GET /api/marketplace/admin/coupons
const adminGetCoupons = async (req, res) => {
  try {
    const coupons = await MarketplaceCoupon.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, coupons });
  } catch (error) {
    logger.error('[Marketplace Admin] adminGetCoupons error:', error);
    return res.status(500).json({ error: 'Error al obtener cupones.' });
  }
};

// POST /api/marketplace/admin/coupons
const adminCreateCoupon = async (req, res) => {
  try {
    const couponData = req.body;
    if (!couponData.code || couponData.discountValue === undefined) {
      return res.status(400).json({ error: 'Código y valor de descuento son requeridos.' });
    }
    couponData.code = couponData.code.toUpperCase().trim();
    const coupon = new MarketplaceCoupon(couponData);
    await coupon.save();
    return res.json({ success: true, coupon });
  } catch (error) {
    logger.error('[Marketplace Admin] adminCreateCoupon error:', error);
    return res.status(500).json({ error: 'Error al crear cupón.' });
  }
};

// DELETE /api/marketplace/admin/coupons/:id
const adminDeleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await MarketplaceCoupon.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Cupón eliminado.' });
  } catch (error) {
    logger.error('[Marketplace Admin] adminDeleteCoupon error:', error);
    return res.status(500).json({ error: 'Error al eliminar cupón.' });
  }
};

// POST /api/marketplace/admin/reseed
const adminReseedCatalog = async (req, res) => {
  try {
    await MarketplaceProduct.deleteMany({});
    await MarketplaceCategory.deleteMany({});
    await MarketplaceCategory.insertMany(DEFAULT_CATEGORIES);
    await MarketplaceProduct.insertMany(DEFAULT_PRODUCTS);
    return res.json({ success: true, message: 'Catálogo de Salud Ocupacional reinicializado con éxito.' });
  } catch (error) {
    logger.error('[Marketplace Admin] adminReseedCatalog error:', error);
    return res.status(500).json({ error: 'Error al reiniciar catálogo.' });
  }
};

module.exports = {
  getCategories,
  getProducts,
  getProductBySlugOrId,
  validateCoupon,
  createCheckout,
  verifyPayment,
  handleWebhook,
  getOrderDetails,
  getMyOrders,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminAddOrderNote,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetCoupons,
  adminCreateCoupon,
  adminDeleteCoupon,
  adminReseedCatalog
};
