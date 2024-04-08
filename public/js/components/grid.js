// Example usage
var dataset = 
     [
        ['Alice', 30, 'Developer'],
        ['Bob', 25, 'Designer'],
        ['Charlie', 35, 'Manager']
    ];


var labels = ['Name', 'Age', 'Job'];



function createElementGrid(type) {
    // Create the main div
    console.log("createElementChart");
    var main= document.createElement('div');
    main.className = 'form-container';
    main.id=type+ Date.now(); // Unique ID for each new element
    main.draggable = true;
    main.tagName=type;
   render(dataset, labels, main,10);
  return main;
}


function editElementGrid(type,element,content)
{
    const button = document.createElement('button');
    button.textContent = 'update';
    button.onclick = function() {
        const propertiesBar = document.getElementById('propertiesBar');
                  const gridID=propertiesBar.querySelector('label').textContent;
                 
                  const main = document.getElementById(gridID);  
        updateGridData(main);
    };
    content.appendChild(button);
    content.appendChild(createMultiSelectItem("Data", "data", "data",element.getAttribute('data'),"text",true));
    filter= createFilterBox(content);
    content.appendChild(filter);
       // Initialize with the standard view
       switchView(event,content,'standard');
       regenerateFilters(content,JSON.parse(element.getAttribute("filter")));

}

function render(dataset, labels, container,rowsPerPage=10) {
    console.log(dataset);
    if (!container) {
        console.error('Container not found');
        return;
    }
    if (dataset.length === 0) {
        console.error('No data provided');
        return;
    }
    console.log("render");
    let currentPage = 1;
    const totalPages = Math.ceil(dataset[0].length / rowsPerPage);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.setAttribute('border', '1');

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    labels.forEach(label => {
        const th = document.createElement('th');
        th.textContent = label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body rows
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Pagination controls
    const paginationDiv = document.createElement('div');
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.style.margin = '3px';
        pageButton.style.direction = 'rtl';
        pageButton.style.display = 'inline-block';
        pageButton.textContent = i;
        pageButton.onclick = () => changePage(i);
        paginationDiv.appendChild(pageButton);
    }

    container.innerHTML = '';
    container.appendChild(table);
    container.appendChild(paginationDiv);

    function changePage(page) {
        currentPage = page;
        const start = (currentPage - 1) * rowsPerPage;
        var end =  start + rowsPerPage;
        if (end > dataset[0].length) {
            end = dataset[0].length;
        }
       // const paginatedItems = dataset.data[0].slice(start, end);
        
        tbody.innerHTML = '';
        
       for(var i=start;i<end;i++)
       {
        const row = document.createElement('tr');
        for(var j=0;j<dataset.length;j++)
        {
            const cell = document.createElement('td');
            cell.textContent = dataset[j][i];
            row.appendChild(cell);
        }
        tbody.appendChild(row);
       }
    }

    // Initialize the first page
    changePage(1);
}

function getGrid(){
    const propertiesBar = document.getElementById('propertiesBar');
                  const gridID=propertiesBar.querySelector('label').textContent;
                 
                  const element = document.getElementById(gridID);
                  const gridNumber=element.getAttribute('gridNumber');
                  
                  var chart=chartList[ gridNumber];
                  return chart;
}


function updateGridData(main) {
   
    const chart=getChart();

    // get propertiesBar
     const propertiesBar = document.getElementById('propertiesBar');
     // get value of x-axis
     var dataInput=propertiesBar.querySelector('#Data');
  
     var gridDatasets=[];
     var labels=[];
     query = dataInput.getAttribute("dataSet");
     console.log("query:"+query);
     var url = '/query/'+query;
     console.log('url:', url);
     fetch(url)
     .then(response => response.json())
     .then(data => {
             // get the labels
               
                 
                 // get from legend the value of the function
               
                
                 // get the function name
                 var dataSelect=dataInput.querySelectorAll('div');
                 var i=0;    
                 dataSelect.forEach(item => {
               
                     var functionName=item.querySelector('select')[item.querySelector('select').selectedIndex].value;
                     console.log("functionName:"+functionName);
 
                     var fieldName=item.querySelector('span').getAttribute('data-field-name');
                     console.log("fieldName:"+fieldName);
                     // get the data
                     
                     // if function is value
                     
                         
 
                     columnData=getDataByFunction(data,fieldName,functionName,fieldName);
                    // clear the chart datasets
                      console.log("data"+columnData);
                      
               
                      
                         labels.push(fieldName);
                      
                         
                         gridDatasets.push(columnData);
                     i++;
                 });
                
                 render(gridDatasets, labels, main,10);
                
 
     });              
     
    

}

