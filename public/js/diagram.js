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
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let ERDTables = {};
let ERDLinks = [];
let scale = 1;
let draggingTable = null;
let draggingField = null;
let draggingTableName = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('contextmenu', onRightClick);
canvas.addEventListener('mouseleave', onMouseLeave);

canvas.addEventListener('contextmenu', function(e) {
    e.preventDefault();  // Prevent the default context menu

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Display the context menu
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    // Optional: Identify if clicking on a table or link to enable/disable menu items
    const table = findTableAtPosition(x, y);
    const link = findLinkAtPosition(x, y);

    document.getElementById('add-relation').style.display = table ? 'block' : 'none';
    document.getElementById('delete-table').style.display = table ? 'block' : 'none';
    document.getElementById('delete-link').style.display = link ? 'block' : 'none';

    // Set actions for menu items
    document.getElementById('add-relation').onclick = function() { addRelation(table); };
    document.getElementById('delete-table').onclick = function() { deleteTable(table); };
    document.getElementById('delete-link').onclick = function() { deleteLink(link); };
});

// Hide context menu on click anywhere on the page
window.addEventListener('click', function() {
    document.getElementById('contextMenu').style.display = 'none';
});

canvas.addEventListener('dragover', function(ev) {
    ev.preventDefault();  // Allow the drop
});

canvas.addEventListener('drop', function(ev) {
    ev.preventDefault();
    console.log('Dropped:', ev.dataTransfer.getData("text/plain"));
    const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
    fetchTableStructure(data.database, data.table, ev.clientX, ev.clientY);
});

