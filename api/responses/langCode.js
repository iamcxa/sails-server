/**
 * @version 9.2
 * @author Mark Ma
 * @returns {String} Locale
*/
module.exports = function langCode() {
  // Get access to `req`, `res`, & `sails`
  const req = this.req;
  const code = req.param('lang');

  let languageCode = code || req.getLocale() || 'zh-TW';
  // 相容政治問題，讓 zh-CN 視為 zh-TW
  if (languageCode === 'zh-CN') {
    languageCode = 'zh-TW';
  }
  return languageCode;
};
