/*!
 * Copyright (c) 2023 Mediasoft & Cie S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// define global variables
var globalDataSets = [];
var fieldsArray = [];
var typeArray = [];

// startup
var mime = 'text/x-sql';
window.editor = CodeMirror.fromTextArea(document.getElementById('QueryBarBodyBodyTextArea'), {
    mode: mime,
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: false,
    matchBrackets: true,
    autofocus: true,
    autocorrect: true,
    spellcheck: true,
    extraKeys: { "tab": "autocomplete" },
    hintOptions: { tables: {} }
});
window.editor.setSize("800px", "100%");
window.editor.on("change", function () {
    window.editor.save();
});

addLog('editor:', window.editor);

// createTable list for the database editor
function createTableListDb() {
    const list = document.getElementById('tableListBar');
    fetchTablesList(list);
}

function dropInputTable(event) {
    event.preventDefault();
    addLog("dropInputTable");
    addLog(event.dataTransfer);
    var elementId = event.dataTransfer.getData("text");
    addLog("elementId:" + elementId);
    event.target.value = elementId;
    generateTableDiagram(elementId);
}

// execute the query /query/:sqlQuery fetch max 20 rows
function executeQuery(event) {
    event.preventDefault();
    var sqlQuery = window.editor.getValue();
    var url = '/query/' + sqlQuery;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            addLog('data:', data);
            var tableBody = document.getElementById('QueryResultTable');
            tableBody.innerHTML = "";
            var tableHeader = document.createElement('tr');
            tableHeader.setAttribute('class', 'tableHeader');
            tableBody.appendChild(tableHeader);

            if (Array.isArray(data)) {
                if (data.length > 0) {
                    var firstObject = data[0];
                    var header = Object.keys(firstObject);
                    header.forEach(field => {
                        var th = document.createElement('th');
                        th.textContent = field;
                        tableHeader.appendChild(th);
                        fieldsArray.push(field);
                        typeArray.push(getType(firstObject[field]));
                    });
                    data.forEach(row => {
                        var tr = document.createElement('tr');
                        tableBody.appendChild(tr);
                        var rowData = Object.values(row);
                        rowData.forEach(field => {
                            var td = document.createElement('td');
                            td.textContent = field;
                            tr.appendChild(td);
                        });
                    });
                }
            } else {
                var tr = document.createElement('tr');
                tableBody.appendChild(tr);
                var rowData = Object.values(data);
                rowData.forEach(field => {
                    var td = document.createElement('td');
                    td.textContent = field;
                    tr.appendChild(td);
                });
            }
        })
        .catch(error => console.error('Error:', error));
}

function saveQuery(event) {
    event.preventDefault();

    event.target.disabled = true;

    var datasetName = document.getElementById('DataSetName').value;
    globalDataSets[datasetName] = {
        query: window.editor.getValue(),
        fields: fieldsArray,
        types: typeArray,
        datasetName: datasetName,
        diagram: {
            ERDTables: this.ERDTables,
            ERDLinks: this.ERDLinks
        }
    };

    const dataset = {
        datasetName: globalDataSets[datasetName].datasetName,
        query: globalDataSets[datasetName].query,
        fields: globalDataSets[datasetName].fields,
        types: globalDataSets[datasetName].types,
        tables: globalDataSets[datasetName].diagram.ERDTables,
        links: globalDataSets[datasetName].diagram.ERDLinks
    };

    saveDatasetToMongoDB(dataset);
    callStoreDatasetData(datasetName, globalDataSets[datasetName].query);
    event.target.disabled = false;
}

function saveDatasetToMongoDB(dataset) {
    fetch('/storeDataset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataset)
    })
    .then(response => response.json())
    .then(data => {
        showToast('Success: ' + data.message, 5000); // Show toast for 5 seconds
    })
    .catch((error) => {
        showToast('Error! ' + error, 5000); // Show toast for 5 seconds
        console.error('Error:', error);
    });
}

async function callStoreDatasetData(datasetName, sqlQuery) {
    const url = '/storeDatasetData';
    const data = {
        datasetName: datasetName,
        sqlQuery: sqlQuery,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response:', responseData);

        return responseData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function getType(field) {
    addLog('field:', field);
    addLog('field:', !isNaN(parseFloat(field)));
    if (!isNaN(parseFloat(field))) {
        return 'number';
    }

    const date = new Date(field);
    if (!isNaN(date.getTime())) {
        return 'date';
    }

    return 'string';
}

function loadDataSetQueryDiagram(datasetName) {
    var dataset = globalDataSets[datasetName];
    window.editor.setValue(dataset.query);

    if (dataset.diagram) {
        this.ERDTables = dataset.diagram.ERDTables != null ? dataset.diagram.ERDTables : [];
        this.ERDLinks = dataset.diagram.ERDLinks != null ? dataset.diagram.ERDLinks : [];
        drawAll();
    }
}

function editTableFieldList(language, tables, links) {
    const editTableFields = document.getElementById('TableEdit');
    addLog('editTableFields:', editTableFields);
    addLog('tables:', tables);
    var sqlEditorTable = [];

    for (var key in tables) {
        var table = tables[key];
        table.fields.forEach(field => {
            var fieldName = field.NAME;
            var tableName = table.tableName;
            sqlEditorTable.push(tableName + "." + fieldName);
            var divID = tableName + "." + fieldName;

            if (!editTableFields.innerHTML.includes(divID) && fieldName !== null) {
                var newColumn = document.createElement('div');
                newColumn.setAttribute('class', 'field-item');
                newColumn.setAttribute('data-table-name', tableName);
                newColumn.setAttribute('data-table-field', fieldName);
                newColumn.innerHTML = `${fieldName}<br/>visible:<input type="checkbox" checked onchange="generateSQLByEditFields()"/>Alias:<input type="text" onchange="generateSQLByEditFields()" />`;
                newColumn.id = divID;
                editTableFields.appendChild(newColumn);
            }
        });
    }

    if (language == 'SQL')
        generateSQLByEditFields(tables, links);
    if (language == '4GL')
        generate4GLByEditFields(tables, links);
}

function generateSQLByEditFields(tables, links) {
    const editTableFields = document.getElementById('TableEdit');
    var fields = editTableFields.querySelectorAll('div');
    var sqlQuery = "SELECT ";
    var sqlEditorFileds = [];
    var sqlEditorTables = [];
    fields.forEach(field => {
        var tableName = field.getAttribute('data-table-name');
        var fieldName = field.getAttribute('data-table-field');
        var checkbox = field.querySelector('input[type="checkbox"]');
        var alias = field.querySelector('input[type="text"]');
        if (checkbox.checked) {
            if (alias.value) {
                sqlQuery += tableName + ".\"" + fieldName + "\" AS \"" + alias.value + "\", ";
            } else {
                sqlQuery += tableName + ".\"" + fieldName + "\", ";
            }
        }
        sqlEditorFileds.push(tableName + "." + fieldName);
        if (!sqlEditorTables.includes(tableName)) {
            sqlEditorTables.push(tableName);
        }
    });

    window.editor.options.hintOptions.tables = sqlEditorFileds;
    sqlQuery = sqlQuery.substring(0, sqlQuery.length - 2);
    sqlQuery += "\n FROM ";

    if (sqlEditorTables.length == 1) {
        sqlQuery += sqlEditorTables[0];
    } else {
        if (links.length > 0) {
            links.forEach(link => {
                let joinTypeSQL = "";
                switch (link.joinType) {
                    case "1:1":
                        joinTypeSQL = "INNER JOIN";
                        break;
                    case "*:1":
                        joinTypeSQL = "LEFT JOIN";
                        break;
                    case "1:*":
                        joinTypeSQL = "RIGHT JOIN";
                        break;
                    case "*:*":
                        joinTypeSQL = "FULL OUTER JOIN";
                        break;
                }
                sqlQuery += `${link.sourceTableName} ${joinTypeSQL} ${link.targetTableName} ON ${link.sourceTableName}.${link.sourceFieldIndex} = ${link.targetTableName}.${link.targetFieldIndex} `;
            });

        } else {
            sqlEditorTables.forEach(table => {
                sqlQuery += table + ", ";
            });
            sqlQuery = sqlQuery.substring(0, sqlQuery.length - 2);
        }
    }
    window.editor.setValue(sqlQuery);
}

function dragDataset(event) {
  


    const datasetName = event.target.getAttribute('data-table-name');
    const fields = event.target.getAttribute('fields');
    const types = event.target.getAttribute('types');
    const dataset = { datasetName: datasetName, fields: fields, types: types };
    event.dataTransfer.setData("text/plain", JSON.stringify(dataset));

}

function dragField(event) {
    console.log('dragField');

    const datasetName = event.target.getAttribute('data-table-name');
    const field = event.target.id.split('.')[1];
    const type = event.target.getAttribute('datatype');
    const dataset = { datasetName: datasetName, field: field, type: type };
    event.dataTransfer.setData("text/plain", JSON.stringify(dataset));

}


// get all the datasets from the database with '/getAllDatasets' endpoint
function getDatasets() {
    addLog('getDatasets');
    fetch('/getAllDatasets')
        .then(response => response.json())
        .then(datasets => {
            var options = [];
            datasets.forEach(dataset => {
                addLog('dataset:', dataset);

                globalDataSets[dataset.datasetName] = {
                    query: dataset.query,
                    fields: dataset.fields,
                    types: dataset.types,
                    datasetName: dataset.datasetName,
                    diagram: dataset.diagram
                };
                options.push(dataset.datasetName);
                createDateSetList(document.getElementById('tablesList'), globalDataSets);
                createDateSetList(document.getElementById('datasetListBar'), globalDataSets);
            });

            var datasetList = document.getElementById('DataSetList');
            addLog('datasetList:', datasetList);
            datasetList.innerHTML = "";
            options.forEach(option => {
                var opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                datasetList.appendChild(opt);
                addLog('opt:', opt);
            });

        }).catch(error => showToast('Error:' + error, 5000)); // Show toast for 5 seconds
}

// createTable list
function createDateSetList(list, datasets) {
    list.innerHTML = '';
    console.log("createTableList:"+ list.id);
    var editor = list.id === 'tablesList' ? true : false;
    for (var key in datasets) {
        if (datasets.hasOwnProperty(key)) {
            const listItem = document.createElement('div');
            listItem.classList.add('table-item');
            listItem.innerText = key;
            listItem.setAttribute('data-table-name', key);
            listItem.setAttribute('data-table-label', key);
            listItem.setAttribute("draggable", "true");
            if (!editor) {
             listItem.setAttribute("ondragstart", "dragDataset(event)");
            }
            listItem.setAttribute("fields", datasets[key].fields);
            listItem.setAttribute("types", datasets[key].types);
            listItem.classList.add('draggable');
            listItem.id = key;
            if (editor) {
                    listItem.addEventListener('click', function (event) {
                        event.preventDefault();
                        var labels = event.target.querySelectorAll("label");
                        if (labels.length > 0) {
                            for (var k = 0; k < labels.length; k++) {
                                event.target.removeChild(labels[k]);
                            }
                        } else if (event.target.classList.contains('table-item')) {
                            var searchFilter = document.getElementById('dataSetSearchFilter').value.toLowerCase();
                            addLog(searchFilter);

                            fields = event.target.getAttribute('key');
                            const tableName = event.target.getAttribute('data-table-name');
                            const tableLabel = event.target.getAttribute('data-table-label');
                            fields = event.target.getAttribute('fields').split(',');
                            types = event.target.getAttribute('types').split(',');
                            query = event.target.getAttribute('query');
                            fields.forEach((field, index) => {
                                if (field.toLowerCase().indexOf(searchFilter) > -1 || searchFilter.length == 0) {
                                    var newColumn = document.createElement('label');
                                    newColumn.innerHTML = '<i class="fas fa-columns"></i>' + field;
                                    newColumn.id = tableName + "." + field;
                                    newColumn.setAttribute("draggable", "true");
                                    newColumn.setAttribute("ondragstart", "dragField(event)");
                                    newColumn.classList.add('draggable');
                                    newColumn.setAttribute("dataType", types[index]);
                                    newColumn.setAttribute("query", query);
                                    newColumn.setAttribute('data-table-name', tableName);
                                    event.target.appendChild(newColumn);
                                }
                            });
                        }
                    });
            } // if editor

            list.appendChild(listItem);
        }
    }
}

// load dataset query and diagram
function loadDataSetQueryDiagram(datasetName) {
    fetch(`/getDataset/${datasetName}`)
    .then(response => response.json())
    .then(dataset => {
        window.editor.setValue(dataset.query);

        const tables = {};
        dataset.tables.forEach(table => {
            tables[table.tableName] = table;
        });

        this.ERDTables = tables;
        this.ERDLinks = dataset.links;

        drawAll();
    })
    .catch(error => console.error('Failed to load dataset:', error));
}

function drawAll() {
    // Implement this function to redraw the entire canvas with the current state of ERDTables and ERDLinks
    // This function should clear the canvas and redraw all tables and links
}
