/**
 * 404 (Not Found) Handler
 *
 * Usage:
 * return res.notFound();
 * return res.notFound(err);
 * return res.notFound(err, 'some/specific/notfound/view');
 *
 * e.g.:
 * ```
 * return res.notFound();
 * ```
 *
 * NOTE:
 * If a request doesn't match any explicit routes (i.e. `config/routes.js`)
 * or route blueprints (i.e. "shadow routes", Sails will call `res.notFound()`
 * automatically.
 */

module.exports = function notFound(rawData, options) {
  // Get access to `req`, `res`, & `sails`
  const req = this.req;
  const res = this.res;
  const sails = req._sails;
  let data = rawData;

  // Set status code
  res.status(404);

  // Log error to console
  if (data !== undefined) {
    sails.log.verbose('Sending 404 ("Not Found") response: \n', data);
  } else {
    sails.log.verbose('Sending 404 ("Not Found") response');
  }

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

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.
  // if (sails.config.environment === 'production') {
  //   data = undefined;
  // }

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
  // If no second argument provided, try to serve the default view,
  // but fall back to sending JSON(P) if any errors occur.
  return res.view('404', { data }, (err, html) => {
    // If a view error occured, fall back to JSON(P).
    if (err) {
      //
      // Additionally:
      // • If the view was missing, ignore the error but provide a verbose log.
      if (err.code === 'E_VIEW_FAILED') {
        sails.log.verbose('res.notFound() :: Could not locate view for error page (sending JSON instead).  Details: ', err);
      }
      // Otherwise, if this was a more serious error, log to the console with the details.
      else {
        sails.log.warn('res.notFound() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ', err);
      }
      return res.json(data);
    }
    return res.send(html);
  });
};
