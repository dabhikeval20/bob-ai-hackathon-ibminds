const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  region: { type: String, required: true, trim: true, maxlength: 120 },
  city: { type: String, required: true, trim: true, maxlength: 120 },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  updatedAt: { type: Date, required: true }
}, { _id: false });

const fleetVehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^VH-[0-9]+$/ },
  vehicleType: { type: String, required: true, enum: ['van', 'truck', 'refrigerated_truck', 'trailer'] },
  status: { type: String, required: true, enum: ['available', 'assigned', 'in_transit', 'maintenance', 'offline'], default: 'available' },
  region: { type: String, required: true, trim: true, maxlength: 120 },
  capacityKg: { type: Number, required: true, min: 0.01 },
  currentLoadKg: { type: Number, required: true, min: 0, default: 0 },
  utilizationPercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
  temperatureControlled: { type: Boolean, required: true, default: false },
  currentLocation: { type: locationSchema, required: true },
  assignedShipmentIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Shipment', default: [] },
  maintenanceDueAt: { type: Date, default: null },
  maintenanceStatus: { type: String, required: true, enum: ['current', 'due', 'overdue'], default: 'current' },
  isSynthetic: { type: Boolean, required: true, default: true }
}, { timestamps: true, collection: 'fleetVehicles' });

fleetVehicleSchema.path('currentLoadKg').validate(function (value) {
  return value <= this.capacityKg;
}, 'currentLoadKg cannot exceed capacityKg');

fleetVehicleSchema.index({ region: 1, status: 1 });
fleetVehicleSchema.index({ utilizationPercent: 1, status: 1 });
fleetVehicleSchema.index({ temperatureControlled: 1 });
fleetVehicleSchema.index({ assignedShipmentIds: 1 });

module.exports = mongoose.models.FleetVehicle || mongoose.model('FleetVehicle', fleetVehicleSchema);
