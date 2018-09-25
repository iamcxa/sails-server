/**
 * 400 (Bad Request) Handler
 *
 * Usage:
 * return res.badRequest();
 * return res.badRequest(data);
 * return res.badRequest(data, 'some/specific/badRequest/view');
 *
 * e.g.:
 * ```
 * return res.badRequest(
 *   'Please choose a valid `password` (6-12 characters)',
 *   'trial/signup'
 * );
 * ```
 */
import _ from 'lodash';

module.exports = function badRequest(rawData, options) {
  // Get access to `req`, `res`, & `sails`
  const { req, res } = this;
  const sails = req._sails;
  let data = rawData;

  // Set status code
  res.status(400);

  if (!data) {
    data = {
      message: '',
      success: false,
    };
  } else if (typeof data === 'string') {
    const phrases = data.split(',');
    const i18nMessage = sails.__({
      phrase: phrases[0],
      locale: req.param('langCode', req.getLocale()),
    });
    // console.log(req.param('langCode', req.getLocale()), i18nMessage);
    data = {
      message: `${i18nMessage}${phrases[1]}`,
      success: false,
    };
  }

  // If the user-agent wants JSON, always respond with JSON
  if (req.wantsJSON) {
    data.controller = req.options.controller;
    data.action = req.options.action;
    data.success = false;
    data.langCode = req.getLocale();
    if (!data.data) data.data = {};
    if (!data.message) {
      data.message = '';
    }
    const i18n = sails.__({
      phrase: data.message,
      // locale: _.hasIn(req, 'langCode') || req.getLocale(),
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
  } if (options.redirect) {
    return res.redirect(options.redirect);
  }

  // If no second argument provided, try to serve the implied view,
  // but fall back to sending JSON(P) if no view can be inferred.
  return res.view('400', { data }, (err, html) => {
    if (err) {
      return res.json(data);
    }
    return res.send(html);
  });
};
