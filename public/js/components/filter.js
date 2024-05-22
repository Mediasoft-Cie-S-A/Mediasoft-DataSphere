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

function createElementFilter(type){
    var main= document.createElement('div');
    main.className = 'dataSetContainer';
    main.id=type+ Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName=type;


    const list = document.getElementById('ContentTableList');
    const detailsDiv = document.getElementById('tableDetails');

    
    return main;
}


function editElementFilter(type,element,content){
    const button = document.createElement('button');
    button.textContent = 'update';
    button.onclick = function() {
        const propertiesBar = document.getElementById('propertiesBar');
        const gridID=propertiesBar.querySelector('label').textContent;
                 
        const main = document.getElementById(gridID);  
        updateDataSearch(main,content);
    };
    content.appendChild(button);   
    content.appendChild(createMultiSelectItem("Data", "data", "data"));
    
    // load the data
    // check if jsonData is not empty
    if (element.getAttribute('datasearch')!=null)
    {
        console.log(element.getAttribute('datasearch'));
        var target=content.querySelector('#Data');
        var jsonData=JSON.parse(element.getAttribute('datasearch'));
        jsonData.forEach(fieldJson => {
            addFieldToPropertiesBar(target,fieldJson);
        });
    }
    // load the data
    // check if jsonData is not empty
   
}


function  updateDataSearch(main,content)
{

 // get all the span elements from data 
 var data=content.querySelectorAll('#Data div');
 // generate the json of all the data
 //console.log(data);
 var jsonData=[];
 data.forEach(item => {
   //  console.log(span.getAttribute("data-field-name"));
    // get the json data from the span
     var json={"fieldname":item.querySelector('span[name="dataContainer"]').getAttribute("data-field-name"),
     "dataset":item.querySelector('span[name="dataContainer"]').getAttribute("dataset"),
     "fieldLabel":item.querySelector('span').textContent,
     "datatype":item.querySelector('span').getAttribute("data-type"),
     "functionName":item.querySelector('select').value
      };
     // add the field to the json
       jsonData.push(json);
 });
 main.setAttribute("datasearch",JSON.stringify(jsonData));



RenderDataSearch(main);
}


function RenderDataSearch(main)
{
    
    main.innerHTML="";
    var searchMainDiv = document.createElement('div');
    searchMainDiv.className = 'search-container';
    searchMainDiv.id="searchDiv";
    searchMainDiv.style.display="infline-block";
    main.appendChild(searchMainDiv);
    var jsonData=JSON.parse(main.getAttribute('datasearch'));
   
    var i=0;
   

    jsonData.forEach(field => {
        console.log(field);
            // generate the search html
            var html="<div class='searchMain' id='search_"+field.fieldname+ Date.now()+"' >";
            html+="<div class='search' id='search_"+field.fieldname+"_searchDiv'>";
            html+="<input type='text' id='search_"+field.fieldname+"_input' list='searchList' placeholder='"+field.fieldLabel+"'  autocomplete='off' ";
            html+="oninput='searchAutoComplete(event,this)' ";
            html+=" dataset='"+field.dataset+"'";   
            html+=" data-field-name='"+field.fieldname+"'"; 
            html+=" data-field-type='"+field.datatype+"'"; 
            html+=" onclick='this.parentElement.querySelector(\".autocomplete-results\").style.display=\"none\"'>";
            html+=" <button type='button' onclick='allSearch(event,\"search_"+field.fieldname+"_input\")'>";
            html+="<i class='fas fa-search'></i> </button>";
            html+="<div id='search_"+field.fieldname+ Date.now()+"_autocomplete' class='autocomplete-results'>";
            html+="</div></div></div>";
            searchMainDiv.innerHTML+=html;
            i++;
    });
    
    
}

function allSearch(event,targetID)
{
    event.preventDefault();
    console.log("allSearch:" + targetID);
    // get the dataset, fieldname and fieldtype and value from the target
    var element=document.getElementById(targetID);
    console.log(element);
    var dataset=element.getAttribute("dataset");
    var fieldName=element.getAttribute("data-field-name");
    var datatype=element.getAttribute("data-field-type");
    var value=element.value;
    // serach all the tagType
    var allObjects=document.querySelectorAll('[tagname]');
    allObjects.forEach(element => {
        console.log(element);
        // get the dataset, fieldname and fieldtype and value
    
         // check if the dataset is the same as the dataset of the search
        if (element.getAttribute("dataset")==dataset)
        {
            console.log("dataset found");
            var jsonFilter={"view":"standard","filters":[{"field":fieldName,"dataset":dataset,"type":datatype,"values":[value]}]};
            element.setAttribute("filter",JSON.stringify(jsonFilter));
            switch (element.getAttribute("tagname")) {
                case "grid":
                    updateGridData(element);
                    break;
                case "BarChart":
                case "LineChart":
                case "PieChart":
                case "DonutChart":
                case "RadarChart":
                case "PolarAreaChart":
                case "BubbleChart":
                case "ScatterChart":
                    console.log("renderChart");
                    renderData(element);
                    break;
                default:
                    break;
                }
        }
        
    });
}
// searchAutoComplete that call the search function "/select-distinct/:tableName/:fieldName" and display the result in the autocomplete div
function searchAutoComplete(event,element)
{
    event.preventDefault();
    
    const dataset = element.getAttribute("dataset");
    const fieldName = element.getAttribute("data-field-name");
    const datatype = element.getAttribute("data-field-type");

 
    const autocomplete = element.parentElement.querySelector('.autocomplete-results');
    const searchValue = element.value.trim();
   
        const url = '/getDatasetDataDistinct/'+dataset+'/'+fieldName;
        // generate filter from searchValue if fieldType is text with openedge syntax
        if (searchValue.length>3)
            {
                switch (datatype) {
                    case "character":
                        url=url+"&filter="+fieldName+" like '%"+searchValue+"%'";
                        break;
                    case "integer":
                        url=url+"&filter="+fieldName+"="+searchValue;
                        break;
                    case "date":
                        url=url+"&filter="+fieldName+"="+searchValue;
                        break;
                    case "logical":
                        url=url+"&filter="+fieldName+"="+searchValue;
                        break;
                    default:
                        url=url+"&filter="+fieldName+" like '%"+searchValue+"%'";;
                }
            }
        fetch(url)
        .then(response => response.json())
        .then(data => {
            autocomplete.innerHTML="";
            autocomplete.setAttribute("style","display:block;top:"+ 
                (parseInt( getAbsoluteOffset(element).top) + 
                 parseInt(element.offsetHeight))+
                 'px;width:'+element.offsetWidth+'px;');
                 
            data.forEach(row => {
                
                var rowDiv = document.createElement('div');
                rowDiv.className = 'autocomplete-row';
                rowDiv.setAttribute("dataset",dataset);
                rowDiv.setAttribute("data-field-name",fieldName);
                rowDiv.setAttribute("data-field-type",datatype);
                rowDiv.addEventListener("click", function(event) {
                    event.preventDefault();
                   
                    element.value=row;
                    autocomplete.style.display="none";
                  });
                
                rowDiv.innerHTML=row;
                autocomplete.appendChild(rowDiv);
              //  console.log(row);
            });
        })
        .catch(error => {
            console.error(error);
        });
}

function getAbsoluteOffset(element) {
    let top = 0, left = 0;
    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);
    return { top,left };
}
