import static org.lwjgl.opengl.GL11.GL_POINTS;
import static org.lwjgl.opengl.GL11.glBegin;
import static org.lwjgl.opengl.GL11.glColor3f;
import static org.lwjgl.opengl.GL11.glVertex2f;

import java.awt.Point;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Vector;
import java.util.concurrent.CopyOnWriteArrayList;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONException;
import org.json.JSONObject;

import code_snippets.clusterLineStrip;
import code_snippets.clusterPoint;
import code_snippets.dbscan;
import code_snippets.dbscan;
import data_processing.Cluster;
import laser_distance_scanner.Distance_scanner;
import laser_distance_scanner.SynchronListHandler;

@WebServlet("/SSEServlet")
public class SSEServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private CopyOnWriteArrayList<Point> pointArray = new CopyOnWriteArrayList<Point>();

	// Zähler für Clients => beendet Scanenr wenn kein Client mehr zuhört
	private static Integer sseCount = 0;

	// Index der auszugebenden Daten (Cluster oder Rohdaten)
	public static int dataIndex = 1;

	public SSEServlet() {

	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {

		// cache abstellen
		response.setHeader("pragma", "no-cache,no-store");
		response.setHeader("cache-control",
				"no-cache,no-store,max-age=0,max-stale=0");

		// Protokoll auf Server Sent Events einstellen
		response.setContentType("text/event-stream;charset=UTF-8");

		// Neuer Client
		sseCount++;
		
		// Wenn erster Client
		if (sseCount == 1) {
			
			// Starten des Distanz_Scanners im Sim Mode
			Distance_scanner.setInstantSimulation(true); // call and set to true
			
			// Name des Simulationsfiles
			Distance_scanner.alternativeSimFile = "walk";
			
			// Start
			Distance_scanner.getDistanceScanner().start();
		}

		// Datenstream in dem JSON String übertragen wird
		PrintWriter pw = response.getWriter();
		
		// Bool zum Unterbrechen der While-Schleife bei Fehler
		boolean isConnected = true;
		
		// Läuft solange kein Fehler eintritt
		while (isConnected) {
			
			// JSON String
			String pointList = "";

			// Verschiedene JSON Strings bei verschiedenen übertragenen Daten
			switch (dataIndex) {
			case 1:
				
				// Holen der Daten aus SynchronHandlerList
				pointArray.clear();
				pointArray.addAll(SynchronListHandler.getPointVector());

				// Vector<clusterLineStrip> vClS =
				// dbscan.getClustersAsLines(SynchronListHandler.getPointVector(),1);

				
				// Aus den Daten JSON Strings machen
				for (Point cp : pointArray) {
					// Ein Punkt (x,y) zur Liste hinzufügen
					pointList += "{\"x\":\"" + Double.toString(cp.getX())
							+ "\",\"y\":" + Double.toString(cp.getY()) + "},";
				}

				break;
			case 2:

				
				// Holen der Daten aus SynchronHandlerList
				CopyOnWriteArrayList<Cluster> cVector = new CopyOnWriteArrayList<Cluster>();
				cVector.addAll(SynchronListHandler.getClusterVector());

				// Aus Daten JSON Strings machen
				for (Cluster c : cVector) {
					
					// Ein Cluster (x,y,l,w) zur Liste hinzufügen
					pointList += "{\"x\":\""
							+ Double.toString(c.getMinCorner().getX())
							+ "\",\"y\":\""
							+ Double.toString(c.getMinCorner().getY())
							+ "\",\"l\":\""
							+ Double.toString(Math.floor(Math.abs(c
									.getMaxCorner().getX()
									- c.getMinCorner().getX())))
							+ "\",\"w\":\""
							+ Double.toString(Math.floor(Math.abs(c
									.getMaxCorner().getY()
									- c.getMinCorner().getY()))) + "\"},";
				}
				break;
			}
			
			// Falls es einen JSON String gibt
			if (pointList != "") {
				
				// Entferne letztes Komma von der Liste				
				pointList = pointList.substring(0, pointList.length() - 1);
				
				// Schreibe JSON String zu Client
				pw.print("data: {\"d\":" + Integer.toString(dataIndex)
						+ ",\"pointList\":[" + pointList + "]} \n\n");
				
				// Stream leeren
				pw.flush();
				
				/*System.out.println("data: "+jObject.toString());
				pw.print("data: "+jObject.toString()+" \n");
				pw.print("\n");
				pw.flush();*/
			}

			// Bei Fehler (Client beendet)
			if (pw.checkError()) {
				
				// Beenden der While Schleife
				isConnected = false;
				System.out.println("False");
				sseCount--;
				if (sseCount == 0) {
					System.out.println("SCN:Interrupted");
					
					// Stoppe Distanz_Scanner
					Distance_scanner.getDistanceScanner().interrupt();
				}
			}
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

}