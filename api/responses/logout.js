module.exports = async function logout(payload, options) {
  const req = this.req;
  const res = this.res;
  // eslint-disable-next-line
  const sails = req._sails;
  const isAuthenticated = req.session.authenticated;
  const session = AuthService.getSessionUser(req);
  let message = KEY.SUCCESS.AUTH_LOGOUT_SUCCESS;

  try {
    if (isAuthenticated || session) {
      sails.log.debug(`=== logout === \nisAuthenticated:${isAuthenticated}\session=>${JSON.stringify(session, null, 2)}`);
      if (session.deviceToken) {
        await UserDevice.destroy({
          where: {
            UserId: session.id,
            deviceToken: session.deviceToken,
          },
        });
      }
      req.session.authenticated = false;
      req.logout();
      if (AuthService.afterLogout) {
        await AuthService.afterLogout(req, res, session);
      }
    } else {
      message = KEY.INFO.AUTH_ALREADY_LOGOUT;
    }
    return res.ok({
      message,
    });
  } catch (error) {
    return res.error(error);
  }
};
