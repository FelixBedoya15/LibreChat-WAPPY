const mongoose = require('mongoose');

const PublicReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Unique human-readable or random ID for sharing
  content: { type: String, required: true }, // Full HTML content of the report
  fileName: { type: String },
  reportType: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // Optional: set an expiration if needed
});

const PublicReport = mongoose.models.PublicReport || mongoose.model('PublicReport', PublicReportSchema);

module.exports = PublicReport;
