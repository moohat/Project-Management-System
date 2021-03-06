var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var flash = require('connect-flash');
const fileUpload = require('express-fileupload');

//Model setup
const { Pool } = require("pg");


//todo: local host
// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "dbpms",
//   password: "admin",
//   port: 5432
// });
const pool = new Pool({
  user: "gfghipmqiznxba",
  host: "ec2-174-129-255-91.compute-1.amazonaws.com",
  database: "dadpjq4k75qfss",
  password: "2b55f9187f49449c919a2d4c8f878896a727977bd4fe579d809eadfc7cc1b2ed",
  port: 5432
});
console.log("Successful connection to the database");

//todo initialize router
var indexRouter = require('./routes/index')(pool);
var projectRouter = require('./routes/project')(pool);
var profileRouter = require('./routes/profile')(pool);
var usersRouter = require('./routes/users')(pool);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// SESSION USE
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
  })
);
// FLASH USE
app.use(flash());
// FILE-UPLOAD USE
app.use(fileUpload());


//todo: call the router
app.use('/', indexRouter);
app.use('/projects', projectRouter);
app.use('/profile', profileRouter);
app.use('/users', usersRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
