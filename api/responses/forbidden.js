/**
 * 403 (Forbidden) Handler
 *
 * Usage:
 * return res.forbidden();
 * return res.forbidden(err);
 * return res.forbidden(err, 'some/specific/forbidden/view');
 *
 * e.g.:
 * ```
 * return res.forbidden('Access denied.');
 * ```
 */

module.exports = function forbidden(sourceData, sourceOptions) {
  // Get access to `req`, `res`, & `sails`
  const req = this.req;
  const res = this.res;
  const sails = req._sails;
  let data = sourceData;
  let options = sourceOptions;

  // Set status code
  res.status(403);

  // Log error to console
  // if (data !== undefined) {
  //   if (data.stack) {
  //     sails.log.warn('Sending 403 ("Forbidden") response: \n', data.stack);
  //   } else if (data.message) {
  //     sails.log.warn('Sending 403 ("Forbidden") response: \n', data.message);
  //   } else {
  //     sails.log.warn('Sending 403 ("Forbidden") response: \n', data);
  //   }
  // } else {
  //   sails.log.warn('Sending empty 403 ("Forbidden") response');
  // }

  if (!data) {
    data = {
      message: '',
      success: false,
    };
  } else if (typeof data === 'string') {
    data = {
      message: data,
      success: false,
    };
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
      phrase: data.message || 'Error.API.User.Suspend',
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
  if (req.path.split('/')[1] === 'admin') {
    sails.log.info('Forbidden redirect /admin/login');
    return res.redirect('/admin/login');
  }

  // if request path is admin-site, redirect to login.
  // if (req.path.split('/')[1] === 'entry') {
  //   sails.log.info('Forbidden redirect /login');
  //   return res.redirect('/login');
  // }

  // If no second argument provided, try to serve the default view,
  // but fall back to sending JSON(P) if any errors occur.
  return res.view('403', { data }, (err, html) => {
    // If a view error occured, fall back to JSON(P).
    if (err) {
      // Additionally:
      // • If the view was missing, ignore the error but provide a verbose log.
      if (err.code === 'E_VIEW_FAILED') {
        sails.log.verbose('res.forbidden() :: Could not locate view for error page (sending JSON instead).  Details: ', err);
      } else {
        // Otherwise, if this was a more serious error, log to the console with the details.
        sails.log.warn('res.forbidden() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ', err);
      }
      return res.json(data);
    }
    return res.send(html);
  });
};
