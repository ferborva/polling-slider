const socketIo = require('socket.io');
const uuid = require('uuid/v4');

let slider;

module.exports = function(io) {
  slider = io.of('slider');
  slider.on('connection', function(socket) {
    console.log('VIRTUAL ROOM CONNECTION:: New Socket setup');
    socket.emit('message', 'Server socket setup correctly.');

    socket.on('register', function(data, callback) {
      console.log(data);
    });
  });
}