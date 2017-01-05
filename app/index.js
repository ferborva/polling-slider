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
    socket.emit('connected', 'Server socket setup correctly.');

    socket.on('register', function(data, callback) {
      console.log('USER REGISTRATION::', data.fp);
      users[data.fp] = socket;
      if (activeQuestion) {
        socket.emit('newQuestion', {
          id: activeQuestion.id,
          q: activeQuestion.question,
          end: activeQuestion.end
        });
      } else {
        socket.emit('questionTransition');
      }
    });

    socket.on('sendQuestion', function(data) {
      console.log('NEW QUESTION::', data.q);
      handleNewQuestion();
      socket.emit('questionReceived');
    })
  });
}


var handleNewQuestion = function() {
  
}