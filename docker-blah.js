var fs = require('fs');
var swig = require('swig');
var express = require('express');
var app = express();

app.docker_blah = {};

app.createConstant = function(object, name, value) {
    Object.defineProperty(object, name, {
        value:      value,
        enumerable: true
    });
};

app.use(function(request, response, next) {
    request.docker_blah = {};
    
    swig.setDefaults({
        cache: false,
        locals: {
            app: app,
            request: request
        }
    });

    next();
});

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

swig.setFilter('match', function(input, pattern) {
    return input.match(new RegExp(pattern)) !== null;
});

var session = require('express-session');
var RedisStore = require('connect-redis')(session);

app.use(session({
    resave: true,
    saveUninitialized: false,
    secret: 'ho-ho-ho TODO changeme',
    store: new RedisStore({
        host: '127.0.0.1',
        port: '6379',
        secret: 'Whoah whoa whoa TODO changeme'
    })
}));

app.engine('twig', swig.renderFile);
app.set('view engine', 'twig');
app.set('views', __dirname + '/views');
app.set('view cache', true);

app.use('/public', express.static('public'));

app.get('/logout', function (request, response) {
    request.session.destroy();
    return response.redirect('/');
});

app.post('/', function (request, response) {
    if (typeof request.session.userId == 'undefined') {
        var
            login = request.body.login,
            password = request.body.password;

        if ((typeof login == 'undefined') || (typeof password == 'undefined')) {
            response.render('layout/auth.html.twig', {error: 'wrong login or password'});
            return;
        }

        var authResult = app.docker_blah.authManager.auth(login, password);

        if ((authResult === null) || (authResult <= 0)) {
            return response.render('layout/auth.html.twig', {error: 'wrong login or password'});
        } else {
            request.session.userId = authResult;
        }
    }

    return response.redirect('/');
});

app.use(function (request, response, next) {
    if (typeof request.session.userId == 'undefined') {
        response.render('layout/auth.html.twig');
    } else {
        var user = app.docker_blah.userManager.getById(request.session.userId);

        if (user === null) {
            request.session.reset();
            return response.redirect('/');
        } else {
            request.docker_blah.user = user;
        }
        next();
    }
});


// app.get('/', function (req, res) {
//     var Docker = require('dockerode');
//     var docker2 = new Docker({
//         host: '192.168.99.100',
//         protocol: 'https',
//         ca: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/ca.pem'),
//         cert: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/cert.pem'),
//         key: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/key.pem'),
//         port: 2376
//     });
//
//
//     var dd = [];
//
//
//     docker2.listImages(function (err, images) {
//         images.forEach(function (imageInfo) {
//             dd.push(imageInfo);
//             // console.log(imageInfo);
//         });
//
//         // res.render('partials/auth.html.twig', { ii: dd });
//         res.render('index.html.twig');
//     });
// });

(function readControllers(dir) {
    fs.readdirSync(dir).forEach(function (file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            readControllers(file)
        } else {
            route = require(file);
            route.controller(app);
        }
    });
})(__dirname + '/controllers');

var sqlite3 = require('sqlite3').verbose();
var file = './data/docker-blah.db';
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

db.serialize(function () {
    if (!exists) {
        db.exec(fs.readFileSync('./config/docker-blah.sql').toString());
    }
});

app.docker_blah.authManager = new (require('./models/authManager.js'))(app, db);

var ProjectManager = require('./models/projectManager.js');
app.docker_blah.projectManager = new ProjectManager(app, db, function() {
    var NodeManager = require('./models/nodeManager.js');
    app.docker_blah.nodeManager = new NodeManager(app, db, function() {
        var UserManager = require('./models/userManager.js');
        app.docker_blah.userManager = new UserManager(app, db, function() {
            app.listen(3000, function () {
                console.log('listening');
            });
        });
    });
});
