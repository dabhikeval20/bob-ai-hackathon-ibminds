const AppError = require('../errors/AppError');

function parsePagination(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  if (!Number.isInteger(page) || page < 1) throw new AppError(400, 'page must be a positive integer', 'INVALID_QUERY');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(400, 'limit must be an integer between 1 and 100', 'INVALID_QUERY');
  return { page, limit, skip: (page - 1) * limit };
}

function buildPagination(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function parseDate(value, fieldName) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(400, `${fieldName} must be a valid date`, 'INVALID_QUERY');
  return date;
}

function sendData(res, data, statusCode = 200) {
  return res.status(statusCode).json({ data });
}

function sendList(res, data, pagination) {
  return res.status(200).json({ data, pagination });
}

module.exports = { parsePagination, buildPagination, parseDate, sendData, sendList };
