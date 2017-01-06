const socketIo = require('socket.io');
const uuid = require('uuid/v4');
const Either = require('data.either');
const R = require('ramda');

let slider;

let users = {};

let questionQueue = [];
let questionHistory = [];
let activeQuestion = null;

module.exports = function(io) {
  slider = io.of('slider');
  slider.on('connection', handleSocketConnection);
}

var handleSocketConnection = function(socket) {

  verifyUserConnection(socket);

  socket.on('register', function(data) {
    handleRegistration(data, socket);
  });

  socket.on('sendQuestion', function(data) {
    handleSentQuestion(data);
    socket.emit('questionReceived');
  });

  socket.on('myAnswer', handleNewAnswer);
}

const handleRegistration = (data, socket) => {
  users[data.fp] = socket;
  traceLog(`USER REGISTRATION:: ${data.fp}`);

  const verified = Either.fromNullable(activeQuestion)

  return verified.fold((e) => {
    socket.emit('questionTransition', {
      history: questionHistory.slice(0,10)
    });
  }, (x) => {
    socket.emit('newQuestion', {
      id: x.id,
      q: x.q,
      end: x.end,
      sTime: getServerTime()
    });
  });
}

const traceLog = (txt) => console.log(txt)

var handleSentQuestion = function(data) {
  console.log('NEW QUESTION::', data.q);
  handleNewQuestion(data.q);
  checkQuestionStatus();
}

var handleNewAnswer = function(data) {
  console.log('USER ANSWER:: New answer received');
  activeQuestion.answers[data.fp] = data.value;
}


var verifyUserConnection = function(socket) {
  console.log('NEW USER:: New Socket setup');
  socket.emit('connected', {
    msg: 'Server socket setup correctly.',
    history: questionHistory.slice(0,10)
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