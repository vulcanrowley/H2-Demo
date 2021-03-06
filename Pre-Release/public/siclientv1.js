
function externalJS(){ // this is to cause immediate loading of js file 
 // IMPORTANT - ALL ElementByIds MUST BE DEFINED OR
// JS DOESN"T WORK
    
//    var l = document.getElementById('l');
var log = function (m) {
    var i = document.createElement('li');
    i.innerText = new Date().toISOString()+' '+m;
//    l.appendChild(i);
}
log('opening socket.io connection');
var s = io();
s.on('connect_error', function (m) { log("error"); });
s.on('connect', function (m) { log("socket.io connection open"); });
s.on('message', function (m) { log(m); });
//s.on('sensor', function (m) { log(m.value); });
    

    
 // debug frame  
 var debugDiv = document.getElementById("debug"); 
debugDiv.innerHTML ='TEST';    
    
 var inPWM =0;           
var outPWM =0;
var rpPWM =0;
var temperature = 55;
var mfmData = 0;
var totalH2 =0;
 
 // -------------Actuators --------------
 
   //set GA inject time
var gaTime = document.getElementById('gaTime'),
    gaTimeDiv = document.getElementById("gaAmt");
    
gaTime.oninput = function() {
       v = this.value;
       gaAmt.value = v;
       //gaTimeDiv.innerHTML = v;
       s.emit('motor', {
            device: "gaMotor",
            value: v
        }); 
    }
 gaAmt.onchange = function() {
       v = this.value;
       gaAmt.value = v;
       gaTime.value =v;
       //gaTimeDiv.innerHTML = v;
       s.emit('motor', {
            device: "gaMotor",
            value: v
        }); 
    }   

     // Set solonoid valve release timing: either the slider or direct input of a value will set the time in seconds
var rsTime = document.getElementById('rsTime'),
    rsTimeDiv = document.getElementById("rsAmt");
    
rsTime.oninput = function() {
       v = this.value;
       rsAmt.value = v;
       //gaTimeDiv.innerHTML = v;
       s.emit('motor', {
            device: "rsMotor",
            value: v
        }); 
    }

 rsAmt.onchange = function() {
       v = this.value;
       rsAmt.value = v;
       rsTime.value =v;
       //gaTimeDiv.innerHTML = v;
       s.emit('motor', {
            device: "rsMotor",
            value: v
        }); 
    } 
 
 // set water IN pump rate 
var INTime = document.getElementById('INTime');
 var inTimeDiv = document.getElementById("inAmt");
      

INTime.onchange = function() {
       inPWM = this.value*2.55;
       inTimeDiv.innerHTML = this.value;
       s.emit('motor', {
            device: "inMotor",
            value: inPWM
        }); 
    }

// Set water OUT pump rate 
var OUT = document.getElementById('OUT'),
    outDiv = document.getElementById("outAmt");

OUT.onchange = function() {
       outPWM = this.value*2.55;
       outDiv.innerHTML = this.value;
       s.emit('motor', {
            device: "outMotor",
            value: outPWM
        }); 
    }

// send GA trigger message
var tr =  document.getElementById("tr");

tr.onclick = function() {
       s.emit('trigger', {
            device: "GAtrigger",
            value: 1
        }); 
    }

// send solenoid trigger message
var rs =  document.getElementById("rs");

rs.onclick = function() {
       s.emit('trigger', {
            device: "RStrigger",
            value: 1
        }); 
    }

// send reclaim pump message
 var rp = document.getElementById('recPump'),
    rpDiv = document.getElementById("rpAmt");

rp.onchange = function() {
       rpPWM = this.value*2.55;
       rpDiv.innerHTML = this.value;
       s.emit('motor', {
            device: "rpMotor",
            value: rpPWM
        }); 
    }   
 
//------- config  --------------

 var dropDown = document.getElementById("defaultNumbers");


//var gaPin = document.getElementById('gaPin'),
   // gaPinDiv = document.getElementById("gaAmt");

gaPin.onchange = function() {
    dropDown.selectedIndex = 0;
       v = this.value;
       s.emit('config', {
            device: "gaPin",
            pin: v
        }); 
    }

inPin.onchange = function() {
       v = this.value;
       s.emit('config', {
            device: "inPin",
            pin: v
        }); 
    }

outPin.onchange = function() {
       v = this.value;
       s.emit('config', {
            device: "outPin",
            pin: v
        }); 
    }

recPin.onchange = function() {
       v = this.value;
       s.emit('config', {
            device: "recPin",
            pin: v
        }); 
    }

 s1Pin.onchange = function() {
       v = this.value;
       s.emit('config', {
            device: "rsPin",
            pin: v
        }); 
    }

wsPin.onchange = function() {
       v = this.value;
       s.emit('config', {
            device: "wsPin",
            pin: v
        }); 
    }

tofPin.onchange = function() {
       v = this.value;
       s.emit('config', {
            device: "tofPin",
            pin: v
        }); 
    }

 tempPin.onchange = function() {
       v = this.value;
       s.emit('config', {
            device: "tempPin",
            pin: v
        }); 
    }
 


//--------------Sensors -----------------
   var GAtemp = document.getElementById("GART");
    
        s.on('sensor', function(data) {
        
        switch(data.sensor){
               
         case "temp":     
            temperature = data.value;
            GAtemp.innerHTML = temperature  + ' C degrees';
            tempData.setValue(0, 1, temperature);
            tempChart.draw(data, options);    
            break;
            
            case "ws":
             if(data.value == 0){
                debugDiv.innerHTML ='IN pump OFF';
                waterSensorOn() ;
              }else if (data.value == 1) {
                 debugDiv.innerHTML ='IN Pump ON';
                 waterSensorOff();
              }
             break;
                
            case "GRBs":
             if(data.value == 1){
                debugDiv.innerHTML ='GRB sensor ON';
                recSensorOn() ;
              }else if (data.value == 0) {
                 debugDiv.innerHTML ='GRB sensor OFF';
                 recSensorOff();
              }
             break;   
                           
           case "MFM":
             mfmData =data.value;
             totalH2 = totalH2 + mfmData;
             debugDiv.innerHTML ='MFM data ' + mfmData;
            break;
                
            }//end of switch
               
    }); // end of sensor processing
      

 }// end of loading function 



