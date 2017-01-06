const socketIo = require('socket.io');
const uuid = require('uuid/v4');

let slider;

let users = {};

let questionQueue = [];
let questionHistory = [];
let activeQuestion = null;

module.exports = function(io) {
  slider = io.of('slider');
  slider.on('connection', function(socket) {
    console.log('NEW USER:: New Socket setup');
    socket.emit('connected', {
      msg: 'Server socket setup correctly.',
      history: questionHistory.slice(0,10)
    });

    socket.on('register', function(data, callback) {
      console.log('USER REGISTRATION::', data.fp);
      users[data.fp] = socket;
      if (activeQuestion) {
        socket.emit('newQuestion', {
          id: activeQuestion.id,
          q: activeQuestion.q,
          end: activeQuestion.end,
          sTime: getServerTime()
        });
      } else {
        socket.emit('questionTransition', {
      history: questionHistory.slice(0,10)
    });
      }
    });

    socket.on('sendQuestion', function(data) {
      console.log('NEW QUESTION::', data.q);
      handleNewQuestion(data.q);
      checkQuestionStatus();
      socket.emit('questionReceived');
    });

    socket.on('myAnswer', function(data) {
      console.log('USER ANSWER:: New answer received');
      activeQuestion.answers[data.fp] = data.value;
    });
  });
}


var handleNewQuestion = function(data) {
  var newId = uuid();
  questionQueue.push({
    id: newId,
    q:  data
  });
}


var checkQuestionStatus = function() {
  if (!activeQuestion && questionQueue.length) {
    sendNextQuestion();
  }
}

setInterval(function() {
  if (activeQuestion && !checkEndOfQuestion()) {
    var data = calculateAnswerData();
    slider.emit('answers', {answersArray: data});
  } else if (activeQuestion && checkQuestionStatus) {
    var data = activeQuestion;
    data.answers = calculateAnswerData();
    questionHistory.unshift(activeQuestion)
    activeQuestion = null;
    slider.emit('questionTransition', {
      history: questionHistory.slice(0,10)
    });
  } else {
    checkQuestionStatus();
  }
}, 1000);

var checkEndOfQuestion = function() {
  var time = new Date();
  var currMillis = time.getTime();
  return activeQuestion.end - currMillis > 0 ? false : true;
}

var sendNextQuestion = function() {
  var time = new Date();
  var millis = time.getTime() + 20000; // Current time plus 20 seconds
  var data = {
    id: questionQueue[0].id,
    q: questionQueue[0].q,
    end: millis,
    answers: {}
  };
  activeQuestion = data;
  slider.emit('newQuestion', {
    id: activeQuestion.id,
    q: activeQuestion.q,
    end: activeQuestion.end,
    sTime: getServerTime()
  });
  questionQueue.shift();
}


var calculateAnswerData = function() {
  var data = [0, 0, 0, 0, 0];
  var allAnswers = activeQuestion.answers;
  for (ans in allAnswers) {
    data[allAnswers[ans] - 1] += 1;
  }
  return data;
}

var getServerTime = function() {
  var d = new Date();
  return d.getTime();
}