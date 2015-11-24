
public class SSEManager {
	
	private static Integer sseCount = 0;
	
	public static synchronized Integer getSseCount() {
		return sseCount;
	}

}
