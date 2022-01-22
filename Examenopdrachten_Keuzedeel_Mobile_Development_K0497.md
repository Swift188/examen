# React Native - Stap voor stap #
Zorg dat je Node.js en Git op jouw computer geinstalleerd hebt.
Installeer Expo CLI tool
```javascript
npm install -g expo-cli
```
Maak een nieuwe default blank template project aan
```javascript
expo init SQLiteSimpleCRUDExample
```
Naar naar de nieuwe project folder
```javascript
cd SQLiteSimpleCRUDExample
```
Open de nieuw project folder in jouw code-editor
```javascript
code .
```
Open een terminal en typ onderstaande om de lokale ontwikkelingsserver van Expo CLI te starten.
Expo CLI start Metro Bundler, dat is een HTTP-server die de JavaScript-code van onze app met behulp van Babel samenstelt en aan de Expo-app levert. Ook verschijnt Expo Dev Tools, een grafische interface voor Expo CLI.
```javascript
yarn start
```
of
```javascript
npm start
```
Installeer Expo client voor iOS en Android op jouw mobiel en druk `Scan QR Code` op het tabblad "Projecten" van de Expo-clientapplicatie of met jouw camera en scan de QR-code die je ziet in de terminal of in Expo Dev Tools. Je kan nu mobile app bewonderen.
Om te kijken of wijzigingen ook zichtbaar zijn open App.js en verander de tekst in "Hallo, wereld!". Je ziet de app direct veranderen. Je hebt de Expo toolchain draaien bent in staat om de broncode voor een project te bewerken en de veranderingen live te zien op jouw mobiel!

## Packages ##
Kill de server en installeer de volgende package met behulp van yarn
```javascript
yarn add expo-sqlite
```
of
```javascript
npm install expo-sqlite
```
## Imports and Connection ##
Nu kunnen we de package importeren en onze databaseverbinding maken. We gebruiken de openenDatabase methode om een verbinding te maken met de database. Als de database niet bestaat, wordt er een nieuwe aangemaakt. Vervang de App.js met onderstaande code
```javascript
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
// Create the client-side database if necessary and a handle/connection to the database, an object.
const db = SQLite.openDatabase("db.testDb");
```
## Initialisatie en UI ##
Vervolgens maken we een startpunt van de App klasse met minimale UI, state en standaard database controle.
```javascript
/**
 * Entry point for display to mobile
 */
class App extends React.Component {
  /**
   * Constructor
   * @param {mixed} props
   */
  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
    // Check if the items table exists if not create it
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, count INT)"
      );
    });
    // Call fetchData method die nog niet bestaat
    this.fetchData();
  }

  /**
   * Required render, called when state is altered
   */
  render() {
    return (
      <View style={Style.main}>
        <Text style={Style.heading}>Add Random Name with Counts</Text>
        <TouchableOpacity onPress={this.newItem} style={Style.green}>
          <Text style={Style.white}>Add New Item</Text>
        </TouchableOpacity>

        <ScrollView style={Style.widthfull}>
          {this.state.data &&
            this.state.data.map((data) => (
              <View key={data.id} style={Style.list}>
                <Text style={Style.badge}>{data.count}</Text>
                <Text>{data.text}</Text>

                <TouchableOpacity onPress={() => this.increment(data.id)}>
                  <Text style={Style.boldGreen}> + </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.delete(data.id)}>
                  <Text style={Style.boldRed}> DEL </Text>
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>
      </View>
    );
  }
}
export default App;

/**
 * Style propje
 */
const Style = StyleSheet.create({
  // ...
  green: {
    borderRadius: 48,
    backgroundColor: "#2980b9",
  },
});

```
Ok dus, we maken een tabel met de naam `items` als deze niet bestaat met behulp van de bovenstaande db-verbinding die we hebben gemaakt. We hebben een knop gemaakt die bedoeld is om wat gebrabbel toe te voegen en een telling van het aantal keren dat de knop is ingedrukt in de database. U kunt de event handlers zoals `addItem, increment` en `delete` zien, maar ze zijn nog niet geimplementeerd, we zullen de `CRUD` operaties in de volgende stap implementeren.

## Acties ##

