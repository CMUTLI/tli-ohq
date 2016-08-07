var queue = require('./queue');
var auth = require('../../auth');

module.exports = function(io) {

  // make sure that this endpoint is protected
  io.use(auth.ioIsAuthenticated);

  // on client connection, join appropriate room, and
  // handle subsequent client -> server communications
  io.on('connection', function(socket) {
    var userid = socket.request.user.id;
    if (socket.request.user.role === 'ca') {
      socket.join('ca');
      socket.join('ca_' + socket.request.user.id);
      oncajoin(socket, userid);
    } else if (socket.request.user.role === 'student') {
      socket.join('student');
      socket.join('student_' + socket.request.user.id);
      onstudentjoin(socket, userid);
    } else {
      throw new Error('Not authorized');
    }
  });

  //update n_cas on disconnect
  io.on('disconnect', function() {
    emit_n_cas();
  });

  // ca/student global rooms
  var cas = function() {
    return io.to('ca');
  };
  var ca = function(userid) {
    return io.to('ca_' + userid);
  };
  var students = function() {
    return io.to('student');
  };
  var student = function(userid) {
    return io.to('student_' + userid);
  };


  //
  // CA handling
  //

  // individual cas
  var oncajoin = function(socket, userid) {

    // listen for events
    socket.on('freeze_question', function() {
      queue.questions.freezeCa(userid);
    });

    socket.on('kick_question', function() {
      queue.questions.closeCa(userid, 'ca_kick');
    });

    socket.on('finish_question', function() {
      queue.questions.closeCa(userid, 'normal');
    });

    socket.on('answer_question', function() {
      queue.questions.answer(userid);
    });
    
    socket.on('close_queue', function() {
      queue.meta.close();
    });

    socket.on('open_queue', function() {
      queue.meta.open();
    });

    socket.on('update_minute_rule', function(minutes) {
      queue.meta.setTimeLimit(minutes);
    });

    // emit the current data on connect
    queue.meta.getCurrent().then(function(meta) {
      socket.emit('queue_meta', makeMessage('data', [{
        id: 0,
        open: meta.open,
        time_limit: meta.time_limit
      }]));
    });

    //emit inital ca_meta
    emit_n_cas();
    queue.questions.getNumQuestions();

    queue.questions.getOpen().then(function(questions) {
      questions.forEach(function(question) {
        socket.emit('questions', makeCaQuestion(question));
      });
    });

    queue.questions.getAnsweringUserId(userid).then(function(question) {
      if (typeof question !== 'undefined') {
        socket.emit('current_question', makeCaQuestion(question));
      }
    });

  };

  // server -> client
  (function() {

    // listen for new questions
    queue.questions.emitter.on('new_question', function(question) {
      cas().emit('questions', makeCaQuestion(question));
    });

    // listen for question updates
    queue.questions.emitter.on('question_frozen', function(question) {
      if (question.initial_ca_user_id !== null) {
        ca(question.initial_ca_user_id).emit('current_question', makeMessage('delete', [question.id]));
      }
      cas().emit('questions',  makeMessage('delete', [question.id]));
    });

    queue.questions.emitter.on('question_unfrozen',function(question) {
      cas().emit('questions', makeCaQuestion(question));
    });

    queue.questions.emitter.on('question_answered', function(question) {
      ca(question.ca_user_id).emit('current_question', makeCaQuestion(question));
      cas().emit('questions', makeMessage('delete', [question.id]));
    });

    queue.questions.emitter.on('question_update' ,function (question) {
      cas().emit('questions', makeCaQuestion(question));
    });

    queue.questions.emitter.on('question_closed', function(question) {
      ca(question.ca_user_id).emit('current_question', makeMessage('delete', [question.id]));
      cas().emit('questions',  makeMessage('delete', [question.id]));
    });

    //listen for ca_meta updates
    queue.questions.emitter.on("n_question_update", function (n) {
      cas().emit('ca_meta', makeMessage('data',[{"id" : 0, "n_questions": n}]));
    });

    // listen for queue_meta updates
    queue.meta.emitter.on('update', function(meta) {
      cas().emit('queue_meta', makeMessage('data', [{
        id: 0,
        open: meta.open,
        time_limit: meta.time_limit
      }]));
    });

  })();


  //
  // Student handling
  //

  // individual students
  var onstudentjoin = function(socket, userid) {

    socket.on('new_question', function(question) {
      question.student_user_id = userid;
      try {
        queue.questions.add(question);
      } catch(error) {
        console.log(error);
      }
    });

    socket.on('update_question', function(question) {
      try {
        queue.questions.updateMeta(userid, question);
      } catch (error) {
        console.log(error);
      }
    });


    socket.on('delete_question', function() {
      queue.questions.closeStudent(userid);
    });

    socket.on('freeze_question', function() {
      queue.questions.freezeStudent(userid);
    });

    socket.on('unfreeze_question', function() {
      queue.questions.unfreezeStudent(userid);
    });

    // emit the current data on connect
    queue.meta.getCurrent().then(function(meta) {
      socket.emit('queue_meta', makeMessage('data', [{
        id: 0,
        open: meta.open
      }]));
    });

    queue.questions.getOpenUserId(userid).then(function(question) {
      if (typeof question === 'undefined') {
        return;
      }
      socket.emit('questions', makeStudentQuestion(question));
    });

    queue.locations.getEnabled().then(function(locations) {
      socket.emit('locations', makeMessage('data', locations));
    });

    queue.topics.getEnabled().then(function(topics) {
      socket.emit('topics', makeMessage('data', topics));
    });

  };

  // server -> client
  (function() {

    // listen for question updates
    queue.questions.emitter.on('new_question', emitStudentQuestion);
    queue.questions.emitter.on('question_frozen', emitStudentQuestion);
    queue.questions.emitter.on('question_unfrozen', emitStudentQuestion);
    queue.questions.emitter.on('question_update' ,emitStudentQuestion);


    queue.questions.emitter.on('question_answered', function(question) {
      // tell everyone their new position on the queue
      queue.questions.getOpen().then(function(questions) {
        questions.forEach(emitStudentQuestion);
      });
    });

    queue.questions.emitter.on('question_closed', function(question) {
      student(question.student_user_id).emit('questions', makeMessage('delete', [question.id]));
    });

    // listen for updates on queue_meta
    queue.meta.emitter.on('update', function(meta) {
      students().emit('queue_meta', makeMessage('data', [{
        id: 0,
        open: meta.open
      }]));
    });

  })();

  //
  // utilities
  //
  function makeMessage(type, payload) {
    return {
      type: type,
      payload: payload
    };
  };

  function makeCaQuestion(question) {
    return makeMessage('data', [{
      id: question.id,
      first_name: question.student_first_name,
      andrew_id: question.student_andrew_id,
      topic: question.topic,
      location: question.location,
      help_text: question.help_text
    }]);
  };

  function makeStudentQuestion(question) {
    return makeMessage('data', [{
      id: question.id,
      topic_id: question.topic_id,
      location_id: question.location_id,
      help_text: question.help_text,
      queue_ps: question.queue_position,
      is_frozen: question.is_frozen,
      can_freeze: question.can_freeze
    }]);
  };

  function emitStudentQuestion(question) {
    student(question.student_user_id).emit('questions', makeStudentQuestion(question));
  };

  function emit_n_cas() {
     var n_cas = Object.keys(cas().sockets).length
     cas().emit('ca_meta', makeMessage('data',[{"id":0, "n_cas": n_cas}]))
  }

};