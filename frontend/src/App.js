import * as React from 'react';

export default function MansoryGallery() {
  // State variables to store width, height, location, photos, and loading status
  const [width, setWidth] = React.useState(window.innerWidth);
  const [height, setHeight] = React.useState(window.innerHeight);
  const [location, setLocation] = React.useState({ city: "", state: "" });
  const [photos, setPhotos] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Function to open a URL in a new tab
  const openInNewTab = (url) => {
    window.open(url, '_blank', 'noreferrer');
  };

  // Effect hook to handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    // Attach event listener for resize event
    window.addEventListener('resize', handleResize);

    // Cleanup by removing event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect hook to fetch location information
  React.useEffect(() => {
    // Fetch location data from the API
    fetch('https://ipinfo.io/?token=4440474e851c76')
      .then(response => response.json())
      .then(data => {
        setLocation({ city: data.city, state: data.region });
      })
      .catch(error => console.error(error));
  }, []);

  // Effect hook to fetch photos based on location
  React.useEffect(() => {
    // Fetch photos from the API if location is available
    if (location.city && location.state) {
      setIsLoading(true); // Set the isLoading state to true while fetching data

      // Construct the URL for fetching flight info based on location
      const url = `http://localhost:3001/api/flightinfo?city=${location.city}&state=${location.state}`;

      // Fetch photos data from the URL
      fetch(url)
        .then(response => response.json())
        .then(data => {
          setPhotos(data);
          setIsLoading(false); // Set the isLoading state to false once data is fetched
        })
        .catch(error => console.error(error));
    }
  }, [location]);

  return (
    <React.Fragment>
      {/* Render a loading screen if data is being fetched */}
      {isLoading && (
        <div className="loading-screen">
          <div className="spinner"></div>
          <div className='loading-text'>
            <p className='main-loading-text'>Loading<span>...</span></p>
            <p>Please note that the initial load may take longer than subsequent loads.</p>
          </div>
        </div>
      )}

      {/* Render the ImageList component with the calculated width and height */}
      {!isLoading && (
        <div class="container mx-auto px-5 py-2 lg:px-16 lg:pt-12">
          <div class="-m-1 flex flex-wrap md:-m-2">
            {photos.map((item) => {
              return (
                <div class="flex w-1/3 flex-wrap">
                  <div class="w-full p-1 md:p-2">
                    <img
                      alt="gallery"
                      class="hover:scale-110 transition duration-500 cursor-pointer block h-full w-full rounded-lg object-cover object-center"
                      src={item.img}
                      onClick={() => openInNewTab(item.clickoutUrl)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Shapes />
    </React.Fragment>
  );
}
