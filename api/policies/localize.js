/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = (req, res, next) => {
  if (req.session.languagePreference) {
    if (sails.config.i18n.locales.indexOf(req.session.languagePreference) > -1) {
      req.setLocale(req.session.languagePreference);
    }
  }
  // 如果有指定 lang，設定頁面語言
  const langCode = req.param('lang');
  if (langCode) {
    if (sails.config.i18n.locales.indexOf(langCode) > -1) {
      sails.log('=== setting language ===>', langCode);
      req.session.languagePreference = langCode;
      req.setLocale(langCode);
    }
  }
  return next();
};
