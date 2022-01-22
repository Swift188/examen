import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
} from 'react-native';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';
import * as Location from 'expo-location';

// Create the client-side database if necessary and a handle/connection to the database, an object.
const db = SQLite.openDatabase('db.testDb');

const App = () => {
	const [data, setData] = useState(null);
	const [location, setLocation] = useState(null);
	const [geocode, setGeocode] = useState(null);

	useEffect(() => {
		db.transaction((tx) => {
			tx.executeSql(
				'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, count INT)'
			);
		});
		fetchData();
		getLocationAsync();

		setInterval(() => {
			getLocationAsync();
		}, 5000);
	}, []);

	/**
	 * @param {mixed} location
	 */
	const getGeocodeAsync = async (location) => {
		const geocode = await Location.reverseGeocodeAsync(location);
		setGeocode(geocode[0]);
	};

	const getLocationAsync = async () => {
		const location = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.BestForNavigation,
		});
		const { latitude, longitude } = location.coords;
		getGeocodeAsync({ latitude, longitude });
		setLocation({ latitude, longitude });
	};

	/**
	 * Read method uses arrow-function syntax
	 */
	const fetchData = () => {
		db.transaction((tx) => {
			// Syntax: tx.executeSql(sqlStatement, arguments, success, error)
			// sending 4 arguments in executeSql
			tx.executeSql(
				'SELECT * FROM items',
				null, // passing sql query and parameters:null
				// success callback which sends two things Transaction object and ResultSet Object
				(txObj, { rows: { _array } }) => setData(_array),
				// failure callback which sends two things Transaction object and Error
				(txObj, error) => console.log('Error ', error)
			); // end executeSQL
		}); // end transaction
	};

	/**
	 * Create method an event handler for new item creation
	 */
	const newItem = () => {
		db.transaction((tx) => {
			// The executeSql() method has an argument intended to allow variables to be substituted into statements without risking SQL injection vulnerabilities.
			// Always use "?" placeholders, pass the variables in as the second argument:
			tx.executeSql(
				'INSERT INTO items (text, count) values (?, ?)',
				['test', 0],
				(txObj, resultSet) => {
					const newData = [
						...data,
						{
							id: resultSet.insertId,
							text: geocode.city,
							count: 0,
						},
					];
					setData(newData);
				},
				(txObj, error) => console.log('Error', error)
			);
		});
	};

	/**
	 * Update method an event handler for item changes
	 * @param {int} id
	 */
	const increment = (id) => {
		db.transaction((tx) => {
			tx.executeSql(
				'UPDATE items SET count = count + 1 WHERE id = ?',
				[id],
				(txObj, resultSet) => {
					if (resultSet.rowsAffected > 0) {
						const newData = data.map((item) => {
							if (item.id == id)
								return { ...item, count: item.count + 1 };
							return item;
						});
						setData(newData);
					}
				}
			);
		});
	};

	/**
	 * Delete method an event handler for item removal
	 * @param {int} id
	 */
	const deleteItem = (id) => {
		db.transaction((tx) => {
			tx.executeSql(
				'DELETE FROM items WHERE id = ? ',
				[id],
				(txObj, resultSet) => {
					if (resultSet.rowsAffected > 0) {
						const newData = data.filter((item) => {
							if (item.id === id) return false;
							return true;
						});
						setData(newData);
					}
				}
			);
		});
	};

	return (
		<View style={Style.main}>
			<Text style={Style.heading}>Add Random Name with Counts</Text>
			<TouchableOpacity onPress={newItem} style={Style.green}>
				<Text style={Style.white}>Add New Item</Text>
			</TouchableOpacity>

			<Text style={Style.heading}>Your Location</Text>
			<Text>
				{geocode.street} {geocode.streetNumber} {geocode.city}{' '}
				{geocode.isoCountryCode}
			</Text>

			<ScrollView style={Style.widthfull}>
				{data &&
					data.map((item) => (
						<View key={item.id} style={Style.list}>
							<Text style={Style.badge}>{item.count}</Text>
							{/* <Text style={Style.heading}>
								{geocode ? geocode.street : ''}
								{' te '}
								{geocode
									? `${geocode.city}, ${geocode.isoCountryCode}`
									: ''}
							</Text>
							<Text style={Style.heading}>
								{location
									? `${location.latitude}, ${location.longitude}`
									: ''}
							</Text> */}
							<Text>{item.text}</Text>

							<TouchableOpacity
								onPress={() => increment(item.id)}
							>
								<Text style={Style.boldGreen}> + </Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => deleteItem(item.id)}
							>
								<Text style={Style.boldRed}> DEL </Text>
							</TouchableOpacity>
						</View>
					))}
			</ScrollView>
		</View>
	);
};

/**
 * Style prop
 */
const Style = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		flex: 1,
		paddingTop: Constants.statusBarHeight,
	},
	heading: {
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
		color: '#95a5a6',
	},
	flexRow: {
		flexDirection: 'row',
	},
	input: {
		borderColor: '#4630eb',
		borderRadius: 4,
		borderWidth: 1,
		flex: 1,
		height: 48,
		margin: 16,
		padding: 4,
	},
	list: {
		backgroundColor: '#bdc3c7',
		flex: 1,
		padding: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 64,
		margin: 8,
		color: '#006266',
	},
	main: {
		backgroundColor: '#ecf0f1',
		marginTop: 32,
		marginBottom: 16,
		marginHorizontal: 16,
	},
	sectionHeading: {
		fontSize: 18,
		marginBottom: 8,
	},
	green: {
		borderRadius: 48,
		backgroundColor: '#2980b9',
	},
	white: {
		padding: 4,
		textAlign: 'center',
		fontSize: 32,
		fontWeight: 'bold',
		color: '#bdc3c7',
	},
	boldGreen: {
		fontSize: 35,
		fontWeight: 'bold',
		color: '#8e44ad',
	},
	boldRed: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#9b59b6',
	},
	badge: {
		backgroundColor: '#34495e',
		color: '#ecf0f1',
		fontWeight: 'bold',
		fontSize: 16,
		borderRadius: 48,
		minWidth: 30,
		padding: 4,
		textAlign: 'center',
	},
});

export default App;
