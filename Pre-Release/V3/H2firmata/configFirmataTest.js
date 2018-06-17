var five = require('johnny-five');
var board = new five.Board();
 
board.on('ready', function() {
  var led = new five.Led(13); // pin 13
  var pin = new five.Pin(10);
// This will set pin 13 high (on)
pin.high();
    
    
  //var outMotor = new five.Motor({
  //  pin: 10
 // });  
 // outMotor.start(255);  
  //led.blink(500); // 500ms interval
});