package ch.ethz.coss.nervous.pulse;

import org.java_websocket.WebSocket;

public class PulseTimeMachineRequest {
	public static long ID_COUNTER = 0;
	public long requestID = 0;
	public int readingType = 0;
	public long startTime = 0;
	public long endTime = 0;
	public WebSocket webSocket = null;
	public boolean isNull;
	
	public PulseTimeMachineRequest(boolean isNull) {
		this.isNull = isNull;
	}
			
	public PulseTimeMachineRequest(long requestID, int readingType, long startTime,
			long endTime, WebSocket webSocket) {
		this.requestID = ID_COUNTER++;
		this.readingType = readingType;
		this.startTime = startTime;
		this.endTime = endTime;
		this.webSocket = webSocket;
	}
	
	public PulseTimeMachineRequest(String request, WebSocket webSocket) {
		requestID++;
		System.out.println("String request = "+request);
		String [] tokens = request.split(",");
		
		this.readingType = Integer.parseInt(tokens[1]);
		this.startTime = Long.parseLong(tokens[2]);
		this.endTime = Long.parseLong(tokens[3]);
		this.webSocket = webSocket;
		
		print();
	}
	
	
	public void print(){
		System.out.println("/*************PulseTimeMachineRequest*******************/");
		System.out.println("Request ID - "+requestID);
		System.out.println("ReadingType - "+readingType);
		System.out.println("StartTime - "+startTime);
		System.out.println("EndTime - "+endTime);
		System.out.println("/*******************************************************/");
	}

}