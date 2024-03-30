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
      //  console.log("type:"+elementsData[type]);
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
   // console.log(event.key);
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
   // console.log("formContainer.offsetTop:"+formContainer.offsetTop);
    var totalOffsetTop = top + editorElementSelected.offsetTop -25;
    var totalOffsetLeft = left+ editorElementSelected.offsetLeft + editorElementSelected.offsetWidth;

    editorFloatMenu.style.top = totalOffsetTop + 'px';
    editorFloatMenu.style.left = totalOffsetLeft + 'px';
    
});


function getAbsoluteOffset(element) {
    let top = 0, left = 0;
   do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);
    return { top, left };
}

// showproperties of the element
function showProperties()
{
    const inputElementSelected=document.getElementById("editorElementSelected");
  //  console.log("inputElementSelected.value:"+inputElementSelected.value);
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
    //  console.log( event.dataTransfer);
    var elementId = event.dataTransfer.getData("text");
    //console.log("elementId:"+elementId);
  
    // get the element source 
    var element = document.getElementById(elementId);
    var type=element.getAttribute("dataType");
    var query=element.getAttribute("query");
   // console.log("type:"+type);
   // console.log("query:"+query);
    // set the type and query in the destination element
    event.target.setAttribute("dataType",type);
    event.target.setAttribute("query",query);
    // split the elementId to get the table name and field name
    
    const elements=elementId.split(".");
    console.log(elements);
    if (elements.length>1)
    {
        // get ObjectType
        var oType= event.target.getAttribute("ObjectType");
        // if the object type is not null set the dataset and field
        var dataset=elements[0];
        var field=elements[1];
        switch (oType)
        {
            case "labels":
            event.target.value=elementId;                 
         
            event.target.value=field;
            // get the dataType
           
            var select= event.target.parentNode.querySelector("select");
            // if the select element exists
            if (select)
            {
                // remove all the options
                removeAllChildNodes(select);
                // create the option
                 setOptionsByType(select,type);
            }
            break;
            case "data":
              // generate the input element
              // get the field type
               
                addFieldToPropertiesBar(event.target,field,type,"value");
            break;
            case "filters":
                // generate the input element
                // get the field type
                event.target.value=field;
                
            break;

        }
        
    }
    else
        event.target.value=elementId;
    // dispatch the input event
    event.target.dispatchEvent(new InputEvent("input"));
     
}
  
// function to remove the item from the data object 
function removeItem(event) {
    event.target.parentNode.remove();
}
