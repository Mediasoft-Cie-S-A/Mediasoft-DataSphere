const { compareSync } = require("bcryptjs");
const { text } = require("body-parser");

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
        
        updateChartData();
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
      addFieldToPropertiesBar(data,config.fieldName,config.dataType,config.functionName);
    });
    // get lendend input
    const legendInput=legend.querySelector('input');
    legendInput.value=element.getAttribute('labels-data-field');
    legendInput.setAttribute("query",element.getAttribute('query'));
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
function addFieldToPropertiesBar(target,field,dataType,functionName)
{
    var dataObjet=target;
    // create the div
    var div = document.createElement("div");
    div.classList.add("selected-item");
    const elementId=field+"-"+Date.now();
    div.id=elementId;
    // get field name
    
    div.innerHTML=`<button class="remove-item" onclick="removeItem(event)">x</button><span data-field-name="${field}" data-type="${dataType}">${field}</span>`;
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
        const query= this.getAttribute('query');
        // execute query
        const url = '/query/'+query;
        console.log('url:', url);
        fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // get distinct value by field
            const values = distinct(data,this.value);
            console.log(values);
            // get the select
            const multiSelect = document.querySelector('#filterBoxContainer select:not(#viewSelect)');
            // empty the select
            multiSelect.innerHTML = '';
            // create the options
            values.forEach(value => {
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
        query: fieldInput.getAttribute('query'),
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
        query: fieldInput.getAttribute('query'),
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
        const filter = filterConfig.filters[0]; // Assuming single filter for simplicity

        const textField = content.querySelector('#filterBoxContainer input[name="field"]');
        textField.value = filter.field;
        textField.setAttribute('query', filter.query);
        textField.setAttribute('dataType', filter.type);

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
    const currentChart=getChart();  
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




function updateChartData() {
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
    const  query = legendInput.getAttribute("query");
    const legendType=legendInput.getAttribute("datatype");
    const legendSelect=legend.querySelector('select');
    const legendfunction=legendSelect.options[legendSelect.selectedIndex].value;

    currentChart.setAttribute("labels-data-field",legendField);
    currentChart.setAttribute("labels-data-function",legendfunction);
    currentChart.setAttribute("labels-data-type",legendType);   
   
    currentChart.setAttribute("query",query);
    var dataSelect=dataInput.querySelectorAll('div');
   
    // generate array of data
    var dataConfig=[];
    dataSelect.forEach(item => {
        var selectFunction=item.querySelector('select');
        var functionName=selectFunction[selectFunction.selectedIndex].value;
        var fieldName=item.querySelector('span').getAttribute('data-field-name');
        var dataType=item.querySelector('span').getAttribute('data-type');
        dataConfig.push({fieldName:fieldName,functionName:functionName,dataType:dataType});
        
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
    var query=element.getAttribute("query");
  //  console.log("query:"+query);
    var url = '/query/'+query;
  //  console.log('url:', url);
    fetch(url)
    .then(response => response.json())
    .then(data => {
            
                // get filter information from the element
                
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
                        filter.filters.forEach(filterElement => {
                            // get the field
                            var field=filterElement.field;
                            // get the values
                            var values=filterElement.values;
                            // filter the data
                            data=data.filter(function (element) {
                               
                                return values.indexOf(element[field])>-1;
                            });
                        });
                    }
                    if (view==='advanced')
                    {
                        filter.filters.forEach(filterElement => {
                            // get the field
                            var field=filterElement.field;
                            // get the values
                            var operator=filterElement.operator;
                            var value=filterElement.value;
                                     // filter the data     
                                     switch (operator) {
                                        case '=':
                                            data=data.filter(function (element) {
                                            return element[field]===value;
                                        });
                                        break;
                                        case '!=':
                                            data=data.filter(function (element) {
                                            return element[field]!==value;
                                        });
                                        break;
                                        case '<':
                                            data=data.filter(function (element) {
                                            return element[field]<value;
                                        }); 
                                        break;
                                        case '>':
                                            data=data.filter(function (element) {
                                            return element[field]>value;
                                        });
                                        break;
                                        case '<=':
                                            data=data.filter(function (element) {
                                            return element[field]<=value;
                                        });
                                        break;
                                        case '>=':
                                            data=data.filter(function (element) {
                                            return element[field]>=value;
                                        });
                                        break;
    
                                    }                     
                               
                            });
                        }
                        
                    
                }// if filter
                console.log(data);
               // get config
                var dataConfig=JSON.parse(element.getAttribute("dataConfig"));
                var i=0;    
                dataConfig.forEach(config => {
              
                    var functionName=config.functionName;
                    console.log("functionName:"+functionName);

                    var fieldName=config.fieldName;
                    console.log("fieldName:"+fieldName);
                    // get the data
                    
                    // if function is value
                    
                        

                    columnData=getDataByFunction(data,fieldName,functionName,labelName);
                   // clear the chart datasets
                     //console.log("data"+columnData);
                     
              
                        if (!chart.data.datasets[i])
                        {
                            chart.data.datasets[i]={data:[]};
                        }
                        else
                        {
                            chart.data.datasets[i].data=[];
                            
                        }
                        chart.data.datasets[i].label=fieldName;
                       chart.data.datasets[i].backgroundColor=chartColors[i];
                        chart.data.datasets[i].borderColor=chartBorderColors[i];
                        chart.data.datasets[i].borderWidth=1;
                        if (fieldsElaborated.indexOf(fieldName)>-1)
                        {
                            console.log("fieldsElaborated.indexOf(fieldName):"+fieldsElaborated.indexOf(fieldName));
                            console.log(chart.config.type);
                            console.log(chart);
                            switch (chart.config.type)
                            {
                                case 'bar':
                                    console.log("bar");
                                    chart.data.datasets[i].type='line';
                                break;
                                case 'line':
                                    chart.data.datasets[i].type='bar';
                                break;
                            }
                            
                        }
                        else
                        {
                            fieldsElaborated.push(fieldName);
                        }
                    
                        chart.data.datasets[i].data=columnData;
                        if (i===0)
                            {
                                if (functionName==='value')
                                {
                                    chart.data.labels=[];
                                    data.forEach(element => {
                                        chart.data.labels.push(element[labelName]);
                                    });
                                }
                                else
                                {
                                    
                                    chart.data.labels=distinct(data,labelName);
                                }
                        }
                    
                    i++;
                });
            chart.update();

               

    });              
    


}

function getDataByFunction(data,fieldName,lfunction,labelName)
{
    switch (lfunction) {
        case 'sum':
            // get the sum of the field grouped by legend values
           
            return getSum(data,fieldName,labelName);
            
        break;
        case 'count':
            // get the distinct values of the field
           
            return getCount(data,fieldName,labelName);
        break;
        case 'avg':
            // get the distinct values of the field
           
          return getAvg(data,fieldName,labelName);
        break;
        case 'min':
            // get the distinct values of the field
           
            return getMin(data,fieldName,labelName);
        break;
        case 'max':
            // get the distinct values of the field
           
            return getMax(data,fieldName,labelName);
        break;
        case 'distinct':
            // get the distinct values of the field
           
            return getDistinct(data,fieldName,labelName);
        break;
        case 'std':
            // get the distinct values of the field
           
            return getStd(data,fieldName,labelName);
        break;
        case 'var':
            // get the distinct values of the field
           
            return getVar(data,fieldName,labelName);
        break;
        case 'median':
            // get the distinct values of the field
           
            return getMedian(data,fieldName,labelName);
        break;
        case 'mode':
            // get the distinct values of the field
           
            return getMode(data,fieldName,labelName);
        break;
        case 'percentile':
            // get the distinct values of the field
           
            return getPercentile(data,fieldName,labelName);
        break;


        case 'value':
          
            // convert the data to array
            var returnData=[];
            data.forEach(element => {
                returnData.push(element[fieldName]);
            });
            return returnData;
        break;
    }

    return data;
}
// get the sum of the field grouped by legend values
function getSum(data,fieldName,labelName)
{   
    console.log("getSum");
   
    var sum=0;
    var sumData=[];
   var sumLabels=[];
    var i=0;

    data.forEach(element => {
        const pos=sumLabels.indexOf(element[labelName]);
        
                if (pos===-1)
                {
                    sumLabels.push(element[labelName]);
                    sumData.push(parseFloat(element[fieldName]));
                       
                    
                }
                else
                {
                    
                     sumData[pos]+=parseFloat(element[fieldName]);
                   
                }
        });

    return sumData;
}


// get average of the field grouped by legend values
function getAvg(data,fieldName,labelName)
{   
    // calculate the average
    var avgData=[];  
    const dataLength=data.length;
    const sData=getSum(data,fieldName,labelName);
  
  
      
       console.log("dataLength:"+dataLength);
       console.log("sumData:"+sData);
       sData.forEach(element => {
            avgData.push(element/dataLength);
        });
       
    return avgData;
}

// getCount of the field grouped by legend values
function getCount(data,fieldName,labelName)
{   
    console.log("getCount");
    
    var sum=0;
    var countData=[];
   var countLabels=[];
    var i=0;

    data.forEach(element => {
        const pos=countLabels.indexOf(element[labelName]);
        
                if (pos===-1)
                {
                    countLabels.push(element[labelName]);
                    countData.push(1);
                       
                    
                }
                else
                {
                    
                    countData[pos]++;
                   
                }
        });

    return countData;
}


// get min of the field grouped by legend values
function getMin(data,fieldName,labelName)
{   
    console.log("getMin");
   
    
    var minData=[];
   var minLabels=[];
    var i=0;

    data.forEach(element => {
        const pos=minLabels.indexOf(element[labelName]);
        
                if (pos===-1)
                {
                    minLabels.push(element[labelName]);
                    minData.push(parseFloat(element[fieldName]));
                       
                    
                }
                else
                {
                    var value=parseFloat(element[fieldName]);
                    if (value<minData[pos])
                    {
                        minData[pos]=value;
                    }                    
                   
                }
        });

    return minData;
}

// getMax
function getMax(data,fieldName,labelName)
{   
    console.log("getMax");
   
    
    var maxData=[];
   var maxLabels=[];
    var i=0;

    data.forEach(element => {
        const pos=maxLabels.indexOf(element[labelName]);
        
                if (pos===-1)
                {
                    maxLabels.push(element[labelName]);
                    maxData.push(parseFloat(element[fieldName]));
                       
                    
                }
                else
                {
                    var value=parseFloat(element[fieldName]);
                    if (value>maxData[pos])
                    {
                        maxData[pos]=value;
                    }                    
                   
                }
        });

    return maxData;
}

// getDistinct
function getDistinct(data,fieldName,labelName)
{   
    console.log("getDistinct");
   
    var distinctData=[];
   var distinctLabels=[];
    var i=0;

    data.forEach(element => {
        const pos=distinctLabels.indexOf(element[labelName]);
        
                if (pos===-1)
                {
                    distinctLabels.push(element[labelName]);
                    distinctData.push(element[fieldName]);
                       
                    
                }
                else
                {
                    if (distinctData[pos]!==element[fieldName])
                    {
                        distinctData[pos]=element[fieldName];
                    }                    
                   
                }
        });

    return distinctData;
}

// getStd
function getStd(data,fieldName,labelName)
{   
    console.log("getStd");
    var stdData=[];
    const sData=getSum(data,fieldName,labelName);
    const avgData=getAvg(data,fieldName,labelName);
    const dataLength=data.length;
    var i=0;
    sData.forEach(element => {
        stdData.push(Math.sqrt((element-avgData[i])*(element-avgData[i])/dataLength));
    });
    return stdData;
}

// getVar
function getVar(data,fieldName,labelName)
{   
    console.log("getVar");
    var varData=[];
    const sData=getSum(data,fieldName,labelName);
    const avgData=getAvg(data,fieldName,labelName);
    const dataLength=data.length;
    var i=0;
    sData.forEach(element => {
        varData.push((element-avgData[i])*(element-avgData[i])/dataLength);
    });
    return varData;
}

// getMedian
function getMedian(data,fieldName,labelName)
{   
    console.log("getMedian");
    var medianData=[];
    const sData=getSum(data,fieldName,labelName);
    const dataLength=data.length;
    var i=0;
    sData.forEach(element => {
        medianData.push(element/dataLength);
    });
    return medianData;
}

// getMode
function getMode(data,fieldName,labelName)
{   
    console.log("getMode");
    var modeData=[];
    const sData=getSum(data,fieldName,labelName);
    const dataLength=data.length;
    var i=0;
    sData.forEach(element => {
        modeData.push(element/dataLength);
    });
    return modeData;
}

// getPercentile
function getPercentile(data,fieldName,labelName)
{   
    console.log("getPercentile");
    var percentileData=[];
    const sData=getSum(data,fieldName,labelName);
    const dataLength=data.length;
    var i=0;
    sData.forEach(element => {
        percentileData.push(element/dataLength);
    });
    return percentileData;
}

function distinct(data,fieldName)
{
  
    // generate distinct labels hash table
    var distinctLabels=[];
    var i=0;
    console.log("data.length:"+data.length);
    for(i=0;i<data.length;i++  ) {
        const element=data[i];
        // find is the element is in the array
       
        
        if (distinctLabels.indexOf(element[fieldName])===-1)
        {
           // console.log("element[fieldName]:"+element[fieldName]);
            distinctLabels.push(element[fieldName]);
            
        }
    }
    return distinctLabels;
}

