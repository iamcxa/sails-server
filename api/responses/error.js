import _ from 'lodash';

module.exports = function errorHandler(error) {
  const { req, res } = this;
  // eslint-disable-next-line
  const sails = req._sails;
  const {
    name = null,
    message = null,
    fields = '',
    parent = null,
    errors = null,
  } = error;
  try {
    const checkHandler = (TYPE, errMessage) => {
      if (!KEY[TYPE]) {
        return false;
      }
      return Object
        .keys(KEY[TYPE])
        .some((e) => {
          const value = (typeof KEY[TYPE][e] === 'function')
            ? KEY[TYPE][e]()
            : KEY[TYPE][e];
          const filter = (typeof KEY[TYPE][e] === 'function')
            ? value.slice(0, value.length - 2)
            : value;
          // console.warn('errMessage filter=>', filter);
          return errMessage.startsWith(filter);
        });
    };

    console.log('=================================');
    console.log('error.message=>', error.message);
    console.log('error.name=>', name);
    console.log('error.fields=>', fields);
    console.log('=================================');

    switch (message) {
      case 'Validation error': {
        switch (name) {
          case 'SequelizeUniqueConstraintError': {
            // console.log('switch Validation error');
            const detail = _.isObject(fields) ? _.values(fields) : fields;
            return res.badRequest(KEY.BAD_REQUEST.UNIQUE_CONSTRAINT_ERROR(detail));
          }
          default:
            return res.badRequest(KEY.ERROR.VALIDATION_FAILED(`${name}: ${JSON.stringify(fields)}`));
        }
      }
      default: {
        if (message.startsWith('ER_TRUNCATED_WRONG_VALUE')
            || message.startsWith('ER_BAD_FIELD_ERROR')
            || message.startsWith('ER_PARSE_ERROR')
            || message.startsWith('ER_INVALID_GROUP_FUNC_USE')
            || message.startsWith('ER_NO_REFERENCED_ROW')
            || message.startsWith('ER_')
        ) {
          if (ConfigService.isDevelopment()) {
            return res.badRequest(message);
          }
          return res.badRequest('Database.Request.Error');
        }
        if (checkHandler('SERVER_ERROR', message)) {
          return res.serverError(message);
        }
        if (checkHandler('BAD_REQUEST', message)) {
          return res.badRequest(message);
        }
        if (checkHandler('NOT_FOUND', message)) {
          return res.notFound(message);
        }
        if (checkHandler('FORBIDDEN', message)) {
          return res.forbidden(message);
        }
        return res.negotiate(error);
      }
    }
  } catch (e) {
    return res.negotiate(e);
  }
};
