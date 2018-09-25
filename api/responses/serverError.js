/**
 * 500 (Server Error) Response
 *
 * Usage:
 * return res.serverError();
 * return res.serverError(err);
 * return res.serverError(err, 'some/specific/error/view');
 *
 * NOTE:
 * If something throws in a policy or controller, or an internal
 * error is encountered, Sails will call `res.serverError()`
 * automatically.
 */

module.exports = function serverError(rawData, options) {
  // Get access to `req`, `res`, & `sails`
  const req = this.req;
  const res = this.res;
  const sails = req._sails;
  let data = (rawData);

  // Set status code
  res.status(500);

  // Log error to console
  // if (data !== undefined) {
  //   if (data.stack) {
  //     sails.log.error('Sending 500 ("Server Error") response: \n', data.stack);
  //   } else if (data.message) {
  //     sails.log.error('Sending 500 ("Server Error") response: \n', data.message);
  //   } else {
  //     sails.log.error('Sending 500 ("Server Error") response: \n', data);
  //   }
  // } else {
  //   sails.log.error('Sending empty 500 ("Server Error") response');
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
    const langCode = req.getLocale() || 'zh-TW';
    data.controller = req.options.controller;
    data.action = req.options.action;
    data.success = false;
    data.langCode = req.param('langCode', langCode);
    if (!data.data) data.data = {};
    if (!data.message) {
      data.message = '';
    }
    // console.log('data.message=>', data)
    if (data.message === 'Validation error') {
      data.message = data.errors[0].message;
    } else {
      let i18n = null;
      try {
        sails.log.error('data.stack=>', data.stack);
        i18n = sails.__({
          phrase: data.message || '',
          locale: langCode,
        });
      } catch (e) {
        sails.log.error(e);
      }
      if (i18n) {
        data.message = i18n;
      }
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
  } else if (options.redirect) {
    return res.redirect(options.redirect);
  }

  // If no second argument provided, try to serve the default view,
  // but fall back to sending JSON(P) if any errors occur.
  return res.view('500', { data }, (err, html) => {
    // If a view error occured, fall back to JSON(P).
    if (err) {
      //
      // Additionally:
      // • If the view was missing, ignore the error but provide a verbose log.
      if (err.code === 'E_VIEW_FAILED') {
        sails.log.verbose('res.serverError() :: Could not locate view for error page (sending JSON instead).  Details: ', err);
      }
      // Otherwise, if this was a more serious error, log to the console with the details.
      else {
        sails.log.warn('res.serverError() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ', err);
      }
      return res.json(data);
    }

    return res.send(html);
  });
};
