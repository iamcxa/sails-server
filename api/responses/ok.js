/**
 * 200 (OK) Response
 *
 * Usage:
 * return res.ok();
 * return res.ok(data);
 * return res.ok(data, 'auth/login');
 *
 * @param  {Object} data
 * @param  {String|Object} options
 *          - pass string to render specified view
 */

import jwt from 'jsonwebtoken';

module.exports = function sendOK(data, options) {
  // Get access to `req`, `res`, & `sails`
  const req = this.req;
  const res = this.res;
  const sails = req._sails;
  const url = req._parsedUrl;
  const path = url.path || '';
  const isAdminView = path.startsWith('/admin');

  sails.log.silly('res.ok() :: Sending 200 ("OK") response');

  // Set status code
  res.status(200);

  // If appropriate, serve data as JSON(P)
  if (req.wantsJSON && !data.view) {
    // data.controller = req.options.controller;
    // data.action = req.options.action;
    if (data) {
      if (data.success === undefined) data.success = true;
      if (!data.data)data.data = {};
      if (!data.message)data.message = '';
    }
    return res.json(data);
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? { view: options } : options || {};

  // 指定 layout sample
  // res.ok({
  //   view: true,
  //   layout: 'layoutAdmin'
  // });

  // 如何關閉預設 layout 輸出？
  // res.ok({
  //   layout: false,
  // });

  const params = { data: data };

  if (isAdminView && !data.layout) {
    params.layout = false;
  } else if (data.layout !== null) {
    params.layout = data.layout;
  }

  if (options.view) {
    return res.view(options.view, params);
  } else if (options.redirect) {
    return res.redirect(options.redirect);
  }
  return res.json(data);
};
