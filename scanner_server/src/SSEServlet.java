import java.awt.Point;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.concurrent.CopyOnWriteArrayList;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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

	private static Integer sseCount = 0;

	public static int dataIndex = 1;

	private static Distance_scanner scn;

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

		sseCount++;
		if (sseCount == 1) {
			Distance_scanner.setInstantSimulation(true);
			scn = Distance_scanner.getDistanceScanner("sim1");
			scn.start();
		}

		PrintWriter pw = response.getWriter();
		boolean isConnected = true;
		while (isConnected) {
			String pointList = "";
			switch (dataIndex) {
			case 1:
				pointArray.clear();
				pointArray.addAll(SynchronListHandler.getPointVector());

				for (Point p : pointArray) {
					pointList += "{\"x\":\"" + Double.toString(p.getX())
							+ "\",\"y\":" + Double.toString(p.getY()) + "},";
				}
				break;
			case 2:

				CopyOnWriteArrayList<Cluster> cVector = new CopyOnWriteArrayList<Cluster>();
				
				cVector.addAll(SynchronListHandler.getClusterVector());
				
				for (Cluster c : cVector) {
					pointList += "{\"x\":\""
							+ Double.toString(c.getMinCorner().getX())
							+ "\",\"y\":\""
							+ Double.toString(c.getMinCorner().getY())
							+ "\",\"l\":\""
							+ Double.toString(Math.floor(Math.abs(c.getMaxCorner().getX()
									- c.getMinCorner().getX())))
							+ "\",\"w\":\""
							+ Double.toString(Math.floor(Math.abs(c.getMaxCorner().getY()
									- c.getMinCorner().getY()))) + "\"},";
				}
				break;
			}
			if (pointList != "") {
				pointList = pointList.substring(0, pointList.length() - 1);
				pw.print("data: {\"d\":"+Integer.toString(dataIndex)+",\"pointList\":[" + pointList + "]} \n\n");
				pw.flush();
			}

			if (pw.checkError()) {
				isConnected = false;
				System.out.println("False");
				sseCount--;
				if (sseCount == 0) {
					System.out.println("SCN:Interrupted");
					scn.interrupt();
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
