/**
 * @author Tobias
 */
document.addEventListener("DOMContentLoaded", init, false);

var activeCatalog = "";

var request;

var socket;
var readyToSend = false;

var isQuestionActive = false;

var isRecording = false;

var scaling = 1;

var mouseDeltaX = -1;
var mouseDeltaY = -1;

var xMove = 0;
var yMove = 0;

var x;
var y;
var l;
var w;
var c;
var ctx;

var mdFlag = 0;

function sseDataListener(event) {
	var data = JSON.parse(event.data);
	var pList = data.pointList;
	ctx.clearRect((-c.width / 2) * (1 / scaling) - xMove, (-c.height / 2)
			* (1 / scaling) - yMove, c.width * (1 / scaling), c.height
			* (1 / scaling));

	for (var b = 0; b < 360; b++) {
		ctx.fillRect(Math.cos(b) * 30, Math.sin(b) * 30, 2, 2);
	}

	switch(data.d){
	case 1:
		for (var i = 0; i < pList.length; i++) {
			x = pList[i].x;
			y = pList[i].y;
			ctx.fillRect(x, y, 2, 2);
		}
		break;
	case 2:
		for (var i = 0; i < pList.length; i++) {
			x = pList[i].x;
			y = pList[i].y;
			l = pList[i].l;
			w = pList[i].w;
			ctx.fillRect(x, y, l, w);
		}
		break;
	case 3:
		for(var i=0; i<pList.length;i++){
			var color = pList.i;
			ctx.beginPath();
			ctx.moveTo(pList.list[0].x,pList.list[0].y);
			for(var c=1; c<pList.list.length; c++){
				ctx.lineTo(pList.list[c].x,pList.list[c].y);				
				console.log(pList.list[c].x);
			}
			switch(color%5){
			case 0:
				context.strokeStyle = '#00ffff';
				break;
			case 1:
				context.strokeStyle = '#00ff00';
				break;
			case 2:
				context.strokeStyle = '#0000ff';
				break;
			case 3:
				context.strokeStyle = '#800080';
				break;
			case 4:
				context.strokeStyle = '#ffff00';
				break;
			}
			ctx.stroke();
		}
		break;
	}
	
}

function socketReceive(message) {
	var sMessage = JSON.parse(message.data);
	console.log(message);
	console.log(sMessage.messageType);
	switch (sMessage.messageType) {
	case 2:
		console.log("Player ID: " + sMessage.playerId);
		playerId = sMessage.playerId;
		login();
		break;
	case 5:
		console.log("Cat changed: " + sMessage.catName);
		activeCatalog = sMessage.catName;
		chooseCatalog(activeCatalog);
		break;
	case 7:
		showGameDiv();
		socketSend(8);
		break;
	case 9:
		curQuestion = sMessage.question;
		curAnswer1 = sMessage.answer1;
		curAnswer2 = sMessage.answer2;
		curAnswer3 = sMessage.answer3;
		curAnswer4 = sMessage.answer4;
		curTimeOut = sMessage.timeOut;
		showQuestion();
		isQuestionActive = true;
		break;
	case 11:
		console.log("Correct: " + sMessage.correct);

		document.getElementById(curSelection).style.borderColor = "red";
		document.getElementById(curSelection).style.backgroundColor = "#FF0800";

		document.getElementById(sMessage.correct).style.borderColor = "green";
		document.getElementById(sMessage.correct).style.backgroundColor = "#8DB600";

		isQuestionActive = false;
		window.setTimeout(function() {
			socketSend(8);
		}, 2000)
		break;
	case 12:
		console.log("Spiel ende!");
	//	GameOver(sMessage);
		break;
	case 255:
		if (sMessage.fatal == 1) {
			ErrorBlinken(sMessage.errorMessage);
		} else {
			console.log("Warning: " + sMessage.errorMessage);
		}
		break;
	default:
		break;
	}
}

