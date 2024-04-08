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


var isTableDragging = false;
var isFieldDragging = false;
var tableObject = null;
var fieldObject = null;
var svgLine = null;
var xOffset = 0;
var yOffset = 0;

// Datasets array

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

    console.log('editor:', window.editor);
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
    console.log("dropInputTable");
    console.log( event.dataTransfer);
    var elementId = event.dataTransfer.getData("text");
    console.log("elementId:"+elementId);
    event.target.value=elementId;
    // generate the table diagram
    generateTableDiagram(elementId);
}


function generateTableDiagram(elementId)
{
 //get the element 
    var element=document.getElementById(elementId);
    // get the table name
    var tableName=element.getAttribute('data-table-name');
    // get the table label
    var tableLabel=element.getAttribute('data-table-label');
    // get DBdiagram div
    var DBdiagram = document.getElementById('DBdiagram');
    // remove all child nodes

    createTableDiagram(tableName,tableLabel);
    // get the table fields and inser it in array
    var tableFields=[];
    fetch(`/table-fields/${tableName}`)
    .then(response => response.json())
    .then(fields => {
        console.log('fields:', fields);
        createFieldsDiagram(0,50,tableName,fields);
    })
    .catch(error => console.error('Error:', error));
    // get the table indexes and insert it in array
    var tableIndexes=[];
  /*  fetch(`/table-indexes/${tableName}`)
    .then(response => response.json())
    .then(indexes => {
        indexes.forEach(index => {
            tableIndexes.push(index);
        });
    })
    .catch(error => console.error('Error:', error)); */
   //create the table diagram

   
}
  



