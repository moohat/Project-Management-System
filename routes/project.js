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

    //todo: pagination and filter
    // router.get("/", (req, res, next) => {

    //     userid = req.params.userid;

    //     // filter mode
    //     let params = [];
    //     if (req.query.check_id && req.query.id) {
    //         params.push(`projectid = '${req.query.id}' `)

    //     }
    //     if (req.query.check_name && req.query.name) {
    //         params.push(`name ILIKE '%${req.query.name}%' `)
    //     }
    //     //Pagination
    //     const page = req.query.page || 1;
    //     let url = req.url == '/' ? '/?page=1' : req.url;
    //     const limit = 5;
    //     const offset = (page - 1) * limit;
    //     let sql = `SELECT COUNT(*) AS total FROM projects  `;
    //     //check params filter
    //     if (params.length > 0) {
    //         sql += `WHERE ${params.join(' AND ')}`
    //     }
    //     pool.query(sql, (err, response) => {
    //         if (err) return res.send(err);
    //         const pages = Math.ceil(response.rows[0].total / limit);
    //         console.log('HALAMAN', response.rows);
    //         sql = `SELECT * FROM projects `;

    //         //check params filter
    //         if (params.length > 0) {
    //             sql += `WHERE ${params.join(' AND ')}`
    //         }
    //         sql += ` LIMIT ${limit} OFFSET ${offset}`;
    //         console.log(sql);

    //         pool.query(sql, (err, response) => {
    //             let tableOption = `SELECT projectopt FROM users WHERE userid = ${userid}`;

    //             if (err) return res.send(err);
    //             res.render('projects/listProject', {
    //                 data: response.rows,
    //                 query: req.query,
    //                 pages,
    //                 page,
    //                 url


    //             });
    //         });
    //     });
    // });


    // ---------------------------- function filter ----------------------------
    // ============================= Router Home Redirect Project =============================
    router.get('/', helpers.isLoggedIn, function (req, res, next) {

        let pathside = "projects";


        const { ckid, id, ckname, name, ckmember, member } = req.query;
        const url = (req.url == '/') ? `/?page=1` : req.url
        const page = req.query.page || 1;
        const limit = 3;
        const offset = (page - 1) * limit
        let params = [];

        console.log(req.query);


        if (ckid && id) {
            params.push(`projects.projectid = ${id}`);
        }
        if (ckname && name) {
            params.push(`projects.name ILIKE '%${name}%'`)
        }
        if (ckmember && member) {
            params.push(`members.userid = ${member}`)
        }
        // console.log(member);

        let sql = `SELECT COUNT(id) as total FROM (SELECT DISTINCT projects.projectid AS id FROM projects LEFT JOIN members ON projects.projectid = members.projectid`;


        if (params.length > 0) {
            sql += ` WHERE ${params.join(" AND ")}`
        }
        sql += `) AS projectmember`;
        // console.log(params);
        console.log(sql);


        pool.query(sql, (err, count) => {
            // console.log(count.rows[0]);

            const total = count.rows[0].total;
            const pages = Math.ceil(total / limit)

            sql = `SELECT DISTINCT projects.projectid, projects.name FROM projects LEFT JOIN members ON projects.projectid = members.projectid`


            if (params.length > 0) {
                sql += ` WHERE ${params.join(" AND ")}`
            }
            sql += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`
            let subquery = `SELECT DISTINCT projects.projectid FROM projects LEFT JOIN members ON projects.projectid = members.projectid`
            if (params.length > 0) {
                subquery += ` WHERE ${params.join(" AND ")}`
            }
            subquery += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`
            let sqlMembers = `SELECT projects.projectid, users.userid, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects LEFT JOIN members ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE projects.projectid IN (${subquery})`

            console.log(sql);

            pool.query(sql, (err, projectData) => {
                // console.log(projectData);

                if (err) throw err;
                // console.log();

                pool.query(sqlMembers, (err, memberData) => {

                    projectData.rows.map(project => {
                        project.members = memberData.rows.filter(member => { return member.projectid == project.projectid }).map(data => data.fullname)
                    })
                    let sqlusers = `SELECT * FROM users`;
                    let sqloption = `SELECT projectopt  FROM users  WHERE userid =${req.session.user.userid}`;
                    console.log(sqloption);

                    pool.query(sqlusers, (err, data) => {
                        // console.log('this data users >', data.rows);

                        pool.query(sqloption, (err, options) => {
                            // console.log(err, options.rows);

                            res.render('projects/listProject', {
                                data: projectData.rows,
                                query: req.query,
                                users: data.rows,
                                page: page,
                                pages: pages,
                                url: url,
                                path, pathside,
                                option: options.rows[0].projectopt,
                                isAdmin: req.session.user
                            })
                        })
                    })
                })
            })
        })
    });
    //------------------------------------------------------------------------------------ 


    //------------------------------------------------------------------------------------ 
    router.post('/update', (req, res) => {

        console.log("====================Router Post options================");
        console.log("==");
        console.log("==");
        console.log("==");

        let sql = `UPDATE users SET projectopt = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
        console.log(sql);
        console.log(req.session.user);

        pool.query(sql, (err) => {
            if (err) throw err;

            res.redirect('/projects');
        })

    })



    //GET FORM ADD
    //=============Router POST ADD===========\\
    router.get('/add', helpers.isLoggedIn, (req, res) => {

        let sql = `select * from users`;
        pool.query(sql, (err, row) => {
            console.log(sql);
            if (err) throw err;
            res.render('projects/addProject', { data: row.rows, isAdmin: req.session.user, path, dataNull: req.flash('dataNull') })
        });
    });

     /* POST ADD PROJECT */
  router.post('/add', function (req, res, next) {
  

    const { name, member } = req.body;
    console.log(name);
    console.log(req.body);
    console.log(member);

    if (name && member) {
      ceklist = true

      const insertId = `INSERT INTO projects (name) VALUES ('${name}')`
      pool.query(insertId, (err, dbProjects) => {
        let selectidMax = `SELECT MAX (projectid) FROM projects`
        pool.query(selectidMax, (err, dataMax) => {
          console.log("Data Max VVVVV");
          let insertidMax = dataMax.rows[0].max
          console.log(insertidMax);
          let insertMember = 'INSERT INTO members (userid, role, projectid) VALUES '
          if (typeof member == 'string') {
            insertMember += `(${member}, ${insertidMax});`
          } else {

            let members = member.map(item => {
              return `(${item}, ${insertidMax})`
            }).join(',')

            insertMember += `${members};`
          }

          console.log(insertMember);
          pool.query(insertMember, (err, dataSelect) => {
            // const lastID = dataSelect.rows
            console.log(dataSelect);
          })

        })

      })
      console.log("Success");
      console.log(insertId);
      req.flash('addProjectSuccess', 'Well Done! add project success')
      res.redirect('/projects');


    } else {

      console.log("data kosong");
      req.flash('dataNull', 'Please Select Member ')
      res.redirect('/projects/add');

    }

    // })
    console.log("");
    console.log("WORK ROUTER PROJECTS");
    console.log("=======================END POST ADD===========================");
    // res.redirect('/projects/add');

  })


    //=============Router GET Edit============\\
    router.get('/edit/:projectid', helpers.isLoggedIn, (req, res) => {
        console.log('=====================Router Edit Get=============================');
        console.log("==");
        console.log("==");
        console.log("==");

        let edit = parseInt(req.params.id);
        let sql = `SELECT members.userid, projects.name, projects.projectid FROM members LEFT JOIN projects ON projects.projectid = members.projectid WHERE projects.projectid = ${req.params.projectid}`;
        console.log(sql);
        pool.query(sql, (err, data) => {
            pool.query(`SELECT * FROM users`, (err, user) => {
                if (err) throw err;
                console.log('suksess edit');
                res.render('projects/editProject', {
                    name: data.rows[0].name,
                    projectid: data.rows[0].projectid,
                    members: data.rows.map(item => item.userid),
                    users: user.rows,
                    path,
                    isAdmin: req.session.user
                })

            })

        })
    })

    //=========Router POST Edit===========\\
    router.post('/edit/:projectid', (req, res) => {
        // let id = parseInt(req.params.id);
        console.log('=====================Router Edit POST=============================');
        console.log("==");
        console.log("==");
        console.log("==");

        const { name, member } = req.body;
        let id = req.params.projectid;

        let sql = `UPDATE projects SET name= '${req.body.name}' WHERE projectid=${req.params.projectid}`;
        console.log(sql);

        pool.query(sql, (err, row) => {
            if (err) throw err;
            pool.query(`DELETE FROM members WHERE projectid = ${req.params.projectid}`, (err) => {
                let temp = []
                if (typeof req.body.member == 'string') {
                    temp.push(`(${req.body.member}, ${id})`)
                } else {
                    for (let i = 0; i < member.length; i++) {
                        temp.push(`(${member[i]}, ${id})`)
                    }
                }

                console.log('Done Update');
                let input = `INSERT INTO members (userid, role,  projectid)VALUES ${temp.join(",")}`;
                pool.query(input, (err) => {
                    res.redirect('/projects')
                })
            })
        });
    });


    //DELETE PROJECT
    router.get("/delete/:projectid", helpers.isLoggedIn, (req, res, next) => {
        // console.log(req.params);
        let projectid = req.params.projectid;
        console.log(projectid);

        let sqlDeleteProject = `DELETE FROM members WHERE projectid = ${projectid};
        DELETE FROM issues WHERE projectid = ${projectid};
        DELETE FROM projects WHERE projectid = ${projectid}`;
        console.log(sqlDeleteProject);

        pool.query(sqlDeleteProject, (err, data) => {
            // console.log(sqlDeleteProject);
            res.redirect(`/projects`);

        });
    })

    //OVERVIEW PROJECT
    router.get("/overview/:projectid", helpers.isLoggedIn, (req, res, next) => {
        let projectid = req.params.projectid;
        let sql1 = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
        let sql2 = `SELECT * FROM issues WHERE projectid = ${projectid}`;
        console.log(sql1);


        pool.query(sql1, (err, data) => {
            pool.query(sql2, (err, issues) => {
                //bug counter
                let bugOpen = 0;
                let bugTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "bug" && item.status != "closed") {
                        bugOpen += 1;
                    }
                    if (item.tracker == "bug") {
                        bugTotal += 1;
                    }
                });
                //featur Counter
                let featureOpen = 0;
                let featureTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "feature" && item.status != "closed") {
                        featureOpen += 1;
                    }
                    if (item.tracker == "feature") {
                        featureTotal += 1;
                    }
                });

                //support counter
                let supportOpen = 0;
                let supportTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "support" && item.status != "closed") {
                        supportOpen += 1;
                    }
                    if (item.tracker == "support") {
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
                    isadmin: req.session.user,
                    projectid: req.params.projectid,

                });
            });
        });
    });



    // router.get("/members/:projectid", (req, res, next) =>{
    // router.get("/overview/", (req, res, next) => {
    //     res.render("projects/overview/listOverview");
    // });

    router.get("/activity/:projectid", helpers.isLoggedIn, (req, res, next) => {
        let projectid = req.params.projectid;

        let sqlProject = `SELECT * FROM projects WHERE projectid = ${projectid} ORDER BY projectid DESC`;
        let sql2 = `SELECT * ,(SELECT CONCAT(firstname, ' ', lastname) AS author FROM users WHERE userid = activity.author AND projectid = ${projectid}) FROM activity WHERE projectid = ${projectid} ORDER BY activityid DESC`;

        // let sql2 = `SELECT * FROM activity WHERE `
        console.log(sql2);

        pool.query(sqlProject, (err, data) => {
            // console.log(data);

            // if (err) {
            //     return res.send(err)
            // };
            pool.query(sql2, (err, issues) => {
                // if (err) {
                //     return res.send(err)
                // };
                // console.log(sql2);
                res.render("projects/overview/activity/listActivity", {
                    data: data.rows,
                    issues: issues.rows,
                    moment,
                    projectid: req.params.projectid,

                });
            });
        });

    });



    // // router.get("/members/:projectid", (req, res, next) =>{
    // router.get("/members/:projectid", helpers.isLoggedIn, (req, res, next) => {
    //     let projectid = req.params.projectid;
    //     const page = req.query.page || 1;
    //     let url = req.url == '/' ? '/?page=1' : req.url;
    //     const limit = 1;
    //     const offset = (page - 1) * limit;
    //     let sqlMember = `SELECT COUNT(*) AS total FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid `;
    //     pool.query(sqlMember, (err, response) => {
    //         if (err) return res.send(err);
    //         const pages = Math.ceil(response.rows[0].total / limit);
    //         let sql = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid LIMIT ${limit} OFFSET ${offset}`;
    //         pool.query(sql, (err, data) => {
    //             res.render("projects/overview/members/listMember", {
    //                 url,
    //                 page,
    //                 pages,
    //                 data: data.rows,
    //                 query: req.query,

    //             });

    //         });
    //     })
    //     // let sql = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
    // });

     //==================================START Get MEMBER======================================================\\

  //==================================Router Get MEMBER======================================================\\
  router.get('/members/:projectid', helpers.isLoggedIn, (req, res) => {
    let path = "members"
    console.log("=================Router Get Overview Members============");
    console.log("==");
    console.log("==");
    console.log("==");


    const { ckid, memberid, ckname, name, ckposition, position } = req.query;
    let temp = []
    const pathside = "member";
    console.log(req.url)
    const url = (req.url == `/members/${req.params.projectid}`) ? `/members/${req.params.projectid}/?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 3;
    let offset = (page - 1) * limit;

    if (ckid && memberid) {
      temp.push(`members.id = ${memberid}`)
    }

    if (ckname && name) {
      temp.push(`CONCAT (users.firstname,' ',users.lastname) ILIKE'%${name}%'`)
    }

    if (ckposition && position) {
      temp.push(`members.role = '${position}'`)
    }
    let sql = `SELECT count(*) as total FROM members WHERE members.projectid = ${req.params.projectid}`;
    // if (temp.length > 0) {
    //   sql += ` WHERE ${temp.join(" AND ")}`
    // }
    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)
      let sqlmember = `SELECT projects.projectid, members.id, members.role, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE members.projectid = ${req.params.projectid}`;
      if (temp.length > 0) {
        sqlmember += ` AND ${temp.join(" AND ")}`
      }
      sqlmember += ` ORDER BY members.id LIMIT ${limit} OFFSET ${offset}`


      console.log('this sql member>', sqlmember);

      let sqloption = `SELECT memberopt  FROM users  WHERE userid = ${req.session.user.userid}`;
      console.log(sqloption);

      pool.query(sqlmember, (err, data) => {
        pool.query(sqloption, (err, option) => {
          res.render('projects/overview/members/listMember', {
            data: data.rows,
            projectid: req.params.projectid,
            page: page,
            pages: pages,
            url: url,
            fullname: data.fullname,
            option: option.rows[0].memberopt,
            pathside, path,
            isAdmin: req.session.user,
            query: req.query
          })
        })
      });
    })
  });

  router.post('/optionmember/:projectid', (req, res) => {
    projectid = req.params.projectid;

    console.log("====================Router Post Members options================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `UPDATE users SET memberopt = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log('this sql members update>', sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect(`/projects/members/${projectid}`);
    })
  })

    //add members
    router.get("/members/:projectid/add",helpers.isLoggedIn, (req, res, next) => {
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

    // router.get("/members/:projectid/:userid/edit",helpers.isLoggedIn, (req, res, next) => {
    //     let userid = req.params.userid;
    //     res.locals.title = "Members | Edit Member";
    //     let sql = `SELECT * FROM users WHERE userid = ${userid}`;
    //     pool.query(sql, (err, data) => {
    //         res.render("projects/overview/members/editMember", {
    //             data: data.rows[0],
    //             projectid: req.params.projectid,
    //         });

    //     });
    // });

    router.get("/members/:projectid/:id/edit",helpers.isLoggedIn, (req, res, next) => {
    console.log("====================Router GET Members Update================");
    console.log("==");
    console.log("==");
    console.log("==");
    const pathside = "member";

    projectid = req.params.projectid;
    id = req.params.id;
    console.log(id);
    


    let sql = `SELECT users.firstname, users.lastname, members.role, id FROM members LEFT JOIN users ON users.userid = members.userid left join projects on projects.projectid =  members.projectid WHERE projects.projectid = ${projectid} AND id = ${id}`
    console.log(sql);
    pool.query(sql, (err, data) => {
      res.render('projects/overview/members/editMember', {
        projectid,
        id: req.params.id,
        data: data.rows[0],
        path,
        pathside,
        projectid: req.params.projectid,
        isAdmin: req.session.user
      })
    })
    });

 

    router.post("/members/:projectid/:id/edit", (req, res, next) => {
        console.log("====================Router POST Members Update================");
     
        projectid = req.params.projectid;
        id = req.params.id;
        const { position } = req.body
    
        let sql = `UPDATE members SET role ='${position}' WHERE id =${id}`
        console.log(sql);
    
        pool.query(sql, (err, data) => {
          if (err) { console.log('Not Found') }
          res.redirect(`/projects/members/${projectid}`)
        });
      });



    router.get("/members/:projectid/:id/delete",helpers.isLoggedIn, (req, res, next) => {
        console.log(req.params);
        let id = req.params.id;
        let projectid = req.params.projectid;
        sql = `DELETE FROM members WHERE id = ${id}`;
        console.log(sql);

        pool.query(sql, (err, data) => {
            console.log(sql);
            res.redirect(`/projects/members/${projectid}`);

        });

    });



    // ISSUES
    // // ISSUES LIST
    // router.get("/issues/:projectid",helpers.isLoggedIn, (req, res, next) => {
    //     res.locals.title = "Project Details | Issues";
    //     let sql1 = `SELECT * FROM projects WHERE projectid = ${req.params.projectid}`;
    //     let sql2 = `SELECT * FROM issues WHERE projectid = ${req.params.projectid} ORDER BY issueid DESC`;
    //     pool.query(sql1, (err, data) => {
    //         pool.query(sql2, (err, issues) => {
    //             // console.log(sql2);
    //             res.render("projects/overview/issues/listIssues", {
    //                 data: data.rows,
    //                 issues: issues.rows,
    //                 moment,
    //                 //   isadmin: req.session.user.isadmin
    //             });
    //         });
    //     });
    // });

  //=========================================START ROUTER ISSUES============================\\
  //=========================================GET ROUTER ISSUES============================\\
  router.get('/issues/:projectid', helpers.isLoggedIn, (req, res) => {
    let path = "issues"
    console.log("=================Router Get  Issues============");
    console.log("==");
    console.log("==");
    console.log("==");


    const { ckid, issueid, cksubject, subject, cktracker, tracker } = req.query;
    let temp = []
    const pathside = "issues";
    console.log(req.url)
    const url = (req.url == `/issues/${req.params.projectid}`) ? `/issues/${req.params.projectid}/?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 3;
    let offset = (page - 1) * limit

    if (ckid && issueid) {
      temp.push(`issues.issueid = ${issueid}`)
    }

    if (cksubject && subject) {
      temp.push(`issues.subject LIKE '%${subject}%'`)
    }

    if (cktracker && tracker) {
      temp.push(`issues.tracker= '${tracker}'`)
    }
    let sql = `SELECT count(*) as total FROM issues WHERE projectid = ${req.params.projectid}`;

    // if (temp.length > 0) {
    //   sql += ` WHERE ${temp.join(" AND ")}`
    // }
    console.log('this sql isse>> ', sql);

    console.log('this temp push', temp.push);

    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)

      let sqlissues = `SELECT * FROM issues WHERE projectid = ${req.params.projectid}`;
      if (temp.length > 0) {
        sqlissues += ` AND ${temp.join(" AND ")}`
      }
      sqlissues += ` ORDER BY issues.issueid LIMIT ${limit} OFFSET ${offset}`


      console.log('this sql issues>', sqlissues);

      let sqloption = `SELECT issueopt  FROM users  WHERE userid = ${req.session.user.userid}`;

      console.log(sqloption);


      pool.query(sqlissues, (err, data) => {
        if (err) { console.log('Not Found') }
        pool.query(sqloption, (err, option) => {
          res.render("projects/overview/issues/listIssues", {
            data: data.rows,
            projectid: req.params.projectid,
            page: page,
            pages: pages,
            url: url,
            fullname: data.fullname,
            options: option.rows[0].issueopt,
            pathside, path,
            isAdmin: req.session.user,
            query: req.query,
            moment
          })
        })
      });
    })
  })
  router.post('/updateIssues/:projectid', (req, res) => {

    console.log("====================Router Post options================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `UPDATE users SET issueopt = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log(sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect(`/projects/issues/${req.params.projectid}`);
    })

  })

    //issue list add
    // router.get("/issues/:projectid/add",helpers.isLoggedIn, (req, res, next) => {
    //     // res.locals.title = "Porject | Add Issues";
    //     let projectid = req.params.projectid;
    //     let sql = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
    //     console.log(sql);

    //     pool.query(sql, (err, data) => {
    //         res.render("projects/overview/issues/addIssues", {
    //             data: data.rows,
    //             moment,
    //             projectid: req.params.projectid,
    //         });
    //     })

    // });

    router.get("/issues/:projectid/add",helpers.isLoggedIn, (req, res) => {
        let path = "issues"
        console.log("=================Router Get ADD Issues============");
        console.log("==");
        console.log("==");
        console.log("==");
    
        const pathside = "issues";
        projectid = req.params.projectid;
    
        let sql = `SELECT projects.projectid, users.userid, users.firstname, users.lastname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON members.userid = users.userid WHERE members.projectid =${projectid} `;
        
        console.log('ini adalah sql project'+sql);
        
    
        pool.query(sql, (err, data) => {
          res.render("projects/overview/issues/addIssues", {
            data: data.rows,
            projectid: req.params.projectid,
            path,
            pathside,
            isAdmin: req.session.user
          });
        });
      });

//       //==============================================================================================================================\\


    router.post("/issues/:projectid/add",(req, res, next) => {
        console.log(req.files.doc);
        let sqlActivityIssue = `INSERT INTO activity(time, title, description,projectid, author) VALUES(NOW(), '${req.body.subject}', 'New Issue Created : Tracker : [${req.body.tracker}] Subject : ${req.body.subject} - (${req.body.status}) - Done: ${req.body.done}', ${req.params.projectid},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}))`;
        console.log(sqlActivityIssue);


        pool.query(sqlActivityIssue, err => {
            if (!req.files || Object.keys(req.files).length === 0) {
                let sqlAddIssue = `INSERT INTO issues(projectid,tracker,subject,description,status,priority,assignee,author,startdate,duedate,estimatedtime,done,files,spenttime,targetversion,createddate)
            VALUES(${req.params.projectid},'${req.body.tracker}','${req.body.subject}','${req.body.description}','${req.body.status}','${req.body.priority}',${req.body.assignee},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}),'${req.body.startdate}','${req.body.duedate}','${req.body.estimatedtime}',${req.body.done},null,'0','${req.body.targetversion}',NOW())`;
                if (err) {
                    res.send(err)
                }
                pool.query(sqlAddIssue, err => {
                    res.redirect(`/projects/issues/${req.params.projectid}`);
                });
            } else {
                let doc = req.files.doc;
                let nameFile = doc.name.replace(/ /g, "_");
                nameFile = Date.now() + "_" + nameFile;

                let sqlAddIssue = `INSERT INTO issues(projectid,tracker,subject,description,status,priority,assignee,author,startdate,duedate,estimatedtime,done,files,spenttime,createddate,updatedate)
                    VALUES(${req.params.projectid},'${req.body.tracker}','${req.body.subject}','${req.body.description}','${req.body.status}','${req.body.priority}',${req.body.assignee},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}),'${req.body.startdate}','${req.body.duedate}','${req.body.estimatedtime}',${req.body.done},'${nameFile}','0',NOW(),NOW())`;

                pool.query(sqlAddIssue, err => {
                    console.log("with file", sqlAddIssue);
                    doc.mv(
                        path.join(__dirname, `../public/images/${nameFile}`),
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



    //ISSUES LIST - EDIT ISSUES
    router.get("/issues/:projectid/:issueid/edit",helpers.isLoggedIn, (req, res, next) => {
        let sqlSelectIssue = `SELECT * FROM issues WHERE issueid = ${req.params.issueid}`;
        let sqlSelectUser = `SELECT userid, email, CONCAT(firstname, ' ', lastname) AS fullname FROM users WHERE userid IN (SELECT userid FROM members WHERE projectid = ${req.params.projectid})`;
        // res.render("projects/overview/issues/editIssues");
        console.log(sqlSelectUser);


        pool.query(sqlSelectIssue, (err, data) => {

            pool.query(sqlSelectUser, (err, users) => {
                if (err) {
                    res.send(err)
                }
                console.log(data.rows[0]);
                res.render("projects/overview/issues/editIssues", {
                    data: data.rows[0],
                    data2: data.rows,
                    users: users.rows,
                    moment,
                    isAdmin: req.session.user,
                    path,


                });
            });
        });
    });

    router.post('/issues/:projectid/:issueid/edit', helpers.isLoggedIn, (req, res) => {
        // let path = "issues"
        console.log("=================Router POST EDIT  Issues============");
        console.log("==");
        console.log("==");
        console.log("==");
    
        let author = req.session.user.userid;
        console.log('this author Edit issues>>', author);
        const { projectid, issueid } = req.params;
        let doc = req.files.doc;
        let nameFile = doc.name.replace(/ /g, "_");
        let filename = Date.now() + "_" + nameFile;
    
        const { tracker, subject, description, status, priority, assignee, startdate, duedate, estimatedtime, done, spenttime, targetversion, parenttask, createddate } = req.body;
    
        // if (req.files) {
        //     let doc = req.files.doc;
        //     let nameFile = doc.name.replace(/ /g, "_");
        //     nameFile = Date.now() + "_" + nameFile;
         
    
        // }
        if (status == 'closed') {
          sql = `UPDATE issues SET tracker ='${tracker}',
                                  subject = '${subject}',
                                  description ='${description}',
                                  status = '${status}',
                                  priority = '${priority}',
                                  startdate ='${startdate}',
                                  duedate = '${duedate}',
                                  estimatedtime =${estimatedtime},
                                  done = ${done},
                                  files ='${filename}',
                                  spenttime =${spenttime},
                                  targetversion =${targetversion},
                                  parenttask = ${parenttask},
                                  author = ${author},
                                  updatedate =  now(),
                                  closeddate = now(),
                                  assignee = ${assignee} WHERE issueid =${req.params.issueid};
          `
        } else {
          sql = `UPDATE issues SET tracker ='${tracker}',
                                  subject = '${subject}',
                                  description ='${description}',
                                  status = '${status}',
                                  priority = '${priority}',
                                  startdate ='${startdate}',
                                  duedate = '${duedate}',
                                  estimatedtime =${estimatedtime},
                                  done = ${done},
                                  files ='${filename}',
                                  spenttime =${spenttime},
                                  targetversion =${targetversion},
                                  parenttask = ${parenttask},
                                  author = ${author},
                                  updatedate =  now(),
                                  assignee = ${assignee} WHERE issueid = ${req.params.issueid}`;
        }
        console.log('this sql edit issues >>', sql);
        let title = `${subject}#${req.params.issueid} (${status})`
    
        pool.query(sql, (err, data) => {
    
          let activity = `INSERT INTO activity (title, description, author,time) VALUES('${title}', '${description}',${req.session.user.userid}, now())`;
    
          console.log('this sql activity>>', activity);
    
          pool.query(activity, (err) => {
            
            doc.mv(
                path.join(__dirname, `../public/images/${filename}`),
                function (err) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    res.redirect(`/projects/issues/${projectid}`)
                }
            );
            // if (err) { console.log('Not Found', err) }
            // res.redirect(`/projects/issues/${projectid}`)
    
    
          })
        })
      })

    // ISSUES LIST - EDIT ISSUES & ADD ACTIVITY - APPLY
    // router.post("/issues/:projectid/:issueid/edit", (req, res, next) => {
    //     const {
    //         tracker,
    //         subject,
    //         description,
    //         status,
    //         priority,
    //         assignee,
    //         startdate,
    //         duedate,
    //         estimatedtime,
    //         done,
    //         file,
    //         spenttime,
    //         targetversion } = req.body;
    //     const { projectid, issueid } = req.params;
    //     let sql1 = `UPDATE issues SET tracker = '${tracker}', subject = '${subject}',description = '${description}', status = '${status}', priority = '${priority}',assignee = ${assignee}, startdate = '${startdate}', duedate = '${duedate}',estimatedtime = '${estimatedtime}',done = ${done}, files = '${file}', spenttime = ${spenttime},targetversion = '${targetversion}', updatedate = NOW() ${status == "closed" ? `, closeddate = NOW()` : ""} WHERE projectid = ${projectid} AND issueid = ${issueid}`;

    //     let sql2 = `INSERT INTO activity(time,title,description,projectid,author)
    //     VALUES(NOW(),'${subject}','${
    //         status == "closed" ? `Issue was closed : ` : ``
    //         }Issue ID : #${issueid} : [${tracker}] Subject : ${subject} - (${status}) - Done: ${done}%.',${projectid
    //         },(SELECT author FROM projects WHERE projectid = ${projectid}));`;
    //     console.log(sql1);
    //     pool.query(sql1, err => {
    //         pool.query(sql2, err => {
    //             res.redirect(`/projects/issues/${projectid}`);
    //         });
    //     });
    // }
    // );



    // ISSUES LIST - DELETE ISSUES
    router.get("/issues/:projectid/:issueid/delete",helpers.isLoggedIn, (req, res, nect) => {
        res.locals.title = "Project | Edit Issues";

        let sql1 = `SELECT * FROM issues WHERE issueid = ${req.params.issueid}`;
        pool.query(sql1, (err, data) => {
            let sql2 = `INSERT INTO activity(time,title,description,projectid,author)
                  VALUES(NOW(),'${data.rows[0].subject}','Issue was deleted by userid : ${req.session.user.userid}, 
                  (${req.session.user.firstname} ${req.session.user.lastname}) : [${data.rows[0].tracker}] 
                  Subject : ${data.rows[0].subject} - (${data.rows[0].status}) - Done: ${data.rows[0].done}%.',
                  ${req.params.projectid},(SELECT author FROM projects WHERE projectid = ${req.params.projectid}))`;

            pool.query(sql2, err => {
                let sql3 = `DELETE FROM issues WHERE issueid = ${req.params.issueid} AND projectid = ${req.params.projectid} `;
                pool.query(sql3, err => {
                    res.redirect(`/projects/issues/${req.params.projectid}`);
                });
            });
        });
    });

    return router;
};