package ch.ethz.coss.nervous.pulse.sql;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.apache.commons.dbcp2.ConnectionFactory;
import org.apache.commons.dbcp2.DriverManagerConnectionFactory;
import org.apache.commons.dbcp2.PoolableConnection;
import org.apache.commons.dbcp2.PoolableConnectionFactory;
import org.apache.commons.dbcp2.PoolingDataSource;
import org.apache.commons.pool2.ObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPool;

import ch.ethz.coss.nervous.pulse.utils.Log;

public final class SqlConnection {

	// Server properties
	private String username;
	private String password;
	private String hostname;
	private int port;
	private String database;

	private DataSource source;

	public Connection getConnection() {
		try {
			return source.getConnection();
		} catch (SQLException e) {
			e.printStackTrace();
			Log.getInstance().append(Log.FLAG_ERROR,
					"Can't get a connection from the data source");
			return null;
		}
	}

	/**
	 * Connection will be set up this way:
	 * [jdbc:mysql://" + hostname + ":" + port + "/" + database]
	 * 
	 * @param hostname
	 * @param username
	 * @param password
	 * @param port
	 * @param database
	 */
	public SqlConnection(String hostname, String username, String password,
			int port, String database) {
		this.username = username;
		this.password = password;
		this.hostname = hostname;
		this.port = port;
		this.database = database;
		print();
		source = setup();

	}

	private DataSource setup() {

		try {
			Class.forName("com.mysql.jdbc.Driver").newInstance();
		} catch (Exception e) {
			e.printStackTrace();
			Log.getInstance().append(Log.FLAG_ERROR,
					"Error loading the SQL driver");
			return null;
		}

		ConnectionFactory cf = null;
		try {
			cf = new DriverManagerConnectionFactory("jdbc:mysql://" + hostname
					+ ":" + port + "/" + database, username, password);
			//System.out.println("CF - " + cf.toString());
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		PoolableConnectionFactory pcf = new PoolableConnectionFactory(cf, null);

		ObjectPool<PoolableConnection> connPool = new GenericObjectPool<PoolableConnection>(
				pcf);

		pcf.setPool(connPool);
		PoolingDataSource<PoolableConnection> dataSource = new PoolingDataSource<PoolableConnection>(
				connPool);
		//System.out.println("DataSource -- " + dataSource);
		return dataSource;
	}

	private void print() {
		System.out.println("***********SqlConnection************");
		System.out.println("hostname - " + hostname);
		System.out.println("username - " + username);
		System.out.println("password - " + password);
		System.out.println("database - " + database);
		System.out.println("************************************");
	}

}