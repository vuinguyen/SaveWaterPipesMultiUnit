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
    
    // keep track of internal values as we're doing calculations
    // in temperatureLoop()
    this.currentRawSlider = 0;
    this.currentVolts = 0;
    
    this.rawSlider = 0;
    this.volts = 0;

    this.totalVolts = 0;
    this.totalSlider = 0;
    this.totalTemp = 0;
    
    this.averageVolts = 0;
    this.averageSlider = 0;
    this.averageTemp = 0;
    
    this.averageCounter = 0;   
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

var thresholdValue = 0.5;   // threshold of whether values changed enough for calculations
var ratio = 1/5;            // used to convert slider values to temp
var constant = -36;         // used to convert slider values to temp
var firstTemp = true;       // is this the first temperature reading?

var criticalTemp = 33;
var warningTemp = 38;
var offLineTemp = 10; 

var averageItemCount = 5;   // the number of values required to find an average
 

// We may not need LCDs for multi-unit demo unless we have at least three
// LCD code: BEGINS
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
// LCD code: ENDS


function toggleValve(inputUnit)
{
    inputUnit.valveState = !inputUnit.valveState;
    if (inputUnit.valveState == true) { inputUnit.valve.on(); }
    else { inputUnit.valve.off(); }
}

// we must update the website whenever the valve opens or closes
function printValveInfo() 
{
    
}

function openValve(inputUnit)
{
    printValveInfo();
    inputUnit.valve.on();
    //inputUnit.valveState = false;
    console.log("Unit " + inputUnit.unitNum + ": valve open");
}

function closeValve(inputUnit)
{
    printValveInfo();
    inputUnit.valve.close();
    //inputUnit.valveState = true;
    console.log("Unit " + inputUnit.unitNum + ": valve closed");
}

//function printSliderValues(sliderNum)
function printSliderValues(inputUnit)
{
    console.log("Slider value " + inputUnit.unitLetter + ": " + inputUnit.slider.voltage_value().toFixed(2) + " V");
}
 
function printSensorInfo(inputUnit, inTemp, inSeverity, average)
{
    // print to console
    var consoleDisplay = (average) ? "Unit: " + inputUnit.unitLetter + ", Average temp: " + inTemp + " F" + ", Severity: " + inSeverity + "\n" : 
    "Unit: " + inputUnit.unitLetter + ", Current temp: " + inTemp + " F" + ", Severity: " + inSeverity + "\n";
    console.log(consoleDisplay);
    
    // print to website
    
    // print to LCD Display
}

function temperatureLoop()
{
    // for now, we will display each sensor value in turn, just the raw values
    //console.log("Slider value 1: " + groveSlide1.voltage_value().toFixed(2) + " V");
    //console.log("Slider value 2: " + groveSlide2.voltage_value().toFixed(2) + " V");
    //console.log("Slider value 3: " + groveSlide3.voltage_value().toFixed(2) + " V");
    
    //*/
    // can I do a loop here? yes!
    // go through this logic for all three units
    for (var i = 0; i < 3; i++)
    {
        unitArray[i].currentRawSlider = unitArray[i].slider.raw_value();
        unitArray[i].currentVolts     = unitArray[i].slider.voltage_value();
        
        // if this is the first temp value or we've hit greater than the threshold
        if ((firstTemp == true) || 
            (Math.abs(unitArray[i].currentVolts - unitArray[i].volts) > thresholdValue))
        {
            unitArray[i].rawSlider = unitArray[i].currentRawSlider;
            unitArray[i].volts     = unitArray[i].currentVolts;
            
            // print values depending on selected unit
            if ((selectedUnit == null) || (selectedUnit == unitArray[i]))
            {
                var temp     = getTemperature(unitArray[i].rawSlider);
                var severity = getSeverity(temp);
                //printSliderValues(unitArray[i]);
                printSensorInfo(unitArray[i], temp, severity);
            }
            firstTemp = false;
        }
        // we are at or less than the threshold value
        else if (Math.abs(unitArray[i].currentVolts - unitArray[i].volts) <= thresholdValue) 
            {
                unitArray[i].rawSlider = unitArray[i].currentRawSlider;
                unitArray[i].volts     = unitArray[i].currentVolts;
                
                unitArray[i].totalVolts  = unitArray[i].volts + unitArray[i].totalVolts;
                unitArray[i].totalSlider = unitArray[i].rawSlider + unitArray[i].totalSlider;
                
                var temp = getTemperature(unitArray[i].rawSlider);
                unitArray[i].totalTemp = parseFloat(temp) + parseFloat(unitArray[i].totalTemp);
                //console.log("Unit: "+ unitArray[i] + ", Temp: " + temp + ", totalTemp: " + unitArray[i].totalTemp + "\n");
                
                // and then check for counter
                if (unitArray[i].averageCounter == averageItemCount)
                {
                    // and then find your average
                    unitArray[i].averageVolts = (unitArray[i].totalVolts / averageItemCount);
                    unitArray[i].averageSlider = (unitArray[i].totalSlider / averageItemCount);
                    unitArray[i].averageTemp = (unitArray[i].totalTemp / averageItemCount).toPrecision(3);
                    
                    var averageSeverity = getSeverity(unitArray[i].averageTemp);
                    
                    // print values depending on selected unit
                    if ((selectedUnit == null) || (selectedUnit == unitArray[i]))
                    {
                        // this needs work
                        //printSliderValues(unitArray[i]);
                        printSensorInfo(unitArray[i], unitArray[i].averageTemp, averageSeverity, 1);
                    }
                  
                    // if valve is open close it
                    if ((unitArray[i].averageSeverity <= 2) && (unitArray[i].valveState == true))
                    {
                        // close the valve
                        // NOTE: CANNOT do this inversion in the closeValve/openValve functions.
                        unitArray[i].valveState = !unitArray[i].valveState; // invert the valveState
                        closeValve(unitArray[i]);
                    }    
                    // if valve is closed, open it
                  
                    if ((unitArray[i].averageSeverity == 3) && (unitArray[i].valveState == false))
                    {
                        // open the valve
                        // NOTE: CANNOT do this inversion in the closeValve/openValve functions.
                        console.log("Unit " + inputUnit.unitNum + ": valve open");
                        openValve(unitArray[i]);
                    } 
                  
                    // reset all variables for that unit  
                    unitArray[i].totalSlider    = 0;
                    unitArray[i].totalVolts     = 0;
                    unitArray[i].totalTemp      = 0;
                    
                    unitArray[i].averageSlider  = 0;
                    unitArray[i].averageVolts   = 0;
                    unitArray[i].averageTemp    = 0;
                    
                    unitArray[i].averageCounter = 0;  
                } // end check for counter
                
                unitArray[i].averageCounter++;
            }
    }   // end for loop for all three units
    
    /*
     if ((selectedUnit == null) || (selectedUnit == unitArray[i]))
        {
                 printSliderValues(unitArray[i]);
        }
    */
    
    /*
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
    */
    
    
    // I don't know if this will work, don't try it!
    // wait specified timeout then call function again
    //setTimeout(temperatureLoop, timeOutSeconds);
}

function mainLoop()
{
    // None of this works, don't do it!
   //for (var i = 1; i < 4; i++)
   // {
    //temperatureLoop(unitArray[i]);    // it doesn't like this
    //}
    
    temperatureLoop();
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