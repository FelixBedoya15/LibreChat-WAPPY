const Ad = require('~/models/Ad');
const { logger } = require('@librechat/data-schemas');

const getAds = async (req, res) => {
    try {
        const ads = await Ad.find({ active: true }).sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (error) {
        logger.error('Error fetching ads', error);
        res.status(500).json({ message: 'Error fetching ads' });
    }
};

const getAllAds = async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (error) {
        logger.error('Error fetching all ads', error);
        res.status(500).json({ message: 'Error fetching ads' });
    }
};

const createAd = async (req, res) => {
    try {
        const { title, content, images, link, active, ctaText } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ message: 'At least one image is required' });
        }

        const newAd = new Ad({
            title,
            content,
            images,
            link,
            ctaText,
            active: active !== undefined ? active : true,
            author: req.user.id,
        });

        const savedAd = await newAd.save();
        res.status(201).json(savedAd);
    } catch (error) {
        logger.error('Error creating ad', error);
        res.status(500).json({ message: 'Error creating ad' });
    }
};

const updateAd = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, images, link, active, ctaText } = req.body;

        const updatedAd = await Ad.findByIdAndUpdate(
            id,
            { title, content, images, link, active, ctaText },
            { new: true }
        );

        if (!updatedAd) {
            return res.status(404).json({ message: 'Ad not found' });
        }

        res.status(200).json(updatedAd);
    } catch (error) {
        logger.error('Error updating ad', error);
        res.status(500).json({ message: 'Error updating ad' });
    }
};

const deleteAd = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAd = await Ad.findByIdAndDelete(id);

        if (!deletedAd) {
            return res.status(404).json({ message: 'Ad not found' });
        }

        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (error) {
        logger.error('Error deleting ad', error);
        res.status(500).json({ message: 'Error deleting ad' });
    }
};

module.exports = {
    getAds,
    getAllAds,
    createAd,
    updateAd,
    deleteAd,
};
