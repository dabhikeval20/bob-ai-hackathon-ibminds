const { FleetVehicle } = require('../models');
const { buildPagination } = require('../utils/api');

async function listFleetVehicles(query) {
  const { page, limit, skip, status, region, minUtilization, maxUtilization } = query;
  const filter = {};
  if (status) filter.status = status;
  if (region) filter.region = region;
  if (minUtilization !== undefined || maxUtilization !== undefined) {
    filter.utilizationPercent = {};
    if (minUtilization !== undefined) filter.utilizationPercent.$gte = minUtilization;
    if (maxUtilization !== undefined) filter.utilizationPercent.$lte = maxUtilization;
  }
  const [data, total] = await Promise.all([
    FleetVehicle.find(filter).sort({ utilizationPercent: -1, vehicleId: 1 }).skip(skip).limit(limit).lean(),
    FleetVehicle.countDocuments(filter)
  ]);
  return { data, pagination: buildPagination(page, limit, total) };
}

module.exports = { listFleetVehicles };
