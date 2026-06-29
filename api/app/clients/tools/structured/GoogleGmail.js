const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { sendEmail, createDraft } = require('~/server/services/googleGmail');

class GoogleGmailTool extends Tool {
  static lc_name() {
    return 'google_gmail';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'google_gmail';
    this.description =
      'Permite enviar correos electrónicos y crear borradores directamente desde la cuenta de Gmail (Google Workspace) conectada por el usuario. Puedes enviar notificaciones de SST, citaciones médicas, alertas de vencimiento o reportes a trabajadores y directivos con formato HTML estilizado o texto plano.';
    
    this.req = fields.req;
    
    this.schema = z.object({
      action: z.enum([
        'send_email',
        'create_draft',
      ]).describe('La acción a realizar en Gmail ("send_email" para enviar directamente o "create_draft" para guardar un borrador en Gmail).'),
      to: z.string().describe('La dirección de correo electrónico del destinatario (ej. "trabajador@empresa.com").'),
      subject: z.string().describe('El asunto del correo electrónico.'),
      body: z.string().describe('El contenido del mensaje. Se recomienda redactar correos profesionales usando etiquetas HTML (ej. <h3>, <p>, <ul>, <b>, <table>, <hr>) para una excelente presentación.'),
      cc: z.string().optional().describe('Direcciones de correo en copia (CC) separadas por coma. Opcional.'),
      bcc: z.string().optional().describe('Direcciones de correo en copia oculta (BCC) separadas por coma. Opcional.'),
    });
  }

  async _call(input) {
    const validationResult = this.schema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Validación fallida: ${JSON.stringify(validationResult.error.issues)}`);
    }

    const { action, to, subject, body, cc, bcc } = validationResult.data;
    
    if (!this.req || !this.req.user) {
      throw new Error('Petición no autenticada. No se pudo obtener el contexto del usuario.');
    }
    const userId = this.req.user.id;

    switch (action) {
      case 'send_email': {
        if (!to) throw new Error('Se requiere el campo "to" (destinatario) para enviar el correo.');
        if (!subject) throw new Error('Se requiere el campo "subject" (asunto) para enviar el correo.');
        if (!body) throw new Error('Se requiere el campo "body" (contenido) para enviar el correo.');

        const result = await sendEmail(userId, { to, subject, body, cc, bcc });
        return `Correo enviado exitosamente a través de tu cuenta de Gmail:\n- Destinatario: ${to}\n- Asunto: "${subject}"\n- ID de mensaje: ${result.id}`;
      }

      case 'create_draft': {
        if (!to) throw new Error('Se requiere el campo "to" (destinatario) para crear el borrador.');
        if (!subject) throw new Error('Se requiere el campo "subject" (asunto) para crear el borrador.');
        if (!body) throw new Error('Se requiere el campo "body" (contenido) para crear el borrador.');

        const result = await createDraft(userId, { to, subject, body, cc, bcc });
        return `Borrador creado exitosamente en tu cuenta de Gmail:\n- Destinatario: ${to}\n- Asunto: "${subject}"\n- ID de borrador: ${result.id}\nPuedes revisarlo y enviarlo desde tu bandeja de salida en Gmail.`;
      }

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }
  }
}

module.exports = GoogleGmailTool;
