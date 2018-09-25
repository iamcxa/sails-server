import urlGetter from 'url';
import _ from 'lodash';
/**
 * res.login([inputs])
 *
 * @param {action} auth callbacl action
 * @param {String} inputs.password
 *
 * @description :: Log the requesting user in using a passport strategy
 * @help        :: See http://links.sailsjs.org/docs/responses
 */

module.exports = async function signin({ model, input, action, protocol }) {
  // Get access to `req` and `res`
  const req = this.req;
  const res = this.res;
  const params = input || {};

  sails.log('================= signin ===================');
  sails.log(`model=>"${model.toString().split(':')[1].replace(']', '')}"`);
  sails.log('protocol=>', protocol);
  sails.log('action=>', action);
  sails.log('params=>\n', params);
  sails.log('================= signin ===================');

  const processor = (err, user, challenges, status) => {
    if (err || !user) {
      const newError = new Error(err.message);
      if (_.has(err, 'message')) {
        if (err.message.includes(KEY.BAD_REQUEST.EXIST_USER)
        || err.message.includes(KEY.BAD_REQUEST.USER_ALREADY_LOGIN)
        || err.message.includes(KEY.BAD_REQUEST.USER_NOTFOUND)
        || err.message.includes(KEY.BAD_REQUEST.EMAIL_NOTFOUND)
        || err.message.includes(KEY.BAD_REQUEST.CHECK_FAIL)
        || err.message.includes(KEY.BAD_REQUEST.BAD_PASSWORD)
        ) {
          newError.status = 400;
        }
        if (err.message.includes(KEY.BAD_REQUEST.PASSWORD_NOTSET)
         || err.message.includes(KEY.BAD_REQUEST.USER_SUSPEND)
        ) {
          newError.status = 403;
        }
      }
      return res.error(newError);
    }

    return req.login(user, async (loginErr) => {
      if (loginErr) {
        return res.error(loginErr);
      }
      req.session.authenticated = true;

      let message = 'Login.Success';
      switch (action) {
        case 'register':
          if (params.shouldVerifyEmail) {
            message = 'Register.Success.And.Should.Verify.Email';
          }
          message = 'Register.Success';
          break;

        default:
          message = 'Login.Success';
          break;
      }
      try {
        // update user lastLogin status
        const { deviceInfo = {} } = input || req.allParams();
        const { isDeviceRegistered } = await User.loginSuccess({
          id: user.id,
          userAgent: req.headers['user-agent'],
          locales: req.headers['accept-language'],
          deviceInfo,
        });
        const jwtToken = AuthService.getSessionEncodeToJWT(req, deviceInfo.deviceToken);
        sails.log.debug('[!] Response.Signin Authorization(jwtToken)=>\n===\n', jwtToken, '\n===');
        return res.ok({
          message,
          data: {
            Authorization: jwtToken,
            isDeviceRegistered,
            ...user,
          },
        });
      } catch (e) {
        return res.error(e);
      }
    });
  };

  /* eslint no-return-await: 0 */
  return await passport.callback({ model, input, protocol, action }, req, res, processor);
};
