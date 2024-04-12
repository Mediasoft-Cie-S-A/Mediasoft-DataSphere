const e = require("express");

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
    render(python);
    return python;
}

function editPython(type,element,content)
{
    var python = createPython(type);
    
    // add update button to call render function
    const button = document.createElement('button');
    button.textContent = 'Update';
    button.onclick = function() {
        render(element);
    };
    content.appendChild(button);
    var data=createMultiSelectItem("Data", "data", "data",element.getAttribute('data'),"text",true);   
    content.appendChild(data);
    content.appendChild(createInputItem("Title", "title", "title",element.getAttribute('title'),"text",true));
    content.appendChild(createInputItem("plotType", "plotType", "plotType",element.getAttribute('plotType'),"text",true));
    content.appendChild(createInputItem("xLabel", "xLabel", "xLabel",element.getAttribute('xLabel'),"text",true));
    content.appendChild(createInputItem("yLabel", "yLabel", "yLabel",element.getAttribute('yLabel'),"text",true));    
    content.appendChild(createInputItem("customCode", "customCode", "customCode",element.getAttribute('customCode'),"text",true));
   
}

function render(python)
{
    const data = [1, 2, 3, 4, 5] ; // Sample data

    // Collecting form data
    const plotType = python.getAttribute('plotType');
    const xLabel = python.getAttribute('xLabel');
    const yLabel =  python.getAttribute('yLabel');
    const title =  python.getAttribute('title'); 
    const fileName = python.getAttribute('filename');
    const customCode = python.getAttribute('customCode');
    // check if data is provided and all required fields are filled
    if (!data || !plotType || !xLabel || !yLabel || !title || !fileName) {
        console.error('Missing required fields');
        return;
    }
    fetch('/generate-plot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, plot_type: plotType, x_label: xLabel, y_label: yLabel, title, file_name: fileName, custom_code: customCode }),
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