"use strict";

/**
 * application.js - bootstrapping, project itself
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class Application {
    
    /**
     * Callback to be used for all database operations
     *
     * @callback DatabaseOperationCallback
     *
     * @param {null|Boolean} isError - indicates was there an error during database operation (true) or null otherwise
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

        // filesystem
        this.fs = require('fs');


        // express itself
        var express = require('express');
        this.express = express();

        // serving static files
        this.express.use('/public', express.static('public'));


        // cookie parser
        var cookieParser = require('cookie-parser');
        this.express.use(cookieParser());


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

        environemnt.addFilter('match', function (input, pattern) {
            return (input.match(new RegExp(pattern)) !== null);
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
            resave: true,
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
                this.getAuth().auth(username, password, function (user, error) {
                    if (user !== null) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                });
            }
        ));

        // passport user serialization
        passport.serializeUser(function (user, done) {
            done(null, user.getId());
        });

        // passport user deserialization
        passport.deserializeUser((id, done) => {
            this.getUserManager().getById(id, (user, error) => {
                done(error, user);
            });
        });

        
        /**
         * START: Base routing initialization
         */

        // set default variables in templates
        this.express.use((request, response, next) => {
            environemnt.addGlobal('application', this);
            environemnt.addGlobal('request', request);

            next();
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
                        return next(error); // will generate a 500 error
                    }

                    // Generate a JSON response reflecting authentication status
                    if (!user) {
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
            /** @type {ProjectManager} - project manager */
            this.projectManager = new (require('../models/projectManager.js'))(this, () => {
                /** @type {NodeManager} - node manager */
                this.nodeManager = new (require('../models/nodeManager.js'))(this, () => {
                    /** @type {UserManager} - user manager */
                    this.userManager = new (require('../models/userManager.js'))(this);

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

                    var server = this.express.listen(3000, function () {
                        console.log('hello');
                    });

                    // TODO websockets
                    var passportSocketIo = require("passport.socketio");

                    var io = require('socket.io').listen(server);


                    io.use(passportSocketIo.authorize({
                        cookieParser: cookieParser,       // the same middleware you registrer in express
                        key:          'express.sid',       // the name of the cookie where express/connect stores its session_id
                        secret:       sessionSecret,    // the session_secret to parse the cookie
                        store:        sessionStore,        // we NEED to use a sessionstore. no memorystore please
                        success:      function(data, accept) {
                            console.log('socket-acc');
                            accept();
                        },
                        fail:         function (data, message, error, accept) {
                            console.log('spocket-fail');
                            // error indicates whether the fail is due to an error or just a unauthorized client
                            if(error)  throw new Error(message);
                            // send the (not-fatal) error-message to the client and deny the connection
                            return accept(new Error(message));
                        }
                    }));

                    io.on('connection', function (socket) {
                        console.log('here');
                    });
                });
            });
        };

        // database
        var file = __dirname + '/../data/docker-blah.db';
        var exists = this.fs.existsSync(file);
        var SQLite3 = require('sqlite3').verbose();

        /** @type {sqlite3.Database} */
        this.sqlite3 = new SQLite3.Database(file);
        
        // initialize the database
        this.sqlite3.serialize(function () {
            if (!exists) {
                self.sqlite3.exec(
                    self.fs.readFileSync(__dirname + '/../config/docker-blah.sql').toString(),
                    function (error) {
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

    handleErrorDuringStartup(error) {
        console.log(error);
    };

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
     * @returns {NodeManager}
     */
    getNodeManager() {
        return this.nodeManager;
    }

    /**
     * @returns {string} path to event files
     */
    getEventsDirectory() {
        return __dirname + '/../logs/';
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
