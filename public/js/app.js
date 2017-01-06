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



var userFingerPrint = null;
var currentSliderValue = 0;
var ioServer = '';
var currentQuestion = null;

var slider = document.getElementById('slider');
var chartCtx = document.getElementById("chart").getContext("2d");

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
  if (currentQuestion) {
    sendMyAnswer();
  }
});

// Sample Doughnut chart data
var data = {
  labels: [
    "No way",
    "I don't think so",
    "N/A",
    "Maybe",
    "Of course"
  ],
  datasets: [
    {
      data: [300, 50, 100, 40, 800],
      backgroundColor: [
        "#CE3633",
        "#BF2F9B",
        "#2989D8",
        "#34D194",
        "#29D132"
      ],
      hoverBackgroundColor: [
        "#CE3633",
        "#BF2F9B",
        "#2989D8",
        "#34D194",
        "#29D132"
      ]
    }]
};

Chart.defaults.global.responsive = false;

var myDoughnutChart = new Chart(chartCtx, {
  type: 'doughnut',
  data: data,
  animation:{
    animateScale:true
  }
});

new Fingerprint2().get(function(result, components){
  userFingerPrint = result;
});


window.addEventListener("load", function(event) {
    trace("Loading complete!");
    ioServer = io('/slider');
    setupServerListeners(ioServer);
});

var trace = function(txt) {
  console.log(txt);
}

setupServerListeners = function(server){
  server.on('connected', function(data){
    trace('SERVER MSG:: Connected correctly')
    registerToServer();
  });

  server.on('newQuestion', function(data) {
    trace('SERVER MSG:: New Question received')
    slider.noUiSlider.set(3);
    handleNewQuestion(data);
  });

  server.on('questionTransition', function() {
    trace('SERVER MSG:: Transition time')
    currentQuestion = null;
    document.getElementById('question').innerHTML = 'Send in your questions!!!';
    slider.noUiSlider.set(3);
    trace('You have to wait for a new question to be posed!');
  });

  server.on('questionReceived', function() {
    trace('SERVER MSG:: Question received correctly')
  });

  server.on('answers', function(data) {
    trace('SERVER MSG:: New batch of answers received')
    trace('SERVER MSG:: Data received');
    trace(data);
    if (data && data.answersArray) {
      myDoughnutChart.data.datasets[0].data = data.answersArray;
      myDoughnutChart.update();
    }
  });
}

var registerToServer = function() {
  if (userFingerPrint) {
    ioServer.emit('register', {
      fp: userFingerPrint
    });
  }
}

var sendNewQuestion = function() {
  var input = document.getElementById('question-input');
  if (input.value) {
    ioServer.emit('sendQuestion', {
      q: input.value
    });
    input.value = '';
  }
}

var handleNewQuestion = function(data) {
  trace('A Question has been received');
  trace(data);
  currentQuestion = data;
  document.getElementById('question').innerHTML = data.q;
  sendMyAnswer();
}

var sendMyAnswer = function() {
  ioServer.emit('myAnswer', {fp: userFingerPrint, value: currentSliderValue});
}