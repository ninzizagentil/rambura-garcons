export function ok(res, data = {}, message = 'Operation successful', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function list(res, data, pagination = {}, message = 'Operation successful') {
  return res.json({ success: true, message, data, pagination });
}

export function fail(res, message, status = 400, errors = []) {
  return res.status(status).json({ success: false, message, errors });
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
