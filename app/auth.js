/**
 * Configuration for the passport authentication module
 */

var passport = require('passport');
var cmushib = require('passport-cmushib')
var trustedHeader = require('passport-trusted-header').Strategy
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var fs = require('fs');                         //file system
var publicCert = fs.readFileSync('/run/secrets/sp-cert.pem', 'utf-8');
var privateKey = fs.readFileSync('/run/secrets/sp-key.pem', 'utf-8');

var db = require('./db');
var config = require('./config');
var cleanUser = require('./components/user/user').cleanUser;

var logger = require('./components/logging/logger')

//app.get(cmushib.urls.metadata, cmushib.metadataRoute(strategy, publicCert));
//console.log(cmushib.urls.metadata)
passport.serializeUser(function(user, done) {
  done(null, user.id);
});


passport.deserializeUser(function(id, done) {
  if (typeof id === 'undefined') {
    done('Invalid session cookie');
  }
  db.select().from('users')
    .where('id', id)
    .first()
    .then(function(user) {
      if (typeof user === 'undefined') {
        done('Invalid session cookie');
      } else {
        db.select('course', 'role')
          .from('roles')
          .where({'user': user.id})
          .then(function(roleList) {
            roles = {}
            for (var i = 0; i < roleList.length; i++) {
              roles[roleList[i].course] = roleList[i].role;
            }
            user.roles = roles;
            user.is_admin = config.ADMIN_USERS.includes(user.andrew_id)
            done(null, cleanUser(user));
          });
      }
      // returning null here prevents bluebird from complaining
      // about an unreturned promise
      return null;
    })
    .catch(function(err) {
      done(err);
    });
});

var conf = config.CMU_SHIB_CONFIG
conf["privateKey"] = privateKey;
//console.log(conf)

var strategy =
    new cmushib.Strategy(
/*	{
	    entityId: "https://ohq.eberly.cmu.edu/login/callback",
	    callbackURL: "https://ohq.eberly.cmu.edu/api/login/success",
	    domain: "ohq.eberly.cmu.edu",
	    privateKey: privateKey
	},*/
	//config.CMU_SHIB_CONFIG,
	conf,
    function(accessToken, refreshToken, profile, done) {
      console.log("HERERRERERER");
      //logger.info('google strategy use');
      // see if user already exists
      db.select()
        .from('users')
        .where('google_id', profile.id)
        .first()
        .then(function(user) {

          // the user exists already - pass it back up
          if (typeof user !== 'undefined') {
            return Promise.resolve(user);
          }

          // user doesn't exist already
          else {
              //return db.insert(getUserInfo(profile))
	      //profile.principalName
	      return db.insert(getUserInfo(profile.id))
                     .into('users')
                     .returning('*')
                     .then(transfer_future_roles);
          }
        })
        .then(function(dbUser) {
          console.log(dbUser);
          done(null, dbUser);
        })
        .catch(function(err) {
          if (err.name === 'UserCreationException') {
            done();
          } else {
            done(err);
          }
        });
    }

  );

passport.use(strategy);
passport.cmushib = strategy;
//passport.cmushib = strategy;
/*passport.use(
  new GoogleStrategy(
    config.GOOGLE_OAUTH2_CONFIG,
    function(accessToken, refreshToken, profile, done) {

      logger.info('google strategy use');
      // see if user already exists
      db.select()
        .from('users')
        .where('google_id', profile.id)
        .first()
        .then(function(user) {

          // the user exists already - pass it back up
          if (typeof user !== 'undefined') {
            return Promise.resolve(user);
          }

          // user doesn't exist already
          else {
            return db.insert(getUserInfo(profile))
                     .into('users')
                     .returning('*')
                     .then(transfer_future_roles);
          }
        })
        .then(function(dbUser) {
          console.log(dbUser);
          done(null, dbUser);
        })
        .catch(function(err) {
          if (err.name === 'UserCreationException') {
            done();
          } else {
            done(err);
          }
        });
    }
  )
);
*/

function transfer_future_roles(insertedUser) {
  andrew_id = insertedUser[0].andrew_id;
  return db.select('*')
           .from('future_roles')
           .where('andrew_id', andrew_id)
           .then(function (roles) {
             uid = insertedUser[0].id;
             toInsert = roles.map((role) => ({"user": uid, "course": role.course,
                                             "role": role.role}));
             return db.insert(toInsert).into("roles")
                      .then(function (insertedRoles) {
                        return db.del().from('future_roles')
                                 .where('andrew_id', andrew_id)
                                 .then((deleted) => Promise.resolve(insertedUser[0]))
                      });
           });
}

function getUserInfo(eppn) {
  logger.info('get user info');
  var result = {};

  result.email = eppn;
  result.andrew_id = result.email;
  result.last_name = "";
  result.first_name = eppn;
  //TODO: remove this when roles are really gone
  result.role = "student";
  result.google_id = eppn;

  return result;
}

var isAuthenticated = {

  redirect: function(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/');
    }
  },

  errorJson: function(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).send({ name: 'AuthenticationError',
                             message: 'Not authenticated' });
    }
  }

};

var hasCourseRole = function(role) {
  return {

    redirect: function(req, res, next) {
      var course_id = req.body.course_id != undefined ? req.body.course_id : req.query.course_id
      if (req.isAuthenticated() &&
          req.user.roles[course_id] === role) {
        next();
      } else {
        res.redirect('/');
      }
    },

    errorJson: function(req, res, next) {
      var course_id = req.body.course_id != undefined ? req.body.course_id : req.query.course_id
      if (req.isAuthenticated() &&
          req.user.roles[course_id] === role) {
        next();
      } else {
        res.status(401).send({ name: 'AuthorizationError',
                               message: 'Not authorized' });
      }
    }

  };
};

function ioIsAuthenticated(socket, next) {
  if (socket.request.isAuthenticated()) {
    next();
  } else {
    next(new Error('Not authorized'));
  }
}

function ioHasCourseRole(role, course_id) {
  return function(socket, next) {
    if (socket.request.isAuthenticated()) {
      if (socket.request.user.roles[course_id] === role) {
        next();
        return;
      } else {
        next(new Error('Not authorized'));
      }
    }
  };
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && config.ADMIN_USERS.includes(req.user.andrew_id)) {
    next();
  } else {
      //res.redirect('/ohq');
      res.redirect('/');
  }
}

module.exports = {
  passport: passport,
  isAuthenticated: isAuthenticated,
  hasCourseRole: hasCourseRole,
  ioIsAuthenticated: ioIsAuthenticated,
  ioHasCourseRole: ioHasCourseRole,
  isAdmin: isAdmin,
};