function socketSend(type) {
	if (readyToSend == true) {
		// Senden
		var messageType = type;
		var jsonSend;
		switch (messageType) {
		case 1:
			var loginName = document.getElementById("inputBox").value;
			jsonSend = JSON.stringify({
				messageType : messageType,
				loginName : loginName
			});
			break;
		case 5:
			var catName = activeCatalog;
			jsonSend = JSON.stringify({
				messageType : messageType,
				catName : catName
			});
			break;
		case 7:
			jsonSend = JSON.stringify({
				messageType : messageType
			});
			break;
		case 8:
			jsonSend = JSON.stringify({
				messageType : messageType
			});
			break;
		case 10:
			jsonSend = JSON.stringify({
				messageType : messageType,
				selection : selection
			});
			break;
		case 11:
			jsonSend = JSON.stringify({
				messageType : messageType
			});
		case 12:
			jsonSend = JSON.stringify({
				messageType : messageType
			});
			break;
		case 35:
			jsonSend = JSON.stringify({
				messageType : messageType
			});
			break;
		default:
			jsonSend = JSON.stringify({
				messageType : messageType
			});
			break;
		}

		socket.send(jsonSend);
	}
}

function init() {
	var buttons = document.getElementsByClassName("button");

	var url = 'ws://localhost:8080/scanner_server/SocketHandler';
	socket = new WebSocket(url);

	socket.onopen = function() {
		readyToSend = true;
	}

	socket.onerror = function(event) {
		alert("Fehler bei den Websockets " + event.data);
	}

	socket.onclose = function(event) {
		console.log("Websockets closing " + event.code);
	}

	socket.onmessage = socketReceive;

	var record = document.getElementById("record");

	record.addEventListener("click", function() {
		if (!isRecording) {
			socketSend(11);
			isRecording = true;
			record.innerHTML = "Stop";
		} else {
			socketSend(12);
			isRecording = false;
			record.innerHTML = "Record";
		}
	}, false);
	
	var chDataIndex = document.getElementById("chDataIndex");

	chDataIndex.addEventListener("click", function(){
		socketSend(35);
	}, false);
	
	c = document.getElementById("can");
	ctx = c.getContext("2d");
	ctx.moveTo(0, 0);
	ctx.translate(c.width / 2, c.height / 2);
	ctx.scale(1, -1);

	var scale_up = document.getElementById("scale_up");

	scale_up.addEventListener("click", function() {
		ctx.scale(1.1, 1.1);
		scaling *= 1.1;
	}, false);

	var scale_down = document.getElementById("scale_down");

	scale_down.addEventListener("click", function() {
		ctx.scale(0.9, 0.9);
		scaling *= 0.9;
	}, false);

	var reset = document.getElementById("reset");
	reset.addEventListener("click", function() {
		ctx.scale(1 / scaling, 1 / scaling);
		scaling = 1;

		ctx.translate(-xMove, -yMove);
		xMove = 0;
		yMove = 0;
	}, false);

	c.addEventListener("mousedown", function() {
		mdFlag = 1;
		mouseDeltaX = event.pageX;
		mouseDeltaY = event.pageY;
	}, false);

	c.addEventListener("mousemove", function(event) {
		if (mdFlag == 1) {
			var xDelta = event.pageX - mouseDeltaX;
			var yDelta = mouseDeltaY - event.pageY;
			ctx.translate(xDelta, yDelta);
			xMove += xDelta;
			yMove += yDelta;
			mouseDeltaX = event.pageX;
			mouseDeltaY = event.pageY;
		}
	}, false);

	c.addEventListener("mouseup", function() {
		mdFlag = 0;
	}, false);

	var source = new EventSource("SSEServlet");
	source.addEventListener('message', sseDataListener, false);
	source.addEventListener('open', function() {
		console.log("SSE Opened!");
	}, false);
	source.addEventListener('error', function() {
		if (event.eventPhase == EventSource.CLOSED) {
			console.log("Error: Connection Closed");
		} else
			console.log("Error: SSE");
	}, false);
}

function hoverButton(event) {
	var button = event.target;
	if (button.isChosen != true) {
		button.style.backgroundColor = "green";
	}
}

function leaveButton(event) {
	var button = event.target;
	if (button.isChosen != true) {
		button.style.backgroundColor = "#c4c4c4";
	}
}

function clickButton(event) {
	var button = event.target;
	if (playerId == 0) {
		if (button.isChosen != true) {
			chooseCatalog(button.textContent);
			socketSend(5);
		}
	}
}

function StartButtonClick(event) {
	if (playerId == 0) {
		var catalogs = document.getElementsByClassName("button");
		if (activeCatalog == "") {
			ErrorBlinken("Kein Katalog ausgew�hlt!");
		} else {
			socketSend(7);
		}
	}
}
