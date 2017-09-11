'use strict';

const Boom = require('boom');

exports.register = (server, options, next) => {

    server.route([{
        method: 'GET',
        path: '/',
        config: {
            auth: false,
            handler: (request, reply) => {
                reply({status:'ok'});
            }
        }
    }, {
        method: 'GET',
        path: '/{path*}',
        config: {
            auth: false,
            handler: (request, reply) => {
                reply(Boom.notFound());
            }
        }
    }]);

    next();
}

exports.register.attributes = {
    name: 'base'
};
