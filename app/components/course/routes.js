var router = require('express').Router();
var validate = require('express-jsonschema').validate;
var auth = require('../../auth');
var db = require('../../db');
var logger = require('../logging/logger');


router.get('/get_all', auth.isAuthenticated.errorJson, function(req, res, next) {
  logger.info('Get all courses');
  return db.select('*')
  .from('courses')
  .orderBy('id')
  .then(function(courses) {
    return res.send(courses);
  })
  .catch(function(err) {
    if (err.name === 'GetCoursesExcept') {
      return res.status(400).send(err);
    } else {
      next(err);
    }
  });
});

router.get('/get_active', auth.isAuthenticated.errorJson, function(req, res, next) {
  logger.info('Get active courses');
  return db.select('*')
  .from('courses')
  .orderBy('id')
  .where('active', true)
  .then(function(courses) {
    res.send(courses);
    //return null so that the promise has a return value
    return null;
  })
  .catch(function(err) {
    if (err.name === 'GetActiveCoursesException') {
      res.status(400).send(err);
    } else {
      next(err);
    }
  });
});

router.get('/get_tas', auth.hasCourseRole('ca').errorJson, function (req, res, next) {
  logger.info('Get tas');
  return db.select('user')
    .from('roles')
    .where('course', req.query.course_id)
    .andWhere('role', 'ca')
    .then(function (roles) {
      user_ids = roles.map((role) => role.user);
      return db.select('andrew_id')
        .from('users')
        .whereIn('id', user_ids)
        .then(function (current_users) {
          return db.select('andrew_id')
            .from('future_roles')
            .where('course', req.query.course_id)
            .andWhere('role', 'ca')
            .then(function (future_users) {
              return res.send(current_users.concat(future_users));
            });
        });
    });
});

router.get('/get_counts', auth.isAdmin, function (req, res, next) {
  logger.info('Get counts');
  return db.select("courses.number", "courses.name")
    .countDistinct("questions.id")
    .from("questions")
    .join("courses", "courses.id", "questions.course_id")
    .groupBy("courses.number", "courses.name")
    .then(function (counts) {
      return res.send(counts);
    }).catch(function (error) {
      res.status(400).send(error);
    });
});

var ValidCourseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    number : {
      type: 'integer',
      required: true,
    },
    name : {
      type: 'string',
      minlength: 1,
      required: true,
    },
    color: {
      type: 'string',
      minlength: 1,
    },
    label: {
      type: 'string',
      minlength: 1
    }
  }
};

var CourseEditSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'integer',
      required: true,
    },
    number : {
      type: 'integer',
    },
    name : {
      type: 'string',
      minlength: 1,
    },
    color: {
      type: 'string',
      minlength: 1,
    },
    active: {
      type: 'boolean',
    },
    label: {
      type: 'string',
      minlength: 1,
    }
  }
}

router.post('/add',
            auth.isAdmin,
            validate({body: ValidCourseSchema}),
            function(req, res, next) {
  logger.info('Add course');
  var body = req.body;

  // check if course number is valid
  db.select('number')
    .from('courses')
    .where('number', body.number)
    .first()
    .then(function(course) {
      if (typeof course !== 'undefined') {
        throw { name: 'AddCourseException',
                message: course.number + ' already has a queue.' };
      }

  // is valid, insert it
      else {
        return db.insert(body)
                 .into('courses')
                 .returning('*')
                 .then(function (newCourse) {
                   newCourse = newCourse[0];
                   //New meta for the course
                   return db.insert({"open": false, "max_freeze": 600, "time_limit": 5,
                                     "registration_code": "placeholder",
                                     "course_id": newCourse.id})
                    .into('queue_meta')
                    .then(function (newMeta) {
                      //Default locations
                      locations = [
                        { location: 'GHC Commons',  enabled: true, course_id: newCourse.id},
                        { location: 'NA',  enabled: true, course_id: newCourse.id}
                      ]
                      return db.insert(locations)
                         .into('locations')
                         .then(function (newLoc) {
                           //default topics
                           topics = [
                             { topic: 'Homework',  enabled: true, course_id: newCourse.id },
                             { topic: 'Conceptual',  enabled: true, course_id: newCourse.id },
                             { topic: 'NA',  enabled: true, course_id: newCourse.id }
                           ]
                           return db.insert(topics)
                                    .into('topics')
                                    .then(() => newCourse);
                        })
                    })
                 })
      }
    })
    .then(function(newCourse) {
      return res.send(newCourse);
    })
    .catch(function(err) {
      if (err.name === 'AddCourseException') {
        res.status(400).send(err);
      } else {
        next(err);
      }
    });
});

router.post("/edit",
            auth.isAdmin,
            validate({ body : CourseEditSchema }),
            function (req,res,next) {
  logger.info('Edit course');
  var id = req.body.id;
  var body = req.body;
  delete body.id;

  db('courses').where('id',id).update(body).then(function(success) {
        return res.send({"success": true});
  }).catch(function(err) {
        return res.status(400).send(err);
    });
});

module.exports = router;
