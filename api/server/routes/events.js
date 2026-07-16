const express = require('express');
const router = express.Router();
const { requireJwtAuth, checkJwtAuth } = require('../middleware');
const { Event } = require('../../models/Event');
const { EventRegistration } = require('../../models/EventRegistration');
const KanbanTask = require('../../models/KanbanTask');
const CompanyInfo = require('../../models/CompanyInfo');
const sendEmail = require('../utils/sendEmail');

// Helper to get active company ID
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) {
    active = await CompanyInfo.findOne({ user: userId });
  }
  return active ? active._id : null;
}

function cleanMeetLink(link) {
  if (!link) return '';
  let url = link.trim();
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = url.match(urlRegex);
  if (match && match[0]) {
    url = match[0];
  }
  
  // Clean any trailing punctuation
  url = url.replace(/[.,;)"'>]+$/, '');
  
  if (url && !/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  return url;
}

async function cleanExistingMeetLinks() {
  try {
    const events = await Event.find({});
    for (const event of events) {
      const cleaned = cleanMeetLink(event.meetLink);
      if (cleaned !== event.meetLink) {
        event.meetLink = cleaned;
        await event.save();
        console.log(`[EventsMigration] Cleaned meetLink for event: ${event.title} -> ${cleaned}`);
      }
    }
  } catch (err) {
    console.error('[EventsMigration] Error cleaning existing meetLinks:', err);
  }
}

// Run cleanup immediately on load
cleanExistingMeetLinks();

function getGoogleCalendarLink(event) {
  const startDate = new Date(event.dateTime);
  // Add 1 hour duration as standard default
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatToUTC = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dates = `${formatToUTC(startDate)}/${formatToUTC(endDate)}`;
  const text = encodeURIComponent(event.title);
  
  let detailsText = `Evento virtual organizado por WAPPY IA.\n\nEnlace de Google Meet: ${event.meetLink}`;
  if (event.meetPassword) {
    detailsText += `\nClave de conexión: ${event.meetPassword}`;
  }
  const details = encodeURIComponent(detailsText);
  const location = encodeURIComponent(event.meetLink);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

// Mass email sending has been removed to prevent mail server rate limiting / blocking.

// 1. GET /api/events - Get published events (authenticated or anonymous)
router.get('/', checkJwtAuth, async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const companyId = userId ? await getActiveCompanyId(userId) : null;

    // Fetch published events
    const query = { isPublished: true };
    if (companyId) {
      query.$or = [
        { companyId: companyId },
        { companyId: { $exists: false } },
        { companyId: null }
      ];
    } else {
      query.$or = [
        { companyId: { $exists: false } },
        { companyId: null }
      ];
    }

    const events = await Event.find(query).sort({ dateTime: 1 }).lean();

    // If authenticated, map registration status
    let userRegistrations = [];
    if (userId) {
      userRegistrations = await EventRegistration.find({ user: userId }).lean();
    }
    const registeredEventIds = new Set(userRegistrations.map(r => r.event.toString()));

    const eventsWithStatus = events.map(event => ({
      ...event,
      isRegistered: registeredEventIds.has(event._id.toString()),
    }));

    res.status(200).json(eventsWithStatus);
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    res.status(500).json({ message: 'Error al recuperar los eventos.' });
  }
});

// 2. POST /api/events/:id/register - Register user to event
router.post('/:id/register', requireJwtAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name || req.user.username || 'Usuario';

    const event = await Event.findById(id);
    if (!event || !event.isPublished) {
      return res.status(404).json({ message: 'El evento no existe o no está publicado.' });
    }

    // Check if already registered
    const existing = await EventRegistration.findOne({ event: id, user: userId });
    if (existing) {
      return res.status(400).json({ message: 'Ya te encuentras registrado en este evento.' });
    }

    // Create registration
    const registration = new EventRegistration({
      event: id,
      user: userId,
    });
    await registration.save();

    // Format date in Spanish for email
    const eventDateFormatted = new Date(event.dateTime).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send email invitation
    try {
      await sendEmail({
        email: userEmail,
        subject: `Confirmación de Registro: ${event.title}`,
        template: 'eventInvitation.handlebars',
        payload: {
          name: userName,
          eventTitle: event.title,
          dateTime: eventDateFormatted,
          meetLink: event.meetLink,
          calendarLink: getGoogleCalendarLink(event),
          meetPassword: event.meetPassword || '',
          year: new Date().getFullYear(),
        },
        from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
      });
    } catch (emailError) {
      console.error('Failed to send event invitation email:', emailError);
      // We do not fail the request if only the email fails, but we log it.
    }

    // Create task in Centro de Control ACPM
    try {
      const companyId = await getActiveCompanyId(userId);
      await KanbanTask.create({
        user: userId,
        title: `Asistir a Evento: ${event.title}`,
        description: `Evento virtual por Google Meet.\nConexión: ${event.meetLink}\n${event.meetPassword ? `Clave: ${event.meetPassword}` : ''}\nProgramado para: ${eventDateFormatted}`,
        status: 'todo',
        dueDate: event.dateTime,
        type: 'training',
        referenceId: event._id.toString(),
        referenceName: event.title,
        companyId: companyId ? companyId.toString() : undefined,
      });
    } catch (taskError) {
      console.error('Failed to create KanbanTask for event registration:', taskError);
      // Do not block registration if task creation fails
    }

    res.status(201).json({
      message: 'Te has registrado exitosamente al evento.',
      registration,
    });
  } catch (error) {
    console.error('Error in POST /api/events/:id/register:', error);
    res.status(500).json({ message: 'Error al registrarse en el evento.' });
  }
});

