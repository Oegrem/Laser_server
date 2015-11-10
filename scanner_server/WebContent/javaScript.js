/**
 * @author Tobias
 */
document.addEventListener("DOMContentLoaded", init, false);

var activeCatalog = "";

var request;

var socket;
var readyToSend = false;

var playerId = -1;

var curQuestion = "";
var curAnswer1 = "";
var curAnswer2 = "";
var curAnswer3 = "";
var curAnswer4 = "";
var curTimeOut = 0;

var curSelection = -1;

var curPlayerList;

var isQuestionActive = false;

function sseDataListener(event) {
	var playerList = JSON.parse(event.data).playerList;
	var table = document.getElementById("table1").getElementsByTagName("tbody")[0];
	while (table.firstChild) {
		table.removeChild(table.firstChild);
	}
	playerList.sort(function(a, b) {
		return b.score-a.score;
	});
	curPlayerList = playerList;
	for (var i = 0; i < playerList.length; i++) {
		var row = table.insertRow();

		var cellPlayer = row.insertCell();
		cellPlayer.textContent = playerList[i].name;

		var cellScore = row.insertCell();
		cellScore.textContent = playerList[i].score;
	}
	var sButton = document.getElementById("startButton");
	if (sButton != null) {
		if (playerId == 0) {
			if (playerList.length > 1 && sButton.disabled) {
				sButton.disabled = false;
				sButton.style.fontSize = "20px";
				sButton.textContent = "Start";
			}
			if (playerList.length < 2 && sButton.disabled == false) {
				sButton.disabled = true;
				sButton.style.fontSize = "16px";
				sButton.textContent = "Warte auf weitere Spieler...";
			}
		}
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
		GameOver(sMessage);
		break;
	case 255:
		if(sMessage.fatal == 1){
		ErrorBlinken(sMessage.errorMessage);
		}else{
			console.log("Warning: "+sMessage.errorMessage);
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
		var selection = curSelection;
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
		default:
			break;
		}

		socket.send(jsonSend);
	}
}

function init() {
	var buttons = document.getElementsByClassName("button");

	/*var url = 'ws://localhost:8080/scanner_server/SocketHandler';
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

	for (var c = 0; c < buttons.length; c++) {
		buttons[c].addEventListener("mouseover", hoverButton, false);
		buttons[c].addEventListener("mouseleave", leaveButton, false);
		buttons[c].addEventListener("click", clickButton, false);
		buttons[c].isChosen = false;
	}

	var loginButton = document.getElementById("loginButton");

	loginButton.addEventListener("click", function() {
		socketSend(1);
	}, false);

	document.getElementById("table1").getElementsByTagName("tbody")[0]
			.addEventListener("mousedown", tableClickListener, false);

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
*/
	var c = document.getElementById("can");
	var ctx = c.getContext("2d");
	ctx.moveTo(0,0);
	window.setInterval(function() {
	var randx = Math.floor((Math.random() * 200) + 10);
	var randy = Math.floor((Math.random() * 200) + 10);
	ctx.clearRect(0,0,c.width,c.height);
	ctx.fillRect(randx,randy,2,2);
	} ,1000);
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
