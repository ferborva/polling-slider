const socketIo = require('socket.io');
const uuid = require('uuid/v4');
const Either = require('data.either');
const Task = require('data.task');
const R = require('ramda');

// Module globals
let slider;

/**
 * Temporal Cache DB
 *
 * Short term solution to keep track of state and data during development
 */
let users = {};
let questionQueue = [];
let questionHistory = [];
let activeQuestion = null;

// DB Management Tasks
const getUserData = (userId) => {
  return new Task((rej, res) => {
    const val = users[userId]
    val ? res(val) : rej('User not found')
  })
}
const getQuestionQueue = () => Task.of(questionQueue)
const getQuestionHistory = () => Task.of(questionHistory)
const getActiveQuestion = () => Task.of(activeQuestion)

const setUserData = R.curry((userId, data) => {
  return new Task((rej, res) => {
    const obj = {
      id: userId,
      socket: data
    };
    users[userId] = obj;
    res(obj);
  })
})

// Test helper functions
const setUsersDB = (collection) => users = collection

const traceLog = (txt) => console.log(txt)

const getServerTime = () => new Date().getTime()

const sendInitAndData = (socket) => {
  traceLog('NEW USER:: New Socket setup');
  const history = getQuestionHistory().map(R.take(10)).fork(() => { return [] }, R.identity)

  socket.emit('connected', {
    msg: 'Server socket setup correctly.',
    history
  })
  return socket;
}

const setupListeners = (socket) => {
  socket.on('register', function(data) {
    handleRegistration(data, socket);
  });

  socket.on('sendQuestion', handleSentQuestion);

  socket.on('myAnswer', handleNewAnswer);
}

const handleSocketConnection = R.compose(setupListeners, sendInitAndData);


const handleRegistration = (data, socket) => {
  // users[data.fp] = socket;
  setUserData(data.fp, {socket}).fork(console.error, console.log);
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


const init = function(io) {
  slider = io.of('slider');
  slider.on('connection', handleSocketConnection);
}


var handleSentQuestion = function(data, cb) {
  console.log('NEW QUESTION::', data.q);
  handleNewQuestion(data.q);
  checkQuestionStatus();
  cb();
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

// Control Loop
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


module.exports = {
  init,
  getUserData,
  setUserData,
  setUsersDB
}