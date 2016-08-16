var socket = io();
var userId = "user";
var valveState = false; // valve is currently closed
var selectedUnitNum = 1;   // by default, we pick the first one

socket.on('temp value', function(msg) {
    var now = new Date();
    var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    
    // console logs don't actually get displayed from here
    console.log("From page 2: unitNum is: " + msg.unitNum + ", temp is: " + msg.temp); 
    
    if (msg.severity == 1)
    {
        $('#temperature-table').prepend($('<tr class="good"><td class="row-temperature">'+msg.temp+' F</td><td class="row-time">'+time+'</td></tr>'));
    }
    else if (msg.severity == 2)
    {
         $('#temperature-table').prepend($('<tr class="warning"><td class="row-temperature">'+msg.temp+' F</td><td class="row-time">'+time+'</td></tr>'));   
    }
    else if (msg.severity == 3)
    {
        $('#temperature-table').prepend($('<tr class="danger"><td class="row-temperature">'+msg.temp+' F</td><td class="row-time">'+time+'</td></tr>'));
    }
    /*
    <tr class="warning">
        <td class="row-temperature"> 38 F </td>
        <td class="row-time"> 8:15PM </td>
      </tr>
      */
});

$("#button-on").on('click', function(e){
    socket.emit('open valve', {selectedUnitNum: selectedUnitNum});
});

$("#button-off").on('click', function(e){
    socket.emit('close valve', {selectedUnitNum: selectedUnitNum});
});

$("#button-auto").on('click', function(e){
    socket.emit('auto valve', {selectedUnitNum: selectedUnitNum});
});

function openValve()
{
    $("#status").text("DRIPPING");
    $("#faucetStatus").attr("src","faucetOn.jpg"); 
};

function closeValve()
{
    $("#status").text("NOT DRIPPING");
    $("#faucetStatus").attr("src","faucetOff.jpg"); 
};

socket.on('open valve', function(msg) {
    valveState = !valveState;
    openValve();   
});
    
socket.on('close valve', function(msg) {
    valveState = !valveState;
    closeValve();  
});

socket.on('toggle valve', function(msg) {
    if (msg.valveState == true)
    {
        openValve();
    }
    else 
    {
        closeValve();   
    }
});

// this may be OBE: BEGIN
socket.on('connected users', function(msg) {
    $('#user-container').html("");
    for(var i = 0; i < msg.length; i++) {
        //console.log(msg[i]+" )msg[i] == userId( "+userId);
        if(msg[i] == userId)
            $('#user-container').append($("<div id='" + msg[i] + "' class='my-circle'><span>"+msg[i]+"</span></div>"));
        else
            $('#user-container').append($("<div id='" + msg[i] + "' class='user-circle'><span>"+msg[i]+"</span></div>"));
    }
});
// this may be OBE: END

socket.on('user connect', function(msg) {
    if(userId === "user"){
        console.log("Client side userId: "+msg);
        userId = msg;
    }
    socket.emit("check unit", userId);
});

// from here, we get the unit selected and the state of the unit's valve
socket.on('check unit', function(msg) {
    selectedUnitNum = msg.unitNum;
    valveState = msg.valveState;
    
    if (msg.valveState == true)
    {
        openValve();
    }
    else 
    {
        closeValve();   
    }
    
});

socket.on('user disconnect', function(msg) {
    console.log("user disconnect: " + msg);
    var element = '#'+msg;
    console.log(element)
    $(element).remove();
});

window.onunload = function(e) {
    socket.emit("user disconnect", userId);
};

window.onload = function(e) {
    socket.emit("page number", {value: 2});
};