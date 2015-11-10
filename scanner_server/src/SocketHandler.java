import java.io.IOException;
import java.nio.ByteBuffer;

import javax.websocket.CloseReason;
import javax.websocket.EndpointConfig;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.json.JSONException;

@ServerEndpoint("/SocketHandler")
public class SocketHandler {

	@OnError
	public void error(Session session, Throwable t) {
		System.out.println("Fehler beim Öffnen des Sockets: " + t);
	}

	@OnOpen
	// Ein Client meldet sich an und eröffnet eine neue Web-Socket-Verbindung
	public void open(Session session, EndpointConfig conf) { // speichern der
																// aktuellen
																// Socket-Session
																// im
																// ConnnectionManager
		ConnectionManager.addSession(session);
		System.out.println("Open Socket mit Session-ID= " + session.getId());
		try {
			if (session.isOpen()) { // Alle Session-IDs aus Connection-Manager
									// auslesen in einem JSON-String speichern
				String output = "[";
				for (int i = 0; i < ConnectionManager.SessionCount() - 1; i++) {
					Session s = ConnectionManager.getSession(i);
					output = output + "\"" + s.getId() + "\"" + ",";
				}
				output = output
						+ "\""
						+ ConnectionManager.getSession(
								ConnectionManager.SessionCount() - 1).getId()
						+ "\"" + "]";

				// Broadcasting : JSON-String an alle Web-Socket-Verbindungen
				// senden
				for (int i = 0; i < ConnectionManager.SessionCount(); i++) {
					Session s = ConnectionManager.getSession(i);
					System.out.println(s);
					s.getBasicRemote().sendText(output, true);
				}

			}
		} catch (IOException e) {
			try {
				session.close();
			} catch (IOException e1) {
				// Ignore
			}
		}
	}

	@OnClose
	// Client meldet sich wieder ab
	public void close(Session session, CloseReason reason) { // Client aus Liste
																// entfernen
		ConnectionManager.SessionRemove(session);
		System.out.println("Close Client.");

		// Alle Session-IDs aus Connection-Manager auslesen in einem JSON-String
		// speichern
		String output = "[";
		for (int i = 0; i < ConnectionManager.SessionCount(); i++) {
			Session s = ConnectionManager.getSession(i);
			output = output + "\"" + s.getId() + "\"" + ",";
		}
		output = output
				+ "\""
				+ ConnectionManager.getSession(
						ConnectionManager.SessionCount() - 1).getId() + "\""
				+ "]";

		// Broadcasting : JSON-String an alle Web-Socket-Verbindungen senden
		for (int i = 0; i < ConnectionManager.SessionCount(); i++) {
			Session s = ConnectionManager.getSession(i);
			try {
				s.getBasicRemote().sendText(output, true);
			} catch (IOException e) {
				// ignore
			}
		}
	}

