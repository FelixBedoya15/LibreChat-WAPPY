const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { google } = require('googleapis');
const { logger } = require('@librechat/data-schemas');
const { getCalendarClient } = require('~/server/services/googleCalendar');

class GoogleCalendarTool extends Tool {
  static lc_name() {
    return 'google_calendar';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'google_calendar';
    this.description = 
      'Permite interactuar con el Google Calendar del usuario. Puedes programar o agendar eventos/recordatorios (ej. inspección de extintores, exámenes médicos), listar o buscar eventos para verificar disponibilidad, reprogramar/editar fechas y títulos de eventos existentes, y eliminar eventos. La herramienta devuelve el enlace directo del evento.';
    
    this.req = fields.req;
    
    this.schema = z.object({
      action: z.enum([
        'create_event',
        'list_events',
        'find_event',
        'delete_event',
        'update_event',
        'reschedule_event',
      ]).describe('La acción a realizar en Google Calendar: create_event, list_events, find_event, delete_event, update_event, reschedule_event.'),
      title: z.string().optional().describe('El título o resumen del evento (ej. "Inspección de extintores"). Requerido para create_event.'),
      description: z.string().optional().describe('La descripción o detalles del evento. Opcional.'),
      startTime: z.string().optional().describe('La fecha y hora de inicio del evento en formato ISO local (ej. "2026-06-29T08:00:00"). Requerido para create_event.'),
      endTime: z.string().optional().describe('La fecha y hora de finalización del evento en formato ISO local. Si se omite, se calculará automáticamente 1 hora después de la hora de inicio.'),
      timeMin: z.string().optional().describe('Fecha/hora de inicio para buscar eventos (formato ISO, ej. "2026-06-29T00:00:00Z"). Opcional para list_events/find_event.'),
      timeMax: z.string().optional().describe('Fecha/hora de fin para buscar eventos (formato ISO, ej. "2026-07-05T23:59:59Z"). Opcional para list_events/find_event.'),
      eventId: z.string().optional().describe('El ID del evento de Google Calendar que deseas eliminar o actualizar.'),
      query: z.string().optional().describe('Palabra clave, nombre o búsqueda para localizar un evento a eliminar, consultar o reprogramar si no tienes el eventId exacto.'),
      newStartTime: z.string().optional().describe('Nueva fecha y hora de inicio para reprogramar el evento (ej. "2026-10-18T14:00:00").'),
      newEndTime: z.string().optional().describe('Nueva fecha y hora de finalización al reprogramar (opcional).'),
      newTitle: z.string().optional().describe('Nuevo título del evento si se desea modificar.'),
    });
  }

