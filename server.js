'use strict';

/**
 * Dependencies.
 */
require('dotenv').config();

const AuthJwt = require('hapi-auth-jwt');
const Good = require('good');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Mongoose = require('mongoose');
const Bell = require('bell');

const Authentication = require('./routes/authentication');
const Base = require('./routes/base');
const User = require('./routes/user');
const Example = require('./routes/example');
const Article = require('./routes/article');
const Comment = require('./routes/comment');


// Create a new server
const server = new Hapi.Server();

Mongoose.Promise = global.Promise;

Mongoose.connect('mongodb://' +
  process.env.DB_USERNAME + ':' +
  process.env.DB_PASSWORD + '@' +
  process.env.DB_HOSTNAME + ':' +
  process.env.DB_PORT + '/' +
  process.env.DB_DATABASE);


// Setup the server with a host and port
server.connection({
  port: parseInt(process.env.PORT, 10) || 3000,
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
    Bell,

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
