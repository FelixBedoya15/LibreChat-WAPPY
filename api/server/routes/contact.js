const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Notification, User } = require('../../models');
const sendEmail = require('../utils/sendEmail');
const { logger } = require('@librechat/data-schemas');

/**
 * Handle contact requests for enterprise plans
 * POST /api/contact/request
 */
router.post('/request', async (req, res) => {
    try {
        const { name, email, phone, company, plan, message } = req.body;

        if (!name || !email || !plan) {
            return res.status(400).json({ message: 'Nombre, email y plan son requeridos.' });
        }

        const dateStr = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

        // 1. Notify all admins in-app
        const admins = await User.find({ role: 'ADMIN' }).select('_id email').lean();
        
        const titleNotif = 'Nueva Solicitud de Plan Empresarial';
        const bodyNotif = `${name} (${company || 'Persona Natural'}) ha solicitado información sobre el ${plan}.`;

        const notificationDocs = admins.map(a => ({
            user: a._id,
            type: 'contact_request',
            title: titleNotif,
            body: bodyNotif,
            // metadata could be added if needed
        }));

        if (notificationDocs.length > 0) {
            await Notification.insertMany(notificationDocs);
        }

        // 2. Send email to admins
        const payload = {
            name,
            email,
            phone: phone || 'No proporcionado',
            company: company || 'No proporcionado',
            plan: plan === 'riesgos' ? 'Plan Intermediación Riesgos Laborales' : 
                  plan === 'empresas' ? 'Plan Empresas' : 
                  'Plan Asesores Independientes SST',
            message: message || 'Sin comentarios adicionales',
            date: dateStr,
        };

        // Send to each admin or to a general admin email if configured
        const adminEmailRecipient = process.env.ADMIN_EMAIL || (admins.length > 0 ? admins[0].email : process.env.EMAIL_FROM);

        if (adminEmailRecipient) {
            try {
                await sendEmail({
                    email: adminEmailRecipient,
                    subject: '🚀 Nueva Solicitud de Plan Empresarial - WAPPY IA',
                    payload,
                    template: 'contactRequest.handlebars',
                });
            } catch (emailErr) {
                logger.error('[Contact] Error sending admin email:', emailErr.message);
                // We don't fail the request if email fails, as notification was created
            }
        }

        res.status(200).json({ message: 'Solicitud enviada con éxito.' });
    } catch (error) {
        logger.error('[Contact] Error handling contact request:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
