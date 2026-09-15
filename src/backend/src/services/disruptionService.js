const { Disruption } = require('../models');
const { buildPagination } = require('../utils/api');

async function listDisruptions(query) {
  const { page, limit, skip, status, severity, region } = query;
  const filter = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (region) filter.affectedRegions = region;
  const [data, total] = await Promise.all([
    Disruption.find(filter).sort({ severity: -1, startsAt: -1 }).skip(skip).limit(limit).lean(),
    Disruption.countDocuments(filter)
  ]);
  return { data, pagination: buildPagination(page, limit, total) };
}

module.exports = { listDisruptions };
