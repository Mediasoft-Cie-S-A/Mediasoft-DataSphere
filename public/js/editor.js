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


function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}


function onchangeInput(event,styleProperty,attribute) {
    console.log("onchange:"+this.value);    
             if (attribute===true)
             {   
                  updateAttribute(styleProperty, this.value);
                  
                  
             }
             else
             {
             updateElementStyle(styleProperty, this.value);
             }
        
    };


function createInputItem(id, label, styleProperty,text,type,attribute) {
    
    var div = document.createElement("div");
    var lbl = document.createElement("label");
    lbl.setAttribute("for", id);
    lbl.textContent = label;

    var input = document.createElement("input");
    input.type = type;
    input.id = id;
    input.setAttribute("ondragover", "allowDrop(event)");
    input.setAttribute("ondrop", "dropInput(event)");
    input.setAttribute("onchange", "onchangeInput(event,'"+styleProperty+"',"+attribute+")");
    input.value=text
     
    div.appendChild(lbl);
    div.appendChild(input);

    return div;
}


function createSelectOption(event,select, text, value) 
{
    var option = document.createElement("option");
    option.value = value;
    option.text = text;
    select.appendChild(option);
}

function createInputDiv(id, labelText, onChangeFunction,text) {
    var div = document.createElement("div");
    div.id = id;
    var label = document.createElement("label");
    label.setAttribute("for", id + "Input");
    label.textContent = labelText;
    var input = document.createElement("input");
    input.type = "text";
    input.id = id + "Input";
    input.className = "input-element";
    input.onchange = function() { onChangeFunction(this.value); };
    input.value=text;
    div.appendChild(label);
    div.appendChild(input);
    return div;
}

function editElement(element) {
    // Get the type of the element
     // if type is null get the element type
     console.log("element:"+element);
     console.log("element.tagName:"+element.tagName);
    var type = element.getAttribute('tagName');
        currentElement=element
        var dialog= document.getElementById("propertiesBar");
    	dialog.style.display = 'block';         
        var content= dialog.querySelector("div");
        content.id="propertiesContent"+type;
        content.setAttribute("elementId",element.id);
	     content.innerHTML="";
        // adding icon close to the dialog
        var closeIcon = document.createElement("i");
        closeIcon.className = "fa fa-close";
        closeIcon.onclick = function() {  document.getElementById("propertiesBar").style.display = 'none'; };
        // set the icon top right
        closeIcon.style.float = "right";      
        closeIcon.style.cursor = "pointer";
        closeIcon.style.border = "1px solid black";
        content.appendChild(closeIcon);

        removeAllChildNodes(content);
        
        const label = document.createElement('label');
        label.textContent = element.id;
	    label.style.float = "left";
        label.style.backgroundColor = "grey";
        label.style.color = "white";
        content.appendChild(label);
        content.appendChild(document.createElement('hr'));
        // Execute the function editor delcared in the components js if exists type   
        console.log("type:"+elementsData[type]);

        if (elementsData[type]){
            if (elementsData[type].editFunction) {
                var functionName = elementsData[type].editFunction;
                console.log("functionName:"+functionName);
                window[functionName](type,element,content);
            
            }
        }



        const style = element.style;

     
        
        content.appendChild(createInputItem("wd", "width", "width",style.width,"text"));
        content.appendChild(createInputItem("hg", "height", "height",style.height,"text"));
        content.appendChild(createInputItem("cl", "color", "color",style.color,"color"));
        content.appendChild(createInputItem("bg", "background-color", "background-color",style.backgroundColor,"color"));
        content.appendChild(createInputItem("border", "border", "border",style.border,"text"));
        content.appendChild(createInputItem("border-radius", "border-radius", "border-radius",style.borderRadius,"text"));
        content.appendChild(createInputItem("font-size", "font-size", "font-size",style.fontSize,"text"));
        content.appendChild(createInputItem("font-family", "font-family", "font-family",style.fontFamily,"text"));       
       
}







function closeModalDbStrct() {

    document.getElementById("tableDetailsModal").style.display = 'none';
    document.querySelector(".overlay").style.display = 'none';
    currentElement = null;
}

function updateElementText(t)
{
    
    var label= currentElement;   
    label.innerText=t;
}

function updateElementValue(t)
{
    var text= currentElement;   
    text.value=t; 
    
}

function updateElementTxtC(t)
{
    currentElement.textContent=t; 
    
}

function updateElementStyle(type,t)
{
    console.log("updateElementStyle:"+type+" "+t);
    currentElement.style.setProperty(type,t);     
    
}

function updateAttribute(type,t)
{
    console.log("updateElementAttribute:"+type+" "+t);
    currentElement.setAttribute(type,t);     
    
}


function updateElementOnChange(t)
{
    var text= currentElement.querySelector('input');   
    text.value=t; 
    
}

