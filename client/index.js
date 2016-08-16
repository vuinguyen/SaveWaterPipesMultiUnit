var socket = io();
var userId = "user";
var valveState1 = false;    // not dripping
var valveState2 = false;    // not dripping
var valveState3 = false;    // not dripping

function updateStatus(state, valveNum) {
    if (valveNum == 1)
        {
            valveState1 = !valveState1;
            if(state == false)
            {
                $('#unitA').text("Water Pipe: NOT DRIPPING");
            }
            else
            {
                $('#unitA').text("Water Pipe: DRIPPING");    
            }
        }
    else if (valveNum == 2)
        {
            valveState2 = !valveState2;
            if(state == false)
            {
                $('#unitB').text("Water Pipe: NOT DRIPPING");
            }
            else
            {
                $('#unitB').text("Water Pipe: DRIPPING");    
            }
        }
    else if (valveNum == 3)
        {
            valveState3 = !valveState3;
            if(state == false)
            {
                $('#unitC').text("Water Pipe: NOT DRIPPING");
            }
            else
            {
                $('#unitC').text("Water Pipe: DRIPPING");    
            }
        }
};

socket.on('toggle valve', function(msg) {
    updateStatus(msg.valveState, msg.unitNum);
});

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
    // when we first connect, we should check to see if need to change
    // status of dripping / not dripping for all units
    //$("#unitA").text("NOT DRIPPING"); 
    //$("#unitB").text("NOT DRIPPING"); 
    //$("#unitC").text("NOT DRIPPING"); 
    socket.emit("check statuses", userId);
});


socket.on('check statuses', function(msg) {
      valveState1 = msg.valveState1;
      updateStatus(valveState1, 1);

      valveState2 = msg.valveState2;
      updateStatus(valveState2, 2);

      valveState3 = msg.valveState3;
      updateStatus(valveState3, 3);
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
    socket.emit("page number", {value: 1});
};