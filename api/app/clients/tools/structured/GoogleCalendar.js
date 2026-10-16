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
      'Permite interactuar con el Google Calendar del usuario. Puedes programar o agendar eventos/recordatorios (ej. inspección de extintores, exámenes médicos), listar eventos en un rango de fechas para verificar disponibilidad, y eliminar eventos. La herramienta devuelve el enlace directo del evento creado.';
    
    this.req = fields.req;
    
    this.schema = z.object({
      action: z.enum([
        'create_event',
        'list_events',
        'delete_event',
      ]).describe('La acción a realizar en Google Calendar.'),
      title: z.string().optional().describe('El título o resumen del evento a crear (ej. "Inspección de extintores"). Requerido para create_event.'),
      description: z.string().optional().describe('La descripción o detalles del evento. Opcional.'),
      startTime: z.string().optional().describe('La fecha y hora de inicio del evento en formato ISO local (ej. "2026-06-29T08:00:00"). Requerido para create_event.'),
      endTime: z.string().optional().describe('La fecha y hora de finalización del evento en formato ISO local. Si se omite, se calculará automáticamente 1 hora después de la hora de inicio.'),
      timeMin: z.string().optional().describe('Fecha/hora de inicio para buscar eventos (formato ISO, ej. "2026-06-29T00:00:00Z"). Opcional para list_events.'),
      timeMax: z.string().optional().describe('Fecha/hora de fin para buscar eventos (formato ISO, ej. "2026-07-05T23:59:59Z"). Opcional para list_events.'),
      eventId: z.string().optional().describe('El ID del evento de Google Calendar que deseas eliminar. Requerido para delete_event.'),
    });
  }

  async _call(input) {
    const validationResult = this.schema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Validación fallida: ${JSON.stringify(validationResult.error.issues)}`);
    }

    const { action, title, description, startTime, endTime, timeMin, timeMax, eventId } = validationResult.data;
    
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
        return await this.listEvents(calendar, timeMin, timeMax);

      case 'delete_event':
        if (!eventId) throw new Error('Se requiere el campo "eventId" para eliminar un evento.');
        return await this.deleteEvent(calendar, eventId);

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

  async listEvents(calendar, timeMin, timeMax) {
    try {
      const params = {
        calendarId: 'primary',
        maxResults: 15,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (timeMin) params.timeMin = this._normalizeColombiaIso(timeMin);
      if (timeMax) params.timeMax = this._normalizeColombiaIso(timeMax);

      const res = await calendar.events.list(params);
      const events = res.data.items || [];

      if (events.length === 0) {
        return 'No se encontraron eventos programados para el rango especificado en tu cuenta de Google Calendar.';
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

  async deleteEvent(calendar, eventId) {
    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      return `El evento con ID "${eventId}" fue eliminado correctamente de Google Calendar.`;
    } catch (err) {
      logger.error('[GoogleCalendarTool] Delete event failed:', err);
      throw new Error(`Fallo al eliminar evento en Google Calendar: ${err.message}`);
    }
  }
}

module.exports = GoogleCalendarTool;
