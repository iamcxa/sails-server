/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function isUser(req, res, next) {
  sails.log.info('--- check isUser ---');
  if (sails.config.offAuth || AuthService.isUser(req)) {
    return next();
  }
  return res.forbidden('You are not permitted to perform this action.');
};
