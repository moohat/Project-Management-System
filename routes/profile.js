var express = require('express');
var router = express.Router();

const helpers = require("../helpers/util")
let nav = 2;

module.exports = function (pool){
/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.session);
  // req.session.user = data.rows[0];
  sql = `SELECT * FROM users WHERE email = '${req.session.user.email}'`;
  pool.query(sql, (err, profile) =>{

    res.render('profile/viewProfile',{
      nav,
        profile: profile.rows[0],
         user: req.session.user,
    });
  });  
  });

  //update profile
  router.post("/", (req, res, next) =>{
    let sql = `UPDATE users SET firstname = '${req.body.firstname}', lastname = '${req.body.lastname}', password = '${req.body.password}', position = '${req.body.position}', jobtype = '${req.body.jobtype}' WHERE email ='${req.session.user.email}'`;

    console.log(sql);
    
    pool.query(sql, (err, data) =>{
      res.redirect("/projects");
    });
  });

//   router.get('/',helpers.isLoggedIn, function(req, res, next) {
//     res.render('profile/viewProfile');
//   });

  return router;
};