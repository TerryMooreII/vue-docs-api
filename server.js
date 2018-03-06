require('dotenv').config();

const AuthJwt = require('hapi-auth-jwt2');
const Good = require('good');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Mongoose = require('mongoose');
const Bell = require('bell');

const Authentication = require('./routes/authentication');
const Base = require('./routes/base');
const User = require('./routes/user');
const Article = require('./routes/article');
const Comment = require('./routes/comment');

// Create a new server
const server = new Hapi.Server({
  port: parseInt(process.env.PORT, 10) || 3000,
  router: {
    stripTrailingSlash: true,
  },
  routes: {
    cors: {
      headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'X-API-KEY'],
      origin: ['*'],
    },
  },
});

Mongoose.Promise = global.Promise;

Mongoose.connect(`mongodb://${
  process.env.DB_USERNAME}:${
  process.env.DB_PASSWORD}@${
  process.env.DB_HOSTNAME}:${
  process.env.DB_PORT}/${
  process.env.DB_DATABASE}`);

async function start() {
  try {
    await server.register({
      plugin: Good,
      options: {
        reporters: {
          console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{
              response: '*',
              log: '*',
            }],
          }, {
            module: 'good-console',
          }, 'stdout'],
        },
      },
    });

    await server.register(AuthJwt);
    await server.register(Bell);

    await server.register(Authentication);
    await server.register(User);
    await server.register(Base);
    await server.register(Article);
    await server.register(Comment);

    // Hoek.assert(!err, err);
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  console.log('Server running at:', server.info.uri);
}

start();

// Export the server to be required elsewhere.
module.exports = server;
