var socket = io();
var userId = "user";

$("#button-unit1").on('click', function(e){
    socket.emit('select unit', {value: 1});
});

$("#button-unit2").on('click', function(e){
    socket.emit('select unit', {value: 2});
});

$("#button-unit3").on('click', function(e){
    socket.emit('select unit', {value: 3});
});

/*
socket.on('toogle led', function(msg) {
    if(msg.value === false) {
        $('#messages').prepend($('<li>Toogle LED: OFF<span> - '+msg.userId+'</span></li>'));
        $("#led-container").removeClass("on");
        $("#led-container").addClass("off");
        $("#led-container span").text("OFF");
    }
    else if(msg.value === true) {
        $('#messages').prepend($('<li>Toogle LED: ON<span> - '+msg.userId+'</span></li>'));
        $("#led-container").removeClass("off");
        $("#led-container").addClass("on");
        $("#led-container span").text("ON");
    }
});

socket.on('chat message', function(msg) {
    $('#messages').prepend($('<li>'+msg.value+'<span> - '+msg.userId+'</span></li>'));
});
*/

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

socket.on('user connect', function(msg) {
    if(userId === "user"){
        console.log("Client side userId: "+msg);
        userId = msg;
    }
});

/*
// This doesn't seem to work
socket.on('temp value', function(msg) {
    var now = new Date();
    var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    //$('#temperature-table').prepend($('Testing'));
    console.log("From page 1: unitNum is: " + msg.unitNum + ", temp is: " + msg.temp);
    
    
    /*
    <tr class="warning">
        <td class="row-temperature"> 38 F </td>
        <td class="row-time"> 8:15PM </td>
      </tr>
      */
});
*/


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
    socket.emit("page number", {value: 1});
};