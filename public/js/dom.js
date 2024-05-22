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

// Function to create json from DOM
function domToJson(element) {
    // Create an array to hold the JSON representation of the children
    var childrenJson = [];

    // Process only the children of the provided element
    Array.from(element.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            childrenJson.push(elementToJson(child));
        } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '') {
            childrenJson.push({ text: child.textContent });
        }
    });

    // If there's only one child, return it directly, otherwise return the array
    return childrenJson.length === 1 ? childrenJson[0] : childrenJson;
}
// Function to convert DOM to JSON
function elementToJson(element) {
    var obj = {
        tag: element.tagName.toLowerCase(),
        attributes: {},
        children: []
    };

    Array.from(element.attributes).forEach(attr => {
        obj.attributes[attr.name] = attr.value;
    });

    Array.from(element.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            obj.children.push(elementToJson(child));
        } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '') {
            obj.children.push({ text: child.textContent });
        }
    });

    return obj;
}

// Function to convert JSON to DOM
function jsonToDom(json, parent) {
    if (Array.isArray(json)) {
        json.forEach(childJson => createDomElement(childJson, parent));
    } else {
        createDomElement(json, parent);
    }

    
}
// Function to create DOM element from JSON
function createDomElement(json, parent) {
    if (json.tag) {
        // Create element for tag
        var element = document.createElement(json.tag);

        // Set attributes
        if (json.attributes) {
            for (var attr in json.attributes) {
                element.setAttribute(attr, json.attributes[attr]);
            }
        }

        element.classList.remove('gjs-selection');
        // onlyEditor is used to hide the element in the render view
        if (element.getAttribute('onlyEditor') === 'true') {
            element.style.display = 'none';
        }
        // Append to parent
        parent.appendChild(element);

        // Process children
        if (json.children) {
            json.children.forEach(child => {
                jsonToDom(child, element);
            });
        }
    } else if (json.text) {
        // Create text node
        var textNode = document.createTextNode(json.text);
        parent.appendChild(textNode);
    }
}


// Function to export the json to file
function exportJson() {
    var formContainer = document.getElementById('formContainer');
    var jsonData = domToJson(formContainer);
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "form.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}


    // Function to handle tab switch
    function onTabSwitch(event) {
        event.preventDefault();
        console.log("onTabSwitch");
        var target = event.target.getAttribute("href");
        removeSelection();
        hideEditMenu();
        console.log(target);
        if(target === '#Dashboard') {
            getDatasets();
           
        }

        if (target === '#renderForm') {
            var formContainer = document.getElementById('formContainer');
            var jsonData = domToJson(formContainer);
            console.log(jsonData);
            var renderContainer = document.getElementById('renderForm');

            // Clear previous content
            renderContainer.innerHTML = '';

            // Convert JSON back to DOM and append
            var domContent = jsonToDom(jsonData,renderContainer);
            
        }
        if (target === '#DatabaseForm') {
            console.log('DatabaseForm');
            createTableListDb();
            getDatasets();
        }
    }

 
    

    // Add event listeners to tab links
    var tabLinks = document.querySelectorAll('.menu a');
    tabLinks.forEach(function(link) {
        link.addEventListener('click', onTabSwitch);
    });

