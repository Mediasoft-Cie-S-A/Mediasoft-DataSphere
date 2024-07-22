
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
        console.log(field);
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

    var searchInputs = document.querySelectorAll('.search-container input');
    var allObjects = document.querySelectorAll('[dataconfig]');

    allObjects.forEach(element => {
        console.log(element);
        // get tagname
        try
        {
                let tagName = element.getAttribute("tagname");
                // check if the tagname is grid, map, chart, panel
                if (tagName === "grid" 
                    || tagName === "map" 
                    || tagName === "LineChart" 
                    || tagName === "BarChart"
                    || tagName === "PieChart"
                    || tagName === "DonutChart"
                    || tagName === "RadarChart"
                    || tagName === "PolarAreaChart"
                    || tagName === "BubbleChart"
                    || tagName === "ScatterChart"            
                    || tagName === "panel") {
                    // get the filter
                        let elementFilter = JSON.parse(element.getAttribute("filter")) || { view: "standard", filters: [] };

                        searchInputs.forEach(input => {
                            let dataset = input.getAttribute("dataset");
                            let linkFieldName = input.getAttribute("data-field-name");
                            let datatype = input.getAttribute("data-field-type");
                            let row = JSON.parse(input.getAttribute("filter"));
                            let linkFieldValue = input.value.trim();

                            if (row) {
                                let linkFieldName = Object.keys(row)[0];
                                let linkFieldValue = row[linkFieldName];
                            }

                            if (linkFieldValue) {
                                let found = false;

                                if (!elementFilter.filters)
                                    elementFilter.filters = [];

                                elementFilter.filters.forEach(item => {
                                    if (item.field === linkFieldName) {
                                        item.values = [linkFieldValue];
                                        found = true;
                                    }
                                });

                                if (!found) {
                                    elementFilter.filters.push({ field: linkFieldName, values: [linkFieldValue] });
                                }

                                element.setAttribute("filter", JSON.stringify(elementFilter));
                            } else {
                                // Remove the filter
                                console.log("remove the filter");

                                if (elementFilter.filters) {
                                    elementFilter.filters.forEach(item => {
                                        if (item.field === linkFieldName) {
                                            elementFilter.filters.splice(elementFilter.filters.indexOf(item), 1);
                                        }
                                    });
                                    element.setAttribute("filter", JSON.stringify(elementFilter));
                                }
                            }
                        });

                        // Update element based on its tagname
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
                                chartManager.renderData(element);
                                break;
                            case "Map":
                                updateMapData(element);
                                break;  
                            case "panel":
                                updatePanelData(element);
                                break;
                            default:
                                break;
                        }
                    }// end of if tagname
            }   
            catch(err)
            {
                console.log(err);
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
    // check if metaschema is not empty
    try
    {
        if (metadata.linkssourceTableName.length === 0) {
            showToast("No dataset found", 5000);
            return;
        }
    }
    catch(err)
    {
        loadSchema(false);
        
    }   
    // get the source table name from metadata links
    links = metadata.links;
    var datasetFileds = [];
    datasetFileds.push(fieldName);
    links.forEach(link => {
        
        if (link.sourceTableName === dataset) {
           // adding the fields to the datasetFields is not existing
            if (!datasetFileds.includes(link.sourceFieldName))
            datasetFileds.push(link.sourceFieldName);
        }
    });
    let url = `/getDatasetDataNoDuplication/${dataset}?fields=${datasetFileds.join(",")}`;
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
                    element.value = row[fieldName];
                    // create the linked filter
                    link={};
                    // for each key in the row get the value
                    for (const key in row) {
                        if (key !== fieldName && key !== "_id") {
                            link[key] = row[key];
                        }
                    }

                    element.setAttribute("filter", JSON.stringify(link));
                    autocomplete.style.display = "none";
                });
                rowDiv.innerHTML = row[fieldName];
                autocomplete.appendChild(rowDiv);
            });
        })
        .catch(error => {
            console.error(error);
        });
}


