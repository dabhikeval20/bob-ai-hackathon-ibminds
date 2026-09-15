const { Shipment, Disruption, FleetVehicle, SensorLog } = require('../models');

async function getDashboardSummary() {
  const [totalShipments, delayedShipments, highRiskShipments, activeDisruptions, availableVehicles, utilization, temperatureAlerts] = await Promise.all([
    Shipment.countDocuments(),
    Shipment.countDocuments({ status: 'delayed' }),
    Shipment.countDocuments({ riskLevel: { $in: ['high', 'critical'] } }),
    Disruption.countDocuments({ status: 'active' }),
    FleetVehicle.countDocuments({ status: 'available' }),
    FleetVehicle.aggregate([{ $group: { _id: null, average: { $avg: '$utilizationPercent' } } }]),
    SensorLog.countDocuments({ isExcursion: true })
  ]);

  return {
    totalShipments,
    delayedShipments,
    highRiskShipments,
    activeDisruptions,
    availableVehicles,
    averageFleetUtilization: Number((utilization[0]?.average || 0).toFixed(2)),
    temperatureAlerts
  };
}

module.exports = { getDashboardSummary };
