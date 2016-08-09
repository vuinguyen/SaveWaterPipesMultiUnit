/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

/*
The Web Sockets Node.js sample application distributed within Intel® XDK IoT Edition under the IoT with Node.js Projects project creation option showcases how to use the socket.io NodeJS module to enable real time communication between clients and the development board via a web browser to toggle the state of the onboard LED.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing/updating MRAA & UPM Library on Intel IoT Platforms with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

OR
In Intel XDK IoT Edition under the Develop Tab (for Internet of Things Embedded Application)
Develop Tab
1. Connect to board via the IoT Device Drop down (Add Manual Connection or pick device in list)
2. Press the "Settings" button
3. Click the "Update libraries on board" option

Review README.md file for in-depth information about web sockets communication

*/

var mraa = require('mraa'); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsersArray = [];
var userId;
var lastUserId = ""; // required change to disconnect

var groveSensor = require('jsupm_grove');

//setup access analog input Analog pin #0 (A0)
var groveSlide1 = new groveSensor.GroveSlide(0);   // pin 0
var groveSlide2 = new groveSensor.GroveSlide(1);   // pin 1
var groveSlide3 = new groveSensor.GroveSlide(2);   // pin 2

var valve1      = new groveSensor.GroveRelay(7);   // pin 7
var valve2      = new groveSensor.GroveRelay(6);   // pin 6
var valve3      = new groveSensor.GroveRelay(5);   // pin 5

var valveState1 = false;
var valveState2 = false;
var valveState3 = false;

function unit(unitNum, unitLetter, slider, valve, valveState, severity) {
    this.unitNum = unitNum;
    this.unitLetter = unitLetter;
    this.slider = slider;
    this.valve = valve;
    this.valveState = valveState;
    this.severity = severity;
};

var unit1 = new unit(1, "A", groveSlide1, valve1, valveState1, 1);
var unit2 = new unit(2, "B", groveSlide2, valve2, valveState2, 1);
var unit3 = new unit(3, "C", groveSlide3, valve3, valveState3, 1);

var unitArray = [unit1, unit2, unit3];

function whichUnit(unitNum) {
    switch(unitNum)
    {
        case 1:
        {   return unit1; break; }
        case 2:
        {   return unit2; break;  }
        case 3:
        {   return unit3; break;  }
        default:
        {   return selectedUnit; break;   }
    }
}

var selectedUnit = null;   // a null object
var pageNumber = 1;
var timeOutSeconds = 3000;  // 1000 is 1 second

var thresholdValue = 0.5;
var ratio = 1/5;            // used to convert slider values to temp
var constant = -36;         // used to convert slider values to temp
var firstTemp = true;       // is this the first temperature reading?

var criticalTemp = 33;
var warningTemp = 38;
var offLineTemp = 10; 

var averageItemCount = 5;
var averageCounter = 0;

// Gotta figure out what to do with all these variables: BEGIN
var rawSlider = 0;
var volts = 0;

var totalVolts = 0;
var totalSlider = 0;
var totalTemp = 0;
var averageVolts = 0;
var averageSlider = 0;
var averageTemp = 0;
// Gotta figure out what to do with all these variables: END

var lcd = require('./lcd');
var display = new lcd.LCD(0);   // 12C socket  

function setLCDColor(inSeverity) 
{
    var red = 0;
    var green = 192;
    var blue = 0;
    
    if (inSeverity == 3)
    {
        red = 192;
        green = 0;
        blue = 0; 
    }
    else if (inSeverity == 2)
    {
        red = 192;
        green = 192;
        blue = 0; 
    }
    
    display.setColor(red, green, blue);
};



function toggleValve(inputUnit)
{
    //var currentValve;
    /*
    switch(valveNum)
    {
        case 1:
        {   //currentValve = valve1; 
            valveState1 = !valveState1;
            if (valveState1 == true) { valve1.on() }
            else { valve1.off(); }
            break;   
        }
        case 2:
        {   //currentValve = valve2; 
            valveState2 = !valveState2;
            if (valveState2 == true) { valve2.on() }
            else { valve2.off(); }
            break;    
        }
        case 3:
        {   //currentValve = valve3; 
            valveState3 = !valveState3;
            if (valveState3 == true) { valve3.on() }
            else { valve3.off(); }
            break;    
        }
    }
    */
    inputUnit.valveState = !inputUnit.valveState;
    if (inputUnit.valveState == true) { inputUnit.valve.on(); }
    else { inputUnit.valve.off(); }
}

//function printSliderValues(sliderNum)
function printSliderValues(inputUnit)
{
    console.log("Slider value " + inputUnit.unitNum + ": " + inputUnit.slider.voltage_value().toFixed(2) + " V");
}