function createTableDiagram( tableName, description) {
    // generate sequence of color for the text, rect and line and background
   
   // get the SVGDiagram image div
    var svgDiagram = document.getElementById('svgDiagram');
 
    // caluculate the table width and height
    var tableWidth = 0;
    var tableHeight = 0;
    const rowHeight = 30;
    const colWidth = 100;
    // calculate the table width
    tableWidth = tableName.length * 10;
    if (description)
    {
        if (description.length * 5 > tableWidth) {
            tableWidth = description.length * 5;
        }
    }
   // create table group
   tableGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
   tableGroup.setAttribute('id', "Table_"+tableName);
   tableGroup.setAttribute('x', 0);
    tableGroup.setAttribute('y', 0);
 
    // calculate the table height   
    tableHeight = 50;
    // create the table
    var table = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    table.setAttribute('tagName', 'Table');
    table.setAttribute('data-table-name', tableName);
    table.setAttribute('data-table-label', description);
    table.setAttribute('x', 0);
    table.setAttribute('y', 0);
    table.setAttribute('width', tableWidth);
    table.setAttribute('height', tableHeight);
    table.setAttribute('style', 'fill:rgb(200,255,255);stroke-width:1;stroke:rgb(0,0,0)');
    table.setAttribute('id', "Rect_"+tableName);
    // adding shadow
    table.setAttribute('filter', 'url(#drop-shadow)');

    tableGroup.appendChild(table);
    // create the table name
    var tableNameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tableNameText.setAttribute('x', 5);
    tableNameText.setAttribute('y', 20);
    tableNameText.setAttribute('fill', 'black');
    tableNameText.setAttribute('font-size', '15');
    tableNameText.textContent = tableName;
    tableGroup.appendChild(tableNameText);
    // create the table description
    var tableDescriptionText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tableDescriptionText.setAttribute('x', 5);
    tableDescriptionText.setAttribute('y', 35);
    tableDescriptionText.setAttribute('fill', 'black');
    tableDescriptionText.setAttribute('font-size', '10');
    tableDescriptionText.textContent = description;
    tableGroup.appendChild(tableDescriptionText);
    // for each fields create a  rect and text
    svgDiagram.appendChild(tableGroup);
    
  }

  function tableMouseDown(e)  {
    e.preventDefault();
    if (e.target.getAttribute('tagName') === 'Table') {
        isTableDragging = true;
        isFieldDragging = false;
        // get the parent of the rect <g> element
        tableObject = e.target.parentNode;
        // select the objet and set border to red with lightblue background
        e.target.setAttribute('style', 'stroke:rgb(255,0,0);stroke-width:2;fill:rgb(200,200,255)');
        // get table name from the rect
        tableName = e.target.getAttribute('data-table-name');
       
      
        xOffset = e.clientX - parseFloat(tableObject.getAttribute('x'));
        yOffset = e.clientY - parseFloat(tableObject.getAttribute('y'));
        fieldObject = null;
        svgLine = null;
    }
    if (e.target.getAttribute('tagName') === 'Field') {
        fieldObject = e.target;
        isFieldDragging = true;
        isTableDragging = false;
        xOffset = e.clientX - parseFloat(e.target.getAttribute('x'));
        yOffset = e.clientY - parseFloat(e.target.getAttribute('y'));
        tableObject = null;
    }
}

  function tableMouseMove(e) {
    e.preventDefault();
    if (isTableDragging) {
      
        var x = e.clientX - xOffset;
        var y = e.clientY - yOffset;
        // get current position of the svgDiagram
         var cx= parseFloat(tableObject.getAttribute('x'))-x;
         var cy= parseFloat(tableObject.getAttribute('y'))-y;
         tableObject.setAttribute('x', x);
         tableObject.setAttribute('y', y);
        
            //     console.log('tableMouseMove - '+ ' x:' + x + ' y:' + y + ' cx:' + cx + ' cy:' + cy);
        moveChildElements(tableObject, cx, cy  );
     
       }
    if (isFieldDragging) {
       
        var svgDiagram = document.getElementById('svgDiagram');
        var x = parseFloat( fieldObject.getAttribute('x'))+parseFloat(fieldObject.getAttribute('width'))-30;
        var y = parseFloat( fieldObject.getAttribute('y'))+parseFloat(fieldObject.getAttribute('height'))/2;
        var cx = e.clientX -svgDiagram.getBoundingClientRect().left;
        var cy = e.clientY -svgDiagram.getBoundingClientRect().top;
       createLink(fieldObject, x,y,cx,cy);
    }
  }

  function tablemMuseUP(e) {
    e.preventDefault();
    var svgDiagram = document.getElementById('svgDiagram');
    if (e.target.getAttribute('tagName') === 'Field' && e.target.id !=fieldObject.id ) {
        // elimite the light border and background
       
        var x = parseFloat( fieldObject.getAttribute('x'))+parseFloat(fieldObject.getAttribute('width'))-30;
        var y = parseFloat( fieldObject.getAttribute('y'))+parseFloat(fieldObject.getAttribute('height'))/2;
        var targetFiled = e.target;
        var cx=parseFloat(targetFiled.getAttribute('x'))+30;
        var cy=parseFloat(targetFiled.getAttribute('y'))+parseFloat(targetFiled.getAttribute('height'))/2;
        var id="Link_"+fieldObject.id+"."+targetFiled.id;
        createZLink(id,fieldObject.id,targetFiled.id, x,y,cx,cy);
        fieldObject.setAttribute('link', id);
        targetFiled.setAttribute('link', id);
         // get the first rect
         var rect=fieldObject.querySelector('rect');
         // set the border to default
         rect.setAttribute('style', 'fill:rgb(200,255,255);stroke-width:1;stroke:rgb(0,0,0)');
        if(svgLine)
        {
          svgDiagram.removeChild(svgLine);
        }
    }else
    {
        // remove svgLine
    
      if(svgLine)
      {
        svgDiagram.removeChild(svgLine);
      }
    }
    isTableDragging = false;
    isFieldDragging = false;
    tableObject = null;
    fieldObject = null;
    svgLine = null;
  }

  function tableMouseLeave(e) {
    var tableName = "Table_" + tableName;
  isTableDragging = false;
    isFieldDragging = false;
 }

 function createLink(field, x, y,cx,cy) {
    
    var svgDiagram = document.getElementById('svgDiagram');
     svgLine=  document.getElementById('svgLine'+field.id);
    if (svgLine === null) {
        svgLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        svgLine.id = "svgLine" + field.id;
        svgDiagram.appendChild(svgLine);
        svgLine.setAttribute('style', 'stroke:rgb(255,255,0);stroke-width:2');
    }
    svgLine.setAttribute('x1', x);
    svgLine.setAttribute('y1', y);
    svgLine.setAttribute('x2', cx);
    svgLine.setAttribute('y2', cy);
   
   
    field.setAttribute('link', svgLine.id);
  }

  function createZLink(id, sourceID,targetID, x, y, cx, cy) {
    console.log('createZLink');
    var svgDiagram = document.getElementById('svgDiagram');

    // Calculate intermediate points for Z shape
    const midX1 = (x + cx) / 2;
    const midY1 = y;
    const midX2 = midX1;
    const midY2 = cy;

    // Create polyline for Z shape
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const points = `${x},${y} ${midX1},${midY1} ${midX2},${midY2} ${cx},${cy}`;
    polyline.setAttribute('points', points);
    polyline.setAttribute('stroke', 'black');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('sourceID', sourceID);
    polyline.setAttribute('targetID', targetID);
    polyline.setAttribute('stroke-width','2px');
    polyline.id =  id;
    svgDiagram.appendChild(polyline);
    // generate the sql query
    generateSQLByEditFields();
    
}

  function createFieldsDiagram(x,y,tableName,fields)
  {
 
    // get svgDiagram
    var svgDiagram = document.getElementById('svgDiagram');
    const tableGroup = svgDiagram.querySelector("#Table_"+tableName);
   
    // get first table rect
    const tableRect = tableGroup.querySelector("rect");
   
    var tableWidth = parseInt( tableRect.getAttribute('width'));
    var tableHeight = parseInt( tableRect.getAttribute('height'));
 
    const rowHeight = 50;
    const colWidth = 10;
    y=tableHeight;

   //generate field structure and calculate the table width
   tableFields=[];
  
    fields.forEach(field => {
       
        const desc=field.NAME + ' (' + field.TYPE.substring(0,4) + ')';
        tableFields.push(desc);
        if (desc.length * colWidth > tableWidth) {
            tableWidth = desc.length * colWidth;
        }
        if (field.LABEL)
        {
            if (field.LABEL.length * colWidth > tableWidth) {
                tableWidth = field.LABEL.length * colWidth;
            }
        }
    }
    );
  //  console.log(sqlEditorTable);
    // set SQL Editor table
   

    // calculate the table height
    tableHeight = 30+ fields.length * rowHeight;
    // update the table rectfield
    tableRect.setAttribute('width', tableWidth);
    tableRect.setAttribute('height', tableHeight);
    // update the table name
    var i=0;
    

    tableFields.forEach(field => {
        // create the field rect
        var fieldRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        fieldRect.setAttribute('tagName', 'Field');
        fieldRect.setAttribute('data-table-name', tableName);
        fieldRect.setAttribute('data-table-field',  fields[i].NAME);
        fieldRect.id="Rect_"+tableName+"."+fields[i].NAME;
        fieldRect.setAttribute('x', x);
        fieldRect.setAttribute('y', y + 50 + i * rowHeight);
        fieldRect.setAttribute('width', tableWidth);
        fieldRect.setAttribute('height', rowHeight);    
    
        if (i % 2 == 0) {
              fieldRect.setAttribute('style', 'fill:rgb(255,200,255);stroke-width:1;stroke:rgb(0,0,0)');
        }
        else {
             fieldRect.setAttribute('style', 'fill:rgb(255,220,255);stroke-width:1;stroke:rgb(0,0,0)');
        }
        // create the field name
        var fieldNameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        fieldNameText.setAttribute('x', x + 5);
        fieldNameText.setAttribute('y', y + 50 + i * rowHeight + 20);
        fieldNameText.setAttribute('fill', 'black');
        fieldNameText.setAttribute('font-size', '10');
        fieldNameText.innerHTML = field;
        // crete the field description
        var fieldDescriptionText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        fieldDescriptionText.setAttribute('x', x + 5);
        fieldDescriptionText.setAttribute('y', y + 50 + i * rowHeight + 35);
        fieldDescriptionText.setAttribute('fill', 'black');
        fieldDescriptionText.setAttribute('font-size', '10');
        fieldDescriptionText.textContent = fields[i].LABEL;

        
        // append the field rect and text to the table
        
        tableGroup.appendChild(fieldRect);
        tableGroup.appendChild(fieldNameText);
        tableGroup.appendChild(fieldDescriptionText);
       // y+=rowHeight;
        i++;
    });
    editTableFieldList();
  }

  function moveChildElements(element, cx, cy) {
  //   console.log('element:', element);
     for (var i=0; i<element.childNodes.length; i++)
     {
            var child=element.childNodes[i];          
          
            try
            {
                if (child)
                {
                    var x= parseInt( child.getAttribute('x'))-cx;
                    var y= parseInt( child.getAttribute('y'))-cy;
                    // set new position of the child                
                
                    child.setAttribute('x', x);
                    child.setAttribute('y', y);
                    moveChildElements(child, cx, cy);
                    // get the link
                    var link=child.getAttribute('link');
                    if (link)
                    {
                        console.log('link:', link);
                       // move the link calculate if it's a line or polyline
                       var line = document.getElementById(link);
                         console.log('line:', line);
                            if (line)
                            {

                                 // get source and target
                                    var sourceID=line.getAttribute('sourceID');
                                    var targetID=line.getAttribute('targetID');
                                    var source=document.getElementById(sourceID);
                                    var target=document.getElementById(targetID);
                                    var x=parseFloat(source.getAttribute('x'))+parseFloat(source.getAttribute('width'))-30;
                                    var y=parseFloat(source.getAttribute('y'))+parseFloat(source.getAttribute('height'))/2;
                                    var cx=parseFloat(target.getAttribute('x'))+30;
                                    var cy=parseFloat(target.getAttribute('y'))+parseFloat(target.getAttribute('height'))/2;
                                    // calculate intermediate points for Z shape
                                    var midX1 = (x + cx) / 2;
                                    var midY1 = y;
                                    var midX2 = midX1;
                                    var midY2 = cy;
                                    // create polyline for Z shape
                                    var points=x+","+y+" "+midX1+","+midY1+" "+midX2+","+midY2+" "+cx+","+cy;
                                    // set the new points
                                    line.setAttribute('points', points);
                                    
                              
                            }
                    }
                }
            }catch(err)
            {
                console.log('err:', err);
            }
        }
    }
  

