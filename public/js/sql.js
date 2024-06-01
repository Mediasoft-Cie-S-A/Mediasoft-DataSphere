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
var globalDataSets =[];
var fieldsArray=[];
var typeArray=[];

    // startup

    

        var mime = 'text/x-sql';
        // get mime type
       
        window.editor = CodeMirror.fromTextArea(document.getElementById('QueryBarBodyBodyTextArea'),
                                             {
                                                mode: mime,
                                                indentWithTabs: true,
                                                smartIndent: true,
                                                lineNumbers: false,
                                                matchBrackets : true,
                                                autofocus: true,
                                                autocorrect: true,
                                                spellcheck: true,
                                                extraKeys: {"tab": "autocomplete"},
                                                hintOptions: {tables: {
                                                    
                                                }}
                                                });
       // set editor size to fill the parent div
        window.editor.setSize("800px", "100%");
        window.editor.on("change", 
                        function() {
                                 window.editor.save();
                                  });

    addLog('editor:', window.editor);
// createTable list for the database editor
function createTableListDb() {
   
    // get id of the div
    const list = document.getElementById('tableListBar');
    // get list of tables   
    fetchTablesList(list);
    

}

function dropInputTable(event)
{
    event.preventDefault();
    addLog("dropInputTable");
    addLog( event.dataTransfer);
    var elementId = event.dataTransfer.getData("text");
    addLog("elementId:"+elementId);
    event.target.value=elementId;
    // generate the table diagram
    generateTableDiagram(elementId);
}



// excecute the query /query/:sqlQuery fetch max 20 rows
function executeQuery(event)
{
    event.preventDefault();
    var sqlQuery=window.editor.getValue();  
    var url = '/query/'+sqlQuery;
    fetch(url)
    .then(response => response.json())
    .then(data => {
            addLog('data:', data);
        var tableBody = document.getElementById('QueryResultTable');
       tableBody.innerHTML="";
        // create table header
        var tableHeader = document.createElement('tr');
        tableHeader.setAttribute('class', 'tableHeader');
        tableBody.appendChild(tableHeader);
        // the json data is an array of object
        // get the first object to get the header
        // check if the data is an array
        if (Array.isArray(data))
        {
            if (data.length>0)
            {
                var firstObject=data[0];
                // get the header
                var header=Object.keys(firstObject);
                // create table header
                header.forEach(field => {
                    var th = document.createElement('th');
                    th.textContent = field;
                    tableHeader.appendChild(th);
                    // add field to fields array;
                    fieldsArray.push(field );
                    // get the type of the field passing the value
                    typeArray.push(getType(firstObject[field]));
                });
                // create table rows
                data.forEach(row => {
                    var tr = document.createElement('tr');
                    tableBody.appendChild(tr);
                    // get the row data
                    var rowData=Object.values(row);
                    rowData.forEach(field => {
                        var td = document.createElement('td');
                        td.textContent = field;
                        tr.appendChild(td);
                    });
                });
              
            }
        }
        else
        {
            var tr = document.createElement('tr');
            tableBody.appendChild(tr);
            // get the row data
            var rowData=Object.values(data);
            rowData.forEach(field => {
                var td = document.createElement('td');
                td.textContent = field;
                tr.appendChild(td);
            });
        }
    })
    .catch(error => console.error('Error:', error));
}

function saveQuery(event)
{
    event.preventDefault();

    // prevent multiple click
    event.target.disabled=true;

    // execute the query
 
            // get the query name
            var datasetName=document.getElementById('DataSetName').value;
            // save the query in the datasets array
            globalDataSets[datasetName]={ query: window.editor.getValue(), fields: fieldsArray, types: typeArray, datasetName: datasetName};
            saveDataset(event);
            

   // showToast("Query saved successfully");
}

function getType(field)
{
    addLog('field:', field);
   addLog('field:', !isNaN(parseFloat(field)));
    // Check if it's a valid number
    if (!isNaN(parseFloat(field))) {
        return 'number';
    }

    // Check if it's a valid date
    const date = new Date(field);
    if (!isNaN(date.getTime())) {
        return 'date';
    }

    // If it's neither, then it's a regular string
    return 'string';
}

// save the dataset in the database with '/storeDataset' endpoint
function saveDataset(event)
{
   
    // using datasets array
    // map   dataset key values
    const canvas = document.getElementById('canvas');
    for (var dataset in globalDataSets)
    {
        // check if cavas is not null and the name of the dataset is the same of input DataSetName
            if (canvas!=null && globalDataSets[dataset].datasetName==document.getElementById('DataSetName').value)
            {
                // get the diagram
                globalDataSets[dataset].diagram={ERDTables: ERDTables, ERDLinks: ERDLinks};
            
            ds={
                query: globalDataSets[dataset].query,
                // convert the array to json string array with JSON.stringify
                fields: globalDataSets[dataset].fields,
                types: globalDataSets[dataset].types,                       
                datasetName: globalDataSets[dataset].datasetName,
                diagram: globalDataSets[dataset].datasetName
            }
            // post the dataset to the server with '/storeDataset' endpoint
        
        addLog('ds:', ds);
            fetch('/storeDataset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            
                body: JSON.stringify(ds)
            }).then(response => response.json())
            .then(data => {
            showToast('Success:'+data.message, 5000); // Show toast for 5 seconds
            // reactivate the button
                event.target.disabled=false;
            })
            .catch((error) => {
            showToast('Error! ' + error, 5000); // Show toast for 5 seconds
                console.error('Error:', error);
            });

            updateDataset(ds);
        }
    }
}

