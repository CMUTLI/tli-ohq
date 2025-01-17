var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var serveIndex = require('serve-index');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var helmet = require('helmet');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var dbSessionStore = require('connect-session-knex')(session);
var auth = require('./auth');
var db = require('./db');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var sessionMiddleware = session({
  name: 'session_id',
  secret: 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 10  // 10 hours
  },
  store: new dbSessionStore({
    knex: db,
    tablename: 'sessions'
  })
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
} else {
  app.use(logger('combined'));
  app.set('trust proxy', true);
}
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(auth.passport.initialize());
app.use(auth.passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// socket.io middleware checks session auth status
io.use(function(socket, next) {
  sessionMiddleware(socket.request, {}, next);
});
io.use(function(socket, next) {
  auth.passport.initialize()(socket.request, {}, next);
});
io.use(function(socket, next) {
  auth.passport.session()(socket.request, {}, next);
});

// hook up routes
app.use('/', express.static('./static/'));
app.use('/api/login', require('./components/login').routes);
app.use('/api/user', require('./components/user').routes );
app.use('/api/stats/timespent', require('./components/stats/timespent').routes);
app.use('/api/course/', require('./components/course').routes)
app.use('/api/role', require('./components/role').routes)

// hook up socket handlers
require('./components/queue').io.queue(io.of('/queue'));
require('./components/queue').io.history(io.of('/history'));
require('./components/queue').io.waittime(io.of('/waittime'));
require('./components/user').io(io.of('/user'));
require('./components/stats/counts').io(io.of('/stats/counts'));

// super-secret stats
app.use('/analytics', auth.isAdmin);
app.use('/analytics', express.static(path.join(__dirname, '../analytics')));
app.use('/analytics', serveIndex(path.join(__dirname, '../analytics')));

// custom error handlers (404, 500, ...) should go here when they're ready

// handle json schema validation failures
app.use(function(err, req, res, next) {
  if (err.name === 'JsonSchemaValidation') {
    res.status(400);
    var responseData = {
      errors: err.validations
    };
    res.send(responseData);
  } else {
    next(err);
  }
});

module.exports = { app: app, server: server };
