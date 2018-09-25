module.exports = function accepted(sourceData, sourceOptions) {
  let data = sourceData;
  let options = sourceOptions;

  // Get access to `req`, `res`, & `sails`
  const req = this.req;
  const res = this.res;
  const sails = req._sails;
  // const url = req._parsedUrl;
  // const path = url.path || '';
  // const isAdminView = path.startsWith('/admin');

  sails.log.silly('res.accepted() :: Sending 202 ("Accepted") response');

  res.status(202);

  // if (isAdminView && !data.layout) {
  //   params.layout = false;
  // } else if (data.layout !== null) {
  //   params.layout = data.layout;
  // }

  return res.view('202', { data: {} });
};
