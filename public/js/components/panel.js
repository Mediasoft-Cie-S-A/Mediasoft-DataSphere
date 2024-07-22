var dataset = [];
var labels = [];
var sortDirection = {};  // Object to keep track of sorting directions

// Function to create the first record component
function createElementPanel(type) {
    // Create the main div
    console.log("createElementPanel");
    var main = document.createElement('div');
    main.className = 'form-container';
    main.id = type + Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName = type;
    main.setAttribute("dataConfig", JSON.stringify([]));
    main.setAttribute("pivotConfig", JSON.stringify([]));
    main.setAttribute("filter", JSON.stringify({ view: "standard", filters: [] }));
    renderFirstRecord(dataset, labels, main);
    return main;
}

// Function to edit the first record component
function editElementPanel(type, element, content) {
    const button = document.createElement('button');
    button.textContent = 'Update';
    button.onclick = function(event) {
        const propertiesBar = document.getElementById('propertiesBar');
        const panelID = propertiesBar.querySelector('label').textContent;
        const main = document.getElementById(panelID);
        updatePanelJsonData(element);
    };
    content.appendChild(button);

    const data = createMultiSelectItem("Data", "data", "data", element.getAttribute('data'), "text");
    const pivot = createMultiSelectItem("Pivot", "pivot", "pivot", element.getAttribute('pivot'), "text");

    content.appendChild(data);
    content.appendChild(pivot);

    const dataConfig = JSON.parse(element.getAttribute("dataConfig"));
    const pivotConfig = JSON.parse(element.getAttribute("pivotConfig"));

    if (dataConfig) {
        dataConfig.forEach(config => addFieldToPropertiesBar(data, config));
    }
    if (pivotConfig) {
        pivotConfig.forEach(config => addFieldToPropertiesBar(pivot, config));
    }

    var filter = createFilterBox(content);
    element.setAttribute("filter", JSON.stringify(filter));
    content.appendChild(filter);

    // Initialize with the standard view
    switchView(event, content, 'standard');
    regenerateFilters(content, JSON.parse(element.getAttribute("filter")));
}

// Function to update panel JSON data
function updatePanelJsonData(element) {
    const propertiesBar = document.getElementById('propertiesBar');
    const chartID = propertiesBar.querySelector('label').textContent;
    var dataInput = propertiesBar.querySelector('#Data');
    var dataSelect = dataInput.querySelectorAll('div');
    var pivotInput = propertiesBar.querySelector('#Pivot');

    // Generate array of data
    var dataConfig = [];
    dataSelect.forEach(item => {
        var selectFunction = item.querySelector('select');
        var functionName = selectFunction[selectFunction.selectedIndex].value;
        var fieldName = item.querySelector('span').getAttribute('data-field-name');
        var dataType = item.querySelector('span').getAttribute('data-type');
        var dataset = item.querySelector('span').getAttribute('dataset');
        element.setAttribute("dataset", dataset);
        dataConfig.push({ fieldName: fieldName, functionName: functionName, dataType: dataType, dataset: dataset });
    });
    element.setAttribute("dataConfig", JSON.stringify(dataConfig));

    // Generate array of pivot
    var pivotSelect = pivotInput.querySelectorAll('div');
    var pivotConfig = [];
    pivotSelect.forEach(item => {
        var selectFunction = item.querySelector('select');
        var functionName = selectFunction[selectFunction.selectedIndex].value;
        var fieldName = item.querySelector('span').getAttribute('data-field-name');
        var dataType = item.querySelector('span').getAttribute('data-type');
        var dataset = item.querySelector('span').getAttribute('dataset');
        element.setAttribute("dataset", dataset);
        pivotConfig.push({ fieldName: fieldName, functionName: functionName, dataType: dataType, dataset: dataset });
    });
    element.setAttribute("pivotConfig", JSON.stringify(pivotConfig));

    // Save filters
    var filters = JSON.parse(element.getAttribute("filter"));
    element.setAttribute("filters", JSON.stringify(filters.filters));

    updatePanelData(element);
}

