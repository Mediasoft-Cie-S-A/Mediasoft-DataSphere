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


function loadForms(){
    addLog('Loading forms...');
    fetch('/list-forms')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(forms => {
            const list = document.getElementById('formsList');
            list.innerHTML = ''; // Clear the list
            const container = document.createElement('div');
            list.appendChild(container);
            container.className = 'portal-container';
            // generate the list of path
            var pathList = forms.map(form => form.formPath);
            // remove duplicates
                pathList = pathList.filter((value, index, self) => self.indexOf(value) === index);
                // create the div container for each path with the id
                pathList.forEach(path => {
                    const pathContainer = document.createElement('div');
                    pathContainer.className = 'portal-path-container';
                    pathContainer.innerHTML = `<span style="float:left;position:absolute;margin-top:-10px"><b>${path}</b></span>`;
                    pathContainer.setAttribute('data-path', path); // Set the path as a data attribute
                    pathContainer.id = path;
                    container.appendChild(pathContainer);
                    // create the div container for each form with the id
                });

                forms.forEach(form => {
                    const listItem = document.createElement('div');                
                    listItem.innerHTML = `<b>${form.formName}</b>`; // Adjust according to your form object structure
                    listItem.className = 'portal-list-item';                
                    listItem.setAttribute('data-form-id', form.formId); // Set the form ID as a data attribute
                    listItem.setAttribute('title', `double click to view form`);
                    // Create delete button
                    const deleteButton = document.createElement('button');
                    deleteButton.innerHTML='<i class="fa fa-trash" style="margin-left:-5px"></i>'
                    deleteButton.className = 'portal-delete-button';        
                    deleteButton.onclick = function() {
                        deleteForm(form.formId, listItem);
                    };

                    // create edit button
                    const editButton = document.createElement('button');
                    editButton.innerHTML='<i class="fa fa-edit" style="margin-left:-5px"></i>'
                    editButton.className = 'portal-edit-button';
                    editButton.onclick = function(event) {
                        event.preventDefault();
                        loadFormData(form.formId,document.getElementById('formContainer'));
                        const editTab = document.querySelector('.menu a[href="#Dashboard"]');
                        if (editTab) {
                            editTab.click(); // Simulate click
                        }
                    
                    };
                    // create show button
                    const showButton = document.createElement('button');
                    showButton.innerHTML='<i class="fa fa-eye" style="margin-left:-5px"></i>'
                    showButton.className = 'portal-show-button';
                    showButton.onclick = function(event) {
                        event.preventDefault();
                        loadFormData(form.formId);
                        const showTab = document.querySelector('.menu a[href="#renderForm"]');
                        if (showTab) {
                            showTab.click(); // Simulate click
                        }
                    
                    };

                //append the delete button to the list item
                listItem.appendChild(deleteButton);
                listItem.appendChild(showButton);                
                listItem.appendChild(editButton);
                listItem.addEventListener('dblclick', function(event) {
                    event.preventDefault();
                    loadFormData(form.formId);
                    const showTab = document.querySelector('.menu a[href="#renderForm"]');
                    if (showTab) {
                        showTab.click(); // Simulate click
                    }
                });
                listItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    // check if the event is a click on the delete,show or edit button
                    if (e.target.className === 'portal-list-item'){
                    showHint(`ID:${form.formId}<br>User:${form.userCreated}<br>Last mod:${form.modificationDate}`, 5000, event);
                    }
                });

                // get the path container
                const pathContainer = document.getElementById(form.formPath);
                pathContainer.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function deleteForm(formId, listItem) {
    fetch(`/delete-form/${formId}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            addLog(data.message);
            listItem.remove(); // Remove the list item from the DOM
        })
        .catch(error => {
            console.error('There was a problem with the delete operation:', error);
        });
}



function loadFormData(formId,renderContainer=document.getElementById('renderForm'))
 {
    addLog('Loading form data...');
    // clear the form
    document.getElementById('renderForm').innerHTML = '';
   
    fetch(`/get-form/${formId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(form => {
            // set the header
            var formId = document.getElementById('formId');
            var formName = document.getElementById('formName');
            var formPath = document.getElementById('formPath');
            var userCreated = document.getElementById('userCreated');
            var userModified = document.getElementById('userModified');
            // Handle the form data here
            addLog('Form Data:', form);
            // For example, display the form data in an alert or populate a form for editing
            formId.value=form.formId;
            addLog(formId);
            formName.value=form.formName;
            formPath.value=form.formPath;
            userCreated.value=form.userCreated;
            
            
            clearCharts();
            renderContainer.innerHTML = '';

            // Convert JSON back to DOM and append
            var domContent = jsonToDom(form.formData,renderContainer);
        
             // search all the chart elements with property chartnumber
            var charts = document.querySelectorAll('[chartnumber]');
            // loop through the charts
            charts.forEach(chart => {
                // get the chart number
                var chartNumber = chart.getAttribute('chartnumber');
                // get the chart type
                var chartType = chart.getAttribute('tagname');
                // get the chart data
                                // generate the chart
                generateChart(chartNumber,chartType,chart);
            });
             
            // get all the div the the tagname=python
            var pythons = document.querySelectorAll('[tagname="python"]');
            // loop through the pythons
            pythons.forEach(python => {
               // render the python
               addLog(python);
               renderPython(python);
            }  );
            addLog(domContent);
           
        })
        .catch(error => {
            showToast('Error!'+error, 5000); // Show toast for 5 seconds
            console.error('There was a problem with the fetch operation:', error);
        });
}

// function to generate the the chart
function generateChart(chartNumber,type,element)
{

  // get the canvas element
    var canvas = element.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    switch (type) {
        case 'LineChart':
            typeChart='line';
            break;
        case 'BarChart':
            typeChart='bar';
            break;
        case 'PieChart':
            typeChart='pie';
            break;
        case 'scatterChart':
            typeChart='scatter';
            break;
        case 'radarChart':
            typeChart='radar';
            break;
        case 'doughnutChart':
            typeChart='doughnut';
            break;
        case 'polarAreaChart':
            typeChart='polarArea';
            break;

    }

    chartList[chartNumber] = new Chart(ctx, {
        type: typeChart,
        data: {
            labels: [],
            datasets: []
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    renderData(element);
}
