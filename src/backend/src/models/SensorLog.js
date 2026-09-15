const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  region: { type: String, required: true, trim: true, maxlength: 120 },
  city: { type: String, required: true, trim: true, maxlength: 120 },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 }
}, { _id: false });

const sensorLogSchema = new mongoose.Schema({
  readingId: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^TEMP-[0-9]+$/ },
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', default: null },
  recordedAt: { type: Date, required: true },
  temperatureCelsius: { type: Number, required: true, min: -80, max: 100 },
  minimumAllowed: { type: Number, required: true, min: -80, max: 100 },
  maximumAllowed: { type: Number, required: true, min: -80, max: 100 },
  isExcursion: { type: Boolean, required: true, default: false },
  excursionSeverity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: null },
  sensorId: { type: String, required: true, trim: true, maxlength: 80 },
  location: { type: locationSchema, default: null },
  isSynthetic: { type: Boolean, required: true, default: true }
}, { timestamps: true, collection: 'sensorLogs' });

sensorLogSchema.path('maximumAllowed').validate(function (value) {
  return value > this.minimumAllowed;
}, 'maximumAllowed must be greater than minimumAllowed');

sensorLogSchema.path('isExcursion').validate(function (value) {
  const outsideRange = this.temperatureCelsius < this.minimumAllowed || this.temperatureCelsius > this.maximumAllowed;
  return value === outsideRange;
}, 'isExcursion must match the configured temperature range');

sensorLogSchema.path('excursionSeverity').validate(function (value) {
  return !this.isExcursion || value !== null;
}, 'excursionSeverity is required when isExcursion is true');

sensorLogSchema.index({ shipmentId: 1, recordedAt: -1 });
sensorLogSchema.index({ isExcursion: 1, recordedAt: -1 });
sensorLogSchema.index({ sensorId: 1 });
sensorLogSchema.index({ vehicleId: 1 });

module.exports = mongoose.models.SensorLog || mongoose.model('SensorLog', sensorLogSchema);