// Function to get panel
function getPanel() {
    const propertiesBar = document.getElementById('propertiesBar');
    const panelID = propertiesBar.querySelector('label').textContent;
    const element = document.getElementById(panelID);
    const panelNumber = element.getAttribute('panelNumber');
    var chart = chartList[panelNumber];
    return chart;
}

// Function to update panel data
function updatePanelData(element) {
    var dataConfig = JSON.parse(element.getAttribute("dataConfig"));
    var pivotConfig = JSON.parse(element.getAttribute("pivotConfig"));
    const sort = JSON.parse(element.getAttribute("sort"));
    const limit = {value: 1};

    // Get the dataset data from the server, using the filter
    var url = `/getDatasetDataByFilter?datasetName=${element.getAttribute("dataset")}`;

    const request = new XMLHttpRequest();
    request.open("POST", url, false); // `false` makes the request synchronous
    const filter = JSON.parse(element.getAttribute("filter"));
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    if (filter !== null && filter !== undefined && filter !== "undefined") {
        const body = {
            columns: dataConfig,
            pivot: pivotConfig,
            view: "standard",
            filters: filter,
            sort: sort,
            limit: limit,
            links: metadata.links
        };
        request.send(JSON.stringify(body));
    } else {
        const body = {
            columns: dataConfig,
            pivot: pivotConfig,
            view: "standard",
            filters: [],
            sort: sort,
            limit: limit,
            links: metadata.links
        };
        request.send(JSON.stringify(body));
    }
    if (request.status === 200) {
        const data = JSON.parse(request.responseText);
        dataset = data;
    }

    renderFirstRecord(dataset, labels, element);
   
}

// Function to render the first record component
function renderFirstRecord(dataset, labels, container) {
    
    console.log("renderFirstRecord");
    console.log(labels);
    if (!container) {
        console.error('Container not found');
        return;
    }
    if (!dataset.length) {
        console.error('No data provided');
        return;
    }
    dataconfig = JSON.parse(container.getAttribute("dataConfig"));
    
    container.innerHTML = '';  // Clear the container at the beginning
    //generate the panel
    var panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = 'panel'+dataset[0].id;
    panel.draggable = true;
    // create control panel with select to select the function to apply to the field
    panel.innerHTML ="";
    createPanelControlPanel(['sum','avg','min','max','count','first','last'], container);
    try
    {
    panel.innerHTML += `<div class="panel-header">${dataconfig[0].fieldName}:</div>`;	
    panel.innerHTML += `<div class="panel-content">${dataset[0][dataconfig[0].fieldName]}</div>`;
    }
    catch(err)
    {
        console.log(err);
    }


    container.appendChild(panel);
    // Create the table
}

// create control panel with select to select the function to apply to the field
function createPanelControlPanel(data, container) {
    var dataconfig = JSON.parse(container.getAttribute("dataConfig"));
    var controlPanel = document.createElement('div');
    controlPanel.className = 'control-panel';
    var label = document.createElement('label');
    label.textContent = 'Function:';
    controlPanel.appendChild(label);
    var select = document.createElement('select');
    select.id = 'function';
    select.className = 'function';
   
    data.forEach(function (item) {
        try
        {
            var option = document.createElement('option');
            option.value = item;
            option.text = item;
            
            if (dataconfig[0].functionName === item) {
                option.selected = true;
            }
            select.appendChild(option);
        }
        catch(err)
        {
            console.log(err);
        }
       
    });
    // Add event listener to the select
   select.setAttribute('onchange', 'applyFunction(event)');
    controlPanel.appendChild(select);
    container.appendChild(controlPanel);
}

// apply the new functions
function applyFunction(event) {
    var container = event.target.closest('.form-element');
    var dataconfig = JSON.parse(container.getAttribute("dataConfig"));
    var functionSelect = container.querySelector('#function');
    dataconfig[0].functionName = functionSelect.value;
    container.setAttribute("dataConfig", JSON.stringify(dataconfig));
    updatePanelData(container);
}


