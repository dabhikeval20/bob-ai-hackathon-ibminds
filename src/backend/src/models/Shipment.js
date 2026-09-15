const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  region: { type: String, required: true, trim: true, maxlength: 120 },
  city: { type: String, required: true, trim: true, maxlength: 120 },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  updatedAt: { type: Date, required: true }
}, { _id: false });

const riskReasonSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
  contribution: { type: Number, required: true, min: 0, max: 100 },
  sourceType: { type: String, required: true, trim: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^SG-[0-9]+$/ },
  origin: { type: String, required: true, trim: true, maxlength: 120 },
  destination: { type: String, required: true, trim: true, maxlength: 120 },
  cargoType: { type: String, required: true, enum: ['pharmaceutical', 'food', 'electronics', 'industrial', 'general'] },
  priority: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, required: true, enum: ['planned', 'in_transit', 'delayed', 'delivered', 'at_risk', 'cancelled'], default: 'in_transit' },
  expectedDelivery: { type: Date, required: true },
  actualDelivery: { type: Date, default: null },
  currentLocation: { type: locationSchema, required: true },
  delayMinutes: { type: Number, required: true, min: 0, default: 0, validate: { validator: Number.isInteger, message: 'delayMinutes must be an integer' } },
  temperatureRequired: { type: Boolean, required: true, default: false },
  temperatureMin: { type: Number, default: null },
  temperatureMax: { type: Number, default: null },
  currentTemperature: { type: Number, default: null },
  assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', default: null },
  riskScore: { type: Number, required: true, min: 0, max: 100, default: 0 },
  riskLevel: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  riskReasons: { type: [riskReasonSchema], default: [] },
  activeDisruptionIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Disruption', default: [] },
  lastCheckpointAt: { type: Date, default: null },
  isSynthetic: { type: Boolean, required: true, default: true }
}, { timestamps: true, collection: 'shipments' });

shipmentSchema.path('temperatureMin').validate(function (value) {
  return !this.temperatureRequired || value !== null && value !== undefined;
}, 'temperatureMin is required for temperature-controlled shipments');

shipmentSchema.path('temperatureMax').validate(function (value) {
  if (!this.temperatureRequired) return true;
  return value !== null && value !== undefined && this.temperatureMin !== null && value > this.temperatureMin;
}, 'temperatureMax must be greater than temperatureMin for temperature-controlled shipments');

shipmentSchema.index({ status: 1, riskLevel: 1 });
shipmentSchema.index({ riskScore: -1, expectedDelivery: 1 });
shipmentSchema.index({ priority: 1, expectedDelivery: 1 });
shipmentSchema.index({ 'currentLocation.region': 1 });
shipmentSchema.index({ assignedVehicle: 1 });
shipmentSchema.index({ activeDisruptionIds: 1 });

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
