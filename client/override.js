$(document).ready(function(){
	//Get Current data
	var now = new Date();
	var months = new Array(
      "January","February","March","April","May",
      "June","July","August","September","October",
      "November","December");
	var date =  months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
	
	$("#currentDate").text("Date : " + date);
	
	$("#override").click(function() {
	  
	  //Check faucetStatus
	  var currentStatus = $("#status").text();
	  
	  if (currentStatus == "DRIPPING")
	  {
		$("#status").text("NOT DRIPPING");
		$("#faucetStatus").attr("src","faucetOff.jpg");  
	  }
	  else
	  {
		$("#status").text("DRIPPING");
		$("#faucetStatus").attr("src","faucetOn.jpg");  
	  }
	  
	});
	
	//Unorder List for temperature. 
	//Display top 10 and when you select the link, previous temperature, it displays the next 10.
	$('ul li:gt(9)').hide();
	
	$('.display-previous').click(function() {
		$('ul li:gt(9)').show("blind");
	});
});