function zoom(event)
{
  
    var svgDiagram = document.getElementById('svgDiagram');
   // var scale = parseFloat(svgDiagram.getAttribute('scale'));
   scale=parseFloat(event.target.value/200);
    svgDiagram.setAttribute('scale', scale);
    svgDiagram.style.transform = "scale(" + scale + ")";
    svgDiagram.style.transformOrigin = "0 0";
}

// excecute the query /query/:sqlQuery fetch max 20 rows
function executeQuery(updateDS)
{
    var sqlQuery=window.editor.getValue();  
    var url = '/query/'+sqlQuery;
    fetch(url)
    .then(response => response.json())
    .then(data => {
            
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
                if (updateDS)
                {
                    // get the query name
                    var datasetName=document.getElementById('DataSetName').value;
                    // save the query in the datasets array
                    globalDataSets[datasetName]={ query: window.editor.getValue(), fields: fieldsArray, types: typeArray, datasetName: datasetName};
                    saveDataset();
                } 
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

function saveQuery()
{
    // execute the query
    executeQuery(true);
    

   // showToast("Query saved successfully");
}

function getType(field)
{
    console.log('field:', field);
   console.log('field:', !isNaN(parseFloat(field)));
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
function saveDataset()
{
   
    // using datasets array
    // map   dataset key values
    for (var dataset in globalDataSets)
    {
       
        ds={
            query: globalDataSets[dataset].query,
            // convert the array to json string array with JSON.stringify
            fields: globalDataSets[dataset].fields,
            types: globalDataSets[dataset].types,                       
            datasetName: globalDataSets[dataset].datasetName,
            diagram: elementToJson(document.getElementById('svgDiagram'))
        }
        // post the dataset to the server with '/storeDataset' endpoint
      
       console.log('ds:', ds);
        fetch('/storeDataset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
           
            body: JSON.stringify(ds)
        }).then(response => response.json())
        .then(data => {
           showToast('Success:'+data.message, 5000); // Show toast for 5 seconds
        })
        .catch((error) => {
           showToast('Error! ' + error, 5000); // Show toast for 5 seconds
            console.error('Error:', error);
        });

        updateDataset(ds);
    }
}

// update Data of dataset in the database with '/storeDataset' endpoint
function updateDataset(ds)
{
    // update the query
    const url = '/query/'+ds.query;
    console.log('url:', url);
    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log(data);
       // store the dataset with storeDatasetData
       const datasetDataPost = {
        datasetName: ds.datasetName,
        data: data,
        userCreated: 'internal',
        userModified: 'internal',
        modificationDate: new Date(),
        creationDate: new Date()
       }
         console.log('datasetDataPost:', datasetDataPost);
        // post the dataset to the server with '/storeDatasetData' endpoint
        fetch('/storeDatasetData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datasetDataPost)
        }).then(response => response.json())
        .then(data => {
            console.log('data:', data);
            showToast('Success:'+data.message, 5000); // Show toast for 5 seconds
        })
        .catch((error) => {
            showToast('Error! ' + error, 5000); // Show toast for 5 seconds
            console.error('Error:', error);
        });

      
    })
    .catch(error => console.error('Error:', error));
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
                    console.log(searchFilter);

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
    console.log(dataSetsList)
    // for each item in the list simulate click
    dataSetsList.forEach(dataset => {
        dataset.click();
    });

}

