/**
 * @author Tobias
 */


// Starte Funktion init wenn index.html vollständig geladen ist
document.addEventListener("DOMContentLoaded", init, false);

var socket;
var readyToSend = false;

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

// Wird aufgerufen wenn Client vom Server SSE Packet erhält
function sseDataListener(event) {
	// Gesendete Daten von JSON in Object umwandeln
	var data = JSON.parse(event.data);
	
	// Punktliste aus Datenobjekt bekommen
	var pList = data.pointList;
	
	// Canvas abhängig vom Zoom und Verschiebung leeren
	ctx.clearRect((-c.width / 2) * (1 / scaling) - xMove, (-c.height / 2)
			* (1 / scaling) - yMove, c.width * (1 / scaling), c.height
			* (1 / scaling));

	// Zeichne Kreis in der Mitte mit Radius 30
	for (var b = 0; b < 360; b++) {
		ctx.fillRect(Math.cos(b) * 30, Math.sin(b) * 30, 2, 2);
	}

	// Zeichne Punkte oder Cluster je nach Daten
	switch(data.d){
	case 1:
		
		// Zeichne alle Punkte
		for (var i = 0; i < pList.length; i++) {
			x = pList[i].x;
			y = pList[i].y;
			ctx.fillRect(x, y, 2, 2);
		}
		break;
	case 2:
		
		// Zeichne alle Cluster
		for (var i = 0; i < pList.length; i++) {
			x = pList[i].x;
			y = pList[i].y;
			l = pList[i].l;
			w = pList[i].w;
			ctx.fillRect(x, y, l, w);
		}
		break;
	}
	
}

// Wird aufgerufen wenn Socket Nachricht eintrifft
function socketReceive(message) {
	
	// Nachricht von JSON in Object umwandeln
	var sMessage = JSON.parse(message.data);
	console.log(message);
	console.log(sMessage.messageType);
	
	// Je nach Nachrichten Typ verschiendene Aktionen ausführen
	switch (sMessage.messageType) {

	default:
		break;
	}
}


// Wird bei Aktion (Buttonclick o.Ä.) aufgerufen
function socketSend(type) {
	
	// Nur falls Socket geöffnet wurde senden
	if (readyToSend == true) {
		// Senden
		
		// Zusammenstellen von JSON String
		var messageType = type;
		var jsonSend;
		
		// Abhängig von zu sendendem Nachrichten Typ verschiedene Pakete aufbauen
		switch (messageType) {
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

		// Nachricht senden
		socket.send(jsonSend);
	}
}


// Wird am Start aufgerufen (nachdem HTML komplett geladen ist)
function init() {

	// URL des Java Servlets für Sockets
	var url = 'ws://localhost:8080/scanner_server/SocketHandler';
	// Neuer Websocket eröffnen
	socket = new WebSocket(url);

	// Anonyme Function zu Socket hinzufügen (beim Öffnen des Sockets)
	socket.onopen = function() {
		readyToSend = true;
	}

	// Anonyme Function zu Socket hinzufügen (beim Error des Sockets)
	socket.onerror = function(event) {
		alert("Fehler bei den Websockets " + event.data);
	}

	// Anonyme Function zu Socket hinzufügen (beim Schließen des Sockets)
	socket.onclose = function(event) {
		console.log("Websockets closing " + event.code);
	}

	// Bei empfangener Nachricht wird Funktion aufderufen
	socket.onmessage = socketReceive;

	// Record Button Objekt von HTML bekommen
	var record = document.getElementById("record");

	// Anonyme Funktion wird ausgeführt bei Click auf Button
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
	
	// ChangeDataIndex Button Objekt von HTML bekommen
	var chDataIndex = document.getElementById("chDataIndex");

	// Anonyme Funktion wird ausgeführt bei Click auf Button
	chDataIndex.addEventListener("click", function(){
		socketSend(35);
	}, false);
	
	// Eröffnen des Canvas aus HTML
	c = document.getElementById("can");
	// 2D Grafik von Canvas bekommen
	ctx = c.getContext("2d");
	ctx.moveTo(0, 0);
	// Position (0,0) als Mittelpunkt festlegen
	ctx.translate(c.width / 2, c.height / 2);
	// X/Y Richtungen anpassen
	ctx.scale(1, -1);

	// Scale_Up Button von HTML bekommen
	var scale_up = document.getElementById("scale_up");

	// Anonyme Funktion bei Click ausführen
	scale_up.addEventListener("click", function() {
		
		// Canvas Bild Größe um 10% vergrößern
		ctx.scale(1.1, 1.1);
		scaling *= 1.1;
	
	}, false);

	// Scale_Down Button von HTML bekommen
	var scale_down = document.getElementById("scale_down");

	// Anonyme Function bei Click ausführen
	scale_down.addEventListener("click", function() {
		
		// Canvas Bild Größe um 10% verkleinern
		ctx.scale(0.9, 0.9);
		scaling *= 0.9;
	
	}, false);

	// Reset Button von HTML bekommen
	var reset = document.getElementById("reset");
	
	// Anonyme Funktion bei Click ausführen
	reset.addEventListener("click", function() {
		
		// Canvas Bild Größe zurücksetzen
		ctx.scale(1 / scaling, 1 / scaling);
		scaling = 1;

		// Canvas Verschiebung zurücksetzen
		ctx.translate(-xMove, -yMove);
		
		// Mausbewegung zurücksetzen
		xMove = 0;
		yMove = 0;
		
	}, false);

	// Anonyme Function bei MouseDown im Canvas ausführen
	c.addEventListener("mousedown", function() {
		// MouseDownFlag auf True
		mdFlag = 1;
		
		// MouseDelta (Maus bewegung) resetten (auf jetzige Mausposition setzen)
		mouseDeltaX = event.pageX;
		mouseDeltaY = event.pageY;
	}, false);

	// Anonyme Function bei MouseMove im Canvas ausführen
	c.addEventListener("mousemove", function(event) {
		// Bei Mausbewegung und bei Mausdruck 
		if (mdFlag == 1) {
			
			// Mausbewegung errechnen
			var xDelta = event.pageX - mouseDeltaX;
			var yDelta = mouseDeltaY - event.pageY;
			
			// Canvas Bild mit Mausbewegung verschieben
			ctx.translate(xDelta, yDelta);
			
			// Insgesamte Mausbewegung zusammenzählen
			xMove += xDelta;
			yMove += yDelta;
			
			// Mousebewegung resetten
			mouseDeltaX = event.pageX;
			mouseDeltaY = event.pageY;
		}
	}, false);

	// Anonyme Function bei MouseUp im Canvas ausführen
	c.addEventListener("mouseup", function() {
		// MouseDownFlag auf False
		mdFlag = 0;
	}, false);

	// Neues SSE eröffnen
	var source = new EventSource("SSEServlet");
	
	// Function ausführen bei bekommener Nachricht
	source.addEventListener('message', sseDataListener, false);
	
	// Anonyme Function beim Eröffnen des SSE
	source.addEventListener('open', function() {
		console.log("SSE Opened!");
	}, false);
	
	// Anonyme Function beim Error des SSE
	source.addEventListener('error', function() {
		if (event.eventPhase == EventSource.CLOSED) {
			console.log("Error: Connection Closed");
		} else
			console.log("Error: SSE");
	}, false);
}

