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
					output += "\"" + s.getId() + "\"" + ",";
				}
				output +=
						 "\""
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

	}

	@OnMessage
	public void receiveTextMessage(Session session, String msg, boolean last)
			throws IOException {
		
		System.out.println("Message im Server erhalten: " + msg);
		SocketMessage sMessage = null;
		try {
			sMessage = new SocketMessage(msg);
		} catch (JSONException e2) {
			e2.printStackTrace();
			sendError(session, 0, "Fehlerhafte Nachricht erhalten!");
		}
		switch (sMessage.GetMessageType()) {
		case 1:

			try {
				session.getBasicRemote().sendText(
						new SocketMessage(2, new Object[] { 1 })
								.GetJsonString());
			} catch (JSONException e2) {
				e2.printStackTrace();
				sendError(session, 1, "LoginResponseOK konnte nicht erstellt werden!");
			}
			break;
		case 5:
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
		}

	}
	
	public static void sendError(Session _session, int _fatal, String _message){
		Session session = _session;
		int fatal = _fatal;
		String message = _message;
		try {
			session.getBasicRemote().sendText(new SocketMessage(255, new Object[]{fatal, message}).GetJsonString());
		} catch (JSONException | IOException e) {
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
