/*
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
var chartList = [];
var currentChart = null;
var chartColors = [ 'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)',   'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)',   'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)' ];
var chartBorderColors = [ 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',   'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',   'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)' ];
function createElementChart(type) {
    var main= document.createElement('div');
    main.className = 'form-container';
    main.id=type+ Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName=type;
    canvasId=type+Date.now();
    main.innerHTML = ` <canvas id="${canvasId}" style="width:400px;height:400px"></canvas>`;

    editElement(main);
    const ctx = main.querySelector("#"+canvasId).getContext('2d');
    var typeChart='';
    switch (type) {
        case 'LineChart':
            typeChart='line';
            break;
        case 'BarChart':
            typeChart='bar';
            break;
        case 'PieChart':
            typeChart='pie';
            break;
        case 'scatterChart':
            typeChart='scatter';
            break;
        case 'radarChart':
            typeChart='radar';
            break;
        case 'doughnutChart':
            typeChart='doughnut';
            break;
        case 'polarAreaChart':
            typeChart='polarArea';
            break;

    }
    chartList.push( new Chart(ctx, {
        type: typeChart,
        data: {
            labels: [],
            datasets: []
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    }));
    main.setAttribute("chartNumber",chartList.length-1);

    return main;
}

function editElementChart(type,element,content)
{
    console.log("editElementChart");
    const button = document.createElement('button');
    button.textContent = 'update';
    button.onclick = function() {
        
        updateJsonData();
    };
    content.appendChild(button);
    var data=createMultiSelectItem("Data", "data", "data",element.getAttribute('data'),"text",true);   
    var legend=createSelectItem("Legend", "legend", "legend",element.getAttribute('legend'),"text",true);
   // var filter=createSelectItem("Filter", "filter", "filter",element.getAttribute('filter'),"text",true);  
    filter= createFilterBox(content);
    content.appendChild(data);
    content.appendChild(legend);
    content.appendChild(filter);
    
    // create data based on the dataConfig
    const dataConfig=JSON.parse(element.getAttribute("dataConfig"));
    
    dataConfig.forEach(config => {
      console.log(config.fieldName + ' ' + config.dataType + ' ' + config.functionName);
      addFieldToPropertiesBar(data,config);
    });
    // get lendend input
    const legendInput=legend.querySelector('input');
    legendInput.value=element.getAttribute('labels-data-field');
    legendInput.setAttribute("dataSet",element.getAttribute('dataSet'));
    legendInput.setAttribute("datatype",element.getAttribute('labels-data-type'));
    // create legend based on the dataConfig    
    const legendSelect=legend.querySelector('select');
    // get the object by id
    var dataType = element.getAttribute("labels-data-type");
    // empty the select
    setOptionsByType(legendSelect, dataType);
    // select the functionName
    legendSelect.value=element.getAttribute("labels-data-function");

       // Initialize with the standard view
     switchView(event,content,'standard');
     regenerateFilters(content,JSON.parse(element.getAttribute("filter")));
}

// clear the charts
function clearCharts()
{
    chartList = [];
    currentChart = null;
}

// function to adding new fileds to the properties bar
function addFieldToPropertiesBar(target,config)
{
    var dataObjet=target;
    // create the div
    var div = document.createElement("div");
    div.classList.add("selected-item");
    const elementId=field+"-"+Date.now();
    div.id=elementId;
    // get field name
    var field=config.fieldName;
    var dataType=config.dataType;
    var functionName=config.functionName;
    var dataset=config.dataset;
    // create the span
    div.innerHTML=`<button class="remove-item" onclick="removeItem(event)">x</button><span name="dataContainer" data-field-name="${field}" data-type="${dataType}" dataset="${dataset}">${field}</span>`;
    dataObjet.appendChild(div);
  
    // generate the select
    var select = document.createElement("select");
    div.appendChild(select);
    // get the datatype
    
    setOptionsByType(select,dataType);
    // select the functionName in the function
    select.value=functionName;   
      
      // get the parent div height
      var height=dataObjet.clientHeight + div.clientHeight;
      // set the height of the parent div
      dataObjet.style.height=height+30+"px";  
}

function getChart(){
    const propertiesBar = document.getElementById('propertiesBar');
                  const chartID=propertiesBar.querySelector('label').textContent;
                 
                  const element = document.getElementById(chartID);
                  const chartNumber=element.getAttribute('chartNumber');
                  
                  var chart=chartList[ chartNumber];
                  return chart;
}

// create filter box

    
// Function to initialize the filter box
function createFilterBox(main) {
    var div = document.createElement("div");
    div.id = 'filterBox';
    var lbl = document.createElement("label");
    lbl.setAttribute("for", div.id);
    lbl.textContent = "Filter:";
    div.appendChild(lbl);
    // add add button for the filter
    var addButton = document.createElement("button");
    addButton.innerHTML = '<i class="fa fa-plus"></i>';
    addButton.onclick = function() {
        // create the filter box
        const filterBox = main.querySelector('#filterBoxContainer');
    };
    
    // clear button for the filter with icon 
    
    var clearButton = document.createElement("button");
    clearButton.innerHTML = '<i class="fa fa-trash"></i>';
    clearButton.onclick = function() {
        // delete attribute filter of the element
        const chart = document.getElementById(main.getAttribute("elementId"));
        chart.removeAttribute("filter");
        // clear the filter box
        const filterBox = main.querySelector('#filterBoxContainer');
        filterBox.innerHTML = '';
        // apply switchview with current value of select
        const viewSelect = main.querySelector('#viewSelect');
        switchView(event, main, viewSelect.value);
    };
    div.appendChild(clearButton);
    // Create container for the filter box
    const filterBoxContainer = document.createElement('div');
    filterBoxContainer.id = 'filterBoxContainer';
  
    // Create the view select dropdown
    const viewSelect = document.createElement('select');
    viewSelect.id = 'viewSelect';
    // Add options
    ['standard', 'advanced'].forEach(view => {
        const option = new Option(view, view);
        console.log(option);
        viewSelect.options.add(option);
    });
  
    // Append the view select to the container
    div.appendChild(viewSelect);
  
    // Event listener for changing views
    viewSelect.addEventListener('change', function() {
      switchView(event, main,this.value);
    });
    div.appendChild(filterBoxContainer);
     // create button apply filter
     // Create a button for generating JSON
    const generateJsonBtn = document.createElement('button');
    generateJsonBtn.textContent = 'Apply';
    generateJsonBtn.setAttribute("onclick","generateJson(event,'"+ main.id +"')");
    filterBoxContainer.appendChild(generateJsonBtn);
   
    div.appendChild(generateJsonBtn);
    return div;
  }
  
  // Function to switch views
  function switchView(event,main,view) {
    event.preventDefault();
    const container = main.querySelector('#filterBoxContainer');
  
    // Clear previous content except the view select
    container.querySelectorAll(':not(#viewSelect)').forEach(el => el.remove());
    const textField = document.createElement('input');
    textField.placeholder = 'Field';
    textField.name = 'field';
    textField.setAttribute('ObjectType','filters');
    textField.setAttribute('ondragover', 'allowDrop(event)');
    textField.setAttribute('ondrop', 'dropInput(event)');
    if (view === 'standard') {
      // Standard view elements
     
      textField.addEventListener('input', function(event) {
        // get query attribute
        const dataset= this.getAttribute('dataSet');
        // create the url for /getDatasetDataDistinct/:datasetName/:field
        const url = '/getDatasetDataDistinct/'+dataset+'/'+this.value;
    
        console.log('url:', url);
        fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const multiSelect = document.querySelector('#filterBoxContainer select:not(#viewSelect)');
            // empty the select
            multiSelect.innerHTML = '';
            // create the options
            data.forEach(value => {
                var opt = document.createElement('option');
                opt.value = value;
                opt.innerHTML = value;
                multiSelect.appendChild(opt);
            });

            // check if json filter exists
            const chart = document.getElementById(main.getAttribute("elementId"));
            if (chart.getAttribute("filter"))
            {
                // get the json
                var filterConfig=JSON.parse(chart.getAttribute("filter"));
                // get the filter
                var filter=filterConfig.filters[0];
                filter.values.forEach(val => {
                    for (let option of multiSelect.options) {
                    if (option.value === val) option.selected = true;
                    }
                });
            }
        });
    // get the object by id      
      });
      const multiSelect = document.createElement('select');
      multiSelect.multiple = true;
      // Example options - replace with your actual options  
   
  
      // Append standard view elements
      container.appendChild(textField);
      container.appendChild(multiSelect);
    } else if (view === 'advanced') {
      // Advanced view elements
    
      const operatorSelect = document.createElement('select');
      // Example operators - replace with your actual options
      ['=', '!=', '<', '>', '>=', '<='].forEach(op => {
        const option = new Option(op, op);
        operatorSelect.options.add(option);
      });
  
      const valueInput = document.createElement('input');
      valueInput.placeholder = 'Value';
  
      // Append advanced view elements
      container.appendChild(textField);
      container.appendChild(operatorSelect);
      container.appendChild(valueInput);
    }
  }
  
  // Function to collect data and generate JSON
function generateJson(event, mainId) {
    event.preventDefault();
    console.log("generateJson");
    console.log(mainId);
    const main =document.getElementById(mainId);
    const viewSelect = main.querySelector('#viewSelect');
    if (!viewSelect) return;
    const view = viewSelect.options[viewSelect.selectedIndex].value;
    let filterInfo = { view: view, filters: [] };
    const fieldInput = document.querySelector('#filterBoxContainer input[name="field"]');
    const dataType=fieldInput.getAttribute('dataType');


    if (view === 'standard') {
      
      const multiSelect = document.querySelector('#filterBoxContainer select:not(#viewSelect)');
      const selectedOptions = Array.from(multiSelect.selectedOptions).map(option => option.value);
      var filterValues=[];
      switch (dataType) {
        case 'string':
            selectedOptions.forEach(option => {
                filterValues.push(option);
            });
            break;
        case 'number':
            selectedOptions.forEach(option => {
                filterValues.push(parseFloat(option));
            });
            break;
        case 'date':
            selectedOptions.forEach(option => {
                filterValues.push(new Date(option));
            });
            break;
    }


      filterInfo.filters.push({
        field: fieldInput.value,
        dataset: fieldInput.getAttribute('dataSet'),
        type: fieldInput.getAttribute('dataType'),
        operator: '',
        value: '',
        values: filterValues
      });
    } else if (view === 'advanced') {
      
      const operatorSelect = document.querySelector('#filterBoxContainer select:not(#viewSelect)');
      const valueInput = document.querySelector('#filterBoxContainer input[placeholder="Value"]');
      var value = null;
      switch(dataType)
        {
            case 'string':
                value=valueInput.value;
                break;
            case 'number':
                value=parseFloat(valueInput.value);
                break;
            case 'date':
                value=new Date(valueInput.value);
                break;
        }
      filterInfo.filters.push({
        field: fieldInput.value,
        dataset: fieldInput.getAttribute('dataSet'),
        type: fieldInput.getAttribute('dataType'),
        operator: operatorSelect.value,
        value: value,
        values: []
      });
    }
    const chart = document.getElementById(main.getAttribute("elementId"));
        // Display the JSON for demonstration purposes
        console.log(JSON.stringify(filterInfo));

    chart.setAttribute("filter",JSON.stringify(filterInfo));
  
    // Here you could also send the JSON to a server, save it, or use it in some other way
    // For example:
    // fetch('/api/filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filterInfo) });
  }

  // Function to regenerate filters from JSON
function regenerateFilters(content,filterConfig) {
    
    switchView(event, content, filterConfig.view); // Ensure the correct view is set
    if ( filterConfig.filters.length > 0)
    {
       // console.log(filterConfig);
        const filter = filterConfig.filters[0]; // Assuming single filter for simplicity

        const textField = content.querySelector('#filterBoxContainer input[name="field"]');
        textField.value = filter.field;
  
        textField.setAttribute('dataType', filter.type);
        textField.setAttribute('dataSet', filter.dataset);
        if (filterConfig.view === 'standard' ) {
        const filter = filterConfig.filters[0]; // Assuming single filter for simplicity      
        
        const multiSelect = content.querySelector('#filterBoxContainer select:not(#viewSelect)');
        textField.dispatchEvent(new Event('input'));

      
        } else if (view === 'advanced' ) {
            content.querySelector('#filterBoxContainer select:not(#viewSelect)').value = filter.operator;
            content.querySelector('#filterBoxContainer input[placeholder="Value"]').value = filter.value;
            textField.dispatchEvent(new Event('input'));

        }

    
        }
  }
  

  

function createSelectItem(id, label, styleProperty,text,type,attribute)
 {
    console.log(text);
   
    var div = document.createElement("div");
    div.id = id;
    var lbl = document.createElement("label");
    lbl.setAttribute("for", id);
    lbl.textContent = label;
    
    var select = document.createElement("select");   
    select.id = id+"select";

    
    const input = document.createElement("input");
    input.setAttribute("ondragover", "allowDrop(event)");
    input.setAttribute("ondrop", "dropInput(event)");
    input.setAttribute("readonly", "true");
    input.setAttribute("ObjectType","labels");

   

    input.addEventListener('input', function(event) {
       
        // get type of the field
        var dataType = this.getAttribute('dataType');
        // empty the select
        console.log("dataType:"+dataType);
        console.log("select:"+select);
        setOptionsByType(select,dataType);
   
    // get the object by id
    });

    div.appendChild(lbl);
    div.appendChild(input);
    div.appendChild(select);

    return div;
}

// function get options by type
function setOptionsByType(select,type)
{
    // empty the select
    select.innerHTML = '';
    // create the options
    var options=[];
    switch (type) {
        case 'string':
            options=['value','count','distinct'];
            break;
        case 'number':
            options=['value','sum','count','avg','min','max','distinct','std','var','median','mode','percentile'];
            break;
        case 'date':
            options=['value','count','distinct'];
            break;
    }
    // add the options
    options.forEach(option => {
      
        var opt = document.createElement('option');
        opt.value = option;
        opt.innerHTML = option;
        select.appendChild(opt);
    });
    
}

function createMultiSelectItem(id, label, styleProperty,text,type,attribute)
 {
    console.log(text);
    var div = document.createElement("div");
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.padding='5px';
    div.style.minHeight = '100px';
    div.style.border = '1px solid #ccc';
    // rounded corners
    div.style.borderRadius = '5px';
    div.id = id;
    div.style.className = 'multi-select';
    div.setAttribute("ObjectType","data")
    // set draggable attribute
    div.setAttribute("draggable", "true");

    div.id = id;
    var lbl = document.createElement("span");
   
    lbl.innerText   = label;
    
    

  
    div.setAttribute("ondragover", "allowDrop(event)");
    div.setAttribute("ondrop", "dropInput(event)");
 
    // get the object by id


    div.appendChild(lbl);
    //div.appendChild(multi);
    //div.appendChild(select);

    return div;
}




function updateJsonData() {
       // get propertiesBar

    const propertiesBar = document.getElementById('propertiesBar');
    const chartID=propertiesBar.querySelector('label').textContent;
   
    const currentChart = document.getElementById(chartID);

    console.log("currentChart:"+currentChart);

    console.log("propertiesBar:"+propertiesBar);
    // get value of x-axis
    var dataInput=propertiesBar.querySelector('#Data');
 
    // get value of legend
    const legend=propertiesBar.querySelector('#Legend');
    const legendInput=legend.querySelector('input');    
    const legendField=legendInput.value;
    const dataSet = legendInput.getAttribute("dataSet");
    const legendType=legendInput.getAttribute("datatype");
    const legendSelect=legend.querySelector('select');
    const legendfunction=legendSelect.options[legendSelect.selectedIndex].value;

    currentChart.setAttribute("labels-data-field",legendField);
    currentChart.setAttribute("labels-data-function",legendfunction);
    currentChart.setAttribute("labels-data-type",legendType);   
   
    currentChart.setAttribute("dataSet",dataSet);
    var dataSelect=dataInput.querySelectorAll('div');
   
    // generate array of data
    var dataConfig=[];
    dataSelect.forEach(item => {
        var selectFunction=item.querySelector('select');
        var functionName=selectFunction[selectFunction.selectedIndex].value;
        var fieldName=item.querySelector('span').getAttribute('data-field-name');
        var dataType=item.querySelector('span').getAttribute('data-type');
        var dataset=item.getAttribute('dataset');
        dataConfig.push({fieldName:fieldName,functionName:functionName,dataType:dataType,dataset:dataset});
        
    });
    currentChart.setAttribute("dataConfig",JSON.stringify(dataConfig));
    // get value of filter
    renderData(currentChart);
}

function renderData(element) {
    var chartColors = [ 'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)',   'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)',   'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)' ];
    var chartBorderColors = [ 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',   'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',   'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)' ];

    var chart=chartList[parseInt(element.getAttribute("chartNumber"))];
    console.log("chart:"+chart);
    console.log("element:"+element);
    console.log(parseInt(element.getAttribute("chartNumber")));
    // get legend field name for the group by
    labelName=element.getAttribute("labels-data-field");
    // staring from legend
    //  get the list of chart fields
    // get the fields
       // get parent of the dataInput
    var fieldsElaborated=[]; 
    chart.data.datasets=[];
  
  
    
    var dataConfig=JSON.parse(element.getAttribute("dataConfig"));
    
                    
               // get config
                
               
                for (index=0;index<dataConfig.length;index++)
                {
                   console.log(index);
                    var config=dataConfig[index];
                    console.log(config);
                    var functionName=config.functionName;
                    console.log("functionName:"+functionName);

                    var fieldName=config.fieldName;
                    console.log("fieldName:"+fieldName);
                    // prepare the dataset
                    
                    
                    // get the dataset data from the server, using the filter

                    var url = getFilterUrl(element);
                   url+="&groups="+labelName+"&agg="+fieldName+"&funct="+functionName;
                   if (!chart.data.datasets[index])
                   {
                       chart.data.datasets[index]={data:[]};
                   }
                   else
                   {
                       chart.data.datasets[index].data=[];
                       
                   }
                   chart.data.datasets[index].label=fieldName;
                   chart.data.datasets[index].backgroundColor=chartColors[index];
                   chart.data.datasets[index].borderColor=chartBorderColors[index];
                   chart.data.datasets[index].borderWidth=1;
                   if (fieldsElaborated.indexOf(fieldName)>-1)
                   {
                      
                       switch (chart.config.type)
                       {
                           case 'bar':
                                chart.data.datasets[index].type='line';
                           break;
                           case 'line':
                               chart.data.datasets[index].type='bar';
                           break;
                       }
                       
                   }
                   else
                   {
                       fieldsElaborated.push(fieldName);
                   }
               
                   
                   const request = new XMLHttpRequest();
                    request.open("GET", url, false); // `false` makes the request synchronous
                    request.send(null);
                   
                    if (request.status === 200) {
                     querydata = request.responseText;
                    }

                   const data=JSON.parse(querydata);
                   
                        // assign the data to the chart only the fields name
                        const columnData=[];
                        const columnLabels=[];
                        var labelFiled=functionName==='value'?labelName:'_id';
                      
                        data.forEach(element => {
                            columnData.push(element[fieldName]);
                            columnLabels.push(element[labelFiled]);                           
                        });
                        
                        chart.data.datasets[index].data=columnData;                       
                        chart.data.labels=columnLabels;
                        console.log("columnData:"+chart.data.datasets[index].data   );           
                        console.log("columnLabels:"+chart.data.labels);
                       
              
            }// for(index=0;index<dataConfig.length;index++)
    chart.update();
          
}

// get the filter url   
function getFilterUrl(element)
{
    var url = '/getDatasetDataByFilter?datasetName='+element.getAttribute("dataSet");
                        
    var field="";
    var values="";
    if (element.getAttribute("filter"))
    {
        var filter=JSON.parse(element.getAttribute("filter"));
        // if filter is not empty
        console.log("filter:"+filter);
        // get the filter view
        var view=filter.view;
        // if the filter is standard get the filter values
        if (view==='standard')
        {
            for (i=0;i<filter.filters.length;i++)
            {
                field+=filter.filters[i].field;
                
                for(l=0;l<filter.filters[i].values.length;l++)
                {
                    values+=filter.filters[i].values[l];
                    if (l<filter.filters[i].values.length-1)
                    {
                        values+=",";
                    }
                }
                if (i<filter.filters.length-1)
                {
                    field+=",";
                    values+=";";
                }
            }
        }
        if (view==='advanced')
        {
            /*  filter.filters.forEach(filterElement => {
                dymaicFilter.push({field:filterElement.field,operator:filterElement.operator,value:filterElement.value});   
                });*/
        }
            
        if (field!=="" && values!=="" && field!==null && values!==null && field!==undefined && values!==undefined)
        {
        // create query string with the filter datasetName=Dataset1&fields=HealthCare&value=Aetna PP,HMO/PPO
        url+="&fields="+field+"&value="+values ;
        
        }
    }// if filter
    return url;
}


