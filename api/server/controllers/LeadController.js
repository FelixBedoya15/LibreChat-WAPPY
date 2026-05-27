const { Lead } = require('~/models/Lead');
const { logger } = require('@librechat/data-schemas');

const recordLead = async (req, res) => {
    try {
        const { fullName, email, phone, videoUrl } = req.body;

        if (!fullName || !email || !phone) {
            return res.status(400).json({ message: 'Todos los campos (nombre, correo, celular) son obligatorios.' });
        }

        const newLead = new Lead({
            fullName,
            email,
            phone,
            videoUrl,
        });

        const savedLead = await newLead.save();
        res.status(201).json({ success: true, lead: savedLead });
    } catch (error) {
        logger.error('Error recording lead', error);
        res.status(500).json({ message: 'Error interno al registrar el contacto.' });
    }
};

const getAllLeads = async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        logger.error('Error fetching leads', error);
        res.status(500).json({ message: 'Error al obtener los contactos registrados.' });
    }
};

const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLead = await Lead.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json({ message: 'Contacto no encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Contacto eliminado correctamente.' });
    } catch (error) {
        logger.error('Error deleting lead', error);
        res.status(500).json({ message: 'Error interno al eliminar el contacto.' });
    }
};

module.exports = {
    recordLead,
    getAllLeads,
    deleteLead,
};