In deze sectie gaan we kijken hoe we `CRUD` acties op SQLite kunnen uitvoeren en de state van React kunnen updaten. We gebruiken `Transactions` voor de interactie met de db met behulp van de methode `Database.transaction`.
```javascript
Database.transaction(callback, errorCallback, successCallback)
```
In elke transactie hoofdaanroep wordt een Transactie-object doorgegeven dat kan worden gebruikt om queries uit te voeren met de methode `Transaction.executeSql()`.

```javascript
Transaction.executeSql(sqlStatementString, argumentsArray, successCallback, errorCallback)
```

`SuccessCallback` stuurt `ResultSets` terug, die een `rowsAffected` telling bevat, `insertIds` in geval `insert` `insertIds` en rijen met gegevens in geval van read.

## Read ##

De eerste stap is het lezen van de gegevens uit de tabel telkens als de app wordt gestart. In de transaction methode gebruiken we alleen de hoofd callback waar een transactieobject `tx` wordt doorgegeven. We gebruiken het om een standaard SQL-leesopdracht uit te voeren. Aangezien we geen parameters hoeven door te geven aan de query, sturen we `null` in tweede parameter en dan stellen we de `ResultSet.rows._array` in als `data`. We hebben de functie ES6 Object matching gebruikt om de waarde `_array` uit de object parameter `ResultSet` direct naar `_array` variabelen te vertalen.

```javascript
  /**
   * Read method uses arrow-function syntax
   */
  fetchData = () => {
    db.transaction((tx) => {
      // Syntax: tx.executeSql(sqlStatement, arguments, success, error)
      // sending 4 arguments in executeSql
      tx.executeSql(
        "SELECT * FROM items",
        null, // passing sql query and parameters:null
        // success callback which sends two things Transaction object and ResultSet Object
        (txObj, { rows: { _array } }) => this.setState({ data: _array }),
        // failure callback which sends two things Transaction object and Error
        (txObj, error) => console.log("Error ", error)
      ); // end executeSQL
    }); // end transaction
  };
```

## Create ##

We gebruiken hetzelfde patroon van transaction en executeSql als voorheen om een nieuwe rij in de items tabel in te voegen. Om het eenvoudig te houden, hebben we de gegevens voor het invoegen en het updaten van de state hardcoded.

Bij een succesvolle insert gebruiken we de array concat methode om de toestand bij te werken. Concat methode creëert en retourneert een nieuwe array met het toegevoegde item. Het is zeer nuttig voor state updates, aangezien we het state object niet direct willen veranderen.

In de setState hadden we ook de Id van het nieuwe item nodig, we hebben het verkregen vanuit ResultSet object.

```javascript
  /**
   * Create method an event handler for new item creation
   */
  newItem = () => {
    db.transaction((tx) => {
      // The executeSql() method has an argument intended to allow variables to be substituted into statements without risking SQL injection vulnerabilities.
      // Always use "?" placeholders, pass the variables in as the second argument:
      tx.executeSql(
        "INSERT INTO items (text, count) values (?, ?)",
        ["gibberish", 0],
        (txObj, resultSet) =>
          this.setState({
            data: this.state.data.concat({
              id: resultSet.insertId,
              text: "gibberish",
              count: 0,
            }),
          }),
        (txObj, error) => console.log("Error", error)
      );
    });
  };
```

## Update ##

We hebben een tellingseigenschap op elk item en we willen deze elke keer dat de plusknop van het object wordt ingedrukt verhogen. De methoden die we zullen gebruiken zal dezelfde zijn als hierboven. We moeten echter voorzichtig zijn met het updaten van onze React states. We kunnen de state niet direct updaten, dus we gebruiken de map-methode hier.

De map-methode maakt een nieuwe array aan door op elk element van de oorspronkelijke array een bewerking uit te voeren. Zo controleren we in de map of de Id van een item hetzelfde is als het bijgewerkte item. Als dat zo is, maak dan een nieuw object aan en wijzig de telling ervan met behulp van de destructuringssyntaxis ES 6, anders geeft u het object terug zoals het is. Zo ontstaat een nieuwe lijst en kunnen we die gebruiken om de state veilig bij te werken.

```javascript
  /**
   * Update method an event handler for item changes
   * @param {int} id
   */
  increment = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE items SET count = count + 1 WHERE id = ?",
        [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let newList = this.state.data.map((data) => {
              if (data.id === id) return { ...data, count: data.count + 1 };
              else return data;
            });
            this.setState({ data: newList });
          }
        }
      );
    });
  };
```

