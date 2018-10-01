module.exports = async function renewSession(req, res, next) {
  /* eslint-disable no-underscore-dangle */
  req.session._garbage = Date();
  req.session.touch();
  return next();
};