	@OnMessage
	public void receiveTextMessage(Session session, String msg, boolean last)
			throws IOException {
		
		System.out.println("Message im Server erhalten: " + msg);
		SocketMessage sMessage = null;
		try {
			sMessage = new SocketMessage(msg);
		} catch (JSONException e2) {
			// TODO Auto-generated catch block
			e2.printStackTrace();
			sendError(session, 0, "Fehlerhafte Nachricht erhalten!");
		}
		switch (sMessage.GetMessageType()) {
		case 1:

			p = Quiz.getInstance().createPlayer(
					((String) sMessage.GetMessage()[0]), qError);

			if (qError.isSet()) {
				System.out.println("Login Error: Code: "
						+ Integer.toString(qError.getStatus()));
				sendError(session, 1, "Spieler konnte nicht erstellt werden: "+qError.getDescription());
			}
			try {
				session.getBasicRemote().sendText(
						new SocketMessage(2, new Object[] { p.getId() })
								.GetJsonString());
			} catch (JSONException e2) {
				// TODO Auto-generated catch block
				e2.printStackTrace();
				sendError(session, 1, "LoginResponseOK konnte nicht erstellt werden!");
			}
			break;
		case 5:
			q.changeCatalog(p, (String) sMessage.GetMessage()[0] + ".xml",
					qError);
			if (qError.isSet()) {
				System.out.println(qError.getDescription());
				sendError(session, 1, "Spieler konnte nicht erstellt werden: "+qError.getDescription());
				return;
			}
			for (int i = 0; i < ConnectionManager.SessionCount(); i++) {
				Session s = ConnectionManager.getSession(i);
				try {
					s.getBasicRemote().sendText(
							new SocketMessage(5, sMessage.GetMessage())
									.GetJsonString());
				} catch (IOException | JSONException e) {
					// ignore
				}
			}
			break;
		case 7:
			q.startGame(p, qError);
			if (qError.isSet()) {
				System.out.println(qError.getDescription());
				sendError(session, 1, "Spiel konnte nicht gestartet werden: "+qError.getDescription());
				return;
			}
			for (int i = 0; i < ConnectionManager.SessionCount(); i++) {
				Session s = ConnectionManager.getSession(i);
				try {
					s.getBasicRemote().sendText(
							new SocketMessage(7, sMessage.GetMessage())
									.GetJsonString());
				} catch (IOException | JSONException e) {
					// ignore
				}
			}
			break;
		case 8:
			curTimeOut = new Timer(p, session);
			Question question = q.requestQuestion(p, curTimeOut, qError);
			if (qError.isSet()) {
				System.out.println("Error: "+qError.getDescription());
				sendError(session, 1, "Konnte Question nicht laden: "+qError.getDescription());

			} else if (question == null && !qError.isSet()) {
				System.out.println("Question ist null");
				if(q.setDone(p)){
					System.out.println("Spiel ende");
					for (int i = 0; i < ConnectionManager.SessionCount(); i++) {
						Session s = ConnectionManager.getSession(i);
						try {
							s.getBasicRemote().sendText(
									new SocketMessage(12, new Object[]{true})
											.GetJsonString());
						} catch (IOException | JSONException e) {
							// ignore
						}
					}
					for(Player pTemp : q.getPlayerList()){
						q.removePlayer(pTemp, qError);
						if(qError.isSet()){
							System.out.println(qError.getDescription());
						}	
					}
				}else{
					System.out.println("Spieler ende");
					try {
						session.getBasicRemote().sendText(new SocketMessage(12, new Object[]{false}).GetJsonString());
					} catch (JSONException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
						sendError(session, 0, "Erstellen der GameOver Nachricht fehlgeschlagen!");
					}
				}
			}else{
			String[] answers = new String[4];
			int i = 0;
			try{
			for (String s : question.getAnswerList()) {
					answers[i] = s;
				i++;
			}
			}catch (NullPointerException e) {
				// TODO: handle exception
				e.printStackTrace();
			}
			try {
				session.getBasicRemote().sendText(
						new SocketMessage(9, new Object[] { question.getQuestion(),
								answers[0], answers[1], answers[2], answers[3],
								(int) (question.getTimeout()/1000) }).GetJsonString());
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				sendError(session, 0, "Erstellen der Question Message fehlgeschlagen");
			}
			}
			break;
		case 10:
			long rightAnswer = q.answerQuestion(p,
					(long) sMessage.GetMessage()[0], qError);
			if (qError.isSet()) {
				System.out.println(qError.getDescription());
				sendError(session, 1, "AnswerQuestion fehlgeschlagen: "+qError.getDescription());
				return;
			}
			try {
				session.getBasicRemote().sendText(
						new SocketMessage(11, new Object[] { false, rightAnswer })
								.GetJsonString());
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				sendError(session, 0, "QuestionResult senden fehlgeschlagen!");
			}
			break;
		}

	}
	
	public static void sendError(Session _session, int _fatal, String _message){
		Session session = _session;
		int fatal = _fatal;
		String message = _message;
		try {
			session.getBasicRemote().sendText(new SocketMessage(255, new Object[]{fatal, message}).GetJsonString());
		} catch (JSONException | IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	@OnMessage
	public void receiveBinaryMessage(Session session, ByteBuffer bb,
			boolean last) {
		try {
			if (session.isOpen()) {
				session.getBasicRemote().sendBinary(bb, last);
			}
		} catch (IOException e) {
			try {
				session.close();
			} catch (IOException e1) {
				// Ignore
			}
		}
	}

}
