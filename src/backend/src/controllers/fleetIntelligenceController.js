const { sendData } = require('../utils/api');
const { getFleetIntelligence, getFleetVehicle, getVehicleSuggestions } = require('../services/fleetIntelligenceService');

async function getFleetIntelligenceController(req, res) {
  return sendData(res, await getFleetIntelligence());
}

async function getFleetVehicleController(req, res) {
  return sendData(res, await getFleetVehicle(req.params.vehicleId));
}

async function getVehicleSuggestionsController(req, res) {
  return sendData(res, await getVehicleSuggestions(req.query.shipmentId));
}

module.exports = { getFleetIntelligenceController, getFleetVehicleController, getVehicleSuggestionsController };
