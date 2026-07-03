function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err.stack || err);

  // Handle common PostgreSQL errors with friendlier messages
  if (err.code === '23505') {
    return res.status(409).json({ message: 'A record with this value already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Related record not found (foreign key violation).' });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error.' });
}

module.exports = { notFound, errorHandler };