//var currentUnitNum = 1;
//function temperatureLoop(currentUnitNum) 
function temperatureLoop()
{
    // for now, we will display each sensor value in turn, just the raw values
    //console.log("Slider value 1: " + groveSlide1.voltage_value().toFixed(2) + " V");
    //console.log("Slider value 2: " + groveSlide2.voltage_value().toFixed(2) + " V");
    //console.log("Slider value 3: " + groveSlide3.voltage_value().toFixed(2) + " V");
    
    //*/
    if (selectedUnit == null)
    {
        console.log("we got here");
        printSliderValues(unit1);
        printSliderValues(unit2);
        printSliderValues(unit3);
        console.log('\n');
    }
    else
    {
        console.log("no, we got here");
        printSliderValues(selectedUnit);
    }
    /*/
    //var unit = whichUnit(currentUnitNum);
    
    /*
    var unit = unit1;
    //console.log("temp loop, currentUnitNum: " + currentUnitNum);
    console.log("temp loop, inputUnit: " + inputUnit);
    console.log("temp loop, inputUnit: " + inputUnit.unitNum);
    console.log("temp loop, inputUnit.slider: " + inputUnit.slider);
    //*/
    /*
    if ((selectedUnit == null) || (selectedUnit == inputUnit))
        {
                 printSliderValues(inputUnit);
        }
    */
    // wait specified timeout then call function again
    //setTimeout(temperatureLoop, timeOutSeconds);
}

function mainLoop()
{
    // or any of this
   //for (var i = 1; i < 4; i++)
   // {
        //currentUnitNum = i;
        //setTimeout(temperatureLoop, 500);   // half a second
       // temperatureLoop(1);
    //temperatureLoop(unitArray[i]);    // it doesn't like this
    temperatureLoop();
    //}
    setTimeout(mainLoop, timeOutSeconds); 
}

function getTemperature(rawSlider) 
{
    var temperature = (rawSlider * ratio) + constant; // convert slider to temperature
    var temp2 = temperature.toPrecision(3);
    return temp2;
}

function getSeverity(temp)
{
    var severity = 1;
    if (temp <= warningTemp)
    {
        severity = 2;
        if (temp <= criticalTemp)
        {
            severity = 3;
        }
    }
    
    return severity;
}


app.get('/', function(req, res) {
    //Join all arguments together and normalize the resulting path.
    res.sendFile(path.join(__dirname + '/client', 'index.html'));
});

//Allow use of files in client folder
app.use(express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/client'));

//Socket.io Event handlers
io.on('connection', function(socket) {
    console.log("\n Add new User: u"+connectedUsersArray.length);
    if(connectedUsersArray.length > 0) {
        var element = connectedUsersArray[connectedUsersArray.length-1];
        userId = 'u' + (parseInt(element.replace("u", ""))+1);
    }
    else {
        userId = "u0";
    }
    console.log('a user connected: '+userId);
    io.emit('user connect', userId);
    connectedUsersArray.push(userId);
    console.log('Number of Users Connected ' + connectedUsersArray.length);
    console.log('User(s) Connected: ' + connectedUsersArray);
    io.emit('connected users', connectedUsersArray);
    
    // once we're connected, start the loop
    //temperatureLoop();
    mainLoop();
    
    /*
    socket.on('user disconnect', function(msg) {
        console.log('remove: ' + msg);
        connectedUsersArray.splice(connectedUsersArray.lastIndexOf(msg), 1);
        io.emit('user disconnect', msg);
    });
    */
    
    // Note: In order for the original webserver application worked, the client 
    // really needed to send a 'user disconnect' message first before it can send
    // a disconnect message. Before, the client tried to send only a 'user disconnect' 
    // message but there was 'disconnect' message, and so the client (web or mobile) never 
    //  really disconnected. I fixed that problem with my implementation.
    
    socket.on('user disconnect', function(msg) {
        lastUserId = msg;
        io.emit('user disconnect', msg);
    });
    
    socket.on('disconnect', function(msg) { 
        if (msg) {lastUserId = msg;}
        console.log('remove: ' + lastUserId);
        connectedUsersArray.splice(connectedUsersArray.lastIndexOf(lastUserId), 1);
        //io.emit('user disconnect', lastUserId);
        lastUserId = "";
});
   // Required changes to actually disconnect: END 
    
    socket.on('select unit', function(msg) {
        console.log("Unit Selected Is: " + msg.value); 
        selectedUnit = whichUnit(msg.value);
    });
    
    socket.on('page number', function(msg) {
        console.log("Page number is: " + msg.value); 
        pageNumber = msg.value;
        if (pageNumber == 1) { selectedUnit = null; }
    });
    
});


http.listen(3000, function(){
    console.log('Web server Active listening on *:3000');
});