function fetchTableStructure(database, table, x, y) {
    const url = `/table-structure/${database}/${table}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            drawTableAtPosition( database,table, data, x, y);
        })
        .catch(error => console.error('Failed to fetch table structure:', error));
}

function drawTableAtPosition(database,table,tableData, x, y) {
    // Assume tableData contains fields and other necessary info
    // Convert fetched data to suit the createTableDiagram parameters if needed
    const inputTableData = {
        tableName: table,
        tableLabel: 'Fetched Table',
        databaseName: database,
        fields: tableData.map(field => ({
            NAME: field.NAME,
            LABEL: field.LABEL,
            TYPE: field.TYPE  // Adjust according to actual data structure
        }))
    };
    console.log('Fetched table data:', inputTableData);
    createTableDiagram(x - 100, y - 50, inputTableData);  // Adjust x, y to center the table
}

function findTableAtPosition(x, y) {
    // Iterate throughERDTables to find one at the given position
    for (let tableName in ERDTable) {
        const table = ERDTable[tableName];
        if (x >= table.x && x <= table.x + table.width && y >= table.y && y <= table.y + table.height) {
            return table;
        }
    }
    return null;
}

function findLinkAtPosition(x, y) {
    // Placeholder for actual link position checking logic
    return null;  // Implement based on how you store and manage ERDLinks
}

function addRelation(table) {
    console.log('Adding relation to:', table.tableName);
    // Implement relation adding logic
}

function deleteTable(table) {
    console.log('Deleting table:', table.tableName);
    delete ERDTable[table.tableName];
    drawAll();  // Redraw canvas after deletion
}

function deleteLink(link) {
    console.log('Deleting link:', link);
    const index = ERDLinks.indexOf(link);
    if (index > -1) {
        ERDLinks.splice(index, 1);
    }
    drawAll();  // Redraw canvas after deletion
}


function setZoom(newScale) {
    scale = parseFloat(newScale);
    drawAll();
}

function clearCanvas() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
}

function drawAll() {
    clearCanvas();
    
    for (const tableName in ERDTables) {
        const table = ERDTables[tableName];
        createTableDiagram(table.x, table.y, table);
    }
    drawLinks();
    editTableFieldList("SQL",ERDTables,ERDLinks);
}



function createTableDiagram(x, y, { tableName, tableLabel, databaseName, fields }) {
    const padding = 10;
    const rowHeight = 60;  // Updated row height, doubled from previous 30px to 60px
    const borderRadius = 5;

    // Calculate the width based on the longest field label to ensure all text fits
    const longestField = fields.reduce((max, field) => {
        const fieldName = `${field.NAME} (${field.TYPE})`;
        const fieldLabel = `${field.LABEL} `;
        const textWidth = Math.max(ctx.measureText(fieldLabel).width,ctx.measureText(fieldName).width);
        return Math.max(max, textWidth);
    }, 0);

    const tableWidth = Math.max(200, longestField + 2 * padding);
    const tableHeight = 70 + fields.length * rowHeight + 20;  // Adjust the table height based on new row height

    ERDTables[tableName] = { x, y, width: tableWidth, height: tableHeight, tableName, tableLabel, databaseName, fields };

    // Create a linear gradient for the entire table
    const tableGradient = ctx.createLinearGradient(x, y, x, y + tableHeight);
    tableGradient.addColorStop(0, '#1E90FF');  // Start color (lighter blue)
    tableGradient.addColorStop(1, '#4169E1');  // End color (darker blue)

    // Add shadow for depth
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';

    // Rounded corners rectangle for the whole table
    ctx.beginPath();
    ctx.moveTo(x + borderRadius, y);
    ctx.arcTo(x + tableWidth, y, x + tableWidth, y + tableHeight, borderRadius);
    ctx.arcTo(x + tableWidth, y + tableHeight, x, y + tableHeight, borderRadius);
    ctx.arcTo(x, y + tableHeight, x, y, borderRadius);
    ctx.arcTo(x, y, x + tableWidth, y, borderRadius);
    ctx.closePath();

    ctx.fillStyle = tableGradient;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Reset shadow to avoid affecting other elements
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;

    // Drawing the table and database name on separate lines
    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(tableName, x + padding, y + 25);
    ctx.font = '12px Arial';
    ctx.fillText(`(${databaseName})`, x + padding, y + 45);

    // Drawing each field with labels on separate lines
    fields.forEach((field, index) => {
        const fieldY = y + 70 + index * rowHeight; // Adjusted Y position for header and fields
        ctx.fillStyle = index % 2 === 0 ? '#F8F8FF' : '#E6E6FA';
        ctx.fillRect(x, fieldY, tableWidth, rowHeight);

        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(field.NAME +" (" + field.TYPE+")", x + padding, fieldY + 20);
        ctx.font = 'italic 12px Arial';
        ctx.fillText(`${field.LABEL}`, x + padding, fieldY + 40);  // Adjusted text position for new row height
    });
}




function createZLink(sourceTableName, sourceFieldIndex, targetTableName, targetFieldIndex) {
    ERDLinks.push({
        sourceTableName,
        targetTableName,
        sourceFieldIndex,
        targetFieldIndex
    });
    drawAll();
}

function drawLinks() {
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(50, 50, 150, 0.5)';  // Soft blue shadow for a glowing effect

    ERDLinks.forEach(link => {
        const sourceTable = ERDTables[link.sourceTableName];
        const targetTable = ERDTables[link.targetTableName];
        const sourceField = sourceTable.fields[link.sourceFieldIndex];
        const targetField = targetTable.fields[link.targetFieldIndex];

        const sourceX = sourceTable.x + sourceTable.width;  // Start right of the source table
        const sourceY = sourceTable.y + 50 + link.sourceFieldIndex * 60 + 30;  // Middle of the row height
        const targetX = targetTable.x;  // Start at the left side of the target table
        const targetY = targetTable.y + 50 + link.targetFieldIndex * 60 + 30;  // Middle of the row height

        const midX = (sourceX + targetX) / 2;  // Midpoint for Z-shape

        // Draw the Z-shaped line
        ctx.beginPath();
        ctx.moveTo(sourceX, sourceY);
        ctx.lineTo(midX, sourceY);  // Horizontal from source to mid
        ctx.lineTo(midX, targetY);  // Vertical line down/up to target Y
        ctx.lineTo(targetX, targetY);  // Horizontal to target

        ctx.strokeStyle = '#4169E1';  // Royal blue for link lines
        ctx.lineWidth = 4;  // Thicker line for better visibility
        ctx.stroke();

        // Draw balls at junctions
        ctx.fillStyle = 'yellow';  // Bright color for visibility
        ctx.beginPath();
        ctx.arc(midX, sourceY, 5, 0, 2 * Math.PI);  // Ball at the horizontal junction
        ctx.fill();

        ctx.beginPath();
        ctx.arc(midX, targetY, 5, 0, 2 * Math.PI);  // Ball at the vertical junction
        ctx.fill();

        // Text for field names at the ends
        ctx.fillStyle = 'black';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(sourceField.fieldLabel, sourceX + 5, sourceY + 5);  // Source field label
        ctx.fillText(targetField.fieldLabel, targetX - ctx.measureText(targetField.fieldLabel).width - 5, targetY + 5);  // Target field label
    });

    // Reset shadow to avoid affecting other elements
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
}



function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / scale;
    mouseY = (e.clientY - rect.top) / scale;

    for (const tableName in ERDTables) {
        const table = ERDTables[tableName];
        if (mouseY > table.y && mouseY < table.y + 50) { // Checking header area for table dragging
            if (mouseX > table.x && mouseX < table.x + table.width) {
                draggingTable = tableName;
                dragOffsetX = mouseX - table.x;
                dragOffsetY = mouseY - table.y;
                return;
            }
        }

        const fieldIndex = getFieldIndex(mouseX, mouseY, table);
        if (fieldIndex !== -1) {
            draggingField = fieldIndex;
            draggingTableName = tableName;
            return;
        }
    }
}

function onMouseUp(e) {
    if (draggingField !== null) {
        for (const tableName in ERDTables) {
            const table = ERDTables[tableName];
            const fieldIndex = getFieldIndex(mouseX, mouseY, table);
            if (fieldIndex !== -1 && tableName !== draggingTableName) {
                createZLink(draggingTableName, draggingField, tableName, fieldIndex);
            }
        }
    }
    draggingField = null;
    draggingTableName = null;
    draggingTable = null;
    drawAll();
}


function getFieldIndex(mouseX, mouseY, table) {
    if (mouseX > table.x && mouseX < table.x + table.width) {
        const relativeY = mouseY - (table.y + 50); // Offset from the table header
        if (relativeY > 0) {
            const fieldIndex = Math.floor(relativeY / 60); // Updated to 60 from 30
            if (fieldIndex < table.fields.length) {
                return fieldIndex;
            }
        }
    }
    return -1;
}


function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / scale;
    mouseY = (e.clientY - rect.top) / scale;

    if (draggingTable) {
        const table = ERDTables[draggingTable];
        table.x = mouseX - dragOffsetX;
        table.y = mouseY - dragOffsetY;
        drawAll();
    } else if (draggingField !== null) {
        drawAll();
        drawDragLink();
    }
}

function drawDragLink() {
    if (!draggingTableName) return;

    const table = ERDTables[draggingTableName];
    const sourceX = table.x + table.width;
    const sourceY = table.y + 50 + draggingField * 30 + 15;

    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(mouseX, mouseY);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
}



function onRightClick(e) {
    e.preventDefault();
    const clickX = (e.clientX - canvas.getBoundingClientRect().left) / scale;
    const clickY = (e.clientY - canvas.getBoundingClientRect().top) / scale;

    ERDLinks = ERDLinks.filter(link => {
        const sourceTable = ERDTables[link.sourceTableName];
        const targetTable = ERDTables[link.targetTableName];

        const sourceX = sourceTable.x + sourceTable.width;
        const sourceY = sourceTable.y + 50 + link.sourceFieldIndex * 30 + 15;
        const targetX = targetTable.x;
        const targetY = targetTable.y + 50 + link.targetFieldIndex * 30 + 15;

        const distToSource = Math.sqrt(Math.pow(sourceX - clickX, 2) + Math.pow(sourceY - clickY, 2));
        const distToTarget = Math.sqrt(Math.pow(targetX - clickX, 2) + Math.pow(targetY - clickY, 2));

        // Check if the click is near either endpoint of the link
        return distToSource > 10 && distToTarget > 10;
    });

    drawAll();
}

function onMouseLeave() {
    draggingTable = null;
    draggingField = null;
    draggingTableName = null;
   // drawAll();
}


// Example of adding ERDTables and ERDLinks
/*createTableDiagram(50, 100, {
    tableName: "users",
    tableLabel: "Users Table",
    databaseName: "UserDB",
    fields: [
        { NAME: 'userid', LABEL: 'Identifier', TYPE: 'INTEGER', fieldLabel: "User ID" },
        { NAME: 'name', LABEL: 'Full Name', TYPE: 'VARCHAR', fieldLabel: "Username" },
        { NAME: 'created_at', LABEL: 'Creation Date', TYPE: 'DATE', fieldLabel: "Creation Timestamp" }
    ]
});
createTableDiagram(450, 100,  {
    tableName: "orders",
    tableLabel: "orders Table",
    databaseName: "UserDB",
    fields: [
        { NAME: 'orderid', LABEL: 'Identifier', TYPE: 'INTEGER', fieldLabel: "Order ID" },
        { NAME: 'number', LABEL: 'Full Name', TYPE: 'VARCHAR', fieldLabel: "number" },
        { NAME: 'created_at', LABEL: 'Creation Date', TYPE: 'DATE', fieldLabel: "Creation Timestamp" }
    ]
});
createZLink("users", 0, "orders", 1);
*/