// URL to fetch the latest earthquake data
const earthquakeDataURL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_week.geojson';

// Fetch and process earthquake data
d3.json(earthquakeDataURL).then(processEarthquakeData);

// Main function to process loaded earthquake data
function processEarthquakeData(data) {
    const earthquakeMarkers = generateMarkersForEarthquakes(data);
    const earthquakesLayerGroup = L.layerGroup(earthquakeMarkers);
    initializeAndDisplayMap(earthquakesLayerGroup);
}

// Generate markers for each earthquake from the dataset
function generateMarkersForEarthquakes(earthquakeData) {
    return earthquakeData.features.map(createEarthquakeMarker);
}

// Create a marker for a specific earthquake
function createEarthquakeMarker(earthquakeFeature) {
    const [longitude, latitude, depth] = earthquakeFeature.geometry.coordinates;

    return L.circle([latitude, longitude], {
        radius: calculateCircleRadius(earthquakeFeature.properties.mag),
        fillColor: determineColorBasedOnDepth(depth),
        color: "#000", // border color of the circle
        weight: 0.5, // border thickness
        fillOpacity: 1 // fill opacity of the circle
    }).bindPopup(generateMarkerPopupContent(earthquakeFeature, depth));
}

// Calculate circle radius based on earthquake magnitude
function calculateCircleRadius(magnitude) {
    return magnitude * 20000;
}

// Generate HTML content for the marker's popup
function generateMarkerPopupContent(earthquake, depth) {
    return `<h3>${earthquake.properties.title}</h3><hr>` +
           `<p><b>Date:</b> ${new Date(earthquake.properties.time)}</p>` +
           `<p><b>Magnitude:</b> ${earthquake.properties.mag}</p>` +
           `<p><b>Depth:</b> ${depth} km</p>`;
}

// Determine the color for the marker based on earthquake depth
function determineColorBasedOnDepth(depth) {
    if (depth > 70) {
        return '#ff0000'; // deep red for deep earthquakes
    } else if (depth > 50) {
        return '#ff8c00'; // dark orange for medium depth
    } else if (depth > 30) {
        return '#ffd700'; // gold for moderate depth
    } else if (depth > 10) {
        return '#9acd32'; // yellow green for shallow depth
    } else {
        return '#00ff00'; // green for very shallow depth
    }
}

// Initialize and display the map with earthquake layers
function initializeAndDisplayMap(earthquakeLayer) {
    const baseTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const map = L.map("map", {
        center: [38.5, -96.5], // Central coordinates for map display
        zoom: 5,
        layers: [baseTileLayer, earthquakeLayer]
    });

    L.control.layers(null, { "Earthquakes": earthquakeLayer }).addTo(map);
    addDepthLegendToMap(map);
}

// Add a legend for depth color coding to the map
function addDepthLegendToMap(map) {
    const depthLegend = L.control({ position: 'bottomright' });

    depthLegend.onAdd = function () {
        const legendDiv = L.DomUtil.create('div', 'info legend');
        const depthThresholds = [-10, 10, 30, 50, 70, 90];
        const labels = []; // Labels for the legend

        // Construct HTML string for legend
        legendDiv.innerHTML = '<h4>Earthquake Depth (km)</h4>';
        for (let i = 0; i < depthThresholds.length; i++) {
            const depth = depthThresholds[i];
            const nextDepth = depthThresholds[i + 1];
            const color = determineColorBasedOnDepth(depth + 1);

            labels.push(
                '<i style="background:' + color + '; width:18px; height:18px; float:left; opacity:0.7;"></i> ' +
                depth + (nextDepth ? '&ndash;' + nextDepth + ' km<br>' : '+ km')
            );
        }

        // Join all labels and update legendDiv innerHTML
        legendDiv.innerHTML += labels.join('');
        return legendDiv;
    };

    depthLegend.addTo(map);
}