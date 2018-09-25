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

module.exports = async function login(role, inputs) {
  const params = inputs || {};
  const queryUrl = params.queryUrl === 'undefined' ? null : params.queryUrl;
  const config = ConfigService.getProjectConfig('project-admin');
  params.successRedirect = queryUrl || (config ? config.successRedirect : '/');
  params.siginedRedirect = queryUrl || (config ? config.siginedRedirect : '/');
  params.invalidRedirect = (config ? config.invalidRedirect : '/login');
  params.shouldVerifyEmail = sails.config.verificationEmail === 'true';

  sails.log('====================================');
  sails.log(`\n role=>"${role.toString().split(':')[1].replace(']', '')}"`);
  sails.log('\n params=>\n', params);
  sails.log('====================================');

  // Get access to `req` and `res`
  const req = this.req;
  const res = this.res;

  const tryAgain = (err) => {
    let reference = '';
    switch (params.action) {
      case 'register':
        return res.redirect('/register');

      case 'disconnect':
        return res.redirect('back');

      default:
        try {
          reference = urlGetter.parse(req.headers.referer);
        } catch (e) {
          reference = { path: '/' };
        }
        return res.redirect(reference.path);
    }
  };

  await passport.callback(role, req, res, (err, user, challenges, statuses) => {
    if (err || !user) {
      // console.log('err.message=>', err.message);
      if (req.wantsJSON && _.has(err, 'message')) {
        const newError = new Error(err.message);
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
        return res.negotiate(newError);
      }
      return tryAgain(err);
    }

    return req.login(user, async (loginErr) => {
      if (loginErr) {
        return tryAgain(loginErr);
      }
      req.session.authenticated = true;

      // update user lastLogin status
      const userAgent = req.headers['user-agent'];
      await user.loginSuccess({ userAgent });

      // save device token
      let deviceRegister = false;
      const supportPlatform = UserDevice.rawAttributes.platform.values;
      const platform = req.param('platform');
      const deviceToken = req.param('deviceToken');
      if (supportPlatform.includes(platform)) {
        // 確保一個 Deivce 只會對應一個 User
        const device = await UserDevice.destroy({
          where: {
            platform,
            deviceToken,
          },
        });

        await UserDevice.create({
          UserId: user.id,
          platform,
          deviceToken,
        });
        deviceRegister = true;
      }

      let jsonMessage = '';
      let targetUrl = params.successRedirect;

      switch (params.action) {
        case 'register':
          if (params.shouldVerifyEmail) {
            if (req.wantsJSON) {
              return res.ok({
                message: 'Registered succeed, please verify your email and update profile.',
              });
            }
            return res.redirect(params.siginedRedirect);
          }
          jsonMessage = 'Registered succeed.';
          targetUrl = params.siginedRedirect;
          break;

        default:
          jsonMessage = 'Logined succeed.';
          targetUrl = params.successRedirect;
          break;
      }
      sails.log('====================================');
      sails.log('req.wantsJSON=>', req.wantsJSON);
      if (req.wantsJSON) {
        sails.log('req.session.needJwt=>', req.session.needJwt);
        try {
          const jwtToken = AuthService.getSessionEncodeToJWT(req);
          sails.log('Authorization(jwtToken)=>', jwtToken);
          return res.ok({
            success: true,
            message: jsonMessage,
            data: {
              Authorization: jwtToken,
              url: targetUrl || params.successRedirect,
              deviceRegister,
            },
          });
        } catch (e) {
          sails.log.error(e);
          return res.negotiate(e);
        }
      }
      sails.log('====================================');
      return res.redirect(params.successRedirect);
    });
  });
};
