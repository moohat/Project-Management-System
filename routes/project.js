var express = require('express');
var router = express.Router();
const path = require('path');
var moment = require('moment');

const helpers = require("../helpers/util")


module.exports = function (pool) {


    //todo: function get pagination only
    // router.get("/", (req, res, next) => {
    //     const page = req.query.page || 1;
    //     const limit = 5;
    //     const offset = (page - 1) * limit;
    //     pool.query(`SELECT COUNT(*) AS total FROM projects  `, (err, response) => {
    //         if (err) return res.send(err);
    //         const pages = Math.ceil(response.rows[0].total / limit);


    //         sql = `SELECT * FROM projects LIMIT ${limit} OFFSET ${offset}`;
    //         pool.query(sql, (err, response) => {
    //             if (err) return res.send(err);
    //             res.render('projects/listProject', {
    //                 data: response.rows,
    //                 page,
    //                 query: req.query,
    //                 pages


    //             });
    //         });
    //     });
    // });

    router.get("/", (req, res, next) => {

        // filter mode
        let params = [];
        if (req.query.check_id && req.query.id) {
            params.push(`projectid = '${req.query.id}' `)

        }
        if (req.query.check_name && req.query.name) {
            params.push(`name ILIKE '%${req.query.name}%' `)

        }


        //Pagination
        const page = req.query.page || 1;

        let url = req.url == '/' ? '/?page=1' : req.url;
        const limit = 5;
        const offset = (page - 1) * limit;
        let sql = `SELECT COUNT(*) AS total FROM projects  `;
        //check params filter

        if (params.length > 0) {
            sql += `WHERE ${params.join(' AND ')}`
        }

        pool.query(sql, (err, response) => {
            if (err) return res.send(err);
            const pages = Math.ceil(response.rows[0].total / limit);
            console.log('HALAMAN', response.rows);
            sql = `SELECT * FROM projects `;

            //check params filter
            if (params.length > 0) {
                sql += `WHERE ${params.join(' AND ')}`
            }
            sql += ` LIMIT ${limit} OFFSET ${offset}`;
            console.log(sql);

            pool.query(sql, (err, response) => {
                if (err) return res.send(err);
                res.render('projects/listProject', {
                    data: response.rows,
                    query: req.query,
                    pages,
                    page,
                    url


                });
            });
        });
    });


    router.post('/', (req, res) => {
        let sql = `UPDATE users SET projectsoptions = '${JSON.stringify(req.body)}' WHERE userid = ${req.session.user.userid}`
        pool.query(sql, (err) => {
            if (err) {
                return res.send(err)
            };
            res.redirect('/projects', {
                // user: req.session.user

            })
        });
    });

    //GET FORM ADD
    router.get('/add', (req, res, next) => {
        let sql = `SELECT userid, firstname || ' ' || lastname AS fullname FROM users`;
        pool.query(sql, (err, result) => {
            if (err) {
                return res.send(err)
            };
            res.render('projects/addProject', {
                // title: 'Add Project',
                path: 'projects',
                users: result.rows,
                user: req.session.user
            });
            console.log(sql);

        });
    });


    //ADD PROJECT
    router.post('/add',helpers.isLoggedIn, (req, res, next) => {
        let sqlAddName = `INSERT INTO projects(name, author) VALUES('${req.body.projectname}', '${req.session.user.userid}')`;
        pool.query(sqlAddName, (err, result) => {
            let sqlAddNext = `SELECT MAX(projectid) total FROM projects`;
            pool.query(sqlAddNext, (err, result) => {
                if (err) throw err;
                let params = [];
                const projectid = result.rows[0].total;
                if (typeof req.body.members == 'string') {
                    params.push(`(${req.body.members}, ${projectid})`);
                } else {
                    for (let i = 0; i < req.body.members.length; i++) {
                        params.push(`(${req.body.members[i]}, ${projectid})`);
                    }
                }
                let sqlAddMembers = `INSERT INTO members(userid, projectid) VALUES ${params.join(', ')}`;
                pool.query(sqlAddMembers, (err) => {
                    if (err) {
                        return res.send(err)
                    };
                    res.redirect('/projects')
                });
            });
        });
    });

    router.get("/edit/:id", (req, res) => {

    });

    //OVERVIEW PROJECT
    router.get("/overview/:projectid", (req, res, next) => {
        let projectid = req.params.projectid;
        let sql1 = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
        let sql2 = `SELECT * FROM issues WHERE projectid = ${projectid}`;

        pool.query(sql1, (err, data) => {
            pool.query(sql2, (err, issues) => {
                //bug counter
                let bugOpen = 0;
                let bugTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "Bug" && item.status != "Closed") {
                        bugOpen += 1;
                    }
                    if (item.tracker == "Bug") {
                        bugTotal += 1;
                    }
                });
                //featur Counter
                let featureOpen = 0;
                let featureTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "Feature" && item.status != "Closed") {
                        featureOpen += 1;
                    }
                    if (item.tracker == "Feature") {
                        featureTotal += 1;
                    }
                });

                //support counter
                let supportOpen = 0;
                let supportTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "Support" && item.status != "Closed") {
                        supportOpen += 1;
                    }
                    if (item.tracker == "Support") {
                        supportTotal += 1;
                    }
                });

                res.render("projects/overview/listOverview", {
                    data: data.rows,
                    issues: issues.rows,
                    //todo: issue tracking
                    bugOpen,
                    bugTotal,
                    featureOpen,
                    featureTotal,
                    supportOpen,
                    supportTotal,
                    // isadmin: req.session.user.isadmin;
                });
            });
        });
    });



    // router.get("/members/:projectid", (req, res, next) =>{
    // router.get("/overview/", (req, res, next) => {
    //     res.render("projects/overview/listOverview");
    // });

    router.get("/activity/:projectid", (req, res, next) => {
        let projectid = req.params.projectid;
        let sql1 = `SELECT * FROM projects WHERE projectid = ${projectid} ORDER BY projectid DESC`;
        let sql2 = `SELECT * ,(SELECT CONCAT(firstname, ' ', lastname) AS author FROM users WHERE projectid = ${projectid}) FROM activity WHERE projectid = ${projectid} ORDER BY activityid DESC`;
        // let sql2 = `SELECT * FROM activity WHERE `
        console.log(sql2);

        pool.query(sql1, (err, data) => {
            // console.log(data);

            if (err) {
                return res.send(err)
            };
            pool.query(sql2, (err, issues) => {
                if (err) {
                    return res.send(err)
                };
                // console.log(sql2);
                res.render("projects/overview/activity/listActivity", {
                    data: data.rows,
                    issues: issues.rows,
                });
            });
        });

    });



    // router.get("/members/:projectid", (req, res, next) =>{
    router.get("/members/:projectid", (req, res, next) => {
        let projectid = req.params.projectid;
        let sql = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
        pool.query(sql, (err, data) => {
            res.render("projects/overview/members/listMember", {
                data: data.rows,

            });

        });
    });

    //add members
    router.get("/members/:projectid/add", (req, res, next) => {
        let projectid = req.params.projectid;
        res.locals.title = "Project Details | Members";
        let sql = `SELECT userid, email, CONCAT(firstname, ' ',lastname) AS fullname FROM users WHERE userid NOT IN (SELECT userid FROM members WHERE projectid =${projectid} )`;

        pool.query(sql, (err, data) => {
            if (data.rows.length > 0) {
                res.render("projects/overview/members/addMember", {
                    data: data.rows,
                    projectid: req.params.projectid,
                });
            } else {
                res.send(err);
                res.redirect(`/projects/members/${projectid}`);
            }

            console.log(data.rows.length);

        });
    });

    router.post("/members/:projectid/add", (req, res, next) => {
        let projectid = req.params.projectid;
        let data = [
            req.body.userid,
            req.body.position,
        ]
        sql = `INSERT INTO members(userid, role, projectid) VALUES($1, $2, ${projectid})`;
        pool.query(sql, data, (err, data) => {
            res.redirect(`/projects/members/${projectid}`);
        });
    });

    router.get("/members/:projectid/:userid/edit", (req, res, next) => {
        let userid = req.params.userid;
        res.locals.title = "Members | Edit Member";
        let sql = `SELECT * FROM users WHERE userid = ${userid}`;
        pool.query(sql, (err, data) => {
            res.render("projects/overview/members/editMember", {
                data: data.rows[0],
                projectid: req.params.projectid,
            });

        });

    });

    router.post("/members/:projectid/:userid/edit", (req, res, next) => {
        console.log(req.params);
        let userid = req.params.userid;
        let projectid = req.params.projectid;
        sql = `UPDATE members SET role = '${req.body.position}' WHERE userid = ${userid} AND projectid = ${projectid}`;
        pool.query(sql, (err, data) => {
            console.log(sql);
            res.redirect(`/projects/members/${projectid}`);

        });

    });

    router.get("/members/:projectid/:userid/delete", (req, res, next) => {
        console.log(req.params);
        let userid = req.params.userid;
        let projectid = req.params.projectid;
        sql = `DELETE FROM members WHERE userid = ${userid}`;
        console.log(sql);

        pool.query(sql, (err, data) => {
            console.log(sql);
            res.redirect(`/projects/members/${projectid}`);

        });

    });



    // ISSUES
    // ISSUES LIST
    router.get("/issues/:projectid", (req, res, next) => {
        res.locals.title = "Project Details | Issues";
        let sql1 = `SELECT * FROM projects WHERE projectid = ${req.params.projectid}`;
        let sql2 = `SELECT * FROM issues WHERE projectid = ${req.params.projectid} ORDER BY issueid DESC`;
        pool.query(sql1, (err, data) => {
            pool.query(sql2, (err, issues) => {
                // console.log(sql2);
                res.render("projects/overview/issues/listIssues", {
                    data: data.rows,
                    issues: issues.rows,
                    moment,
                    //   isadmin: req.session.user.isadmin
                });
            });
        });
    });

    //issue list add
    router.get("/issues/:projectid/add", (req, res, next) => {
        // res.locals.title = "Porject | Add Issues";
        let projectid = req.params.projectid;
        let sql = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
        console.log(sql);

        pool.query(sql, (err, data) => {
            res.render("projects/overview/issues/addIssues", {
                data: data.rows,
                moment,
                projectid: req.params.projectid,
            });
        })

    });

    router.post("/issues/:projectid/add", (req, res, next) => {
        console.log(req.files.sampleFile);

        let activityIssue = `INSERT INTO activity(time, title, description,projectid, author) VALUES(NOW(), '${req.body.subject}', 'New Issue Created : Tracker : [${req.body.tracker}] Subject : ${req.body.subject} - (${req.body.status}) - Done: ${req.body.done}', ${req.params.projectid},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}))`;

        pool.query(activityIssue, err => {
            if (!req.files || Object.keys(req.files).length === 0) {
                let sql2 = `INSERT INTO issues(projectid,tracker,subject,description,status,priority,assignee,author,startdate,duedate,estimatedtime,done,files,spenttime,targetversion,createddate)
            VALUES(${req.params.projectid},'${req.body.tracker}','${req.body.subject}','${req.body.description}','${req.body.status}','${req.body.priority}',${req.body.assignee},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}),'${req.body.startdate}','${req.body.duedate}','${req.body.estimatedtime}',${req.body.done},null,'0','${req.body.targetversion}',NOW())`;
                if (err) {
                    res.send(err)
                }
                pool.query(sql2, err => {
                    res.redirect(`/projects/issues/${req.params.projectid}`);
                });
            } else {
                let sampleFile = req.files.sampleFile;
                let nameFile = sampleFile.name.replace(/ /g, "_");
                nameFile = Date.now() + "_" + nameFile;

                let sql2 = `INSERT INTO issues(projectid,tracker,subject,description,status,priority,assignee,author,startdate,duedate,estimatedtime,done,files,spenttime,targetversion,createddate)
                    VALUES(${req.params.projectid},'${req.body.tracker}','${req.body.subject}','${req.body.description}','${req.body.status}','${req.body.priority}',${req.body.assignee},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}),'${req.body.startdate}','${req.body.duedate}','${req.body.estimatedtime}',${req.body.done},'${nameFile}','0','${req.body.targetversion}',NOW())`;

                pool.query(sql2, err => {
                    console.log("with file", sql2);
                    sampleFile.mv(
                        path.join(__dirname, `../public/images/{nameFile}`),
                        function (err) {
                            if (err) {
                                return res.status(500).send(err);
                            }
                            res.redirect(`/projects/issues/${req.params.projectid}`)
                        }
                    );

                });
            }
        });

    });

    router.post("/issues/:projectid/add",(req, res, next) =>{
        
    });



    //ISSUES LIST - EDIT ISSUES
    router.get("/issues/:projectid/:issueid/edit", (req, res, next) =>{
        let sql1 = `SELECT * FROM issues WHERE issueid = ${req.params.issueid}`;
        let sql2 = `SELECT userid, email, CONCAT(firstname, ' ', lastname) AS fullname FROM users HWERE userid IN (SELECT userid FROM members WHERE projectid = ${req.params.projectid})`;

        pool.query(sql1, (err, data) =>{
            pool.query(sql2, (err, users) =>{
                res.render("project/overview/issues/editIssues", {
                    data: data.rows[0],
                    users: users.rows,
                    moment,  

                });
            });
        });
    });

     // ISSUES LIST - EDIT ISSUES & ADD ACTIVITY - APPLY
  router.post(
    "/issues/:projectid/:issueid/edit-save",
    helpers.isLoggedIn,
    (req, res, next) => {
      let sql1 = `UPDATE issues SET tracker = '${
        req.body.tracker
      }', subject = '${req.body.subject}',
    description = '${req.body.description}', status = '${
        req.body.status
      }', priority = '${req.body.priority}',
    assignee = ${req.body.assignee}, startdate = '${
        req.body.startdate
      }', duedate = '${req.body.duedate}',
    estimatedtime = '${req.body.estimatedtime}',done = ${
        req.body.done
      }, files = '${req.body.file}', spenttime = ${
        req.body.spenttime
      }, targetversion = '${req.body.targetversion}', updateddate = NOW() ${
        req.body.status == "Closed" ? `, closeddate = NOW()` : ""
      }  WHERE projectid = ${req.params.projectid} AND issueid = ${
        req.params.issueid
      }`;

      let sql2 = `INSERT INTO activity(time,title,description,projectid,author)
    VALUES(NOW(),'${req.body.subject}','${
        req.body.status == "Closed" ? `Issue was closed : ` : ``
      }Issue ID : #${req.params.issueid} : [${req.body.tracker}] Subject : ${
        req.body.subject
      } - (${req.body.status}) - 
    Done: ${req.body.done}%.',${
        req.params.projectid
      },(SELECT author FROM projects WHERE projectid = ${
        req.params.projectid
      }));`;
      console.log(sql1);
      db.query(sql1, err => {
        db.query(sql2, err => {
          res.redirect(`/projects/issues/${req.params.projectid}`);
        });
      });
    }
  );

  // ISSUES LIST - DELETE ISSUES
  router.get("/issues/:projectid/:issueid/delete", (req, res, nect) => {
    res.locals.title = "Project | Edit Issues";

    let sql1 = `SELECT * FROM issues WHERE issueid = ${req.params.issueid}`;
    db.query(sql1, (err, data) => {
      let sql2 = `INSERT INTO activity(time,title,description,projectid,author)
                  VALUES(NOW(),'${data.rows[0].subject}','Issue was deleted by userid : ${req.session.user.userid}, 
                  (${req.session.user.firstname} ${req.session.user.lastname}) : [${data.rows[0].tracker}] 
                  Subject : ${data.rows[0].subject} - (${data.rows[0].status}) - Done: ${data.rows[0].done}%.',
                  ${req.params.projectid},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}))`;

      db.query(sql2, err => {
        let sql3 = `DELETE FROM issues WHERE issueid = ${req.params.issueid} AND projectid = ${req.params.projectid} `;
        db.query(sql3, err => {
          res.redirect(`/projects/issues/${req.params.projectid}`);
        });
      });
    });
  });

    return router;
};