## Delete ##

We hebben ook een verwijderknop op elk item om het te verwijderen. Zodra de verwijderknop wordt ingedrukt, zal de query worden uitgevoerd met behulp van dezelfde methoden als hierboven, maar hoe werken we de React-state bij?

We kunnen de Arrays-filtermethode gebruiken om een nieuwe array met gefilterde items te maken. In de filtermethode kunnen we specificeren welke elementen we moeten opnemen of uitsluiten door true of false te retourneren. Zodra deze nieuwe array is gemaakt, kunnen we de state veilig updaten.

```javascript
  /**
   * Delete method an event handler for item removal
   * @param {int} id
   */
  delete = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM items WHERE id = ? ",
        [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let newList = this.state.data.filter((data) => {
              if (data.id === id) return false;
              else return true;
            });
            this.setState({ data: newList });
          }
        }
      );
    });
  };
```

## Style prop ##

```javascript
/**
 * Style prop
 */
const Style = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#95a5a6",
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 4,
  },
  list: {
    backgroundColor: "#bdc3c7",
    flex: 1,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 64,
    margin: 8,
    color: "#006266",
  },
  main: {
    backgroundColor: "#ecf0f1",
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
    backgroundColor: "#2980b9",
  },
  white: {
    padding: 4,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "#bdc3c7",
  },
  boldGreen: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#8e44ad",
  },
  boldRed: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9b59b6",
  },
  badge: {
    backgroundColor: "#34495e",
    color: "#ecf0f1",
    fontWeight: "bold",
    fontSize: 16,
    borderRadius: 48,
    minWidth: 30,
    padding: 4,
    textAlign: "center",
  },
});

```
# Hardwarespecifieke functionaliteit #

Een voorbeeld van het gebruik maken van hardwarespecifieke zaken is bijvoorbeeld gebruik maken van de GPS om de locatie van de gebruiker te achterhalen. Eerst installeren wij wat extra Expo packages. Zowel expo-location and expo-permissions. Kill de server en voer onderstaande uit.
## Packages en imports ##
```javascript
expo install expo-location
expo install expo-permissions
```

Importeer ze dan allebei in uw App.js.

```javascript
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
```
## Ini en UI ##
Voeg de location, geocode en error message toe aan de initiele state.
```javascript
    this.state = {
      data: null,
      location: null,
      geocode: null,
      errorMessage: "",
    };
```

> `componentDidMount()` wordt direct na het koppelen van een component (in de boom) aangeroepen. Initialisatie die om DOM-nodes vragen, moet hier gebeuren. 
> Als u gegevens moet laden vanaf een extern endpoint, is dit een goede plaats om het netwerkverzoek te initiëren of in dit geval het ophalen van locatiegegevens.

```javascript
  /**
   *
   */
  componentDidMount() {
    this.getLocationAsync();
  }
```
Pas de render methode als volgt aan:

```javascript
  /**
   * Required render, called when state is altered
   */
  render() {
    const { location, geocode, errorMessage } = this.state;
    return (
      <View style={Style.main}>
        <Text style={Style.heading}>Add Random Name with Counts</Text>
        <Text style={Style.heading}>
          {geocode ? geocode[0].street : ""}
          {" te "}
          {geocode ? `${geocode[0].city}, ${geocode[0].isoCountryCode}` : ""}
        </Text>
        <Text style={Style.heading}>
          {location ? `${location.latitude}, ${location.longitude}` : ""}
        </Text>
        ...
```

## getLocationAsync ##

getLocationAsync zal onze belangrijkste functie zijn voor het verkrijgen van de locatie-extractie en de toegang tot locatiegegevens kortom permissions.
Het moet er zoiets als dit uitzien.

```javascript
  /**
   *
   */
  getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied",
      });
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    const { latitude, longitude } = location.coords;
    this.getGeocodeAsync({ latitude, longitude });
    this.setState({ location: { latitude, longitude } });
  };
```
De eerste regel, vraagt naar de locatie van de gebruiker, met behulp van expo-permissions Permissions.askAsync.

