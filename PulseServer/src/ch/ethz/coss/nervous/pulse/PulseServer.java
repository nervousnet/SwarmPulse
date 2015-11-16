/*******************************************************************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 ETH Zurich.
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
package ch.ethz.coss.nervous.pulse;

import java.io.IOException;

import org.java_websocket.WebSocketImpl;

import ch.ethz.coss.nervous.pulse.socket.PulseConcurrentServer;
import ch.ethz.coss.nervous.pulse.socket.PulseRequestHandlingServer;
import ch.ethz.coss.nervous.pulse.socket.SqlFetchWorkerFactory;
import ch.ethz.coss.nervous.pulse.sql.PulseElementConfiguration;
import ch.ethz.coss.nervous.pulse.sql.SqlConnection;
import ch.ethz.coss.nervous.pulse.sql.SqlSetup;
import ch.ethz.coss.nervous.pulse.sql.SqlUploadWorkerFactory;
import ch.ethz.coss.nervous.pulse.utils.Log;

public class PulseServer {

	public static void main(String[] args) throws InterruptedException, IOException {
		WebSocketImpl.DEBUG = false;

		// Load configuration from custom path or current directory
		if (args.length > 0) {
			config = Configuration.getInstance(args[0]);
		} else {
			config = Configuration.getInstance();
		}

		// Set up logging
		Log log = Log.getInstance(config.getLogDisplayVerbosity(), config.getLogWriteVerbosity(), config.getLogPath());
		log.append(Log.FLAG_INFO, "Reading configuration file done");

		log.append(Log.FLAG_INFO, "Reading configuration file done");
		// Set up SQL connection
		SqlConnection sqlco = new SqlConnection(config.getSqlHostname(), config.getSqlUsername(),
				config.getSqlPassword(), config.getSqlPort(), config.getSqlDatabase());
		log.append(Log.FLAG_INFO, "Establishing connection to SQL database done");

		// Set up SQL tables
		SqlSetup sqlse = new SqlSetup(sqlco.getConnection(), config);
		sqlse.setupTables();

		// Create factory which creates workers for uploading to the SQL
		// database
		SqlUploadWorkerFactory factory = new SqlUploadWorkerFactory(sqlco, sqlse);

		SqlFetchWorkerFactory sqlFfactory = new SqlFetchWorkerFactory(sqlco, sqlse);
		PulseRequestHandlingServer prhServer = new PulseRequestHandlingServer(config.getServerThreads() + 5,
				sqlFfactory);
		Thread reqServerThread = new Thread(prhServer);
		reqServerThread.start();

		PulseWebSocketServer pWebSocketServer = new PulseWebSocketServer(8446, prhServer);
		pWebSocketServer.start();

		// Start server
		PulseConcurrentServer server = new PulseConcurrentServer(8445, pWebSocketServer, 5, factory);
		Thread serverThread = new Thread(server);
		serverThread.start();
		log.append(Log.FLAG_INFO, "PulseConcurrentServer Started");

		Thread sqlFetchThread = new Thread(prhServer);
		sqlFetchThread.start();

		boolean running = true;

		while (running) {
			try {
				Thread.sleep(50000);
			} catch (InterruptedException e) {
				log.append(Log.FLAG_WARNING, "Server execution interrupted");
				running = false;
			}
		}

		// Stop server
		server.stop();
		prhServer.stop();
		log.append(Log.FLAG_INFO, "Server terminated");

	}

	public static int smartphonesPort = 8445;
	public static Configuration config;
}