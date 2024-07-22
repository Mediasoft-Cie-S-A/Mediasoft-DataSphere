var dataset = [];
var labels = [];
var sortDirection = {};  // Object to keep track of sorting directions

function createElementGrid(type) {
    // Create the main div
    console.log("createElementChart");
    var main = document.createElement('div');
    main.className = 'form-container';
    main.id = type + Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName = type;
    main.setAttribute("dataConfig", JSON.stringify([]));
    main.setAttribute("pivotConfig", JSON.stringify([]));
    main.setAttribute("filter", JSON.stringify({ view: "standard", filters: [] }));
    render(dataset, labels, main, 10);
    return main;
}

function editElementGrid(type, element, content) {
    const button = document.createElement('button');
    button.textContent = 'Update';
    button.onclick = function(event) {
        const propertiesBar = document.getElementById('propertiesBar');
        const gridID = propertiesBar.querySelector('label').textContent;
        const main = document.getElementById(gridID);
        updateGridJsonData(element);
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

function updateGridJsonData(element) {
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

  
    updateGridData(element);
}


function getGrid() {
    const propertiesBar = document.getElementById('propertiesBar');
    const gridID = propertiesBar.querySelector('label').textContent;
    const element = document.getElementById(gridID);
    const gridNumber = element.getAttribute('gridNumber');
    var chart = chartList[gridNumber];
    return chart;
}

function updateGridData(element,sendToAI=false,prompt=null) {
    var dataConfig = JSON.parse(element.getAttribute("dataConfig"));
    var pivotConfig = JSON.parse(element.getAttribute("pivotConfig"));
    const sort = JSON.parse(element.getAttribute("sort"));
    const limit = JSON.parse(element.getAttribute("limit"));
          
    
    var gridDatasets = [];
    var labels = [];
    element.innerHTML = '';
    for (var index = 0; index < dataConfig.length; index++) {
        console.log(index);
        var config = dataConfig[index];
        console.log(config);
        var functionName = config.functionName;
        console.log("functionName:" + functionName);

        var fieldName = config.fieldName;
        console.log("fieldName:" + fieldName);

        // Prepare the dataset
        labels.push(fieldName);
    }
         // Display loading indicator
    const loadingIndicator = document.createElement('div');
         loadingIndicator.innerHTML= '<p style="margin: auto">Loading...</p><img src="/img/loader_metal.gif" style="display: block; margin: auto; width:200px;">';
    element.appendChild(loadingIndicator);
         // Get the dataset data from the server, using the filter
    var url = `/getDatasetDataByFilter?datasetName=${element.getAttribute("dataset")}`;

    const request = new XMLHttpRequest();
    request.open("POST", url, false); // `false` makes the request synchronous
    const filter = JSON.parse(element.getAttribute("filter"));
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    console.log("filter:" + filter);
    console.log(metadata);
    if (filter !== null && filter !== undefined && filter !== "undefined") {
        const body = {
                 columns: dataConfig, 
                 pivot: pivotConfig, 
                 view: "standard", 
                 filters: filter,
                  sort: sort, 
                  limit: limit,
                 links:  metadata.links
                };
        request.send(JSON.stringify(body));
    } else {
        console.log("No filter");
        const body = {
             columns: dataConfig,
             pivot: pivotConfig,
             view: "standard", 
             filters: [], 
             sort: sort, 
             limit: limit,
             links:  metadata.links
            };
        request.send(JSON.stringify(body));
    }
    if (request.status === 200) {
        const data = JSON.parse(request.responseText);
        dataset = data;
    }
   
    if(!sendToAI)
     render(dataset, labels, element, 10);
    else
    {
        // Send the data to AI
        queryChatAI(prompt+ ", the request is related to the json in the input: "
             +JSON.stringify(dataset) + " , return only the json data as result with all the columns in the source json, and if there is a fuction, please calcuate the function if need, without explanaition. for the result delimit the json with #START_JSON and #AND_JSON.").then(response => {
            console.log(response);
            render(response, labels, element, 10);
        });
    }
    
}

function render(dataset, labels, container, rowsPerPage = 10) {
    if (!container) {
        console.error('Container not found');
        return;
    }
    if (!dataset.length) {
        console.error('No data provided');
        return;
    }

    container.innerHTML = '';  // Clear the container at the beginning
    createGridControlPanel(container);
    console.log("render");

    let currentPage = 1;
    const totalPages = Math.ceil(dataset.length / rowsPerPage);
    const maxPageButtons = 5; // Maximum number of page buttons to display

    const table = document.createElement('table');
    container.appendChild(table);

    table.style.width = '100%';
    table.setAttribute('border', '1');

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Generate header row get all the keys from the object in the dataset
    dataset.forEach(item => {
        Object.keys(item).forEach(key => {
            if (!labels.includes(key) && key !== '_id') {
                labels.push(key);
            }
        });
    });

    labels.forEach(label => {
        const th = document.createElement('th');
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;

        th.appendChild(labelSpan);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body rows
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Pagination controls
    const paginationDiv = document.createElement('div');
    container.appendChild(paginationDiv);

    function updatePaginationButtons() {
        paginationDiv.innerHTML = '';

           
        // Update the limit input with row count
        const limitInput = container.querySelector('#limitInput');
        if (limitInput) {
            limitInput.value = dataset.length;
        }

        // Determine the range of page buttons to display
        const half = Math.floor(maxPageButtons / 2);
        let startPage = Math.max(1, currentPage - half);
        let endPage = Math.min(totalPages, currentPage + half);

        if (currentPage - half < 1) {
            endPage = Math.min(totalPages, endPage + (half - (currentPage - 1)));
        }
        if (currentPage + half > totalPages) {
            startPage = Math.max(1, startPage - ((currentPage + half) - totalPages));
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.style.margin = '1px';
            pageButton.style.direction = 'rtl';
            pageButton.style.display = 'inline-block';
            pageButton.style.alignSelf = 'left';
            pageButton.textContent = i;
            pageButton.onclick = () => changePage(i);
            if (i === currentPage) {
                pageButton.disabled = true;
            }
            paginationDiv.appendChild(pageButton);
        }
        const exportButton = document.createElement('button');
        exportButton.innerHTML = '<i class="fas fa-file-export"></i>';
        exportButton.style.margin = '1px';
        exportButton.style.direction = 'rtl';
        exportButton.style.display = 'inline-block';
        exportButton.style.alignSelf = 'right';
        exportButton.onclick = () => {
            console.log('Exporting data');
            //console.log(labels);
           // console.log(dataset);
            let csv = labels.join(',') + '\n';
            for (let i = 0; i < dataset.length; i++) {
                for (let j = 0; j < labels.length; j++) {
                    csv += dataset[i][labels[j]];
                    if (j < labels.length - 1) {
                        csv += ',';
                    }
                }
                csv += '\n';
            }

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.csv';
            a.click();
            URL.revokeObjectURL(url);
        };

        // Add export button
        paginationDiv.appendChild(exportButton);
         // Display row number and row count
         const rowInfo = document.createElement('div');
         rowInfo.textContent = `Page: ${currentPage}/${dataset.length/10} - Rows: ${dataset.length}`;
         rowInfo.style.display = 'inline-block';
         paginationDiv.appendChild(rowInfo);
    }

    function changePage(page) {
        currentPage = page;
        const start = (currentPage - 1) * rowsPerPage;
        let end = start + rowsPerPage;
        if (end > dataset.length) {
            end = dataset.length;
        }
        tbody.innerHTML = '';
        for (let i = start; i < end; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < labels.length; j++) {
                const value = dataset[i][labels[j]];
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        updatePaginationButtons();
    }

    // Initialize the first page
    changePage(1);
}

function sortData(field, direction,currentChart ) {
        
    // check if in dataConfig there sort element, if exists replace it with the new one otherwise add it
    
    currentChart.setAttribute("sort", JSON.stringify({ field: field, direction: direction }));
    updateGridData(currentChart);

}

function limitResults(limitValue,currentChart) {
    
    currentChart.setAttribute("limit", JSON.stringify({ value: limitValue}));
    updateGridData(currentChart);
}

function createGridControlPanel(element) {
    const id = "CTRLPANEL" + element.id;
    var controlPanel = element.querySelector(`#${id}`);
    var sortfield = "";
    // define the limit value with the size of the dataset
    var limitValue = 100;


    if (controlPanel) {
        // Get sort field and direction
        sortfield = element.querySelector('#sortSelect').textContent;
        limitValue = element.querySelector('#limitInput').value;

        element.removeChild(controlPanel);
    }

    controlPanel = document.createElement('div');
    controlPanel.id = id;
    controlPanel.style.display = 'flex';
    controlPanel.style.flexDirection = 'column';
    controlPanel.style.backgroundColor = '#f0f0f0';
    controlPanel.style.padding = '10px';
    controlPanel.style.marginBottom = '10px';

    // Sort and limit controls container
    const sortLimitContainer = document.createElement('div');
    sortLimitContainer.style.display = 'flex';
    sortLimitContainer.style.alignItems = 'center';
    sortLimitContainer.style.marginBottom = '10px';

    // Sort label and select
    const sortLabel = document.createElement('label');
    sortLabel.textContent = 'Field';
    sortLabel.style.marginRight = '10px';
    sortLimitContainer.appendChild(sortLabel);

    const sortSelect = document.createElement('select');
    sortSelect.id = 'sortSelect';
    JSON.parse(element.getAttribute("dataConfig")).forEach(config => {
        const option = document.createElement('option');
        option.value = config.fieldName;
        option.textContent = config.fieldName;
        sortSelect.appendChild(option);
        if (config.fieldName === sortfield) {
            option.selected = true;
        }
    });
    sortSelect.style.marginRight = '10px';
    sortLimitContainer.appendChild(sortSelect);

    // Sort buttons
    const sortAscButton = document.createElement('button');
    sortAscButton.textContent = '↑';
    sortAscButton.onclick = () => sortData(sortSelect.value, 'asc', element);
    sortAscButton.style.marginRight = '5px';
    sortLimitContainer.appendChild(sortAscButton);

    const sortDescButton = document.createElement('button');
    sortDescButton.textContent = '↓';
    sortDescButton.onclick = () => sortData(sortSelect.value, 'desc', element);
    sortDescButton.style.marginRight = '10px';
    sortLimitContainer.appendChild(sortDescButton);

    // Limit label and input
    const limitLabel = document.createElement('label');
    limitLabel.textContent = 'Limit results:';
    limitLabel.style.marginRight = '10px';
    sortLimitContainer.appendChild(limitLabel);

    const limitInput = document.createElement('input');
    limitInput.type = 'number';
    limitInput.id = 'limitInput';
    if (limitValue !== null) {
        limitInput.value = limitValue;
    }
    limitInput.style.marginRight = '10px';
    sortLimitContainer.appendChild(limitInput);

    // Update button
    const updateButton = document.createElement('button');
    updateButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
    updateButton.onclick = () => limitResults(parseInt(limitInput.value), element);
    sortLimitContainer.appendChild(updateButton);

    controlPanel.appendChild(sortLimitContainer);

    // ChatGPT query panel
    const chatAIContainer = document.createElement('div');
    chatAIContainer.style.display = 'flex';
    chatAIContainer.style.alignItems = 'center';

    // Prompt label and input
    const promptLabel = document.createElement('label');
    promptLabel.textContent = 'Query AI:';
    promptLabel.style.marginRight = '10px';
    chatAIContainer.appendChild(promptLabel);

    const promptInput = document.createElement('input');
    promptInput.type = 'text';
    promptInput.id = 'promptInput';
    promptInput.style.marginRight = '10px';
    chatAIContainer.appendChild(promptInput);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.onclick = async () => {
        const query = promptInput.value;
        if (query) {
            updateGridData(element, true, query);
            // Process the response as needed
        }
    };
    chatAIContainer.appendChild(submitButton);

    controlPanel.appendChild(chatAIContainer);

    element.insertBefore(controlPanel, element.firstChild);
}

async function queryChatAI(query) {
    const apiKey = 'API-KEY';
    const apiUrl = 'https://api.openai.com/v1/chat/completions  ';

    const response =  await  fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            "model": "gpt-4",
            "messages": [{"role":"user", "content": query}],
        })
    });

    const data = await response.json();
    let result = extractJsonData(data.choices[0].message.content);
    // check if result is an array
    if (!Array.isArray(result)) {
        result = [result];
    }
    return result;
}

function extractJsonData(text) {
    const jsonRegex = /#START_JSON\s*([\s\S]*?)\s*#END_JSON/;
    const match = text.match(jsonRegex);
    if (match && match[1]) {
        try {
            const jsonData = JSON.parse(match[1]);
            return jsonData;
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return null;
        }
    } else {
        console.error("No JSON data found");
        return null;
    }
}
