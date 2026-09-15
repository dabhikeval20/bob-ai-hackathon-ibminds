const mongoose = require('mongoose');

const disruptionSchema = new mongoose.Schema({
  disruptionId: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^DIS-[0-9]+$/ },
  type: { type: String, required: true, enum: ['weather', 'road_closure', 'port_congestion', 'customs', 'warehouse', 'labor'] },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, required: true, enum: ['monitoring', 'active', 'resolved'], default: 'active' },
  affectedRegions: { type: [String], required: true, validate: { validator: regions => regions.length > 0, message: 'At least one affected region is required' } },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, default: null },
  estimatedDelayMinutes: { type: Number, required: true, min: 0, default: 0 },
  affectedShipmentIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Shipment', default: [] },
  source: { type: String, required: true, enum: ['synthetic', 'manual', 'external'], default: 'synthetic' },
  isSynthetic: { type: Boolean, required: true, default: true }
}, { timestamps: true, collection: 'disruptions' });

disruptionSchema.path('endsAt').validate(function (value) {
  return value === null || value === undefined || value > this.startsAt;
}, 'endsAt must be after startsAt');

disruptionSchema.index({ status: 1, severity: -1 });
disruptionSchema.index({ affectedRegions: 1 });
disruptionSchema.index({ startsAt: 1, endsAt: 1 });
disruptionSchema.index({ affectedShipmentIds: 1 });

module.exports = mongoose.models.Disruption || mongoose.model('Disruption', disruptionSchema);
