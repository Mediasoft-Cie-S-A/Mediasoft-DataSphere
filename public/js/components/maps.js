function createMapPanel(type, location) {
    // Create the main div
    console.log("createMapPanel");
    var main = document.createElement('div');
    main.className = 'map-container';
    main.id = type + Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName = type;
    main.setAttribute("location", JSON.stringify(location || {}));
    renderMap(main, location);
    return main;
}

function editMapPanel(type, element, content) {
    const button = document.createElement('button');
    button.textContent = 'Update';
    button.onclick = function(event) {
        const propertiesBar = document.getElementById('propertiesBar');
        const panelID = propertiesBar.querySelector('label').textContent;
        const main = document.getElementById(panelID);
        updateMapJsonData(element);
    };
    content.appendChild(button);

    const location = JSON.parse(element.getAttribute('location'));
    const locationInput = createLocationInput("Location", "location", "location", location);
    content.appendChild(locationInput);

    const locationConfig = JSON.parse(element.getAttribute("location"));

    if (locationConfig) {
        addLocationToPropertiesBar(locationInput, locationConfig);
    }
}

function updateMapJsonData(element) {
    const propertiesBar = document.getElementById('propertiesBar');
    const chartID = propertiesBar.querySelector('label').textContent;
    var locationInput = propertiesBar.querySelector('#Location');
    var locationSelect = locationInput.querySelectorAll('div');

    var locationConfig = [];
    locationSelect.forEach(item => {
        var locationType = item.querySelector('span').getAttribute('data-type');
        var locationValue = item.querySelector('input').value;
        locationConfig.push({ type: locationType, value: locationValue });
    });
    element.setAttribute("location", JSON.stringify(locationConfig));

    updateMapData(element);
}

function getMapPanel() {
    const propertiesBar = document.getElementById('propertiesBar');
    const panelID = propertiesBar.querySelector('label').textContent;
    const element = document.getElementById(panelID);
    const panelNumber = element.getAttribute('panelNumber');
    var map = mapList[panelNumber];
    return map;
}

function updateMapData(element) {
    var locationConfig = JSON.parse(element.getAttribute("location"));

    // Validate and parse location data
    let lat, lng;
    if (locationConfig.length === 2 && locationConfig[0].type === "lat" && locationConfig[1].type === "lng") {
        lat = parseFloat(locationConfig[0].value);
        lng = parseFloat(locationConfig[1].value);
        renderMap(element, { lat, lng });
    } else {
        const address = locationConfig.map(loc => loc.value).join(', ');
        geocodeAddress(address, (err, coords) => {
            if (err) {
                console.error("Geocoding error:", err);
                return;
            }
            lat = coords.lat;
            lng = coords.lng;
            renderMap(element, { lat, lng });
        });
    }
}

function renderMap(container, location) {
    if (!container) {
        console.error('Container not found');
        return;
    }
    if (!location || typeof location.lat === 'undefined' || typeof location.lng === 'undefined') {
        console.error('Invalid location data');
        return;
    }

    container.innerHTML = '';  // Clear the container at the beginning

    var mapDiv = document.createElement('div');
    mapDiv.style.height = '400px'; // Set the height of the map
    container.appendChild(mapDiv);

    const map = L.map(mapDiv).setView([location.lat, location.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([location.lat, location.lng]).addTo(map)
        .bindPopup('Location')
        .openPopup();
}

function createLocationInput(labelText, id, name, value) {
    const container = document.createElement('div');
    container.className = 'location-input';

    const label = document.createElement('label');
    label.textContent = labelText;
    container.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = name;
    input.value = value ? JSON.stringify(value) : '';
    container.appendChild(input);

    return container;
}

function addLocationToPropertiesBar(element, config) {
    config.forEach(location => {
        const locationItem = createLocationInput("Location", "location", "location", location.value);
        element.appendChild(locationItem);
    });
}

function geocodeAddress(address, callback) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                callback(null, { lat: parseFloat(lat), lng: parseFloat(lon) });
            } else {
                callback(new Error("No results found"));
            }
        })
        .catch(err => callback(err));
}
