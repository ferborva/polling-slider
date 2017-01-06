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
var questionHistory = [];
var timer = 0;

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
  // console.log(txt);
}

setupServerListeners = function(server){
  server.on('connected', function(data){
    trace('SERVER MSG:: Connected correctly')
    questionHistory = data.history;
    updateHistory();
    registerToServer();
  });

  server.on('newQuestion', function(data) {
    trace('SERVER MSG:: New Question received')
    slider.noUiSlider.set(3);
    handleNewQuestion(data);
  });

  server.on('questionTransition', function(data) {
    questionHistory = data.history;
    updateHistory();
    trace('SERVER MSG:: Transition time')
    currentQuestion = null;
    document.getElementById('question').innerHTML = 'Send in your questions!!!';
    document.getElementById('seconds').innerHTML = '?';
    myDoughnutChart.data.datasets[0].data = [0, 0, 1, 0, 0];
    myDoughnutChart.update();
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
  setTimer();
  document.getElementById('question').innerHTML = data.q;
  sendMyAnswer();
}

var sendMyAnswer = function() {
  ioServer.emit('myAnswer', {fp: userFingerPrint, value: currentSliderValue});
}

var updateHistory = function(){
  var tbody = document.getElementById('table-body');
  while(tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  questionHistory.forEach(function(item) {
    trace('History Item:');
    trace(item);
    var tr = document.createElement('tr');
    var td1 = document.createElement('td');
    td1.innerHTML = item.q;
    var td2 = document.createElement('td');
    td2.innerHTML = item.answers[4];
    var td3 = document.createElement('td');
    td3.innerHTML = item.answers[3];
    var td4 = document.createElement('td');
    td4.innerHTML = item.answers[2];
    var td5 = document.createElement('td');
    td5.innerHTML = item.answers[1];
    var td6 = document.createElement('td');
    td6.innerHTML = item.answers[0];
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tr.appendChild(td5);
    tr.appendChild(td6);
    tbody.appendChild(tr);
  })
}

var setTimer = function() {
  timer = Math.round((currentQuestion.end - currentQuestion.sTime) / 1000);
  document.getElementById('seconds').innerHTML = timer;
}

setInterval(function(){
  if (currentQuestion) {
    timer -= 1;
    document.getElementById('seconds').innerHTML = timer;
  }
}, 1000);