const mongoose = require('mongoose');

const marketplaceProductSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  sku: { type: String, unique: true, sparse: true, trim: true },
  shortDescription: { type: String, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, index: true }, // e.g. 'medicina_laboral', 'gtc45_ipevar', 'pesv', 'psicosocial', 'ergonomia', 'auditoria'
  tags: [{ type: String, trim: true }],
  serviceType: {
    type: String,
    enum: ['service_virtual', 'service_onsite', 'service_hybrid', 'digital_download', 'consulting_hours'],
    default: 'service_virtual'
  },
  
  // Pricing in COP
  regularPrice: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, default: 0, min: 0 },
  hasDiscount: { type: Boolean, default: false },
  
  // Variants (e.g. Range of workers: 1-10, 11-50, etc.)
  hasVariants: { type: Boolean, default: false },
  variants: [{
    name: { type: String, trim: true },
    options: [{
      label: { type: String, trim: true },
      priceDelta: { type: Number, default: 0 },
      isDefault: { type: Boolean, default: false }
    }]
  }],
  
  // Service execution info
  estimatedDeliveryDays: { type: String, default: '3 a 5 días hábiles' },
  deliverables: [{ type: String, trim: true }],
  requirements: [{ type: String, trim: true }],
  faqs: [{
    question: { type: String, trim: true },
    answer: { type: String, trim: true }
  }],
  
  // Media
  featuredImage: { type: String, default: '' },
  gallery: [{ type: String }],
  brochureUrl: { type: String },
  
  // Status and visibility
  status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
  isFeatured: { type: Boolean, default: false },
  salesCount: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 1 },
  stockType: { type: String, enum: ['unlimited', 'limited'], default: 'unlimited' },
  availableSlots: { type: Number, default: 0 },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

marketplaceProductSchema.index({ category: 1, status: 1 });
marketplaceProductSchema.index({ isFeatured: 1, status: 1 });

const MarketplaceProduct = mongoose.models.MarketplaceProduct || mongoose.model('MarketplaceProduct', marketplaceProductSchema);
module.exports = MarketplaceProduct;
