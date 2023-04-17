// Import the necessary libraries
import * as React from 'react';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

// Function to create an object with src and srcSet properties
// based on the image, size, and number of rows and columns
function srcset(image, size, rows = 1, cols = 1) {
  return {
    src: `${image}?w=${size * cols}&h=${size * rows}&fit=crop&auto=format`,
    srcSet: `${image}?w=${size * cols}&h=${size * rows}&fit=crop&auto=format&dpr=2 2x`,
  };
}

// The component that renders the ImageList
export default function QuiltedImageList() {

  // State hooks to keep track of the width and height of the viewport, location, and photos
  const [width, setWidth] = React.useState(window.innerWidth);
  const [height, setHeight] = React.useState(window.innerHeight);
  const [location, setLocation] = React.useState({ city: "", state: "" });
  const [photos, setPhotos] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  

  // Function to open a new tab with the provided URL
  const openInNewTab = (url) => {
    window.open(url, '_blank', 'noreferrer');
  };

  // Function to calculate the number of columns and rows for each image
  const calculateColsRows = (image) => {
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    const area = image.naturalWidth * image.naturalHeight;
    let cols = 1;
    let rows = 1;
    if (area > 500000) {
      cols = 4;
      rows = 2;
    } else if (area > 250000) {
      cols = 3;
      rows = 2;
    } else if (aspectRatio > 1.25) {
      cols = 2;
    }
    if (aspectRatio <= 0.75) {
      rows = 2;
    }
    if (aspectRatio <= 0.5) {
      rows = 3;
    }
    return [cols, rows];
  };

  // Effect hook to add and remove event listener for window resize
  React.useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect hook to fetch location from API on component mount
  React.useEffect(() => {
    fetch('https://ipinfo.io/?token=4440474e851c76')
      .then(response => response.json())
      .then(data => {
        setLocation({ city: data.city, state: data.region });
      })
      .catch(error => console.error(error));
  }, []);

  // Effect hook to fetch data from API using location on component mount and whenever the location changes
  React.useEffect(() => {
    if (location.city && location.state) {
      setIsLoading(true); // Set the IsLoading state to true while fetching data
      const url = `http://localhost:3001/api/flightinfo?city=${location.city}&state=${location.state}`;
      fetch(url)
        .then(response => response.json())
        .then(data => {
          setPhotos(data);
          setIsLoading(false); // Set the IsLoading state to false once data is fetched
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
        <ImageList
          sx={{ width: width - 10, height: height, margin: 1 }}
          variant="quilted"
          cols={4}
          rowHeight={250}
          gap={5}
        >
          {photos.map((item) => {
            // Create a new Image object to get the naturalWidth and naturalHeight
            const img = new Image();
            img.src = item.img;
            const [cols, rows] = calculateColsRows(img);
            console.log(cols + "and " + rows)
            return (
              // Render each image as an ImageListItem with the calculated number of columns and rows
              <ImageListItem key={item.img} cols={cols} rows={rows} sx={{
                "&:hover": {
                  transform: 'scale(1.05) translateY(-3px)',
                  cursor: 'pointer'
                },
              }}>
                <img 
                  {...srcset(item.img, 121, rows, cols)}
                  alt = {item.dest}
                  loading="lazy"
                  onClick={() => openInNewTab(item.clickoutUrl)}
                />
              </ImageListItem>
            );
          })}
        </ImageList>
      )}
    </React.Fragment>
  );
}
