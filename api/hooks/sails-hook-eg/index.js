/**
 * Created by jaumard on 28/03/2015.
 */

module.exports = function (sails) {
    var loader = require('sails-util-micro-apps')(sails);

    return {
      configure() {
        loader.configure({
          policies: `${__dirname}/api/policies`, // Path to your hook's policies
          config: `${__dirname}/config`, // Path to your hook's config
        });
      },
      initialize(next) {
        loader.inject({
          responses: `${__dirname}/api/responses`,
          models: `${__dirname}/api/models`, // Path to your hook's models
          services: `${__dirname}/api/services`, // Path to your hook's services
          controllers: `${__dirname}/api/controllers`, // Path to your hook's controllers
        }, err => next(err));
        // loader.injectAll({
        //   responses: `${__dirname}/api/responses`,
        //   models: `${__dirname}/api/models`, // Path to your hook's models
        //   services: `${__dirname}/api/services`, // Path to your hook's services
        //   controllers: `${__dirname}/api/controllers`, // Path to your hook's controllers
        // }, err => next(err));
      },
    };
};