  async _call(input) {
    const validationResult = this.schema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Validación fallida: ${JSON.stringify(validationResult.error.issues)}`);
    }

    const { action, title, description, startTime, endTime, timeMin, timeMax, eventId, query, newStartTime, newEndTime, newTitle } = validationResult.data;
    
    if (!this.req || !this.req.user) {
      throw new Error('Petición no autenticada. No se pudo obtener el contexto del usuario.');
    }
    const userId = this.req.user.id;
    
    const calendar = await getCalendarClient(userId);
    if (!calendar) {
      throw new Error('Google Calendar no está conectado. Por favor, conéctalo en la pestaña Cuenta de la Configuración de Wappy.');
    }

    switch (action) {
      case 'create_event':
        if (!title) throw new Error('Se requiere el campo "title" para crear un evento.');
        if (!startTime) throw new Error('Se requiere el campo "startTime" para crear un evento.');
        return await this.createEvent(calendar, title, description, startTime, endTime);

      case 'list_events':
      case 'find_event':
        return await this.listEvents(calendar, timeMin, timeMax, query || title);

      case 'delete_event':
        return await this.deleteEvent(calendar, eventId, query || title);

      case 'update_event':
      case 'reschedule_event':
        return await this.updateEvent(calendar, {
          eventId,
          query,
          title,
          newTitle,
          startTime,
          endTime,
          newStartTime,
          newEndTime,
          description,
        });

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }
  }

  _normalizeColombiaIso(str, addHours = 0) {
    if (!str) return null;
    let s = String(str).trim();
    if (s.endsWith('Z') || s.endsWith('z')) {
      s = s.slice(0, -1);
    }
    if (!s.includes('T') && s.includes(' ')) {
      s = s.replace(' ', 'T');
    }
    if (s.length === 10) {
      s = `${s}T09:00:00`;
    }
    s = s.replace(/[+-]\d{2}:\d{2}$/, '');
    if (s.length === 16) {
      s = `${s}:00`;
    }
    if (addHours > 0) {
      const parts = s.split('T');
      const datePart = parts[0];
      const timePart = parts[1] || '09:00:00';
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, min, sec] = timePart.split(':').map(Number);
      const d = new Date(year, month - 1, day, hour + addHours, min || 0, sec || 0);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const se = String(d.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${da}T${h}:${mi}:${se}-05:00`;
    }
    return `${s}-05:00`;
  }

  async createEvent(calendar, title, description, startTime, endTime) {
    try {
      const normalizedStart = this._normalizeColombiaIso(startTime);
      const normalizedEnd = endTime ? this._normalizeColombiaIso(endTime) : this._normalizeColombiaIso(startTime, 1);

      const eventBody = {
        summary: title,
        description: description || '',
        start: {
          dateTime: normalizedStart,
          timeZone: 'America/Bogota',
        },
        end: {
          dateTime: normalizedEnd,
          timeZone: 'America/Bogota',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 120 },
          ],
        },
      };

      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventBody,
      });

      const startFormatted = new Date(res.data.start.dateTime || res.data.start.date).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'full',
        timeStyle: 'short',
      });
      const endFormatted = new Date(res.data.end.dateTime || res.data.end.date).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        timeStyle: 'short',
      });

      return `Evento creado exitosamente en tu Google Calendar (Hora Colombia):\n- Título: "${res.data.summary}"\n- ID: ${res.data.id}\n- Enlace directo al Evento: ${res.data.htmlLink}\n- Inicio: ${startFormatted}\n- Fin: ${endFormatted}`;
    } catch (err) {
      logger.error('[GoogleCalendarTool] Create event failed:', err);
      if (err.message && (err.message.includes('has not been used') || err.message.includes('disabled'))) {
        throw new Error('La API de Google Calendar no está habilitada en tu proyecto de Google Cloud (Proyecto 802179818443). Debes habilitarla en https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=802179818443 para poder consultar o agendar eventos.');
      }
      throw new Error(`Fallo al crear evento en Google Calendar: ${err.message}`);
    }
  }

  async listEvents(calendar, timeMin, timeMax, query = null) {
    try {
      const params = {
        calendarId: 'primary',
        maxResults: 20,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (query && typeof query === 'string' && query.trim().length > 0) {
        params.q = query.trim();
      }

      if (timeMin) params.timeMin = this._normalizeColombiaIso(timeMin);
      if (timeMax) params.timeMax = this._normalizeColombiaIso(timeMax);

      const res = await calendar.events.list(params);
      const events = res.data.items || [];

      if (events.length === 0) {
        return query
          ? `No se encontraron eventos en Google Calendar que coincidan con la búsqueda "${query}".`
          : 'No se encontraron eventos programados para el rango especificado en tu cuenta de Google Calendar.';
      }

      const list = events.map(e => {
        const rawDate = e.start.dateTime || e.start.date;
        const localFormatted = new Date(rawDate).toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return `- "${e.summary}" (ID: ${e.id}) - Fecha (Colombia): ${localFormatted} - Link: ${e.htmlLink}`;
      }).join('\n');

      return `Eventos programados encontrados en Google Calendar (Hora Colombia):\n${list}`;
    } catch (err) {
      logger.error('[GoogleCalendarTool] List events failed:', err);
      if (err.message && (err.message.includes('has not been used') || err.message.includes('disabled'))) {
        throw new Error('La API de Google Calendar no está habilitada en tu proyecto de Google Cloud (Proyecto 802179818443). Debes habilitarla en https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=802179818443 para poder consultar o agendar eventos.');
      }
      throw new Error(`Fallo al listar eventos en Google Calendar: ${err.message}`);
    }
  }

  async deleteEvent(calendar, eventId, query = null) {
    try {
      let targetId = (eventId || '').trim();
      let eventSummary = '';

      // Si no hay targetId o targetId parece una frase / búsqueda semántica
      const isSearchPhrase = !targetId || targetId.includes(' ') || targetId.length < 5;
      if (isSearchPhrase) {
        const searchTerm = (query || targetId || '').trim();
        if (!searchTerm) {
          throw new Error('Se requiere el "eventId" o un término de búsqueda ("query" / "title") para identificar el evento a eliminar.');
        }

        const searchRes = await calendar.events.list({
          calendarId: 'primary',
          q: searchTerm,
          maxResults: 5,
          timeMin: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        });
        const items = searchRes.data.items || [];
        if (items.length === 0) {
          return `No se encontró ningún evento que coincida con "${searchTerm}" para eliminar en Google Calendar.`;
        }
        targetId = items[0].id;
        eventSummary = items[0].summary || '';
      }

      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: targetId,
        });
        return `El evento "${eventSummary || targetId}" (ID: ${targetId}) fue eliminado exitosamente de tu Google Calendar.`;
      } catch (delErr) {
        // Fallback: Si falló por 404 (ID no encontrado) y tenemos texto de búsqueda
        if ((delErr.code === 404 || delErr.status === 404) && (query || eventId)) {
          const searchTerm = (query || eventId).trim();
          const searchRes = await calendar.events.list({
            calendarId: 'primary',
            q: searchTerm,
            maxResults: 5,
            timeMin: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          });
          const items = searchRes.data.items || [];
          if (items.length > 0) {
            await calendar.events.delete({
              calendarId: 'primary',
              eventId: items[0].id,
            });
            return `El evento "${items[0].summary}" (ID: ${items[0].id}) fue eliminado exitosamente de tu Google Calendar.`;
          }
        }
        throw delErr;
      }
    } catch (err) {
      logger.error('[GoogleCalendarTool] Delete event failed:', err);
      throw new Error(`Fallo al eliminar evento en Google Calendar: ${err.message}`);
    }
  }

  async updateEvent(calendar, params) {
    try {
      const { eventId, query, title, newTitle, startTime, endTime, newStartTime, newEndTime, description } = params;
      let targetEvent = null;

      // 1. Intentar buscar directamente por eventId si parece un ID válido
      const cleanEventId = (eventId || '').trim();
      if (cleanEventId && !cleanEventId.includes(' ') && cleanEventId.length >= 5) {
        try {
          const getRes = await calendar.events.get({
            calendarId: 'primary',
            eventId: cleanEventId,
          });
          if (getRes && getRes.data) {
            targetEvent = getRes.data;
          }
        } catch (e) {
          logger.warn(`[GoogleCalendarTool] No se encontró evento con ID directo "${cleanEventId}": ${e.message}`);
        }
      }

      // 2. Si no se encontró por ID, buscar semánticamente por query o title
      if (!targetEvent) {
        const searchTerm = (query || title || cleanEventId).trim();
        if (!searchTerm) {
          throw new Error('Se requiere el "eventId", "title" o "query" para localizar el evento que deseas reprogramar o editar.');
        }

        const searchRes = await calendar.events.list({
          calendarId: 'primary',
          q: searchTerm,
          maxResults: 5,
          timeMin: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        });
        const items = searchRes.data.items || [];
        if (items.length === 0) {
          return `No se encontró ningún evento en Google Calendar que coincida con "${searchTerm}" para reprogramar o modificar.`;
        }
        targetEvent = items[0];
      }

      // 3. Determinar los campos a modificar
      const effectiveStart = newStartTime || startTime;
      const effectiveEnd = newEndTime || endTime;
      const effectiveTitle = newTitle || (title && title !== targetEvent.summary ? title : null);

      const patchBody = {};
      if (effectiveTitle) {
        patchBody.summary = effectiveTitle;
      }
      if (description !== undefined && description !== null) {
        patchBody.description = description;
      }
      if (effectiveStart) {
        const normalizedStart = this._normalizeColombiaIso(effectiveStart);
        const normalizedEnd = effectiveEnd ? this._normalizeColombiaIso(effectiveEnd) : this._normalizeColombiaIso(effectiveStart, 1);
        patchBody.start = {
          dateTime: normalizedStart,
          timeZone: 'America/Bogota',
        };
        patchBody.end = {
          dateTime: normalizedEnd,
          timeZone: 'America/Bogota',
        };
      } else if (effectiveEnd) {
        patchBody.end = {
          dateTime: this._normalizeColombiaIso(effectiveEnd),
          timeZone: 'America/Bogota',
        };
      }

      const res = await calendar.events.patch({
        calendarId: 'primary',
        eventId: targetEvent.id,
        requestBody: patchBody,
      });

      const updatedStart = new Date(res.data.start.dateTime || res.data.start.date).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'full',
        timeStyle: 'short',
      });
      const updatedEnd = new Date(res.data.end.dateTime || res.data.end.date).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        timeStyle: 'short',
      });

      return `Evento reprogramado / actualizado exitosamente en Google Calendar (Hora Colombia):\n- Título: "${res.data.summary}"\n- ID: ${res.data.id}\n- Enlace directo: ${res.data.htmlLink}\n- Nueva fecha/hora de inicio: ${updatedStart}\n- Fin: ${updatedEnd}`;
    } catch (err) {
      logger.error('[GoogleCalendarTool] Update event failed:', err);
      throw new Error(`Fallo al reprogramar/actualizar evento en Google Calendar: ${err.message}`);
    }
  }
}

module.exports = GoogleCalendarTool;
