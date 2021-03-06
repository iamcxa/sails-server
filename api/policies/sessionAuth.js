import _ from 'lodash';

/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = async function sessionAuth(req, res, next) {
  try {
    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    const session = AuthService.getSessionUser(req);
    if (session) {
      const user = await User.findById(session.id);
      if (!user) {
        return res.forbidden(KEY.ERROR.NO_USER_LOGIN);
      }
      const verify = AuthService.verifyUser(user, req.url);
      sails.log(`user=> "${user.id}", url=> "${req.url}", verify=> "${verify.success}"`);
      if (verify.success) {
        return next();
      }
      switch (verify.reason.condition.name) {
        default:
          // sails.log.info(`[!] 拒絕使用者 ID '${user.id}' 存取路徑 '${req.url}'。`);
          sails.log.warn(`[!] 拒絕使用者 ID '${user.id}' 存取路徑 '${req.url}'。原因：根據使用者 ${verify.reason.condition.name} 規則的 ${verify.reason.field} 欄位`);
          return res.forbidden(KEY.BAD_REQUEST.NEED_TO_CONFIRM_MEMBERSHIP);
      }
    }

    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    // return res.forbidden('You are not permitted to perform this action.');
    return res.forbidden(KEY.ERROR.NO_USER_LOGIN);
  } catch (e) {
    sails.log.error(e);
    return next(e);
  }
};
