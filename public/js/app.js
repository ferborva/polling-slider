console.log('================================================');
console.log(' ____                   _____                   ');
console.log('|    \\ ___ _____ ___   |  _  |___ _ _ _ ___ ___ ');
console.log('|  |  | -_|     | . |  |   __| . | | | | -_|  _|');
console.log('|____/|___|_|_|_|___|  |__|  |___|_____|___|_| ');
console.log('================================================');

console.log(' ');
console.log('Welcome to my jungle!');
console.log(' ');
console.log(' ');
console.log(' ');



var userFingerPrint = '';
var currentSliderValue = 0;
var ioServer = '';

var slider = document.getElementById('slider');

noUiSlider.create(slider, {
  start: [3],
  direction: 'rtl',
  orientation: 'vertical',
  step: 1,
  range: {
    'min': 1,
    'max': 5
  }
});

slider.noUiSlider.on('update', function( values, handle ) {
  currentSliderValue = parseInt(values[0]);
});

new Fingerprint2().get(function(result, components){
  userFingerPrint = result;
});


window.addEventListener("load", function(event) {
    console.log("Loading complete!");
    ioServer = io('/slider');
    setupServerListeners(ioServer);
});


setupServerListeners = function(server){
  server.on('message', function(data){
    // Log a message from the sever. Simple connection check
    console.log(data);
  });
}