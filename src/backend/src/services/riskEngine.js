const RISK_LEVELS = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
});

const RULES = Object.freeze([
  { code: 'DELAY_OVER_30_MINUTES', points: 10, message: 'Shipment is delayed by more than 30 minutes.' },
  { code: 'DELAY_OVER_120_MINUTES', points: 8, message: 'Shipment is delayed by more than 120 minutes.' },
  { code: 'DELAY_OVER_240_MINUTES', points: 7, message: 'Shipment is delayed by more than 240 minutes.' },
  { code: 'HIGH_PRIORITY_CARGO', points: 10, message: 'High-priority cargo needs additional operational attention.' },
  { code: 'CRITICAL_PRIORITY_CARGO', points: 15, message: 'Critical-priority cargo is exposed to operational risk.' },
  { code: 'LOW_DISRUPTION', points: 5, message: 'A low-severity disruption affects the shipment route.' },
  { code: 'MEDIUM_DISRUPTION', points: 10, message: 'A medium-severity disruption affects the shipment route.' },
  { code: 'HIGH_DISRUPTION', points: 18, message: 'A high-severity disruption affects the shipment route.' },
  { code: 'CRITICAL_DISRUPTION', points: 25, message: 'A critical disruption affects the shipment route.' },
  { code: 'TEMPERATURE_EXCURSION', points: 30, message: 'Temperature exceeded the safe range.' },
  { code: 'COLD_CHAIN_EXCURSION', points: 5, message: 'Temperature-sensitive cargo has an active excursion.' },
  { code: 'DEADLINE_WITHIN_6_HOURS', points: 15, message: 'Delivery deadline is approaching within 6 hours.' },
  { code: 'DEADLINE_WITHIN_24_HOURS', points: 8, message: 'Delivery deadline is approaching within 24 hours.' },
  { code: 'ROUTE_BLOCKED', points: 15, message: 'The shipment route is blocked or closed.' },
  { code: 'ROUTE_DISRUPTED', points: 10, message: 'The shipment route is disrupted.' },
  { code: 'ROUTE_DELAYED', points: 6, message: 'The shipment route has a delay status.' },
  { code: 'VEHICLE_UNAVAILABLE', points: 15, message: 'Assigned vehicle is unavailable or in maintenance.' }
]);

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const VALID_DISRUPTION_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
const VALID_ROUTE_STATUSES = new Set(['normal', 'delayed', 'disrupted', 'blocked', 'closed']);
const VALID_VEHICLE_STATUSES = new Set(['available', 'assigned', 'in_transit', 'maintenance', 'offline', 'unavailable']);

