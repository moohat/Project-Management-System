var express = require('express');
var router = express.Router();

const helpers = require("../helpers/util")


module.exports = function (pool){
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('users/listUser');
  });

  /* GET add user page. */
router.get('/add', function(req, res, next) {
  res.render('users/addUser');
});

  /* GET add user page. */
  router.get('/edit', function(req, res, next) {
    res.render('users/editUser');
  });
//   router.get('/',helpers.isLoggedIn, function(req, res, next) {
//     res.render('profile/viewProfile');
//   });

  return router;
};