Als de toestemming wordt verleend, zal het de locatiegegevens blijven krijgen, anders zal het aangeven dat de toestemming voor toegang tot de locatie is geweigerd met een foutmelding.

Vervolgens zal de functie expo-location getCurrentPositionAsync gebruiken om de locatiegegevens te verkrijgen. Let op, de functie neemt een objectargument inclusief de Geolocation Accuracy. Deze heeft meerdere waarden, afhankelijk van uw nauwkeurigheidsvereiste.

| Accuracy                   | Value | Description                                                                                   |
|----------------------------|-------|-----------------------------------------------------------------------------------------------|
| Accuracy.Lowest            | 1     | Accurate to the nearest three kilometers.                                                     |
| Accuracy.Low               | 2     | Accurate to the nearest kilometer.                                                            |
| Accuracy.Balanced          | 3     | Accurate to within one hundred meters.                                                        |
| Accuracy.High              | 4     | Accurate to within ten meters of the desired target.                                          |
| Accuracy.Highest           | 5     | The best level of accuracy available.                                                         |
| Accuracy.BestForNavigation | 6     | The highest possible accuracy that uses additional sensor data to facilitate navigation apps. |

Let wel, ik haal alleen de breedtegraad en lengtegraad(latitude and longitude) uit de teruggestuurde gegevens, want die hebben meer dan alleen de coördinaten.

Bewaar het in de state, en gebruik de volgende functie die we gaan maken om de getGeocodeAsync data uit de locatie te halen.

## getGeocodeAsync ##

getGeocodeAsync functie zal er voor zorgen dat de geocode geolocatiegegevens uit onze breedtegraad- en lengtegraadcoördinaten worden gehaald.

Door gebruik te maken van de expo-locatie reverseGeocodeAsync functie. Zo simpel is het...

```javascript
  /**
   *
   * @param {mixed} location
   */
  getGeocodeAsync = async (location) => {
    let geocode = await Location.reverseGeocodeAsync(location);
    this.setState({ geocode });
  };
```

## Create aangepast ##

Verwerk onderstaande wijzigingen om ervoor te zorgen dat de huidige locatie in de database wordt opgeslagen.

```javascript
  /**
   * Create method an event handler for new item creation
   */
  newItem = () => {
    db.transaction((tx) => {
      let city = this.state.geocode[0].city;
      // The executeSql() method has an argument intended to allow variables to be substituted into statements without risking SQL injection vulnerabilities.
      // Always use "?" placeholders, pass the variables in as the second argument:
      tx.executeSql(
        "INSERT INTO items (text, count) values (?, ?)",
        [street, 0],
        (txObj, resultSet) =>
          this.setState({
            data: this.state.data.concat({
              id: resultSet.insertId,
              text: city,
              count: 0,
            }),
          }),
        (txObj, error) => console.log("Error", error)
      );
    });
  };
```


## Resultaat ##

# Exameneisen #

## Technisch ontwerp ##
* De deelnemer inventariseert de wensen van de opdrachtgever, in overleg met collega's, grondig.
* De deelnemer maakt in overleg met collega's een beargumenteerde keuze uit de mogelijke type mobiele applicaties: native, hybride of web en onderbouwd deze uitgebreid.
* De deelnemer vergelijkt diverse ontwikkelomgevingen, programmeertalen en hardware-specifieke,functionaliteiten die passen bij het type mobiele applicatie en onderbouwd dit uitgebreid.

## Bron en DB ##
* De deelnemer gebruikt de gekozen ontwikkelomgeving effectief.
* De deelnemer programmeert (onderdelen van) de mobiele applicatie correct.
* De deelnemer past de hardware-specifieke functionaliteiten deskundig toe bij het maken van (onderdelen van) de mobiele applicatie.(Verzin zelf eens wat)

## Testrapport ##
* De deelnemer test onderdelen van de mobiele applicatie grondig.
* De deelnemer rapporteert zijn bevindingen in een testrapport, waarin beschreven staat of de functionaliteiten werken.
* De deelnemer corrigeert eventuele gebreken aan onderdelen van de mobiele applicatie, zodat deze functioneel zijn.

> Uitvoeren en opleveren 18 januari vóór 23:59, sturen naar jdunk@unboundit.com
> Online-examen vindt plaats op 19 januari van 14:00 tot 16:00 (if someone asks)