// Function to delete the selected element
function deleteSelectedElement() {
    // Find the selected element
    const selectedElement = document.querySelector('.Selection');
 
    // If an element is found and it's part of the DOM, remove it
    if (selectedElement && selectedElement.parentNode) {
        selectedElement.parentNode.removeChild(selectedElement);
    }
}

// Event listener for keypress on the window
window.addEventListener('keyup', function(event) {
    // Check if the pressed key is the one you want, e.g., the Delete key
   // addLog(event.key);
    if (event.key === 'Delete') {
     
        deleteSelectedElement();
    }
},false);


// editor properties on hover, click, double click

// get the formContainer id
var formContainer = document.getElementById('formContainer');
// add event listener to the formContainer of on hover and show the context menu editorFloatMenu
// in the position where the mouse is over and aligned to right for the sub elements
formContainer.addEventListener('click', function(event) {
    event.preventDefault();
    // remove gjs-selection class from all elements
    removeSelection();
    console.log("event.target.id:"+event.target.id);    
    if (event.target.id === 'formContainer') {       
        
        hideEditMenu();
        }
    //get the offset of formContainer
    const { top, left } = getAbsoluteOffset(formContainer);
    var editorElementSelected = event.target;
    editorElementSelected.classList.add("gjs-selection");
    const inputElementSelected=document.getElementById("editorElementSelected");
    inputElementSelected.value=editorElementSelected.id;
    var editorFloatMenu = document.getElementById('editorFloatMenu');
    editorFloatMenu.style.display = 'block';
    // Get the total offset by combining formContainer's and element's offset
   // addLog("formContainer.offsetTop:"+formContainer.offsetTop);
    var totalOffsetTop = top + editorElementSelected.offsetTop -25;
    var totalOffsetLeft = left+ editorElementSelected.offsetLeft + editorElementSelected.offsetWidth;

    editorFloatMenu.style.top = totalOffsetTop + 'px';
    editorFloatMenu.style.left = totalOffsetLeft + 'px';
    
});



// showproperties of the element
function showProperties()
{
    const inputElementSelected=document.getElementById("editorElementSelected");
  //  addLog("inputElementSelected.value:"+inputElementSelected.value);
    var editorElementSelected=document.getElementById(inputElementSelected.value);

    editElement(editorElementSelected);
}

function deleteElement()
{
    const inputElementSelected=document.getElementById("editorElementSelected");
    var editorElementSelected=document.getElementById(inputElementSelected.value);
    editorElementSelected.parentNode.removeChild(editorElementSelected);
    hideEditMenu();
}

function hideEditMenu()
{
    var editorFloatMenu = document.getElementById('editorFloatMenu');
    editorFloatMenu.style.display = 'none';
}

function removeSelection()
{
    var elements  = document.getElementsByClassName("gjs-selection");
    for(i=0;i<elements.length;i++)
    {
        elements[i].classList.remove("gjs-selection");
     
    }
}   

function dropInput(event) {
    
    event.preventDefault();

    console.log("dropInput");
    console.log( event.dataTransfer);
    // get data from the drag event in json format

    var dataset = JSON.parse( event.dataTransfer.getData("text/plain"));
    const datasetname=dataset.datasetName;
        const field=dataset.field;
        const type=dataset.type;
    console.log(datasetname);
    console.log(field);
    console.log(type);  
    // get the element source 
  
    event.target.setAttribute("dataset",dataset.datasetName);
    // split the elementId to get the table name and field name
    if (datasetname&&field&&type )
    {
        // get ObjectType
        const oType= event.target.getAttribute("ObjectType");
        // if the object type is not null set the dataset and field
        switch (oType)
        {
            case "labels":
            console.log("labels");
            event.target.value=field;
            event.target.setAttribute("dataType",type);
            // get the dataType
           
            var select= event.target.parentNode.querySelector("select");
            // if the select element exists
            if (select && type)
            {
                // create the option
                setOptionsByType(select,type);
                console.log(select);

            }
            break;
            case "data":
              // generate the input element
              // get the field type
                let config = {fieldName:field,dataType:type,dataset:datasetname,functionName:"value"};
                addFieldToPropertiesBar(event.target,config);
            break;
            case "filters":
                // generate the input element
                // get the field type
                event.target.value=field;
                event.target.setAttribute("dataType",type);
                
            break;

        }
        
    }
    else
    {
        event.target.value=field;
        event.target.setAttribute("dataType",type);

    }
    // dispatch the input event
    event.target.dispatchEvent(new InputEvent("input"));
     
}
  
