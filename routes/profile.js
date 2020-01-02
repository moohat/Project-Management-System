var express = require('express');
var router = express.Router();

const helpers = require("../helpers/util")


module.exports = function (pool){
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('profile/viewProfile',{
        //  user: req.session.user
    });
  });

//   router.get('/',helpers.isLoggedIn, function(req, res, next) {
//     res.render('profile/viewProfile');
//   });

  return router;
};