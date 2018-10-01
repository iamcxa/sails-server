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

const defaultMessage = 'badRequest';

module.exports = function badRequest(rawData, options) {
  // Get access to `req`, `res`, & `sails`
  const { req, res } = this;
  const sails = req._sails;
  let data = {
    langCode: req.getLocale(),
    controller: req.options.controller,
    action: req.options.action,
    success: false,
  };

  // Set status code
  res.status(400);

  // get i18n and params
  if (!rawData) {
    data.message = defaultMessage;
  } else if (typeof rawData === 'string') {
    const phrases = rawData.split('|');
    const i18nMessage = sails.__({
      phrase: phrases[0],
      locale: req.param('langCode', req.getLocale()),
    });
    const detailMessage = phrases[1]
      ? `|${phrases[1]}`
      : '';
    data.message = `${i18nMessage}${detailMessage}`;
  } else if (typeof rawData === 'object') {
    const i18nMessage = sails.__({
      phrase: rawData.phrase,
      locale: req.param('langCode', req.getLocale()),
    });
    data = {
      ...data,
      ..._.omit(rawData, ['phrase']),
      message: i18nMessage,
    };
  }

  // delete sensitive information in production mode.
  if (sails.config.environment === 'production') {
    delete data.stack;
    delete data.controller;
    delete data.action;
  }

  // If the user-agent wants JSON, always respond with JSON
  if (req.wantsJSON) {
    return res.json(data);
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  /* eslint-disable-next-line no-param-reassign */
  options = (typeof options === 'string') ? { view: options } : options || {};

  // If a view was provided in options, serve it.
  // Otherwise try to guess an appropriate view, or if that doesn't
  // work, just send JSON.
  if (options.view) {
    return res.view(options.view, { data });
  } if (options.redirect) {
    return res.redirect(options.redirect);
  }
  return res.json(data);
};
