/**
 * Sets no-cache header in response.
 */
module.exports = function nocache(req, res, next) {
  sails.log.info('Applying disable cache policy');
  res.header('Cache-Control', 'no-cache');
  return next();
};
