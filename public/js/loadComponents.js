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


var currentElement=null;
var elementsData=[];
// create the sidebar menu
// Load the JSON data


loadJson('/elementsConfig')
    .then(data => {
        elementsData = data;
        createSidebar(elementsData);
    })
    .catch(err => {
        console.error(err);
    });

// js script
    function loadScriptIfNotLoaded(scriptUrl,scriptslist) {
        // Check if the script is already loaded
     
       
        // The script is not loaded, check if it exists and load it
        try {
           return fetch(scriptUrl)
            .then(response => {
                if (response.ok) {
                    // The script exists, load it
                    var script = document.createElement('script');
                    script.src = scriptUrl;
                    
                    document.body.appendChild(script);
                    scriptslist.push(scriptUrl);
                } else {
                    addLog('Script not found: ' + scriptUrl);
                }
            });
        }catch(err) {
            addLog('Script not found: ' + scriptUrl);
        }
    }
// Create the sidebar
function createSidebar(elementsData) {
    const sidebar = document.getElementById('componentsSidebar');
    const categories = {};
    var scriptslist = [];
    var csslist = [];
    // Group elements by category
    for (const elementId in elementsData) {
        const elementData = elementsData[elementId];
        if (!categories[elementData.category]) {
            categories[elementData.category] = [];
        }
        categories[elementData.category].push(elementData);
    }

    // Create sidebar items
    for (const category in categories) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        const button = document.createElement('button');
        button.textContent = category;
        button.className = 'category-button';
        button.addEventListener('click', function() {
            const categoryDiv = this.parentElement;
            const height = categoryDiv.style.height;
            addLog(height);
            if (height === "75px") {
                categoryDiv.style.height = 'auto';
            } else {
                categoryDiv.style.height = '75px';
            }
        });
        categoryDiv.appendChild(button);
        categoryDiv.appendChild(document.createElement('hr'));
        const elements = categories[category];
       
                for (const elementData of elements) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'component-item draggable';
                    itemDiv.draggable = true;
                    itemDiv.innerHTML = "<img src='"+elementData.image+"' width='50px' height='50px' draggable='false' />";
                    itemDiv.id = elementData.type;
                    itemDiv.addEventListener('dragstart', drag);
                    itemDiv.addEventListener('mouseover', function(event){
                        event.preventDefault();
                        showHint(elementData.description,3000,event);
                    })
                    itemDiv.addEventListener('dblclick',function(event){
                        event.preventDefault();
                        addLog(event.target.id);
                        // create the element
                        var newElement = createFormElement(event.target.id);
                                
                                if (newElement) {
                                    event.target.appendChild(newElement);
                                }
                    })
                    categoryDiv.appendChild(itemDiv);

                    // Check if the script exists
                    // Check if the script exists
                    // Use the function
                    var scriptUrl = "/js/components/" + elementData.scriptName;
                  //  scriptslist.forEach(script => addLog(script));
                    var existingScript = scriptslist.find(script => script === scriptUrl);
                  
                               
                    if (!existingScript) {
                        addLog("scriptUrl:"+scriptUrl);
                        loadScriptIfNotLoaded(scriptUrl)
                        .catch(error => {
                            addLog('Error loading script:', error);
                        });
                    scriptslist.push(scriptUrl);
                 }
                // css file
                var cssUrl = "/css/" + elementData.styles;
                var existingCss = csslist.find(css => css === cssUrl);
                if (!existingCss) {
                    var link = document.createElement('link');
                    link.href = cssUrl;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                    scriptslist.push(cssUrl);
                   
                }
            }
             sidebar.appendChild(categoryDiv);      
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
 
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    
    event.preventDefault();

    var elementId = event.dataTransfer.getData("text");
    addLog("elementId:"+elementId);
            var newElement = createFormElement(elementId);
            
            if (newElement) {
                event.target.appendChild(newElement);
            }
     
}

// Assuming you're in a browser environment
async function loadJson(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}




function createFormElement(elementId) {
    var element = null;

        addLog(elementId);
        
        addLog(elementsData[elementId]);
         // Execute the function
         var functionName = elementsData[elementId].createFunction;
        addLog("functionName:"+functionName);
         if (typeof window[functionName] === 'function') {
            addLog("functionName:"+functionName);
            element= window[functionName](elementId);
         }
      
         if (element) {
            element.setAttribute("tagName",elementId);
            element.className = 'form-element';
            element.draggable = true;
            element.ondragstart = drag;
        }
    return element;
}

