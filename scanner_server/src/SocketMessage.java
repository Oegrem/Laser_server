import laser_distance_scanner.Distance_scanner;

import org.json.JSONException;
import org.json.JSONObject;

public class SocketMessage {

	private String jsonString;

	private int messageType;

	private Object[] message = new Object[6];

	public SocketMessage(String _jsonString) throws JSONException {
		jsonString = _jsonString;
		// Auslesen messageType
		JSONObject jObject;
		jObject = new JSONObject(jsonString);

		messageType = jObject.getInt("messageType");
		switch (messageType) {
		case 11:
			System.out.println("Connection successful");
			Distance_scanner.getDistanceScanner().recordSimFile("file1");
			break;
		case 12:
			System.out.println("Record stop");
			Distance_scanner.getDistanceScanner().stopRecording();
		break;
		case 35:
			switch(SSEServlet.dataIndex){
			case 1:
				SSEServlet.dataIndex = 2;
				break;
			case 2:
				SSEServlet.dataIndex = 1;
				break;
			}
			System.out.println("DataIndex changed");
			break;
		}
	}

	public SocketMessage(int _messageType, Object[] _message)
			throws JSONException {
		messageType = _messageType;
		message = _message;
		JSONObject jObject = new JSONObject();
		jObject.put("messageType", messageType);

		switch (messageType) {
		default:
			break;
		}
		jsonString = jObject.toString();
	}

	public String GetJsonString() {
		return jsonString;
	}

	public int GetMessageType() {
		return messageType;
	}

	public Object[] GetMessage() {
		return message;
	}
}
