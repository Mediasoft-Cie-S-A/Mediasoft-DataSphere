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
function createGridElement(type, id) {

    addLog("creategrid:"+type);
    var main= document.createElement('div');
    main.className = 'form-container row display-flex';
    main.id=type+ Date.now(); // Unique ID for each new element
    main.tagName=type;

    processGridId(id, main);
}

/** Loop through selected grid layout's id and generate elements accordingly **/
async function processGridId(id, parent) {

    for (let i = 0; i < id.length; i++) {

        var child = document.createElement('div');
        child.className =`col-md-${id[i]} col-sm-12 grid-element`;  
        child.id=parent.id+"GridElement";
        child.tagName="gridelement";
        // child.draggable = true;

        parent.appendChild(child);
    }

    document.getElementById("formContainer").appendChild(parent);
}

function editGridElement(type,element,content)
{
    // Create and append the elements

}

function insertHtmlGrid(event) {
    addLog('event', event.target.id);

    const modal = document.getElementById('htmlGridModal');
    const overl = document.getElementById('overlayModal');
    modal.style.display = 'none';
    overl.style.display = 'none';

    createGridElement('grid', event.target.id);
}

function showHtmlGridModal(main) {
    const modal = document.getElementById('htmlGridModal');
    modal.setAttribute('data-main-id', main.id);
    const overl = document.getElementById('overlayModal');
    modal.style.display = 'block';
    overl.style.display = 'block';
}

function closeHtmlGridModal() {
    const modal = document.getElementById('htmlGridModal');
    const overl = document.getElementById('overlayModal');
    modal.style.display = 'none';
    overl.style.display = 'none'; 
}