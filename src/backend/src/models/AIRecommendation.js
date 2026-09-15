const mongoose = require('mongoose');

const aiRecommendationSchema = new mongoose.Schema({
  recommendationId: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^REC-[0-9]+$/ },
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', default: null },
  type: { type: String, required: true, enum: ['review', 'escalate', 'contact_carrier', 'check_capacity', 'monitor', 'verify_route'] },
  priority: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  reasonCodes: { type: [String], required: true, validate: { validator: reasons => reasons.length > 0, message: 'At least one reason code is required' } },
  supportingRecordIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  source: { type: String, required: true, enum: ['deterministic', 'runtime_ai'], default: 'deterministic' },
  confidence: { type: Number, min: 0, max: 1, default: null },
  status: { type: String, required: true, enum: ['open', 'reviewed', 'dismissed'], default: 'open' },
  generatedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, default: null },
  isSynthetic: { type: Boolean, required: true, default: true }
}, { timestamps: true, collection: 'aiRecommendations' });

aiRecommendationSchema.path('expiresAt').validate(function (value) {
  return value === null || value === undefined || value > this.generatedAt;
}, 'expiresAt must be after generatedAt');

aiRecommendationSchema.index({ status: 1, priority: -1 });
aiRecommendationSchema.index({ shipmentId: 1, generatedAt: -1 });
aiRecommendationSchema.index({ vehicleId: 1 });
aiRecommendationSchema.index({ reasonCodes: 1 });

module.exports = mongoose.models.AIRecommendation || mongoose.model('AIRecommendation', aiRecommendationSchema);