// --- ADMIN ROUTES (Protected) ---

// Middleware to ensure admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
};

// 3. GET /api/events/admin - List all events with registrations count (Admin)
router.get('/admin', requireJwtAuth, requireAdmin, async (req, res) => {
  try {
    const events = await Event.find({}).sort({ dateTime: -1 }).lean();

    // Map registrations count and details
    const eventsWithRegistrations = await Promise.all(
      events.map(async (event) => {
        const registrations = await EventRegistration.find({ event: event._id })
          .populate('user', 'name email username')
          .lean();
        return {
          ...event,
          registrationsCount: registrations.length,
          registrations: registrations.map(r => r.user),
        };
      })
    );

    res.status(200).json(eventsWithRegistrations);
  } catch (error) {
    console.error('Error in GET /api/events/admin:', error);
    res.status(500).json({ message: 'Error al recuperar la lista de eventos.' });
  }
});

// 4. POST /api/events/admin - Create new event (Admin)
router.post('/admin', requireJwtAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, thumbnail, tags, dateTime, meetLink, meetPassword, isPublished, isFeatured, companyId } = req.body;

    if (!title || !dateTime || !meetLink) {
      return res.status(400).json({ message: 'El título, la fecha y el link de Meet son obligatorios.' });
    }

    const event = new Event({
      title,
      description,
      thumbnail,
      tags: tags || [],
      dateTime: new Date(dateTime),
      meetLink: cleanMeetLink(meetLink),
      meetPassword,
      isPublished: isPublished || false,
      isFeatured: isFeatured || false,
      companyId: companyId || undefined,
    });

    await event.save();



    res.status(201).json(event);
  } catch (error) {
    console.error('Error in POST /api/events/admin:', error);
    res.status(500).json({ message: 'Error al crear el evento.' });
  }
});

// 5. PUT /api/events/admin/:id - Update event (Admin)
router.put('/admin/:id', requireJwtAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    // Apply updates
    if (updates.title !== undefined) event.title = updates.title;
    if (updates.description !== undefined) event.description = updates.description;
    if (updates.thumbnail !== undefined) event.thumbnail = updates.thumbnail;
    if (updates.tags !== undefined) event.tags = updates.tags;
    if (updates.dateTime !== undefined) event.dateTime = new Date(updates.dateTime);
    if (updates.meetLink !== undefined) event.meetLink = cleanMeetLink(updates.meetLink);
    if (updates.meetPassword !== undefined) event.meetPassword = updates.meetPassword;
    if (updates.isPublished !== undefined) event.isPublished = updates.isPublished;
    if (updates.isFeatured !== undefined) event.isFeatured = updates.isFeatured;
    if (updates.companyId !== undefined) event.companyId = updates.companyId || undefined;

    await event.save();



    res.status(200).json(event);
  } catch (error) {
    console.error('Error in PUT /api/events/admin/:id:', error);
    res.status(500).json({ message: 'Error al actualizar el evento.' });
  }
});

// 6. DELETE /api/events/admin/:id - Delete event and its registrations (Admin)
router.delete('/admin/:id', requireJwtAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    // Delete associated registrations
    await EventRegistration.deleteMany({ event: id });

    // Optional: Delete related KanbanTasks for this event
    await KanbanTask.deleteMany({ referenceId: id });

    res.status(200).json({ message: 'Evento y registros asociados eliminados correctamente.' });
  } catch (error) {
    console.error('Error in DELETE /api/events/admin/:id:', error);
    res.status(500).json({ message: 'Error al eliminar el evento.' });
  }
});

module.exports = router;
