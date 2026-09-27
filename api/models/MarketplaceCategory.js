const mongoose = require('mongoose');

const marketplaceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true },
  icon: { type: String, default: 'ShieldCheck' }, // Lucide icon name
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const MarketplaceCategory = mongoose.models.MarketplaceCategory || mongoose.model('MarketplaceCategory', marketplaceCategorySchema);
module.exports = MarketplaceCategory;
