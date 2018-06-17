var five = require('johnny-five');
var board = new five.Board();
 var bright= 20;
board.on('ready', function() {
 // var led = new five.Led(13); // pin 13
  var ninepin = new five.Pin({pin:9, mode: five.Pin.PWM});
 // var ninepin = new five.Pin(9);  
    
// This will set pin 10 low (on)
//tenpin.low();
    
//for (i = 0; i < 255; i++) { 
   board.io.pwmWrite(9,bright);
//}     
    
    
 //ninepin.high();   
    
  //var outMotor = new five.Motor({
  //  pin: 10
 // });  
 // outMotor.start(255);  
 // led.blink(500); // 500ms interval
});