'use strict';

/**
 * Dependencies.
 */
const AuthJwt = require('hapi-auth-jwt');
const Good = require('good');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Mongoose = require('mongoose');

const Authentication = require('./routes/authentication');
const Base = require('./routes/base');
const User = require('./routes/user');
const Example = require('./routes/example');
const Article = require('./routes/article');
const Comment = require('./routes/comment');

//Config
const config = require('./config');

// Create a new server
const server = new Hapi.Server();

Mongoose.Promise = global.Promise;

Mongoose.connect('mongodb://' +
  config.db.username + ':' +
  config.db.password + '@' +
  config.db.hostname + ':' +
  config.db.port + '/' +
  config.db.database);


// Setup the server with a host and port
server.connection({
  port: parseInt(process.env.PORT, 10) || 3000,
  host: '0.0.0.0',
  router: {
    stripTrailingSlash: true
  },
  routes: {
    cors: {
      headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'X-API-KEY'],
      origin: ['*']
    }
  }
});

// Export the server to be required elsewhere.
module.exports = server;

/*
    Load all plugins and then start the server.
    First: community/npm plugins are loaded
    Second: project specific plugins are loaded
 */
server.register(
  [
    //Hapi Plugins
    {
      register: Good,
      options: {
        reporters: {
          console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{
              response: '*',
              log: '*'
            }]
          }, {
            module: 'good-console'
          }, 'stdout']
        }
      }
    },
    AuthJwt,

    //Routes
    Authentication,
    Base,
    User,
    Article,
    Comment
  ],
  (err) => {

    Hoek.assert(!err, err);

    //Start the server
    server.start(() => {
      //Log to the console the host and port info
      console.log(`Server started at: ${server.info.uri}`);
    });
  });
