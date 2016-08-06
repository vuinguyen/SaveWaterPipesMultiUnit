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
//var myOnboardLed = new mraa.Gpio(3, false, true); //LED hooked up to digital pin (or built in pin on Galileo Gen1)
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output
var ledState = true; //Boolean to hold the state of Led

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsersArray = [];
var userId;
var lastUserId = ""; // required change to disconnect

var timeOutSeconds = 3000;  // 1000 is 1 second

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

var index = 0;
var totalVolts = 0;
var totalSlider = 0;
var averageVolts = 0;
var averageSlider = 0;

var sensorChosen = 0;
var pageNumber = 1;

function toggleValve(valveNum)
{
    //var currentValve;
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
}

function printSliderValues(sliderNum)
{
    var slider;
    switch(sliderNum) 
    {
        case 1:
        {
            slider = groveSlide1;
            break;
        }
        case 2: 
        {
            slider = groveSlide2;
            break;
        }
        case 3:
        {
            slider = groveSlide3;
            break;
        }
    }
    console.log("Slider value " + sliderNum + ": " + slider.voltage_value().toFixed(2) + " V");
}


function temperatureLoop() 
{
    // for now, we will display each sensor value in turn, just the raw values
    //console.log("Slider value 1: " + groveSlide1.voltage_value().toFixed(2) + " V");
    //console.log("Slider value 2: " + groveSlide2.voltage_value().toFixed(2) + " V");
    //console.log("Slider value 3: " + groveSlide3.voltage_value().toFixed(2) + " V");
    
    if (sensorChosen == 0)
    {
        printSliderValues(1);
        printSliderValues(2);
        printSliderValues(3);
        console.log('\n');
    }
    else
    {
        printSliderValues(sensorChosen);
    }
    // wait specified timeout then call function again
    setTimeout(temperatureLoop, timeOutSeconds);
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
    temperatureLoop();
    
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
    
    
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
        console.log('message: ' + msg.value);
    });
    
    socket.on('toogle led', function(msg) {
        myOnboardLed.write(ledState?1:0); //if ledState is true then write a '1' (high) otherwise write a '0' (low)
        msg.value = ledState;
        io.emit('toogle led', msg);
        ledState = !ledState; //invert the ledState
    });
    
    socket.on('choose sensor', function(msg) {
        console.log("Sensor Chosen is: " + msg.value); 
        sensorChosen = msg.value;
    });
    
    socket.on('page number', function(msg) {
        console.log("Page number is: " + msg.value); 
        pageNumber = msg.value;
        if (pageNumber == 1) { sensorChosen = 0; }
    });
    
});


http.listen(3000, function(){
    console.log('Web server Active listening on *:3000');
});