const express = require('express');
const { requireJwtAuth } = require('../middleware');
const Roadmap = require('../../models/Roadmap');
const Notification = require('../../models/Notification');
const mongoose = require('mongoose');

const router = express.Router();

// GET all roadmap updates (public for logged in users)
router.get('/', requireJwtAuth, async (req, res) => {
  try {
    let items = await Roadmap.find({}).sort({ date: -1 });

    // Auto-seed real documents if empty
    if (items.length === 0) {
      const defaultSeedItems = [
        {
          title: 'Editor de Archivos e IA Web',
          description: 'Se introdujo el nuevo "Editor de Archivos" con soporte para importación y conversión visual enriquecida de PDFs y Words. Además, la burbuja de "Edición con IA" ahora cuenta con acceso a la web en vivo mediante Google Search Grounding permitiéndole verificar fuentes.',
          version: 'V2.5.0',
          date: new Date(),
          type: 'Nuevo',
        },
        {
          title: 'Análisis en Vivo (SGSST Visión)',
          description: 'Uso de las cámaras de celulares y computadores para Visión Artificial integrada al sistema corporativo (incorporación de cámaras de seguridad como mejora futura). Ahora Tenshi puede observar a través del lente, detectar actos o condiciones inseguras y autoredactarte inspecciones o reportes estructurados.',
          version: 'V2.2.0',
          date: new Date(Date.now() - 86400000 * 5),
          type: 'Nuevo',
        },
        {
          title: 'Gestor SG-SST: Participación e Informes',
          description: 'El núcleo de operaciones preventivas de WAPPY IA cobró vida permitiendo completar el ciclo PHVA total con generadores automatizados como Política, Matriz Legal, Dashboard Predictivo e integración de Buzón de Empleados IPEVAR.',
          version: 'V2.0.0',
          date: new Date(Date.now() - 86400000 * 15),
          type: 'Nuevo',
        },
        {
          title: 'Aula Mágica Estudiantil',
          description: 'Lanzamiento de las herramientas de formación contínua, permitiéndo centralizar material SST y adoctrinamiento para coordinadores en vivo.',
          version: 'V1.5.0',
          date: new Date(Date.now() - 86400000 * 30),
          type: 'Mejora',
        },
        {
          title: 'Blog Normativo Integrado',
          description: 'Incorporación de Blog de noticias institucionales leídas transversalmente por nuestro Agente IA central.',
          version: 'V1.1.0',
          date: new Date(Date.now() - 86400000 * 60),
          type: 'Nuevo',
        },
        {
          title: 'Sistema Fundacional: Chat Inteligente',
          description: 'Lanzamiento original de WAPPY IA (Tenshi). Motores conversacionales LLM adaptados al contexto corporativo como núcleo base de operaciones.',
          version: 'V1.0.0',
          date: new Date(Date.now() - 86400000 * 100),
          type: 'Anuncio',
        },
      ];
      await Roadmap.insertMany(defaultSeedItems);
      // Fetch again to get the real ObjectIds and sorted output
      items = await Roadmap.find({}).sort({ date: -1 });
      console.log(`[Roadmap] Auto-seeded database with ${items.length} historical updates.`);
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ message: 'Error fetching roadmap updates' });
  }
});

// GET the most recent update ID for checking notifications
router.get('/latest', requireJwtAuth, async (req, res) => {
  try {
    const latest = await Roadmap.findOne({}).sort({ date: -1 }).select('_id date title');
    res.status(200).json(latest || null);
  } catch (error) {
    console.error('Error fetching latest roadmap:', error);
    res.status(500).json({ message: 'Error fetching latest update' });
  }
});

// POST a new roadmap item (ADMIN only)
router.post('/', requireJwtAuth, async (req, res) => {
  try {
    // Basic Admin check
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden. Solo administradores pueden publicar en la Hoja de Ruta.' });
    }

    const { title, description, version, date, type } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const newItem = new Roadmap({
      title,
      description,
      version: version || '',
      date: date || new Date(),
      type: type || 'Nuevo'
    });

    const savedItem = await newItem.save();

    // Broadcast notification to all active users seamlessly in the background
    (async () => {
      try {
        const User = mongoose.model('User');
        const users = await User.find({}).select('_id');
        if (users && users.length > 0) {
          const bulkNotifications = users.map((u) => ({
            user: u._id,
            type: 'system_update',
            title: `🌟 ¡Nueva Actualización: ${savedItem.version || 'WAPPY'}!`,
            body: savedItem.title,
            read: false,
            metadata: { roadmapId: savedItem._id }
          }));
          await Notification.insertMany(bulkNotifications);
          console.log(`[Roadmap] Broadcasted update notification to ${users.length} users.`);
        }
      } catch (err) {
        console.error('[Roadmap] Error broadcasting notifications:', err);
      }
    })();

    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating roadmap item:', error);
    res.status(500).json({ message: 'Error creating roadmap item' });
  }
});

// PUT update an existing item (ADMIN only)
router.put('/:id', requireJwtAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden. Solo administradores pueden editar en la Hoja de Ruta.' });
    }

    const updatedItem = await Roadmap.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Roadmap item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating roadmap item:', error);
    res.status(500).json({ message: 'Error updating roadmap item' });
  }
});

// DELETE a roadmap item (ADMIN only)
router.delete('/:id', requireJwtAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const deletedItem = await Roadmap.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Roadmap item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap item:', error);
    res.status(500).json({ message: 'Error deleting roadmap item' });
  }
});

module.exports = router;