// function to remove the item from the data object 
function removeItem(event) {
    event.target.parentNode.remove();
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
    console.log("field:"+field);
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
      
      // calculate the height of the parent div
      var totalHeight=0;
        for (var i = 0; i < dataObjet.children.length; i++) {
            totalHeight += dataObjet.children[i].height + 10;
            if (i==dataObjet.children.length-1)
            {
                dataObjet.children[i].style.marginBottom="30px";
            }
            else{
                dataObjet.children[i].style.marginBottom="0px";
            
            }
        }
        dataObjet.style.height=totalHeight+"px";
    }

// Function to initialize the filter box
function createFilterBox(main) {
    var div = document.createElement("div");
    div.id = 'filterBox';
    
    var lbl = document.createElement("label");
    lbl.setAttribute("for", div.id);
    lbl.textContent = "Filter:";
    div.appendChild(lbl);

    // Add button to add a new filter
    var addButton = document.createElement("button");
    addButton.innerHTML = '<i class="fa fa-plus"></i>';
    addButton.onclick = function() {
        const filterBoxContainer = main.querySelector('#filterBoxContainer');
        filterBoxContainer.appendChild(createFilterField(main));
    };
    div.appendChild(addButton);

    // Clear button for the filter with icon
    var clearButton = document.createElement("button");
    clearButton.innerHTML = '<i class="fa fa-trash"></i>';
    clearButton.onclick = function() {
        const chart = document.getElementById(main.getAttribute("elementId"));
        chart.removeAttribute("filter");
        const filterBoxContainer = main.querySelector('#filterBoxContainer');
        filterBoxContainer.innerHTML = '';
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
    ['standard', 'advanced'].forEach(view => {
        const option = new Option(view, view);
        viewSelect.options.add(option);
    });

    // Append the view select to the container
    div.appendChild(viewSelect);

    // Event listener for changing views
    viewSelect.addEventListener('change', function(event) {
        switchView(event, main, this.value);
    });
    div.appendChild(filterBoxContainer);

    // Create button to apply filter
    const generateJsonBtn = document.createElement('button');
    generateJsonBtn.textContent = 'Apply';
    generateJsonBtn.setAttribute("onclick", "generateJson(event,'" + main.id + "')");
    div.appendChild(generateJsonBtn);

    return div;
}

// Function to create individual filter fields
function createFilterField(main) {
    const container = document.createElement('div');
    container.className = 'filterField';

    const textField = document.createElement('input');
    textField.placeholder = 'Field';
    textField.name = 'field';
    textField.setAttribute('ObjectType', 'filters');
    textField.setAttribute('ondragover', 'allowDrop(event)');
    textField.setAttribute('ondrop', 'dropInput(event)');

    container.appendChild(textField);

    // Create and append input fields based on view
    const viewSelect = main.querySelector('#viewSelect').value;
    if (viewSelect === 'standard') {
        const multiSelect = document.createElement('select');
        multiSelect.multiple = true;

        textField.addEventListener('input', function(event) {
            const dataset = this.getAttribute('dataset');
            const url = '/getDatasetDataDistinct/' + dataset + '/' + this.value;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    multiSelect.innerHTML = '';
                    data.forEach(value => {
                        var opt = document.createElement('option');
                        opt.value = value;
                        opt.innerHTML = value;
                        multiSelect.appendChild(opt);
                    });

                    const chart = document.getElementById(main.getAttribute("elementId"));
                    if (chart.getAttribute("filter")) {
                        var filterConfig = JSON.parse(chart.getAttribute("filter"));
                        var filter = filterConfig.filters[0];
                        filter.values.forEach(val => {
                            for (let option of multiSelect.options) {
                                if (option.value === val) option.selected = true;
                            }
                        });
                    }
                });
        });

        container.appendChild(multiSelect);
    } else if (viewSelect === 'advanced') {
        const operatorSelect = document.createElement('select');
        ['=', '!=', '<', '>', '>=', '<='].forEach(op => {
            const option = new Option(op, op);
            operatorSelect.options.add(option);
        });

        const valueInput = document.createElement('input');
        valueInput.placeholder = 'Value';

        container.appendChild(operatorSelect);
        container.appendChild(valueInput);
    }

    return container;
}

// Function to switch views
function switchView(event, main, view) {
    event.preventDefault();
    const container = main.querySelector('#filterBoxContainer');
    container.innerHTML = '';

    const addFilterField = createFilterField(main);
    container.appendChild(addFilterField);
}
  
 // Function to collect data and generate JSON
