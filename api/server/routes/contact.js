const express = require('express');
const router = express.Router();
const Notification = require('../../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { logger } = require('~/config');
const mongoose = require('mongoose');

router.post('/', async (req, res) => {
    try {
        const { name, email, phone, company, plan, message } = req.body;

        if (!name || !email || !company) {
            return res.status(400).json({ error: 'Nombre, correo electrónico y empresa son requeridos.' });
        }

        // 1. Notify all admins in the system
        const User = mongoose.model('User');
        const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
        
        let planLabel = plan;
        if (plan === 'intermediacion') planLabel = 'Intermediación de Riesgos Laborales';
        if (plan === 'empresas') planLabel = 'Plan Empresas';
        if (plan === 'asesores') planLabel = 'Plan Asesores Independientes';

        const title = `Nueva solicitud de contacto comercial`;
        const body = `${name} de ${company} está interesado en el plan ${planLabel}.`;

        const notificationDocs = admins.map(a => ({
            user: a._id,
            type: 'contact_request',
            title,
            body,
        }));

        if (notificationDocs.length > 0) {
            await Notification.insertMany(notificationDocs);
        }

        // 2. Send Email using the email utility
        const adminEmail = process.env.EMAIL_FROM || 'soporte@wappy-ia.com';
        
        try {
            await sendEmail({
                email: adminEmail,
                subject: `Nueva solicitud de contacto de ${company}`,
                payload: {
                    name,
                    email,
                    phone: phone || 'No proporcionado',
                    company,
                    plan: planLabel,
                    message: message || 'Ningún mensaje adicional.'
                },
                template: 'contact-us.html',
                throwError: true
            });
            logger.debug('[Contact] Email sent to admin successfully.');
        } catch (emailErr) {
            logger.error('[Contact] Error sending contact email:', emailErr);
            // We don't block the user response if the email fails, but we log it
        }

        res.status(200).json({ success: true, message: 'Solicitud enviada correctamente' });
    } catch (error) {
        logger.error('[Contact] Error processing contact form:', error);
        res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud.' });
    }
});

module.exports = router;