function normalizeValue(value) {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

function getSeverity(value) {
  return normalizeValue(value?.severity || value);
}

function isTemperatureExcursion(value) {
  if (value === true) return true;
  if (value?.isExcursion === true) return true;
  if (Number.isFinite(value?.currentTemperature) && Number.isFinite(value?.maximumAllowed)) {
    return value.currentTemperature > value.maximumAllowed || value.currentTemperature < value.minimumAllowed;
  }
  return false;
}

function getDeadlineHours(deliveryDeadline, now) {
  if (!deliveryDeadline) return null;
  const deadline = new Date(deliveryDeadline);
  if (Number.isNaN(deadline.getTime())) throw new TypeError('deliveryDeadline must be a valid date');
  return (deadline.getTime() - now.getTime()) / (60 * 60 * 1000);
}

function validateInput(input, now) {
  const delayMinutes = input.delayMinutes ?? 0;
  if (!Number.isFinite(delayMinutes) || delayMinutes < 0) throw new TypeError('delayMinutes must be a non-negative number');
  const priority = normalizeValue(input.priority || 'medium');
  if (!VALID_PRIORITIES.has(priority)) throw new TypeError(`Unsupported priority: ${priority}`);
  const disruptionSeverity = getSeverity(input.disruptionSeverity);
  if (disruptionSeverity && !VALID_DISRUPTION_SEVERITIES.has(disruptionSeverity)) throw new TypeError(`Unsupported disruption severity: ${disruptionSeverity}`);
  const routeStatus = normalizeValue(input.routeStatus || 'normal');
  if (!VALID_ROUTE_STATUSES.has(routeStatus)) throw new TypeError(`Unsupported route status: ${routeStatus}`);
  const vehicleStatus = normalizeValue(input.vehicleStatus || 'available');
  if (!VALID_VEHICLE_STATUSES.has(vehicleStatus)) throw new TypeError(`Unsupported vehicle status: ${vehicleStatus}`);
  getDeadlineHours(input.deliveryDeadline, now);
  return { delayMinutes, priority, disruptionSeverity, routeStatus, vehicleStatus };
}

function addRule(triggeredRules, rule) {
  triggeredRules.push({ code: rule.code, points: rule.points, reason: rule.message });
}

function getRiskLevel(score) {
  if (score >= 65) return RISK_LEVELS.CRITICAL;
  if (score >= 40) return RISK_LEVELS.HIGH;
  if (score >= 20) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

function getRecommendedAction(riskLevel, triggeredRules) {
  const codes = new Set(triggeredRules.map(rule => rule.code));
  if (riskLevel === RISK_LEVELS.CRITICAL) return 'Escalate immediately and review alternate capacity or route options.';
  if (codes.has('TEMPERATURE_EXCURSION') || codes.has('COLD_CHAIN_EXCURSION')) return 'Escalate cold-chain review and verify cargo protection.';
  if (riskLevel === RISK_LEVELS.HIGH) return 'Prioritize operational review and confirm a mitigation plan.';
  if (riskLevel === RISK_LEVELS.MEDIUM) return 'Monitor the shipment and verify the next checkpoint.';
  return 'Continue routine monitoring.';
}

function calculateShipmentRisk(input = {}) {
  const now = input.now ? new Date(input.now) : new Date();
  if (Number.isNaN(now.getTime())) throw new TypeError('now must be a valid date');
  const normalized = validateInput(input, now);
  const triggeredRules = [];
  const { delayMinutes, priority, disruptionSeverity, routeStatus, vehicleStatus } = normalized;

  if (delayMinutes > 30) addRule(triggeredRules, RULES[0]);
  if (delayMinutes > 120) addRule(triggeredRules, RULES[1]);
  if (delayMinutes > 240) addRule(triggeredRules, RULES[2]);
  if (priority === 'high') addRule(triggeredRules, RULES[3]);
  if (priority === 'critical') addRule(triggeredRules, RULES[4]);
  if (disruptionSeverity) addRule(triggeredRules, RULES[['low', 'medium', 'high', 'critical'].indexOf(disruptionSeverity) + 5]);
  const hasTemperatureExcursion = isTemperatureExcursion(input.temperatureExcursion);
  if (hasTemperatureExcursion) {
    addRule(triggeredRules, RULES[9]);
    if (['pharmaceutical', 'food'].includes(normalizeValue(input.cargoType))) addRule(triggeredRules, RULES[10]);
  }
  const deadlineHours = getDeadlineHours(input.deliveryDeadline, now);
  if (deadlineHours !== null && deadlineHours >= 0 && deadlineHours <= 6) addRule(triggeredRules, RULES[11]);
  else if (deadlineHours !== null && deadlineHours >= 0 && deadlineHours <= 24) addRule(triggeredRules, RULES[12]);
  if (routeStatus === 'blocked' || routeStatus === 'closed') addRule(triggeredRules, RULES[13]);
  else if (routeStatus === 'disrupted') addRule(triggeredRules, RULES[14]);
  else if (routeStatus === 'delayed') addRule(triggeredRules, RULES[15]);
  if (['maintenance', 'offline', 'unavailable'].includes(vehicleStatus)) addRule(triggeredRules, RULES[16]);

  const riskScore = Math.min(100, triggeredRules.reduce((total, rule) => total + rule.points, 0));
  const riskLevel = getRiskLevel(riskScore);
  return {
    riskLevel,
    riskScore,
    riskReasons: triggeredRules.map(rule => ({ code: rule.code, message: rule.reason, points: rule.points })),
    triggeredRules,
    recommendedAction: getRecommendedAction(riskLevel, triggeredRules),
    calculatedAt: now.toISOString()
  };
}

module.exports = { RISK_LEVELS, RULES, calculateShipmentRisk, getRiskLevel };
