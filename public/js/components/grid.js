// Example usage
var dataset = [];

var labels = [];

function createElementGrid(type) {
    // Create the main div
    addLog("createElementChart");
    var main = document.createElement('div');
    main.className = 'form-container';
    main.id = type + Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName = type;
    render(dataset, labels, main, 10);
    return main;
}

function editElementGrid(type, element, content) {
    const button = document.createElement('button');
    button.textContent = 'update';
    button.onclick = function(event) {
        const propertiesBar = document.getElementById('propertiesBar');
        const gridID = propertiesBar.querySelector('label').textContent;
        const main = document.getElementById(gridID);
        updateGridJsonData(element);
    };
    content.appendChild(button);
    content.appendChild(createMultiSelectItem("Data", "data", "data", element.getAttribute('data'), "text", true));

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

    // Generate array of data
    var dataConfig = [];
    dataSelect.forEach(item => {
        var selectFunction = item.querySelector('select');
        var functionName = selectFunction[selectFunction.selectedIndex].value;
        var fieldName = item.querySelector('span').getAttribute('data-field-name');
        var dataType = item.querySelector('span').getAttribute('data-type');
        var dataset = item.querySelector('span').getAttribute('dataset');
        element.setAttribute("dataSet", dataset);
        dataConfig.push({ fieldName: fieldName, functionName: functionName, dataType: dataType, dataset: dataset });
    });
    element.setAttribute("dataConfig", JSON.stringify(dataConfig));

    // Save filters
    var filters = JSON.parse(element.getAttribute("filter"));
    element.setAttribute("filters", JSON.stringify(filters.filters));

    updateGridData(element);
}

function render(dataset, labels, container, rowsPerPage = 10) {
    addLog(dataset);
    if (!container) {
        console.error('Container not found');
        return;
    }
    if (!dataset.length) {
        console.error('No data provided');
        return;
    }

    addLog("render");
    let currentPage = 1;
    const totalPages = Math.ceil(dataset[0].length / rowsPerPage);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.setAttribute('border', '1');

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    labels.forEach(label => {
        const th = document.createElement('th');
        th.textContent = label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body rows
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Pagination controls
    const paginationDiv = document.createElement('div');
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.style.margin = '1px';
        pageButton.style.direction = 'rtl';
        pageButton.style.display = 'inline-block';
        pageButton.style.alignSelf = 'left';
        pageButton.textContent = i;
        pageButton.onclick = () => changePage(i);
        paginationDiv.appendChild(pageButton);
    }

    const exportButton = document.createElement('button');
    exportButton.innerHTML = '<i class="fas fa-file-export"></i>';
    exportButton.style.margin = '1px';
    exportButton.style.direction = 'rtl';
    exportButton.style.display = 'inline-block';
    exportButton.style.alignSelf = 'right';
    exportButton.onclick = () => {
        addLog('Exporting data');
        addLog(labels);
        addLog(dataset[0]);
        let csv = labels.join(',') + '\n';
        for (let i = 0; i < dataset[0].length; i++) {
            for (let j = 0; j < dataset.length; j++) {
                csv += dataset[j][i];
                if (j < dataset.length - 1) {
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
    paginationDiv.appendChild(exportButton);

    container.innerHTML = '';
    container.appendChild(table);
    container.appendChild(paginationDiv);

    function changePage(page) {
        currentPage = page;
        const start = (currentPage - 1) * rowsPerPage;
        let end = start + rowsPerPage;
        if (end > dataset[0].length) {
            end = dataset[0].length;
        }
        tbody.innerHTML = '';
        for (let i = start; i < end; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < dataset.length; j++) {
                const value = dataset[j];
                const cell = document.createElement('td');
                cell.textContent = value[i];
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
    }

    // Initialize the first page
    changePage(1);
}

function getGrid() {
    const propertiesBar = document.getElementById('propertiesBar');
    const gridID = propertiesBar.querySelector('label').textContent;
    const element = document.getElementById(gridID);
    const gridNumber = element.getAttribute('gridNumber');
    var chart = chartList[gridNumber];
    return chart;
}

function updateGridData(element) {
    var dataConfig = JSON.parse(element.getAttribute("dataConfig"));
    var gridDatasets = [];
    var labels = [];

    for (var index = 0; index < dataConfig.length; index++) {
        addLog(index);
        var config = dataConfig[index];
        addLog(config);
        var functionName = config.functionName;
        addLog("functionName:" + functionName);

        var fieldName = config.fieldName;
        addLog("fieldName:" + fieldName);

        // Prepare the dataset
        labels.push(fieldName);

        // Get the dataset data from the server, using the filter
        var url = getFilterUrl(element);
        // url+="&groups="+labelName+"&agg="+fieldName+"&funct="+functionName;

        const request = new XMLHttpRequest();
        request.open("GET", url, false); // `false` makes the request synchronous
        request.send(null);

        if (request.status === 200) {
            querydata = request.responseText;
        }

        const data = JSON.parse(querydata);

        // Assign the data to the chart only the fields name
        var rowdata = [];
        data.forEach(item => {
            rowdata.push(item[fieldName]);
        });

        gridDatasets.push(rowdata);
    }

    render(gridDatasets, labels, element, 10);
}

function getFilterUrl(element) {
    var url = '/getDatasetDataByFilter?datasetName=' + element.getAttribute("dataSet");
   // check if filter is set    
   // get filters attribute
   if (element.getAttribute("filter") != null && element.getAttribute("filter") != undefined) {
        try {
            var filter = JSON.parse(element.getAttribute("filters"));
            if (filter) {
                var fieldArray = [];
                var valueArray = [];
                filter.forEach(f => {
                    fieldArray.push(f.field);
                    valueArray.push(f.values.join(','));
                });
                if (fieldArray.length > 0 && valueArray.length > 0) {
                    url += '&fields=' + fieldArray.join(',') + '&values=' + valueArray.join(';');
                }
            }
        }
        catch (e) {
            addLog(e);
        }
    }
    return url;
}
