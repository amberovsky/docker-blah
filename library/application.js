"use strict";

/**
 * application.js - bootstrapping
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class Application {

    /**
     * @constructor
     */
    constructor() {
        var self = this;

        // filesystem
        this.fs = require('fs');


        // express itself
        var express = require('express');
        this.express = express();

        // serving static files
        this.express.use('/public', express.static('public'));


        // cookie parser
        this.express.use((require('cookie-parser'))());


        // body / form parser
        var bodyParser = require('body-parser');
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({
            extended: true
        }));


        // logging
        var morgan = require('morgan');
        var winston = require('winston');
        this.express.use(morgan('combined', {
            stream: this.fs.createWriteStream(__dirname + '/../logs/http.log', { flags: 'a' })
        }));


        // templating
        var nunjucks = require('nunjucks');
        var environemnt = nunjucks.configure(__dirname + '/../views', {
            autoescape: true,
            express: this.express,
            noCache: true // TODO
        });

        environemnt.addFilter('match', function(input, pattern) {
            return (input.match(new RegExp(pattern)) !== null);
        });


        // sessions
        var session = require('express-session');
        var RedisStore = require('connect-redis')(session);
        this.express.use(session({
            resave: true,
            saveUninitialized: false,
            secret: 'ho-ho-ho TODO changeme',
            store: new RedisStore({
                host: '127.0.0.1',
                port: '6379',
                secret: 'Whoah whoa whoa TODO changeme'
            })
        }));


        /**
         * START: Base routing initialization
         */

        // set default variables in templates
        this.express.use(function(request, response, next) {
            env.addGlobal('application', self);
            env.addGlobal('request', request);

            next();
        });

        // handle logout
        this.express.get('/logout', function (request, response) {
            request.session.destroy();
            return response.redirect('/');
        });

        // handle login
        this.express.post('/', function (request, response) {
            if (typeof request.session.userId == 'undefined') {
                var
                    login = request.body.login,
                    password = request.body.password;

                if ((typeof login == 'undefined') || (typeof password == 'undefined')) {
                    response.render('layout/auth.html.twig', {error: 'wrong login or password'});
                    return;
                }

                var authResult = self.getDockerBlah().getAuth().auth(login, password);

                if ((authResult === null) || (authResult <= 0)) {
                    return response.render('layout/auth.html.twig', {error: 'wrong login or password'});
                } else {
                    request.session.userId = authResult;
                }
            }

            return response.redirect('/');
        });

        // middleware for all requests - check auth
        this.express.use(function (request, response, next) {
            if (typeof request.session.userId == 'undefined') {
                response.render('layout/auth.html.twig');
            } else {
                var user = self.getDockerBlah().getUserManager().getById(request.session.userId);

                if (user === null) {
                    request.session.reset();
                    return response.redirect('/');
                } else {
                    request.currentUser = user;
                }
                next();
            }
        });
        
        /**
         * END: Base routing initialization
         */


        // database
        var file = __dirname + '/../data/docker-blah.db';
        var exists = this.fs.existsSync(file);
        var SQLite3 = require('sqlite3').verbose();
        
        /** @type {sqlite3.Database} */
        this.sqlite3 = new SQLite3.Database(file);

        // run the project
        var run = function() {

            /** @type {DockerBlah} */
            self.dockerBlah = new (require(__dirname + '/../library/dockerBlah.js'))(self, function(error) {
                if (error === null) {

                    // load controllers
                    (function readControllers(dir) {
                        self.fs.readdirSync(dir).forEach(function (file) {
                            file = dir + '/' + file;
                            var stat = self.fs.statSync(file);
                            if (stat && stat.isDirectory()) {
                                readControllers(file)
                            } else {
                                var route = require(file);
                                route.controller(self);
                            }
                        });
                    })(__dirname + '/../controllers');

                    self.express.listen(3000, function () {
                        console.log('listening');
                    });
                } else {
                    console.log(error);
                }
            });
        };

        // initialize the database
        this.sqlite3.serialize(function () {
            if (!exists) {
                self.sqlite3.exec(
                    self.fs.readFileSync(__dirname + '/../config/docker-blah.sql').toString(),
                    function(error) {
                        if (error === null) {
                            run();
                        } else {
                            console.log(error);
                        }
                    }
                );
            } else {
                run();
            }
        });
    };


    /**
     * @returns {Object}
     */
    getExpress() {
        return this.express;
    };

    /**
     * @returns {DockerBlah}
     */
    getDockerBlah() {
        return this.dockerBlah;
    }

    /**
     * @returns {sqlite3.Database}
     */
    getSqlite3() {
        return this.sqlite3;
    }

    /**
     * Create constant in a class
     *
     * @param {Object} object - class
     * @param {string} name - constant name
     * @param {*} value - constant value
     */
    createConstant(object, name, value) {
        Object.defineProperty(object, name, {
            value: value,
            enumerable: true
        });
    };
}

module.exports = Application;
