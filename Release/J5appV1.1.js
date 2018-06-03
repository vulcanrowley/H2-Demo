'use strict';

var five = require('johnny-five'),board,motor,button;
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let led = null;


let gaTime=0,inPwm=0,outPwm=0,rsTime=0,rpPwm =0;
let sData ={}; 

 /***** define Pins ********/ 
// PWM pins are 3, 5, 6, 9, 10, and 11 but avoid using Pin 3 
//Only PWM pins can be used for Motor objects
// Sensor inputs
let wsPin = 2;
let sssrPin = 3;
let tempPin = 4;// Dallas temperature sensor

// Actuator pins
let gaPin =5;// Ga inject
let rpPin = 6;// recovery motor
//let ?? = 7;// 
//let uknPin = 8;// 
let inPin = 9;// water IN
let outPin = 10;// water OUT
let rsPin = 11; // solenoid
//let ?? = 12;// 



let offState = true;// state of ws sensor 
let motorOff = false; // INmotor can run initially; flag set by water sensor
let GRBoff = true; // flag set by SSSR
let GRBenable = false;



app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/demoIndexV1.html')
});

//board = new five.Board();
var board = new five.Board({
  port: "COM9",
  repl: false  
});
board.on("ready", function() {
  console.log('Arduino is ready.');
 
// actuators
  var gaMotor = new five.Motor({
    pin: gaPin
  }); 
  var rsMotor = new five.Motor({
    pin: rsPin
  });
  var inMotor = new five.Motor({
    pin: inPin
  });
  var outMotor = new five.Motor({
    pin: outPin
  });
  var rpMotor = new five.Motor({
    pin: rpPin
  });  
    
// switches
  var ws = new five.Button(wsPin); 
  var sssr = new five.Button(sssrPin); 
    
 // water IN pump
if(GRBoff){
 ws.on("down", function() {
   motorOff = false;
   inMotor.start(inPwm);
   sData = {
       sensor: "ws",
       value: 1
            };
    io.emit('sensor', sData);   
    console.log( "Button down" );
  }).on("up", function() {
    motorOff =true;
    inMotor.stop();
    sData = {
       sensor: "ws",
       value: 0
            };
    io.emit('sensor', sData);  
    console.log( "Button up" );
  });// end water IN pump
}// end of GRB test for inMotor     

  
   // ga Recovery pump   
 sssr.on("down", function() {// 'Down' means there is a contact with Ga
   sData = {
       sensor: "GRBs",
       value: 1
            };
   io.emit('sensor', sData);   
   console.log( "Ga present" );  
    
   GRBoff = false;
   rpMotor.start(255);

   console.log( "GRBoff false - turn off water motors"); 
   inMotor.stop();
   outMotor.stop(); 
 });    
 sssr.on("up", function() {
    GRBoff =true;
    rpMotor.stop();
    sData = {
       sensor: "GRBs",
       value: 0
            };
    io.emit('sensor', sData);  
    console.log( "No Ga sensed" );
    console.log( "GRBoff true - turn ON water motors");
      outMotor.start(outPwm);
      if(motorOff){
          inMotor.stop();
      }else{
          inMotor.start(inPwm);
      };
     
  });// end GA recovery pump

    
  // Listen to the web socket connection
  io.on('connection', function(client) {

  client.on('motor', function(data) {
    console.log( data);
    switch (data.device) {
    case "gaMotor":
        gaTime = data.value*1000;// Set value for trigger 
        break;
        
    case "rsMotor":
        rsTime = data.value*1000; // Set value for trigger command
        break; 
        
    case "inMotor":
        inPwm = data.value.toFixed(0);
        if(GRBoff){    
         if(motorOff){
          inMotor.stop();
         }else {
           inMotor.start(inPwm);
         }
        }
        break;
            
       case "outMotor":
        outPwm = data.value.toFixed(0); 
        if(GRBoff){ 
         outMotor.start(outPwm);
        }
        break; 
              
        }// end of switch                                 
   });//end of "motor"
    
 client.on('trigger', function(data) {
    console.log( data);
    switch (data.device) {
    case "GAtrigger":
    // "start" events fire when the motor is started.
        gaMotor.on("start", function() {
         console.log("inject start", Date.now());

       // Ga Inject motor stop in gaTime milliseconds
          board.wait(gaTime, function() {
            gaMotor.stop();
            });
        });
        gaMotor.start(255);    
        break; 
    case "RStrigger":
        // "start" events fire when the motor is started.
        rsMotor.on("start", function() {
         console.log("Solenoid start", Date.now());

       // Solenoid motor stop in rsTime milliseconds
          board.wait(rsTime, function() {
            rsMotor.stop();
            });
        });
        rsMotor.start(255);
        console.log( "turn off water motors - give SSR sensor time to react"); 
        inMotor.stop();
        outMotor.stop();   
        break; 
         };   // end of switch  
    });  //end of trigger
    
    

  });// end of websocket loop
  
});//end of Johnny-five loop

const port = process.env.PORT || 3000;

server.listen(port);
console.log(`Server listening on http://localhost:${port}`);


/*
/***** serial connection to Mass Flow Meter ********

// Listen to serial port

    var mfmData = "";
    serialMFM = new SerialPort(portName, {
        baudRate: 19200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    });
// Listen to Mass Flow Meter serial port
    serialMFM.on("open", function () {
    // Send 'A6' to poll for hydrogen
     serialMFM.write('A6' + '\r');   
     console.log('open MFM communication');
        
      // Listens to incoming data
      serialMFM.on('data', function(data) {
          console.log('MFM: '+ data); 
      
      // parse received string 
      // data = device ID('A'), absolute pressure, temperature, volumetric flow rate,
      // mass flow rate, setpoint value, and selected gas
      // split out  and Only forward 'mass flow rate'
      mfmData = data.toString();
      //console.log('MFM String: '+ data);
      var output = mfmData.split(" ");
      var mf =parseFloat(output[4]);    
      // send mfm value to UI
        sData = {
            sensor: "mfm",
            value: mf
                };
        io.emit('sensor', sData);
        console.log("MFM :" + mf); 
               
          
     }); //end of serial function 

*/

    /*        
    case "rpMotor":
        rpPwm = data.value.toFixed(0);
        if(GRBoff){
          rpMotor.stop();
        }else {
           rpMotor.start(rpPwm);
        }
        break; 
          
    case "GRBenable":
        if(data.value){
          GRBenable = true;
        }else {
          GRBenable = false;
        }
        break; 
       
   }   // end of GRBcontrol of water pumps         
            
            
      */ 
