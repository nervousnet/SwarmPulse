/*******************************************************************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 ETH Zürich.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 *
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Contributors:
 *     Prasad Pulikal - prasad.pulikal@gess.ethz.ch  - Initial design and implementation
 *******************************************************************************/
package ch.ethz.coss.nervous.pulse.sql;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import ch.ethz.coss.nervous.pulse.PulseTimeMachineRequest;
import ch.ethz.coss.nervous.pulse.PulseWebSocketServer;
import ch.ethz.coss.nervous.pulse.socket.SqlFetchWorker;
import ch.ethz.coss.nervous.pulse.utils.Log;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;

public class SqlRequestWorker extends SqlFetchWorker {

	SqlSetup sqlse;
	PulseTimeMachineRequest ptmRequest;

	public SqlRequestWorker(PulseWebSocketServer ps, Connection connection, SqlSetup sqlse,
			PulseTimeMachineRequest ptmRequest) {
		super(ps, connection);
		this.sqlse = sqlse;
		this.ptmRequest = ptmRequest;
	}

	@Override
	public void run() {
		try {

			JsonObject feature = null;
			JsonArray features = null;
			JsonObject featureCollection = null;

			try {

				/***** SQL get ********/
				// Fetch data
				PreparedStatement datastmt = sqlse.getSensorValuesFetchStatement(connection, ptmRequest.readingType,
						ptmRequest.startTime, ptmRequest.endTime);
				ResultSet rs = datastmt.executeQuery();
				featureCollection = new JsonObject();
				features = new JsonArray();
				// System.out.println("SQL query result size =
				// "+rs.getFetchSize());
				long currentTimeMillis = System.currentTimeMillis();
				while (rs.next()) {
					long volatility = rs.getLong("Volatility");
					long recordTime = rs.getLong("RecordTime");

					System.out.println("Volatility = " + volatility);
					System.out.println("currentTimeMillis = " + currentTimeMillis);
					System.out.println("total time = " + (recordTime + (volatility * 1000)));
					if (volatility == 0 || (recordTime + (volatility * 1000) > currentTimeMillis)) {

						continue;
					}

					String lat = rs.getString("lat");
					String lon = rs.getString("lon");

					feature = new JsonObject();
					feature.addProperty("type", "Feature");
					JsonObject point = new JsonObject();
					point.addProperty("type", "Point");
					JsonArray coord = new JsonArray();
					coord.add(new JsonPrimitive(lat));
					coord.add(new JsonPrimitive(lon));
					point.add("coordinates", coord);
					feature.add("geometry", point);

					JsonObject properties = new JsonObject();

					properties.addProperty("volatility", volatility);
					if (ptmRequest.readingType == 0) {
						String luxVal = rs.getString("Light");
						// System.out.println("Reading instance of light");
						properties.addProperty("readingType", "" + 0);
						properties.addProperty("level", luxVal);
					} else if (ptmRequest.readingType == 1) {
						String soundVal = rs.getString("Decibel");
						properties.addProperty("readingType", "" + 1);
						properties.addProperty("level", soundVal);
					} else if (ptmRequest.readingType == 2) {
						String message = rs.getString("Message");
						properties.addProperty("readingType", "" + 2);
						properties.addProperty("message", message);
					} else {
						// System.out.println("Reading instance not known");
					}

					feature.add("properties", properties);
					features.add(feature);

					// if((features.getAsJsonArray()).size() >= 60000){
					// featureCollection.add("features", features);
					// pSocketServer.sendToSocket(ptmRequest.webSocket,
					// ptmRequest.requestID, featureCollection.toString(),
					// false);
					// featureCollection = new JsonObject();
					// featureCollection = new JsonObject();
					// features = new JsonArray();
					// try {
					// Thread.sleep(10);
					// } catch (Exception e) {
					// // TODO Auto-generated catch block
					// e.printStackTrace();
					// }
					// break;
					// }
				}

				featureCollection.add("features", features);
				// System.out.println("Feature collection +
				// "+featureCollection.toString());
				pSocketServer.sendToSocket(ptmRequest.webSocket, ptmRequest.requestID, featureCollection.toString(),
						true);

				/*************/

			} catch (JsonParseException e) {
				System.out.println("can't save json object: " + e.toString());
			}

		} catch (Exception e) {
			e.printStackTrace();
			Log.getInstance().append(Log.FLAG_WARNING, "Generic error");
		} finally {
			cleanup();
		}
	}

	@Override
	protected void cleanup() {
		super.cleanup();

	}
}
