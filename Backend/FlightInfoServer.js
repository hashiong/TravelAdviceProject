const axios = require('axios');
const cheerio = require('cheerio');


async function getDestinations() {
  // The base URL for Kayak's website
  const mainUrl = "https://www.kayak.com";
  
  // The URL for the Kayak API that returns destination data for a given airport
  const url = "https://www.kayak.com/s/horizon/exploreapi/destinations?airport=LAX&budget=&duration=&flightMaxStops=&stopsFilterActive=false&zoomLevel=8&selectedMarker=&themeCode=&selectedDestination=";
  
  try {
    // Make an HTTP GET request to the Kayak API and extract the "destinations" property from the response
    const { destinations } = await axios.get(url).then(({ data }) => data);
    
    // Transform the "destinations" array into an array of objects with properties "city", "country", "price", "url", and "img"
    const parsedDestinations = destinations.map(({ city: { name: city }, country: { name: country }, flightInfo: { price }, clickoutUrl }) => ({
      city,
      country,
      price,
      url: mainUrl + clickoutUrl,
      img: ""
    }));
    
    // Sort the array of parsed destinations by price, in ascending order
    parsedDestinations.sort((a, b) => a.price - b.price);
    
    // Log the parsed destinations array to the console and return it
    console.log(parsedDestinations);
    return parsedDestinations;
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
  
  // This async function retrieves the first image URL from a Google search for a given city
  async function getSearchResultImages(city) {
    const searchUrl = `https://www.google.com/search?q=${city}&oq=${city}&hl=en&tbm=isch&asearch=ichunk&async=_id:rg_s,_pms:s,_fmt:pc&sourceid=chrome&ie=UTF-8`;
    const user_agent = selectRandom();
    const headers = {
      "User-Agent": user_agent
    };
  
    try {
      const html = await axios.get(searchUrl, { headers }).then(({ data }) => data);
      const $ = cheerio.load(html);
      let image_url = null;
      // Iterate over each <div class="rg_bx"> element
      $("div.rg_bx").each((i, el) => {
        const json_string = $(el).find(".rg_meta").text();
        // Parse the JSON metadata and extract the image URL
        image_url = JSON.parse(json_string).ou;
        // Exit the loop after the first iteration to retrieve only the first image URL
        return false;
      });
  
      console.log(image_url);
      return image_url;
    } catch (err) {
      console.error("Failed to get search result images:", err);
      return null; // Return null if an error occurs
    }
  }
  
