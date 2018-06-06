'use strict';

var five = require('johnny-five'),board,motor,button;
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
/*
const MFMport = new SerialPort('COM11',{  //'/dev/ttyUSB1',{
  baudRate: 19200             });
const parser = new Readline({delimiter: '\r'});
MFMport.pipe(parser);
*/

// Draft code framework to log values
var fs = require('fs');
var logStream = fs.createWriteStream('log.txt', {'flags': 'a'});

let led = null;


let gaTime=0,inPwm=0,outPwm=0,rsTime=0,rpPwm =0;
let sData ={}; 

 /***** define Pins ********/ 
// PWM pins are 3, 5, 6, 9, 10, and 11 but avoid using Pin 3 
//Only PWM pins can be used for Motor objects
// Sensor inputs
let wsPin = 2;
let sssrPin = 3;
let tempPin = 4;// Dallas temperature sensor on GRB

// Actuator pins
let gaPin =5;// Ga inject
let rpPin = 6;// recovery motor
let GRBheat = 7;//  relay control for GRB heater 
let Satheat = 8;// relay control for Saturation Heater
let inPin = 9;// water IN
let outPin = 10;// water OUT
let rsPin = 11; // solenoid
//let ?? = 12;// 

// Analog Pins
let Sat_Temp = 'A1'; // Stauration beaker temp



let offState = true;// state of ws sensor 
let motorOff = false; // INmotor can run initially; flag set by water sensor
let GRBoff = true; // flag set by SSSR
let GRBenable = false;

/*
 setInterval( readTemps , 1000);// check GRB and Saturation Beakers every 10 seconds
 
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function readTemps(){
       sData = {
       sensor: "SATtemp",
       value: getRandomInt(1, 100)//this.celsius
            };
   io.emit('sensor', sData); 
    
    console.log('Sending emit');
 }   
*/


app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/demoIndexV3.html')
});

//board = new five.Board();
var board = new five.Board({
  //port: "COM9", // WARNING __ MUST SET ARDUINO PORT MANUALLY
  //port: "/dev/ttyUSB0",
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
  var GRBheater = new five.Pin({
  pin: GRBheat
  });  
  var SATheater = new five.Pin({
  pin: SATheat
  }); 
    
// switches
  var ws = new five.Button(wsPin); 
  var sssr = new five.Button(sssrPin); 
    
//Sensors
  var GRBthermometer = new five.Thermometer({
    controller: "DS18B20",
    pin: tempPin,
    freq: 5000  // read temp every five seconds   
  }); 
  var SATthermometer = new five.Thermometer({
    controller: "LM335",
    pin: Sat_Temp, //"A0"
    freq: 5000  // read temp every five seconds 
  });  
    
    
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
    
 GRBthermometer.on("change", function() { // Dallas sensor reporting GRB temp
    Gtemp = this.celsius;
     console.log(Gtemp + "°C");
    
    sData = {
       sensor: "GRBtemp",
       value: Gtemp
            };
   io.emit('sensor', sData);
     // turn off GRB heater if temp over 95 C
    if(Gtemp > 95){
       GRBheater.low();
       }else{GRBheater.high();} 
  });  
    
  SATthermometer.on("change", function() { // Dallas sensor reporting GRB temp
    Stemp = this.celsius;
      console.log(Stemp + "°C");
    // console.log("0x" + this.address.toString(16));
    sData = {
       sensor: "SATtemp",
       value: Stemp
            };
   io.emit('sensor', sData);
      // Turn off Saturation heater if temp over 125 C
   if(Stemp > 125){
       SATheater.low();
       }else{SATheater.high();} 
  });    
    

    

    
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
            console.log("inject stop", Date.now()); 
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

/*  Comment OUT MFC WHEN NOT ATTACHED
parser.on('data', function(data) {
    //console.log('data: ',data)
    
       // parse received string 
      // data = device ID('A'), absolute pressure, temperature, volumetric flow rate,
      // mass flow rate, setpoint value, and selected gas
      // split out  and Only forward 'mass flow rate'
     var mfmData = data.toString();
          //console.log('MFM String: '+ data);
      var parts = mfmData.split(" ");
      var mf =parseFloat(parts[4]);
      var pressure =parseFloat(parts[1]);
      var gasTemp = parseFloat(parts[2]);
    

    
      // send mfm value to UI
       var mData = {
           sensor: "mfm",
           value: mf
                };
       io.emit('sensor', mData);
        console.log("MFM: " + mf); 
        
  //logStream.write(new Date().toLocaleString() + ' - ' + MFM + 'g\s');
  
    });  //end of parsers setup
    
setInterval( MFMpoll , 100);

function MFMpoll(){
    MFMport.write('A\r');         //console.log('Sending A');  
 }

*/ 

const port = process.env.PORT || 3000;

server.listen(port);
console.log(`Server listening on http://localhost:${port}`);

     /*send mfm gasTemp value to UI
      var tempData = {
           sensor: "temp",
           value: gasTemp
                };
       io.emit('sensor', tempData);
        console.log("gastemp: " + gasTemp);
        */ 