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



function createElementTab(type) {
    const element  = document.createElement('div');
    element.id = 'Tab'+ Date.now(); // Unique ID for each new element
    element.tagName = type;
    element.classList.add('ctab_tabs-container');
   
    // generate tab html code with 3 tabs
    const tabsHeader = document.createElement('div');
    tabsHeader.classList.add('ctab_tabs-header');
    element.appendChild(tabsHeader);
    const tabsContent = document.createElement('div');
    tabsContent.classList.add('ctab_tabs');
    element.appendChild(tabsContent);
    

    createTabContent(tabsHeader,tabsContent);
    
    return element;
}

function editElementTab(type,element,content)
{
    console.log('editElementTab');
  
    //get all the tabs
    const tabsHeader= element.querySelectorAll('.ctab_HeaderButton');
    
    const tabsContent = element.querySelectorAll('.ctab_ContentDiv');
   
    const div = document.createElement('div');
    div.id = 'TabList'; 
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.padding='5px';
    div.style.minHeight = '100px';
    div.style.border = '1px solid #ccc';
    // rounded corners
    div.style.borderRadius = '5px';
   
    div.style.className = 'multi-select';
    div.style.overflow = 'auto';
    // add the add button
    const addButton = document.createElement('button');
    addButton.id = 'addTab';
    addButton.style.width = '30px';
    addButton.innerText = '+';
    addButton.style.itemAlign = 'center';
    addButton.style.float= 'right';
    addButton.addEventListener('click',function(){
        createTabContent(element.querySelector('.ctab_tabs-header'),element.querySelector('.ctab_tabs'));
    });
    div.appendChild(addButton);

    
    // add remove button in current div
    for (var i=0;i<tabsHeader.length;i++)  {
        const tabH = tabsHeader[i];
        const tabC = tabsContent[i];
        const editTab = document.createElement('div');
        editTab.id = 'editTab';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = tabH.innerText;
        input.addEventListener('change',function(){
            tabH.innerText = input.value;
        });
        editTab.appendChild(input);
        const removeButton = document.createElement('button');
        removeButton.id = 'removeTab';
        removeButton.innerText = '-';
        removeButton.addEventListener('click',function(){
            tabH.remove();
            tabC.remove();
        });
        editTab.appendChild(removeButton);
        div.appendChild(editTab);
    };
    content.appendChild(div);
}


function createTabContent (tabsHeader,tabsContent) 
{
    let tabs = tabsHeader.querySelectorAll('.ctab_HeaderButton');
    let tabcount=0;
    if (tabs!=null || tabs!=undefined)
    {
        tabcount = tabs.length;
    }
    
    const tabId = `ctab_tab-${tabcount}`;

    // Create tab header
    const tabHeader = document.createElement('div');
    
    tabHeader.dataset.tab = tabId;
    tabHeader.innerText = `Tab-${tabcount}`;;
    tabHeader.className='ctab_HeaderButton';
    tabsHeader.appendChild(tabHeader);

    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.id = tabId;
   // tabContent.textContent = `Content for ${title}`;
    tabsContent.appendChild(tabContent);
    tabContent.style.display = 'none';
    tabContent.className='ctab_ContentDiv';

    // Activate the new tab
   // fire tabHeader click event
 
    tabHeader.setAttribute('onclick', 'activateTab(event,this,document.getElementById("' + tabId + '"))');

   activateTab(event, tabHeader,tabContent);

   
};

function activateTab(event,tabHeader,tabContent){
    event.preventDefault();
    
    tabContent.parentElement.querySelectorAll('.ctab_ContentDiv').forEach((el) => el.style.display = 'none');
    tabHeader.parentElement.querySelectorAll('.ctab_HeaderButton').forEach((el) => el.classList.remove('active'));
    tabHeader.classList.add('active');       
    tabContent.style.display = 'block';
}