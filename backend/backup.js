const axios = require('axios');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb')
const cors = require('cors');

const express = require("express");
const app = express();
app.use(cors());

app.listen(3000, function() {
  console.log('Server started on port 3000');
});

app.get('/api/flightinfo', async function(req, res) {
  const city = req.query.city;
  const state = req.query.state;
  const airportCode = await getAirportCode(city, state)
  const output = await getTravelInfo(airportCode)
  res.json(output);
});

async function establish_dbconnection(){

  const mongodbURL = "mongodb+srv://hongenlei99:JZQeH32bzhkG6aHX@traveldestinations.1hbog2q.mongodb.net/?retryWrites=true&w=majority"
  
  const client = new MongoClient(mongodbURL);

  try {
      // Connect to the MongoDB cluster
      await client.connect();
      return client;

  } catch (e) {
      console.error(e);
  }
}

async function insertDestinations(client, destiantions){

  let date = getCurrentDate()
  const result = await client.db("Destination_Info").collection(date).insertOne(destiantions);

  // console.log(`New destinations inserted with the following id: ${result.insertedId}`)
}

async function fieldCheck(client, databaseName, collectionName, airport) {
  try {
 
    const database = await client.db(databaseName);
    const collections = await database.listCollections().toArray();
    const collectionExists = collections.some((collection) => collection.name === collectionName);

    if (collectionExists) {
      // console.log(`${collectionName} collection exists`);

      const query = { [airport]: { $exists: true } };
      const collection = await database.collection(collectionName);
      const result = await collection.findOne(query);

      if (result) {
        console.log(`${airport} field exists`);
        return true;
      } else {
        console.log(`${airport} field does not exist`);
        return false;
      }
    } else {
      // console.log(`${collectionName} collection does not exist`);
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function getRandomImage(collection, city, country){

  try{
    let place = city + "," + country

    const query = { [place]: { $exists: true } };
    const projection = { [place]: 1, _id: 0 };
    const result = await collection.findOne(query, projection);
    const images = result[place];
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];

  }
  catch(err){
    // console.log(`Unable to find images for ${city + "," + country}`)
    return ""
  }
  
}


async function getTravelInfo(airport){
  // console.log("gettravelinfo: ", airport)
  try{
    let client = await establish_dbconnection()

    let date = getCurrentDate()
    let check = await fieldCheck(client, "Destination_Info", date, airport)
  
    if(!check){
      await updateDestinations(client, airport);
    }
  
    const query = { [airport]: { $exists: true } };
    const projection = { [airport]: 1, _id: 0 };
  
    const result = await client.db('Destination_Info').collection(date).findOne(query, projection);
    const destinations_info = result[airport].slice(0, 200)

    let output = []
    const image_collection = await client.db('Images').collection('Destinations');

    const locations = new Set()
    for (let i = 0; i < destinations_info.length; i++){
      let image_url = await getRandomImage(image_collection, destinations_info[i].city, destinations_info[i].country)
      let location = destinations_info[i].city + destinations_info[i].country
      if(image_url == "" && locations.has(location)){
        continue;
      }
      locations.add(location)

      // let temp = {"city": destinations_info[i].city, "country": destinations_info[i].country, "image_url": image_url, "clickoutUrl": destinations_info[i].url}
      let temp = {img: image_url, clickoutUrl: destinations_info[i].url}
      
      output.push(temp)
    }
    console.log(output.length)
    client.close();
    return output;
  }
  catch(err){
    // throw err
  }
  
}

async function updateDestinations(client, airport) {


  // The base URL for Kayak's website
  const mainUrl = "https://www.kayak.com";
  
  // The URL for the Kayak API that returns destination data for a given airport
  const url = `https://www.kayak.com/s/horizon/exploreapi/destinations?airport=${airport}&budget=&duration=&flightMaxStops=&stopsFilterActive=false&zoomLevel=8&selectedMarker=&themeCode=&selectedDestination=`;
  
  try {

    // Make an HTTP GET request to the Kayak API and extract the "destinations" property from the response
    const { destinations } = await axios.get(url).then(({ data }) => data);
    
    // Transform the "destinations" array into an array of objects with properties "city", "country", "price", "url", and "img"
    const parsedDestinations = destinations.map(({ city: { name: city }, country: { name: country }, flightInfo: { price }, clickoutUrl }) => ({
      city,
      country,
      price,
      url: mainUrl + clickoutUrl
    }));
    
    // Sort the array of parsed destinations by price, in ascending order
    parsedDestinations.sort((a, b) => a.price - b.price);
    const slicedDestinations = parsedDestinations.slice(0, 200)
    
    // Log the parsed destinations array to the console and return it
    // console.log(parsedDestinations);
    let destinations_info = {[airport]: slicedDestinations}
    await insertDestinations(client, destinations_info)

    for (let i = 0; i < slicedDestinations.length; i++){
      await getSearchResultImages(client, slicedDestinations[i].city, slicedDestinations[i].country)
    }

    return true;
  } catch (err) {
    // Log an error message and the error object to the console if the HTTP request fails
    console.log("ERROR!!!");
    console.error(err);
    throw err;
  }
}

// This function selects a random user agent from a predefined list
const selectRandom = () => {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    ];
    const randomNumber = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomNumber];
  };
  
function getCurrentDate(){
  let date_ob = new Date();

  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  return year + month + date;
}
  

// This async function retrieves the first image URL from a Google search for a given city
async function getSearchResultImages(client, city, country) {

  try {
    let place = city + "," + country
    const database = await client.db("Images");
    const collection = await database.collection("Destinations")

    const query = { [place]: { $exists: true } };
    const result = await collection.findOne(query);
    if (result) {
      // console.log(`${place} field exists in the Image Database`);
      return true;
    }

    const searchUrl = `https://www.google.com/search?q=${place}&oq=${place}&hl=en&tbm=isch&asearch=ichunk&async=_id:rg_s,_pms:s,_fmt:pc&sourceid=chrome&ie=UTF-8`;
    const user_agent = selectRandom();
    const headers = {
      "User-Agent": user_agent
    };

    const html = await axios.get(searchUrl, { headers }).then(({ data }) => data);
    const $ = cheerio.load(html);
    let images_results= [];
    $("div.rg_bx").each((i, el) => {
        let json_string = $(el).find(".rg_meta").text();
        images_results.push(JSON.parse(json_string).ou);
        if(i == 9){
          return false;
        }    
  });
  // console.log(images_results)
    let images = {[place] : images_results}
    const insertion_result = await collection.insertOne(images);
    
    // console.log(`New destinations inserted with the following id: ${insertion_result.insertedId}`)
  } catch (err) {
    throw err 
    // console.error("Failed to get search result images:", err);
  }
}
async function getAirportCode(city, state) {
  try {
    const response = await axios.get(`https://www.travelmath.com/nearest-airport/${city +",+"+state}`);
    const html = response.data;
    const $ = cheerio.load(html);
    const selectedElement = $('ul.related:nth-child(6) > li:nth-child(1) > span:nth-child(3)');
    const extractedText = selectedElement.text();
    const airportCode = extractedText.match(/\([A-Z]+/)[0];
    return airportCode.substring(1)
  } catch (error) {
    console.error(error);
  }
}