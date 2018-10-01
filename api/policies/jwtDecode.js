/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
import jwt from 'jsonwebtoken';
// import { ConfigService } from '../../../../../node_modules/aws-sdk/index';

module.exports = async function jwtDecode(req, res, next) {
  try {
    // console.log('req', req);
    const session = AuthService.getSessionUser(req);
    if (session && session.id && !ConfigService.isProduction()) {
      const user = await User.findByIdWithRole(session.id);
      if (user) {
        req.session.passport = {
          user: {
            ...user.toJSON(),
          },
        };
      }
      return next();
    }

    let token = req.headers.Authorization || req.headers.authorization;
    sails.log('====================================');
    sails.log('JwtDecode token=>\n', token);
    sails.log('====================================');
    if (typeof token !== 'undefined' && token) {
      if (token.includes('Bearer')) {
        token = token.replace('Bearer ', '');
      }
      const jwtSecret = sails.config.session.secret;
      const decoded = jwt.verify(token, jwtSecret);
      sails.log('decoded jwt result=>\n', decoded);
      req.session.authenticated = true;
      const user = await User.findByIdWithRole(decoded.id);
      // FIXME: 加入檢查逾時設定
      if (!user) { throw new Error(KEY.BAD_REQUEST.USER_NOT_EXISTS); }
      req.session.passport = {
        user: {
          ...user.toJSON(),
        },
      };
    }
    return next();
  } catch (err) {
    sails.log.warn(err);
    req.session.authenticated = false;
    req.session.passport = {
      user: null,
    };
    return res.forbidden(KEY.NO_USER_LOGIN);
  }
};