// get all the datasets from the database with '/getAllDatasets' endpoint
function getDatasets()
{
    
    console.log('getDatasets');
    fetch('/getAllDatasets')
    .then(response => response.json())
    .then(datasets => {
        var options = [];
        datasets.forEach(dataset => {
            // add the dataset to the datasets array
            console.log('dataset:', dataset);
          
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
               console.log('datasetList:', datasetList);
                datasetList.innerHTML="";
                options.forEach(option => {
                    var opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    datasetList.appendChild(opt);
                    console.log('opt:', opt);
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
      console.log('dataset:', dataset);
      const div=document.getElementById('DBdiagram')
      div.innerHTML="";
      jsonToDom(dataset.diagram,div);
  } 

  function editTableFieldList()
  {
    const editTableFields = document.getElementById('TableEdit');
  
    // for each <g> object in the svgDiagram
    var svgDiagram = document.getElementById('svgDiagram');
    var tables=svgDiagram.querySelectorAll('g');
    var sqlEditorTable=[];
    // for each table

    tables.forEach(table => {
        // get the table name
       
        // get the table fields
        var fields=table.querySelectorAll('rect');
        fields.forEach(field => {
            // cerate id for the div
            var fieldName=field.getAttribute('data-table-field');
            var tableName=field.getAttribute('data-table-name') ;
            sqlEditorTable.push("PUB."+tableName+"."+fieldName);
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
      
    });   
     
   // window.editor.options.hintOptions.tables[tableName]=sqlEditorTable;
    // generate sql query
        generateSQLByEditFields();
  }
    
function generateSQLByEditFields()
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
                sqlQuery+="PUB."+tableName+"."+fieldName+" AS "+alias.value+", ";
            }
            else
            {
                sqlQuery+="PUB."+tableName+"."+fieldName+", ";
            }
           
        }
        sqlEditorFileds.push("PUB."+tableName+"."+fieldName);
        // if the table is not in the sqlEditorTables array add it
        if (!sqlEditorTables.includes("PUB."+tableName))
        {
            sqlEditorTables.push("PUB."+tableName);
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
        var links=svgDiagram.querySelectorAll('polyline[id^="Link_"]');
        if (links.length>0)
        {
            links.forEach(link => {
                var sourceID=link.getAttribute('sourceID');
                var targetID=link.getAttribute('targetID');
                console.log('sourceID:', sourceID);
                console.log('targetID:', targetID);
                var source=svgDiagram.querySelector("rect[id='"+sourceID+"']");
                var target=svgDiagram.querySelector("rect[id='"+targetID+"']");
                var sourcteTable=source.getAttribute('data-table-name');
                var targetTable=target.getAttribute('data-table-name');
                var sourceField=source.getAttribute('data-table-field');
                var targetField=target.getAttribute('data-table-field');
                sqlQuery+="PUB."+sourcteTable+" INNER JOIN PUB."+targetTable+" ON PUB."+sourcteTable+"."+sourceField+"=PUB."+targetTable+"."+targetField;
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

