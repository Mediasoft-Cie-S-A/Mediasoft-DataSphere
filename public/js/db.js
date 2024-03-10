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



const header=['NAME','TYPE','LABEL' ,'FORMAT','MANDATORY', 'DECIMAL', 'WIDTH', 'DEFAULT'];

var tableList=[];
// The 'DOMContentLoaded' event fires when the initial HTML document has been completely loaded and parsed,
// without waiting for stylesheets, images, and subframes to finish loading.
// The function passed as the second argument will be executed once the 'DOMContentLoaded' event is fired.



function fetchTablesList(list) {
    fetch('/tables-list')
        .then(response => response.json())
        .then(tables => {
            console.log(tables);
            list.innerHTML = '';
             // add new table button
             tableList=[];
            tables.forEach(table => {
                const listItem = document.createElement('div');
                listItem.classList.add('table-item');
                listItem.innerHTML = '<i class="fas fa-table"></i>'+table.NAME;
                listItem.setAttribute('data-table-name', table.NAME);
                listItem.setAttribute('data-table-label', table.LABEL);
                listItem.setAttribute("draggable","true");
                listItem.setAttribute("ondragstart","drag(event)");
                listItem.classList.add('draggable');
                listItem.id=table.NAME;
                // show hint on hover
                listItem.setAttribute('title', table.LABEL);
                list.appendChild(listItem);
                tableList.push(table.NAME);
            });
        })
        .catch(error => console.error('Error:', error));
}








// table structure
function fetchTableDetails(tableName,element) {
   
    Promise.all([
        fetch(`/table-fields/${tableName}`).then(response => response.json())        
    ])
    .then(([fields]) => {      
      // check if the the element has children
        if (element.children.length>0)
        { 
            removeAllChildNodes(element);
        }       
       else
       {
            fields.forEach(field => {
                // Sample configuration array
                                    
                const label = document.createElement('label');
                label.innerHTML ='<i class="fas fa-columns"></i>'+ field.NAME;
                label.id=tableName+"."+field.NAME;
                label.setAttribute("draggable","true");
                label.setAttribute("ondragstart","drag(event)");
                label.classList.add('draggable');
                element.appendChild(label);
            
              });
      }
         
    })
    .catch(error => console.error('Error:', error));
}

// if the select value is "select" activate tablename select and fieldName otherwise desactivated them
function activateSelect(fieldName)
{
    var table= document.getElementById('TableFieldsList');
    var select= document.querySelector('tr[data-field-name="'+fieldName+'"] select[name="inputType"]');
    var tableNameSelect= document.querySelector('tr[data-field-name="'+fieldName+'"] select[name="tableName"]');
    var fieldNameSelect= document.querySelector('tr[data-field-name="'+fieldName+'"] select[name="fieldName"]');
    var type=select.options[select.selectedIndex].value;
    if (type==="select")
    {
        tableNameSelect.setAttribute("disabled",false);
        fieldNameSelect.setAttribute("disabled",false);
    }
    else
    {
        tableNameSelect.setAttribute("disabled",true);
        fieldNameSelect.setAttribute("disabled",true);
    }
}


// loadFieldsList function check the table name and load the fields in the select
function loadFieldsList(fieldName)
{
   var table= document.getElementById('TableFieldsList');
   var tableNameSelect= document.querySelector('tr[data-field-name="'+fieldName+'"] select[name="tableName"]');
   console.log('tableNameSelect:', tableNameSelect);
   var tableName=tableNameSelect.options[tableNameSelect.selectedIndex].value;
    var select = document.querySelector('tr[data-field-name="'+fieldName+'"] select[name="fieldName"]');
    select.innerHTML = '';
    if (table) {
        fetch(`/table-fields/${tableName}`)
            .then(response => response.json())
            .then(fields => {
                fields.forEach(field => {
                    const option = document.createElement('option');
                    option.value = field.NAME;
                    option.text = field.NAME;
                    select.appendChild(option);
                });
            })
            .catch(error => console.error('Error:', error));
    }
}



function getColumnData(type,newColumn) {
   var columnData='';
    switch (type) {
        case 'DECIMAL':
        case 'NUMERIC':
            columnData = `${newColumn.TYPE}(${newColumn.WIDTH}, ${newColumn.DECIMAL})`;
            break;
        case 'CHAR':
        case 'VARCHAR':
            columnData = `${newColumn.TYPE}(${newColumn.WIDTH})`;
            break;
        case 'INTEGER':
        case 'TIME':
        case 'TIMESTAMP':
        case 'DOUBLE':
        case 'FLOAT':
        case 'REAL':
        case 'SMALLINT':
        case 'BIGINT':
        case 'BIT':                
        case 'DATE':
            columnData = newColumn.TYPE;
            break;
        // Add more cases as needed
        default:
            throw new Error(`Unsupported type: ${newColumn.TYPE}`);
    }
    if (columnData.MANDATORY === '1') {
        columnData += ' NOT NULL';
    }   
    if (columnData.DEFAULT) {
        columnData += ` DEFAULT ${columnData.DEFAULT}`;
    }
    return columnData;
}


