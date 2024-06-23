
function createElementFilter(type){
    var main = document.createElement('div');
    main.className = 'dataSetContainer';
    main.id = type + Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName = type;

    return main;
}

function editElementFilter(type, element, content){
    const button = document.createElement('button');
    button.textContent = 'update';
    button.onclick = function() {
        const propertiesBar = document.getElementById('propertiesBar');
        const gridID = propertiesBar.querySelector('label').textContent;
        const main = document.getElementById(gridID);  
        updateDataSearch(main, content);
    };
    content.appendChild(button);   
    content.appendChild(createMultiSelectItem("Data", "data", "data"));

    if (element.getAttribute('datasearch') != null) {
        addLog(element.getAttribute('datasearch'));
        var target = content.querySelector('#Data');
        var jsonData = JSON.parse(element.getAttribute('datasearch'));
        console.log(jsonData);
        jsonData.forEach(fieldJson => {
            addFieldToPropertiesBar(target, fieldJson);
        });
    }
}

function updateDataSearch(main, content) {
    var data = content.querySelectorAll('#Data div');
    var jsonData = [];
    data.forEach(item => {
        var json = {
            "fieldName": item.querySelector('span[name="dataContainer"]').getAttribute("data-field-name"),
            "dataset": item.querySelector('span[name="dataContainer"]').getAttribute("dataset"),
            "fieldLabel": item.querySelector('span').textContent,
            "datatype": item.querySelector('span').getAttribute("data-type"),
            "functionName": item.querySelector('select').value
        };
        jsonData.push(json);
    });
    main.setAttribute("datasearch", JSON.stringify(jsonData));

    RenderDataSearch(main);
}

function RenderDataSearch(main) {
    main.innerHTML = "";
    var searchMainDiv = document.createElement('div');
    searchMainDiv.className = 'search-container';
    searchMainDiv.id = "searchDiv";
    searchMainDiv.style.display = "inline-block";
    main.appendChild(searchMainDiv);
    var jsonData = JSON.parse(main.getAttribute('datasearch'));

    jsonData.forEach(field => {
        addLog(field);
        var html = `<div class='searchMain' id='search_${field.fieldName + Date.now()}' >
                        <div class='search' id='search_${field.fieldName}_searchDiv'>
                            <input type='text' id='search_${field.fieldName}_input' list='searchList' placeholder='${field.fieldLabel}' autocomplete='off' 
                                oninput='searchAutoComplete(event,this)' 
                                dataset='${field.dataset}' 
                                data-field-name='${field.fieldName}' 
                                data-field-type='${field.datatype}' 
                                onclick='this.parentElement.querySelector(".autocomplete-results").style.display="none"'>
                            <button type='button' onclick='allSearch(event,"search_${field.fieldName}_input")'>
                                <i class='fas fa-search'></i>
                            </button>
                            <div id='search_${field.fieldName + Date.now()}_autocomplete' class='autocomplete-results'></div>
                        </div>
                    </div>`;
        searchMainDiv.innerHTML += html;
    });
}

function allSearch(event, targetID) {
    event.preventDefault();
    addLog("allSearch: " + targetID);

    var searchInputs = document.querySelectorAll('.search-container input');
    let filterInfo = { view: "standard", filters: [] };

    searchInputs.forEach(input => {
        let dataset = input.getAttribute("dataset");
        let fieldName = input.getAttribute("data-field-name");
        let datatype = input.getAttribute("data-field-type");
        let value = input.value.trim();
        console.log(value);
        console.log(fieldName);
        console.log(dataset);
        console.log(datatype);
        if (value) {
            filterInfo.filters.push({
                field: fieldName,
                dataset: dataset,
                type: datatype,
                operator: '',
                value: '',
                values: [value]
            });
        }
    });

    var allObjects = document.querySelectorAll('[tagname]');
    allObjects.forEach(element => {
        if (filterInfo.filters.length === 0)
            return;
        if (element.getAttribute("dataset") === filterInfo.filters[0].dataset) {
            var jsonFilter = JSON.parse(element.getAttribute("filter"));
            filterInfo.filters.forEach(filter => {
                var found = false;
                if (jsonFilter) {
                    if (!jsonFilter.filters)
                        jsonFilter.filters = [];
                    jsonFilter.filters.forEach(item => {
                        if (item.field === filter.field) {
                            item.values = filter.values;
                            found = true;
                        }
                    });
                    if (!found) {
                        jsonFilter.filters.push(filter);
                    }
                    element.setAttribute("filter", JSON.stringify(jsonFilter));
                } else {
                    jsonFilter = { view: "standard", filters: [] };
                    jsonFilter.filters.push(filter);
                    element.setAttribute("filter", JSON.stringify(jsonFilter));
                }
            });

            switch (element.getAttribute("tagname")) {
                case "grid":
                    updateGridData(element);
                    break;
                case "BarChart":
                case "LineChart":
                case "PieChart":
                case "DonutChart":
                case "RadarChart":
                case "PolarAreaChart":
                case "BubbleChart":
                case "ScatterChart":
                    addLog("renderChart");
                    chartManager.renderData(element);
                    break;
                default:
                    break;
            }
        }
    });
}


function searchAutoComplete(event, element) {
    event.preventDefault();

    const dataset = element.getAttribute("dataset");
    const fieldName = element.getAttribute("data-field-name");
    const datatype = element.getAttribute("data-field-type");

    const autocomplete = element.parentElement.querySelector('.autocomplete-results');
    const searchValue = element.value.trim();

    let url = `/getDatasetDataDistinct/${dataset}/${fieldName}`;
    if (searchValue.length > 3) {
        switch (datatype) {
            case "character":
                url += `&filter=${fieldName} like '%${searchValue}%'`;
                break;
            case "integer":
                url += `&filter=${fieldName}=${searchValue}`;
                break;
            case "date":
                url += `&filter=${fieldName}=${searchValue}`;
                break;
            case "logical":
                url += `&filter=${fieldName}=${searchValue}`;
                break;
            default:
                url += `&filter=${fieldName} like '%${searchValue}%'`;
                break;
        }
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            autocomplete.innerHTML = "";
            autocomplete.style.display = "block";
            autocomplete.style.position = "absolute";
            const { top, left } = getAbsoluteOffset(element);
            autocomplete.style.left = left + 'px';
            autocomplete.style.top = (parseInt(top) + parseInt(element.offsetHeight)) + 'px';
            autocomplete.style.width = element.offsetWidth + 'px';

            data.forEach(row => {
                var rowDiv = document.createElement('div');
                rowDiv.className = 'autocomplete-row';
                rowDiv.setAttribute("dataset", dataset);
                rowDiv.setAttribute("data-field-name", fieldName);
                rowDiv.setAttribute("data-field-type", datatype);
                rowDiv.addEventListener("click", function(event) {
                    event.preventDefault();
                    element.value = row;
                    autocomplete.style.display = "none";
                });
                rowDiv.innerHTML = row;
                autocomplete.appendChild(rowDiv);
            });
        })
        .catch(error => {
            console.error(error);
        });
}


