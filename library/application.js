"use strict";

/**
 * application.js - bootstrapping, project itself
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

class Application {
    
    /**
     * Callback to be used for all database operations
     *
     * @callback DatabaseOperationCallback
     *
     * @param {null|string} isError - indicates was there an error during database operation (true) or error message
     *                                otherwise
     */

    /**
     * Callback to be used in case of errors
     *
     * @callback ErrorHandlerCallback
     *
     * @param {object} error - generated error object
     * @param {(null|string)} message - optional message
     */

    /**
     * "Next" callback
     *
     * @callback NextCallback
     */


    /**
     * @constructor
     */
    constructor() {
        var self = this;


        /**
         * @type {Utils} - project utils
         */
        this.utils = new (require('./utils.js'))();

        /**
         * @type {DockerUtils} - docker utils
         */
        this.dockerUtils = new (require('./dockerUtils.js'));

        /**
         * @type {WebSocketEventEmitter} - websocket event emitter
         */
        this.webSocketEventEmitter = new (require('./webSocketEventEmitter.js'))();


        // filesystem
        this.fs = require('fs');


        // express itself
        var express = require('express');
        this.express = express();


        // cookie parser
        var cookieParser = require('cookie-parser');
        this.express.use(cookieParser());


        // body / form parser
        var bodyParser = require('body-parser');
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({
            extended: true
        }));

        // file uploads
        var multer = require('multer');
        this.express.use(multer({ dest: '/var/www/docker-blah/uploads/'}).any());

        // global variables for request
        this.express.use(function (request, response, next) {
            response.locals.request = request;

            next();
        });

        /**
         * @param {string} tid - thread id
         * @param {string} uid - user id
         * @param {string} uri - uri
         *
         * @returns {Function} - message formatter for logger
         */
        var loggerFormatter = function (tid, uid, uri) {
            return function (options) {
                var date = new Date();

                // format timestamp
                var timestamp = date.getUTCFullYear() + '-' + self.utils.leadZero(date.getUTCMonth()) + '-' +
                    self.utils.leadZero(date.getUTCDate()) + ' ' + self.utils.leadZero(date.getUTCHours()) + ':' +
                    self.utils.leadZero(date.getUTCMinutes()) + ':' + self.utils.leadZero(date.getUTCSeconds()) + '.' +
                    self.utils.leadZero(date.getUTCMilliseconds(), 3);

                var message = timestamp + ' TID: ' + tid + ' UID: [' + uid + '] - ' + options.level.toUpperCase() +
                    ': ' + (undefined !== options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta) : '' );

                return (typeof uri === 'undefined') ? message : (message + '; URI: [' + uri + ']');
            };
        };

        // system logger
        var winston = require('winston');
        this.systemLogger = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: self.getLogsDirectory() + '/system.log',
                    json: false,
                    formatter: loggerFormatter('[SYSTEM]', 'SYSTEM')
                })
            ]
        });

        this.systemLogger.info('booting docker-blah...');


        // templating
        var nunjucks = require('nunjucks');
        var environment = nunjucks.configure(__dirname + '/../views', {
            autoescape: true,
            express: this.express,
            noCache: true // TODO
        });

        // globals for each template
        environment.addGlobal('application', this);

        // filter: check regexp
        environment.addFilter('match', function (input, pattern) {
            return (input.match(new RegExp(pattern)) !== null);
        });

        // filter: slice string
        environment.addFilter('slice', function (input, start, end) {
            return input.slice(start, end);
        });

        // filter: format timestamp to date
        environment.addFilter('date', function (input) {
            var date = new Date(parseInt(input) * 1000);

            return date.getUTCFullYear() + '-' + self.utils.leadZero(date.getUTCMonth()) + '-' +
                self.utils.leadZero(date.getUTCDate()) + ' ' + self.utils.leadZero(date.getUTCHours()) + ':' +
                self.utils.leadZero(date.getUTCMinutes()) + ':' + self.utils.leadZero(date.getUTCSeconds());
        });


        // sessions
        var sessionSecret = 'ho-ho-ho TODO changeme'; // TODO
        var session = require('express-session');
        var redisStore = require('connect-redis')(session);
        var sessionStore = new redisStore({
            host: '127.0.0.1',
            port: '6379',
            secret: 'Whoah whoa whoa TODO changeme'
        });
        this.express.use(session({
            key: 'express.sid',
            resave: false,
            saveUninitialized: false,
            secret: sessionSecret,
            store: sessionStore
        }));


        // authentication
        var passport = require('passport');
        var LocalStrategy = require('passport-local').Strategy;
        this.express.use(passport.initialize());
        this.express.use(passport.session());

        // local strategy for passport
        passport.use(new LocalStrategy((username, password, done) => {
            this.getAuth().auth(username, password, function (error, user) {
                if (user !== null) {
                    self.getSystemLogger().info('user logined : [' + user.getId() + ' - ' + user.getName() + ']');

                    return done(null, user);
                } else {
                    self.getSystemLogger().error('unable to auth user with login [' + username + '], error: [' +
                        error + ']');
                    return done(null, false);
                }
            });
        }));

        // passport user serialization
        passport.serializeUser(function (user, done) {
            done(null, user.getId());
        });

        // passport user deserialization
        passport.deserializeUser((id, done) => {
            this.getUserManager().getById(id, (error, user) => {
                if (error !== null) {
                    self.getSystemLogger().error('unable to deserialize user [' + id + ']');
                }

                done(error, user);
            });
        });

        
        /**
         * START: Base routing initialization
         */

        // set default variables in templates
        this.express.use((request, response, next) => {
            // thread id
            request.tid = '[' + self.getRandomInt(0, 9) + self.getRandomInt(0, 9) + self.getRandomInt(0, 9) +
                self.getRandomInt(0, 9) + self.getRandomInt(0, 9) + self.getRandomInt(0, 9) + ']';

            request.logger = new (winston.Logger)({
                transports: [
                    new (winston.transports.File)({
                        filename: self.getLogsDirectory() + '/system.log',
                        json: false,
                        formatter: loggerFormatter(
                                request.tid,
                                (typeof request.user !== 'undefined')
                                    ? (request.user.getId() + ' : ' + request.user.getName())
                                    : 'NON-AUTH',
                                request.originalUrl
                        )
                    })
                ]
            });

            /** @type {UserManager} - user manager */
            request.userManager = new (require('../models/userManager.js'))(self, request.logger);

            /** @type {ProjectManager} - project manager */
            request.projectManager = new (require('../models/projectManager.js'))(
                self,
                request.userManager,
                request.logger
            );

            /** @type {projectUtils} - projectUtils */
            request.projectUtils = new (require('./projectUtils.js'))(request);

            /** @type {NodeManager} - node manager */
            request.nodeManager = new (require('../models/nodeManager.js'))(self, request.logger);

            /** @type {ProjectLogManager} - project log manager */
            request.projectLogManager = new (require('../models/projectLogManager.js'))(self, request.logger);

            /** @type {NodeUtils} - nodeUtils */
            request.nodeUtils = new (require('./nodeUtils.js'))(request);

            /** function to get docker instance */
            request.getDocker = self.dockerUtils.createDockerForRequest(request);

            /** @type {RegistryManager} - registry manager */
            request.registryManager = new (require('../models/registryManager.js'))(self, request.logger);

            if (typeof request.user !== 'undefined') {
                // for auth'ed user we will add list of available projects
                request.projectManager.getAllExceptLocal((error, projects) => {
                    response.locals.allProjects = projects;

                    // this controls what projects user have access to (except admin/super)
                    request.projectManager.getAllForUser(request.user, (error, projectsWithAccess) => {
                        request.projectsWithAccess = projectsWithAccess;

                        // if user has local docker - add it to the request
                        if (request.user.getLocalId() !== -1) {
                            request.projectManager.getById(request.user.getLocalId(), (error, local) => {
                                request.local = local;
                                request.projectsWithAccess[local.getId()] = local;

                                return next();
                            });
                        } else {
                            return next();
                        }
                    });
                });
            } else {
                return next();
            }
        });

        // handle logout
        this.express.get('/logout', function (request, response) {
            request.logout();
            
            return response.redirect('/');
        });
        
        // handle login
        this.express.post('/', function (request, response, next) {
            passport.authenticate(
                'local',
                function(error, user, info) {
                    if (error) {
                        self.getSystemLogger().error(error);

                        return next(error); // will generate a 500 error
                    }

                    // Generate a JSON response reflecting authentication status
                    if (!user) {
                        self.getSystemLogger().error('no user after auth');

                        return response.render('layout/auth.html.twig', { error: 'wrong login or password' });
                    }

                    // ***********************************************************************
                    // "Note that when using a custom callback, it becomes the application's
                    // responsibility to establish a session (by calling req.login()) and send
                    // a response."
                    // Source: http://passportjs.org/docs
                    // ***********************************************************************
                    request.login(user, loginErr => {
                        if (loginErr) {
                            self.getSystemLogger().error(loginErr);

                            return next(loginErr);
                        }

                        return response.redirect('/');
                    });
                }
            )(request, response, next);
        });


        // middleware for all requests - check auth
        this.express.use(function (request, response, next) {
            if (!request.isAuthenticated()) {
                self.getSystemLogger().info('user is not auth\'ed, will redirect to auth');

                response.render('layout/auth.html.twig');
            } else {
                next();
            }
        });

        /**
         * END: Base routing initialization
         */


        // run the project
        var run = () => {

            /** @type {Auth} - Auth */
            this.auth = new (require('./auth.js'))(this);

            /** @type {UserManager} - user manager */
            this.userManager = new (require('../models/userManager.js'))(self, this.systemLogger);

            /** @type {ProjectManager} - project manager */
            this.projectManager = new (require('../models/projectManager.js'))(self, this.systemLogger);

            /** @type {NodeManager} - node manager */
            this.nodeManager = new (require('../models/nodeManager.js'))(self, this.systemLogger);


            this.getSystemLogger().info('loading controllers...');

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

            // 404 handler
            this.express.use(function(request, response, next) {
                request.logger.error('Requested non-existed URL');
                return response.status(404).render('error/404.html.twig', {
                    action: 'error'
                });
            });

            // error handler
            this.express.use(function (error, request, response, next) {
                // skip if headers were sent
                if (response.headersSent) {
                    return next(error);
                }

                console.log(error);
                self.getSystemLogger().error(error);

                response.status(500).send(`
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>Docker-blah</title>
                        <link rel='shortcut icon' href='/public/favicon.ico' type='image/x-icon' />
                    </head>
                    <body>
                        Something really bad happened.<br>
                        If the superman is not around you - call your system administrator.
                    </body>
                    </html>
                `);
            });

            this.getSystemLogger().info('done');

            /**
             * Ta-daaa! The server
             */
            this.express.listen(3000, function () {
                // socket.io & passportjs
                var passportSocketIo = require("passport.socketio");
                var io = require('socket.io').listen(this);

                // passportjs for auth
                io.use(passportSocketIo.authorize({
                    cookieParser: cookieParser, // the same middleware you register in express
                    key:          'express.sid', // the name of the cookie where express/connect stores its session_id
                    secret:       sessionSecret, // the session_secret to parse the cookie
                    store:        sessionStore, // we NEED to use a sessionstore. no memorystore please
                    success:      function(data, accept) {
                        console.log('socket-acc');
                        accept();
                    },
                    fail:         function (data, message, error, accept) {
                        // TODO more detailed logs
                        console.log('failed socket connection');

                        // error indicates whether the fail is due to an error or just a unauthorized client
                        if (error) {
                            throw new Error(message);
                        }

                        // send the (not-fatal) error-message to the client and deny the connection
                        return accept(new Error(message));
                    }
                }));

                io.on('connection', function (socket) {
                    
                    // authe'ed user
                    var user = socket.request.user;
                    
                    var websocketLogger = new (winston.Logger)({
                        transports: [
                            new (winston.transports.File)({
                                filename: self.getLogsDirectory() + '/system.log',
                                json: false,
                                formatter: loggerFormatter('[WEBSOCKET]', user.getId() + ' - '  + user.getName())
                            })
                        ]
                    });
                    
                    self.getWebSocketEventEmitter().emit('connection', socket, user, websocketLogger);
                });

                self.systemLogger.info('docker-blah has started');
                console.log('docker-blah has started');
            });
        };

        // database
        var file = __dirname + '/../../data/docker-blah.db';
        var exists = this.fs.existsSync(file);
        var SQLite3 = require('sqlite3').verbose();

        /** @type {sqlite3.Database} */
        this.sqlite3 = new SQLite3.Database(file);
        
        // initialize the database
        this.sqlite3.serialize(function () {
            if (!exists) {
                self.getSystemLogger().info('database doesn\'t exist, will create...');

                self.sqlite3.exec(
                    self.fs.readFileSync(__dirname + '/../config/docker-blah.sql').toString(),
                    function (error) {
                        if (error === null) {
                            self.getSystemLogger().info('database was created');

                            run();
                        } else {
                            self.getSystemLogger().error(error);
                        }
                    }
                );
            } else {
                self.getSystemLogger().info('database already exists');

                run();
            }
        });
    };

    /**
     * @param {number} min - minimum value for a random number
     * @param {number} max - maximum value for a random number
     *
     * @returns {number} - pseudo-random number
     */
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * @returns {Object}
     */
    getExpress() {
        return this.express;
    };

    /**
     * @returns {sqlite3.Database}
     */
    getSqlite3() {
        return this.sqlite3;
    }

    /**
     * @returns {Auth}
     */
    getAuth() {
        return this.auth;
    }

    /**
     * @returns {NodeManager}
     */
    getNodeManager() {
        return this.nodeManager;
    }


    /**
     * @returns {ProjectManager}
     */
    getProjectManager() {
        return this.projectManager;
    }

    /**
     * @returns {UserManager}
     */
    getUserManager() {
        return this.userManager;
    }

    /**
     * @returns {string} path to logs
     */
    getLogsDirectory() {
        return '/var/log/docker-blah/';
    }

    /**
     * @returns {winston.Logger} system logger
     */
    getSystemLogger() {
        return this.systemLogger;
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

    /**
     * @returns {WebSocketEventEmitter} - websocket event emitter
     */
    getWebSocketEventEmitter() {
        return this.webSocketEventEmitter;
    }
    
}

module.exports = Application;