function generateJson(event, mainId) {
    event.preventDefault();
    console.log("generateJson");
    console.log(mainId);
    
    const main = document.getElementById(mainId);
    const viewSelect = main.querySelector('#viewSelect');
    if (!viewSelect) return;
    
    const view = viewSelect.options[viewSelect.selectedIndex].value;
    let filterInfo = { view: view, filters: [] };
    
    const filterFields = main.querySelectorAll('#filterBoxContainer .filterField');

    filterFields.forEach(filterField => {
       
        const fieldInput = filterField.querySelector('input[name="field"]');
        const dataType = fieldInput.getAttribute('dataType');
        
        if (view === 'standard') {
            const multiSelect = filterField.querySelector('select');
            const selectedOptions = Array.from(multiSelect.selectedOptions).map(option => option.value);
            let filterValues = [];

            switch (dataType) {
                case 'string':
                    filterValues = selectedOptions;
                    break;
                case 'number':
                    filterValues = selectedOptions.map(option => parseFloat(option));
                    break;
                case 'date':
                    filterValues = selectedOptions.map(option => new Date(option));
                    break;
            }

            filterInfo.filters.push({
                field: fieldInput.value,
                dataset: fieldInput.getAttribute('dataset'),
                type: dataType,
                operator: '',
                value: '',
                values: filterValues
            });

        } else if (view === 'advanced') {
            const operatorSelect = filterField.querySelector('select');
            const valueInput = filterField.querySelector('input[placeholder="Value"]');
            let value = null;

            switch (dataType) {
                case 'string':
                    value = valueInput.value;
                    break;
                case 'number':
                    value = parseFloat(valueInput.value);
                    break;
                case 'date':
                    value = new Date(valueInput.value);
                    break;
            }

            filterInfo.filters.push({
                field: fieldInput.value,
                dataset: fieldInput.getAttribute('dataset'),
                type: dataType,
                operator: operatorSelect.value,
                value: value,
                values: []
            });
        }
    });

    const chart = document.getElementById(main.getAttribute("elementId"));
    chart.setAttribute("filter", JSON.stringify(filterInfo));

    // Display the JSON for demonstration purposes
    console.log(JSON.stringify(filterInfo));

    // Here you could also send the JSON to a server, save it, or use it in some other way
    // For example:
    // fetch('/api/filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filterInfo) });
}

 // Function to regenerate filters from JSON
function regenerateFilters(content, filterConfig) {
    if (!filterConfig) return;
    switchView(event, content, filterConfig.view); // Ensure the correct view is set
    
    if (!filterConfig.filters) return;

    if (filterConfig.filters.length > 0) {
        filterConfig.filters.forEach(filter => {
            const filterBoxContainer = content.querySelector('#filterBoxContainer');
            const filterField = createFilterField(content);
            filterBoxContainer.appendChild(filterField);
            
            const textField = filterField.querySelector('input[name="field"]');
            textField.value = filter.field;
            textField.setAttribute('dataType', filter.type);
            textField.setAttribute('dataset', filter.dataset);

            if (filterConfig.view === 'standard') {
                const multiSelect = filterField.querySelector('select');
                textField.dispatchEvent(new Event('input')); // Trigger input event to populate options
                setTimeout(() => {
                    filter.values.forEach(val => {
                        for (let option of multiSelect.options) {
                            if (option.value === val) option.selected = true;
                        }
                    });
                }, 1000); // Adjust timeout as needed to ensure options are populated
            } else if (filterConfig.view === 'advanced') {
                filterField.querySelector('select').value = filter.operator;
                filterField.querySelector('input[placeholder="Value"]').value = filter.value;
            }
        });
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
        default:
            options=['value','count','distinct'];
            break;
    }
    console.log(options);
    // add the options
    options.forEach(option => {
      
        var opt = document.createElement('option');
        opt.value = option;
        opt.innerHTML = option;
        select.appendChild(opt);
    });
    console.log(select);
}

function createMultiSelectItem(id, label, styleProperty,text,type,attribute)
 {
    console.log(id + " " + label + " " + styleProperty + " " + text + " " + type + " " + attribute);
    var div = document.createElement("div");
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.padding='10px';
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



function getAbsoluteOffset(el) {
    var doc  = document,
    win  = window,
    body = doc.body,

    // pageXOffset and pageYOffset work everywhere except IE <9.
    offsetX = win.pageXOffset !== undefined ? win.pageXOffset :
        (doc.documentElement || body.parentNode || body).scrollLeft,
    offsetY = win.pageYOffset !== undefined ? win.pageYOffset :
        (doc.documentElement || body.parentNode || body).scrollTop,

    rect = el.getBoundingClientRect();

if (el !== body) {
    var parent = el.parentNode;

    // The element's rect will be affected by the scroll positions of
    // *all* of its scrollable parents, not just the window, so we have
    // to walk up the tree and collect every scroll offset. Good times.
    while (parent !== body && parent !== null) {
        offsetX += parent.scrollLeft;
        offsetY += parent.scrollTop;
        parent   = parent.parentNode;
    }
}

return {
    bottom: rect.bottom + offsetY,
    height: rect.height,
    left  : rect.left + offsetX,
    right : rect.right + offsetX,
    top   : rect.top + offsetY,
    width : rect.width
};
}