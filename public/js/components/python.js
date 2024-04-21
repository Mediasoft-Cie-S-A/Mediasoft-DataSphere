// Initiate Python component
function createPython(type)
{
    var python = document.createElement("div");
    python.className = "python";
    python.draggable = true;
    python.id = type + Date.now();
    python.tagName = type;
    python.setAttribute('filename', 'img-'+python.id+'.png');
    python.setAttribute('plotType', 'line');
    python.setAttribute('xLabel', 'X-axis');
    python.setAttribute('yLabel', 'Y-axis');
    python.setAttribute('title', 'Title');
    python.setAttribute('customCode', '');
    python.innerHTML = "<div class='python-header'> <img id='plotImage' src='' alt='Generated plot will appear here' hidden></div>";
    renderPython(python);
    return python;
}

function editPython(type,element,content)
{
       
    // add update button to call render function
    const button = document.createElement('button');
    button.textContent = 'Update';
    button.onclick = function() {
        updateJsonData(element);
    };
    content.appendChild(button);
    var data=createMultiSelectItem("Data", "data", "data",element.getAttribute('data'),"text",true);   
    var legend=createSelectItem("Legend", "legend", "legend",element.getAttribute('legend'),"text",true);
    filter= createFilterBox(content);
    content.appendChild(data);
    content.appendChild(legend);
    content.appendChild(filter);
    content.appendChild(createInputItem("Title", "title", "title",element.getAttribute('title'),"text",true));
    content.appendChild(createInputItem("plotType", "plotType", "plotType",element.getAttribute('plotType'),"text",true));
    content.appendChild(createInputItem("xLabel", "xLabel", "xLabel",element.getAttribute('xLabel'),"text",true));
    content.appendChild(createInputItem("yLabel", "yLabel", "yLabel",element.getAttribute('yLabel'),"text",true));    
    content.appendChild(createInputItem("customCode", "customCode", "customCode",element.getAttribute('customCode'),"text",true));
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



function renderPython(python)
{
    
    // get dataconfig json
    var dataConfig=JSON.parse(python.getAttribute("dataConfig"));
   
    // Collecting form data
    const plotType = python.getAttribute('plotType');
    const xLabel = python.getAttribute('xLabel');
    const yLabel =  python.getAttribute('yLabel');
    const title =  python.getAttribute('title'); 
    const fileName = python.getAttribute('filename');
    const customCode = python.getAttribute('customCode');
    const fields = dataConfig.map(config => config.fieldName);
    const legend = python.getAttribute("labels-data-field");;
    var url = getFilterUrl(python);
    console.log(url);
    const request = new XMLHttpRequest();
    request.open("GET", url, false); // `false` makes the request synchronous
    request.send(null);
   
    if (request.status === 200) {
     querydata = request.responseText;
    }

   const data=JSON.parse(querydata);

    fetch('/generate-plot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, fields:fields, legend:legend, plot_type: plotType, x_label: xLabel, y_label: yLabel, title, file_name: fileName, custom_code: customCode }),
    })
    .then(response => response.blob())
    .then(blob => {
        const imageUrl = URL.createObjectURL(blob);
        const img = python.querySelector("#plotImage");
        img.src = imageUrl;
        img.hidden = false;
    })
    .catch(error => console.error('Error:', error));
}