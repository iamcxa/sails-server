// const Sails = require('sails');
const rc = require('rc');
const Sails = require('sails').constructor;
const chai = require('chai');
const env = require('../config/env/test');
chai.use(require('chai-datetime'));

global.request = require('supertest-as-promised');

global.should = chai.should();
global.sinon = require('sinon');

const sailsApp = new Sails();

before((done) => {
  const config = rc('sails');
  config.environment = 'test-travis';

  sailsApp.lift(config, (err, server) => {
    if (err) return done(err);
    // eslint-disable-next-line no-param-reassign
    server.config = _.merge(
      {},
      server.config,
      env,
      {
        environment: 'test-travis',
        autoreload: false,
      },
    );
    sails.log('\n\n======== config.environment ==>', server.config.environment);
    return done(err, server);
  });
});

after((done) => {
  sailsApp.lower(done());
});
