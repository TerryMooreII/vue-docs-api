Hapi Authentication and Authorization with JWT and mongo
==========

Example to show how authentication and authorization works in Hapi.js on Node.js with Mongo/Mlab and JWT.

This project was cloned from a hapi with cookie auth [example.](https://medium.com/@poeticninja/authentication-and-authorization-with-hapi-5529b5ecc8ec#.12z6lpcao) So props...

hapi JWT is from [here](https://github.com/dwyl/hapi-auth-jwt2)


Config.js
-----------
Add a config.js to the root of your project (Better yet update to use ENV params)

```javascrpt
module.exports = {
    token:{
      secret: 'output of this ->' //node -e "console.log(require('crypto').randomBytes(256).toString('base64'));"
    },
    db: {
        username: '',
        password: '',
        hostname: '',
        database: '',
        port: ''
    },
    server: {
        hostname: 'localhost',
        port: 3000
    }
}
```
