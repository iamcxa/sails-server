/**
 * 401 (unAuthorized) Handler
 *
 * Usage:
 * return res.unAuthorized();
 * return res.unAuthorized(err);
 * return res.unAuthorized(err, 'some/specific/unAuthorized/view');
 *
 * e.g.:
 * ```
 * return res.unAuthorized('Access denied.');
 * ```
 */

module.exports = function unAuthorized(sourceData, sourceOptions) {
  let data = sourceData;
  let options = sourceOptions;

  // Get access to `req`, `res`, & `sails`
  const req = this.req;
  const res = this.res;
  const sails = req._sails;

  // log sourceData
  sails.log('== 401 unAuthorized ==>', data);

  // Set status code
  res.status(401);

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.
  if (sails.config.environment === 'production') {
    data = undefined;
  }

  // Log error to console
  if (!data) {
    sails.log('Sending 401 ("unAuthorized") response');
    data = {
      message: '',
      success: false,
    };
  } else {
    sails.log('Sending 401 ("unAuthorized") response: \n', data);
    if (typeof data === 'string') {
      data = {
        message: data,
        success: false,
      };
    }
  }

  // get and set user login status.
  const isAuthenticated = AuthService.isAuthenticated(req);
  data.isAuthenticated = isAuthenticated;

  // If the user-agent wants JSON, always respond with JSON
  if (req.wantsJSON) {
    data.controller = req.options.controller;
    data.action = req.options.action;
    data.success = false;
    data.langCode = req.param('langCode', req.getLocale());
    if (!data.data) data.data = {};
    if (!data.message) {
      data.message = '';
    }
    const i18n = sails.__({
      phrase: data.message,
      locale: req.param('langCode', req.getLocale()),
    });
    if (i18n) {
      data.message = i18n;
    }
    if (sails.config.environment === 'production') {
      delete data.stack;
      delete data.controller;
      delete data.action;
    }
    return res.json(data);
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? { view: options } : options || {};

  // If a view was provided in options, serve it.
  // Otherwise try to guess an appropriate view, or if that doesn't
  // work, just send JSON.
  if (options.view) {
    return res.view(options.view, { data });
  }

  // if request path is admin-site, redirect to login.
  // if (req.path.split('/')[1] === 'admin') {
  //   sails.log.info('unAuthorized redirect /admin/login');
  //   return res.redirect('/admin/login');
  // }

  // If no second argument provided, try to serve the default view,
  // but fall back to sending JSON(P) if any errors occur.
  return res.view('401', { data }, (err, html) => {
    // If a view error occured, fall back to JSON(P).
    if (err) {
      // Additionally:
      // • If the view was missing, ignore the error but provide a verbose log.
      if (err.code === 'E_VIEW_FAILED') {
        sails.log.verbose('res.unAuthorized() :: Could not locate view for error page (sending JSON instead).  Details: ', err);
      } else {
        // Otherwise, if this was a more serious error, log to the console with the details.
        sails.log.warn('res.unAuthorized() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ', err);
      }
      return res.json(data);
    }
    return res.send(html);
  });
};
