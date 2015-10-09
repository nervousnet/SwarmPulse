package ch.ethz.coss.nervous.pulse.model;

import java.io.Serializable;
import java.util.Arrays;

public class LightReading extends Visual implements Serializable {

	public double lightVal;

	public LightReading(String uuid, double lightVal, long timestamp, VisualLocation loc) {
		type = 0;
		this.uuid = uuid;
		this.lightVal = lightVal;
		this.timestamp = timestamp;
		this.location = loc;
		serialVersionUID = 2L;
	}

	@Override
	public String toString() {
		return "LightReading = (" + "," + timestamp + ") -> " + "(" + lightVal
				+ ")  @ " + Arrays.toString(location.latnLong);
	}
}
