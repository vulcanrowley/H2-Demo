
function externalJS(){ // this is to cause immediate loading of js file 
 // IMPORTANT - ALL ElementByIds MUST BE DEFINED OR
// JS DOESN"T WORK
    
// var imported = document.createElement('script');
//imported.src = '/path/to/imported/script';
//document.head.appendChild(imported);   
    
    
    
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
//var mfmData = 0;
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
     totalH2 = 0; // reset total hydrogen
    
var ch =  document.getElementById("chart");
    ch.innerHTML = '';
    
var newSeries = [[]];
    newSeries =  new Rickshaw.Series.FixedDuration([{ name: 'mass' }], undefined, {
		timeInterval: 100,
		maxDataPoints: 100,
		timeBase: new Date().getTime()
	}); 
    // instantiate our graph!
var graph = new Rickshaw.Graph( {
	element: document.getElementById("chart"),
	width: 300,
	height: 200,
	renderer: 'line',
	series: newSeries
} );
var time = new Rickshaw.Fixtures.Time();
var seconds = time.unit('second');

var xAxis = new Rickshaw.Graph.Axis.Time({
    graph: graph,
    timeUnit: seconds
});

xAxis.render(); 
var yAxis = new Rickshaw.Graph.Axis.Y({
    graph: graph
});

yAxis.render();
    
// add some data every 100 msec
var iv = setInterval( function() {

	  var data = { 'mass': mfmData  };

	  graph.series.addData(data);
	  graph.render();

     }, 100);
    
    
}// end of Ga inject trigger

// send solenoid trigger message
var rs =  document.getElementById("rs");

rs.onclick = function() {
     debugDiv.innerHTML ='into trigger'; 
       s.emit('trigger', {
            device: "RStrigger",
            value: 1
        }); 
    }




//--------------Sensors -----------------
  
   var sumH2 = document.getElementById("totalH2");
   

    
        s.on('sensor', function(data) {
        
        switch(data.sensor){
               
         case "GRBtemp":     
            GRBtemperature = data.value;
            g2.refresh(GRBtemperature); 
            debugDiv.innerHTML ='GRB Temp' + GRBtemperature;    
            break;
                
          case "SATtemp":     
            SATtemperature = data.value;
            g3.refresh(SATtemperature); 
            //debugDiv.innerHTML ='SAT Temp' + SATtemperature;   
            break; 
                
          case "GAStemp":     
            GAStemperature = data.value;
            g1.refresh(GAStemperature);   
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
                           
           case "mfm":
             mfmData =Math.abs(data.value);
             totalH2 = totalH2 + mfmData/10;/// very rough trapazoidal integration
             //debugDiv.innerHTML ='MFM data ' + mfmData;
            sumH2.innerHTML = totalH2.toFixed(5) + ' grams';
            break;
                
            }//end of switch
               
    }); // end of sensor processing
      

 }// end of loading function 
