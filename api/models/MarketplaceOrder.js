const mongoose = require('mongoose');

const marketplaceOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true }, // e.g. "ORD-WAP-2026-1042"
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  
  customer: {
    fullName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    documentId: { type: String, required: true, trim: true }, // NIT o Cédula
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true }, // WhatsApp
    city: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceProduct' },
    title: { type: String, required: true },
    sku: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    selectedVariant: {
      name: { type: String },
      label: { type: String },
      priceDelta: { type: Number, default: 0 }
    },
    subtotal: { type: Number, required: true }
  }],
  
  subtotal: { type: Number, required: true, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  promoCode: { type: String, trim: true },
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'COP' },
  
  // Payment
  paymentMethod: { type: String, enum: ['WOMPI', 'MANUAL_TRANSFER'], default: 'WOMPI' },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'DECLINED', 'MANUAL_REVIEW', 'VOIDED'],
    default: 'PENDING'
  },
  wompiReference: { type: String, unique: true, sparse: true },
  wompiTransactionId: { type: String },
  manualReceiptUrl: { type: String },
  
  // Service execution / fulfillment
  fulfillmentStatus: {
    type: String,
    enum: ['NUEVO', 'CONTACTADO', 'EN_EJECUCION', 'ENTREGADO', 'CANCELADO'],
    default: 'NUEVO'
  },
  assignedSpecialist: { type: String, trim: true },
  serviceTimeline: [{
    status: { type: String },
    comment: { type: String },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String }
  }],
  internalNotes: [{
    note: { type: String },
    author: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

marketplaceOrderSchema.index({ 'customer.email': 1 });
marketplaceOrderSchema.index({ orderNumber: 1 });
marketplaceOrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });

const MarketplaceOrder = mongoose.models.MarketplaceOrder || mongoose.model('MarketplaceOrder', marketplaceOrderSchema);
module.exports = MarketplaceOrder;