// update Data of dataset in the database with '/storeDataset' endpoint
function updateDataset(ds)
{
  
       // store the dataset with storeDatasetData
       const datasetDataPost = {
        datasetName: ds.datasetName,
        sqlQuery: ds.query,
        userCreated: 'internal',
        userModified: 'internal',
        modificationDate: new Date(),
        creationDate: new Date()
       };
         addLog('datasetDataPost:', datasetDataPost);
        // post the dataset to the server with '/storeDatasetData' endpoint
        fetch('/storeDatasetData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datasetDataPost)
        }).then(response => response.json())
        .then(data => {
            addLog('data:', data);
            showToast('Success:'+data.message, 5000); // Show toast for 5 seconds
        })
        .catch((error) => {
            showToast('Error! ' + error, 5000); // Show toast for 5 seconds
            console.error('Error:', error);
        });

      
  
}

function createTableList(list,datasets) {
   
    list.innerHTML = '';
    // add new table button
  
   // read the datasets keys
    for (var key in datasets) {
        
        if (datasets.hasOwnProperty(key)) {
            const listItem = document.createElement('div');
            listItem.classList.add('table-item');
            listItem.innerText = key; // Adjust based on your API response
            listItem.setAttribute('data-table-name', key);
            listItem.setAttribute('data-table-label', key);
            listItem.setAttribute("draggable","true");
            listItem.setAttribute("ondragstart","drag(event)");
            listItem.setAttribute("query",datasets[key].query);
            listItem.setAttribute("fields",datasets[key].fields);
            listItem.setAttribute("types",datasets[key].types);
            listItem.classList.add('draggable');
            listItem.id=key;
            listItem.addEventListener('click', function(event) {
                event.preventDefault();
                
                // get the label count;
                var labels=event.target.querySelectorAll("label");
                if (labels.length>0)
                {
                for (var k=0;k<labels.length;k++)
                        {
                            event.target.removeChild(labels[k]);
                        }
                    }
                     else   if (event.target.classList.contains('table-item') ) {
                    // get the search filter value
                    var searchFilter = document.getElementById('dataSetSearchFilter').value.toLowerCase();
                    addLog(searchFilter);

                    fields= event.target.getAttribute('key');
                    const tableName = event.target.getAttribute('data-table-name');
                    const tableLabel = event.target.getAttribute('data-table-label');
                    // get the table fields
                    fields= event.target.getAttribute('fields').split(',');
                    types= event.target.getAttribute('types').split(',');
                    query= event.target.getAttribute('query');
                    fields.forEach((field,index) => {
                        // check filter and fields
                        if (field.toLowerCase().indexOf(searchFilter)>-1 || searchFilter.length==0)
                        {
                         
                        var newColumn= document.createElement('label');
                        // newColumn with field icon + field name
                        newColumn.innerHTML='<i class="fas fa-columns"></i>'+field;
                        newColumn.id=tableName+"."+field;
                        newColumn.setAttribute("draggable","true");
                        newColumn.setAttribute("ondragstart","drag(event)");
                        newColumn.classList.add('draggable');
                        newColumn.setAttribute("dataType",types[index]);
                        newColumn.setAttribute("query",query);
                        newColumn.setAttribute('data-table-name', tableName);
                        event.target.appendChild(newColumn);
                        }
                    });
                        
                    

                }
            });

            list.appendChild(listItem);
           
        }
    }
   
   // fetchTablesList(list);
    
 

}   

function dataSetSearchField()
{
    // get the list of datasets div
    var dataSetsList=document.getElementById("tablesList").querySelectorAll('.table-item');
    addLog(dataSetsList)
    // for each item in the list simulate click
    dataSetsList.forEach(dataset => {
        dataset.click();
    });

}

// get all the datasets from the database with '/getAllDatasets' endpoint
function getDatasets()
{
    
    addLog('getDatasets');
    fetch('/getAllDatasets')
    .then(response => response.json())
    .then(datasets => {
        var options = [];
        datasets.forEach(dataset => {
            // add the dataset to the datasets array
            addLog('dataset:', dataset);
          
            globalDataSets[dataset.datasetName]={ 
                query: dataset.query, 
                fields: dataset.fields, 
                types: dataset.types, 
                datasetName: dataset.datasetName,
                diagram: dataset.diagram};
                // init combo
                options.push(dataset.datasetName);
                createTableList(document.getElementById('tablesList'),globalDataSets);  
               });
               var datasetList= document.getElementById('DataSetList');
               addLog('datasetList:', datasetList);
                datasetList.innerHTML="";
                options.forEach(option => {
                    var opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    datasetList.appendChild(opt);
                    addLog('opt:', opt);
                });
            }).catch(error => showToast('Error:' + error, 5000)); // Show toast for 5 seconds
   
}   





  

  // loas dataset query and diagram
  function loadDataSetQueryDiagram(datasetName)
  {

      // get the dataset
      var dataset=globalDataSets[datasetName];
  
      // set the query
      window.editor.setValue(dataset.query);
      // load the diagram
    
     
      // assing ERDTables and ERDLinks from dataset.diagram
      addLog('dataset.diagram:', dataset.diagram);
      if (dataset.diagram)
        {

        ERDTables=dataset.diagram.ERDTables!=null?dataset.diagram.ERDTables:[ERDTables];
        ERDLinks=dataset.diagram.ERDLinks!=null?dataset.diagram.ERDLinks:ERDLinks;
        addLog('ERDTables:', ERDTables);
        addLog('ERDLinks:', ERDLinks);
        // generate the diagram
        drawAll();
        }
 } 

  function editTableFieldList(language,tables,links)
  {
    const editTableFields = document.getElementById('TableEdit');
    addLog('editTableFields:', editTableFields);
    addLog('tables:', tables);
    var sqlEditorTable=[];
    // for each table
    // get table key, value
    
    for(var key in tables) {
        var table=tables[key];
        // get the table name
       
        // get the table fields
      
        table.fields.forEach(field => {
            // cerate id for the div
            var fieldName=field.NAME;
            var tableName=table.tableName;
            sqlEditorTable.push(tableName+"."+fieldName);
            var divID=tableName+"."+fieldName;
            // check if the field is already in the editTableFields and if exists continue
           
            if (!editTableFields.innerHTML.includes(divID) && fieldName!==null)
            {             
                       
           
            // create the field list
            var newColumn= document.createElement('div');
            newColumn.setAttribute('class', 'field-item');
            newColumn.setAttribute('data-table-name', tableName);
            newColumn.setAttribute('data-table-field', fieldName);
            // newColumn with field icon + field name
            newColumn.innerHTML=`${fieldName}<br/>visible:<input type="checkbox" checked onchange="generateSQLByEditFields()"/>Alias:<input type="text" onchange="generateSQLByEditFields()" />`;
            newColumn.id=divID;            
            editTableFields.appendChild(newColumn);
            
            }
        });
      
    };   
     
   // window.editor.options.hintOptions.tables[tableName]=sqlEditorTable;
    // generate sql query
    if (language=='SQL' )
        generateSQLByEditFields(tables,links);
    if (language=='4GL')
        generate4GLByEditFields(tables,links);
  }
    


function generateSQLByEditFields(tables,links)
{
    const editTableFields = document.getElementById('TableEdit');
    // get the list of div
    var fields=editTableFields.querySelectorAll('div');
    var sqlQuery="SELECT ";
    var sqlEditorFileds=[];
    var sqlEditorTables=[];
    fields.forEach(field => {
        // get the table name
        var tableName=field.getAttribute('data-table-name');
        // get the field name
        var fieldName=field.getAttribute('data-table-field');
        // get the checkbox
        var checkbox=field.querySelector('input[type="checkbox"]');
        // get the alias
        var alias=field.querySelector('input[type="text"]');
        if (checkbox.checked)
        {
            if (alias.value)
            {
                sqlQuery+=tableName+"."+fieldName+" AS "+alias.value+", ";
            }
            else
            {
                sqlQuery+=tableName+"."+fieldName+", ";
            }
           
        }
        sqlEditorFileds.push(tableName+"."+fieldName);
        // if the table is not in the sqlEditorTables array add it
        if (!sqlEditorTables.includes(tableName))
        {
            sqlEditorTables.push(tableName);
        }
    });

    window.editor.options.hintOptions.tables=sqlEditorFileds;
    sqlQuery=sqlQuery.substring(0,sqlQuery.length-2);   
    sqlQuery+="\n FROM ";
    // get the first table
    if (sqlEditorTables.length==1)
    {    
        sqlQuery+=sqlEditorTables[0];
    }
    else
    {
        // check if exists the link between the tables
        var svgDiagram = document.getElementById('svgDiagram');
        addLog(links);
        if (links.length>0)
        {
            links.forEach(link => {
             
                sqlQuery+=link.sourceTableName+" INNER JOIN "+link.targetTableName+" ON "+link.sourceTableName+"."+link.sourceFieldIndex+"="+link.targetTableName+"."+link.targetFieldIndex;
            });

        }else
        {
                sqlEditorTables.forEach(table => {
                    sqlQuery+=table+", ";
                });
                sqlQuery=sqlQuery.substring(0,sqlQuery.length-2);
        }
    }
    window.editor.setValue(sqlQuery);


}

