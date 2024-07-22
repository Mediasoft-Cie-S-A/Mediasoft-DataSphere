class ERD {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ERDTables = {};
        this.ERDLinks = [];
        this.scale = 1;
        this.draggingTable = null;
        this.draggingField = null;
        this.draggingTableName = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.selectedLink = null;

        this.initEventListeners();
    }

    initEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
        this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());
        window.addEventListener('click', () => this.hideContextMenu());
        this.canvas.addEventListener('dragover', (ev) => this.onDragOver(ev));
        this.canvas.addEventListener('drop', (ev) => this.onDrop(ev));
    }

    onContextMenu(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;

        // Display the context menu
        const menu = document.getElementById('contextMenu');
        menu.style.display = 'block';
        menu.style.left = `${e.clientX + window.scrollX}px`;
        menu.style.top = `${e.clientY + window.scrollY}px`;

        // Identify if clicking on a table or link to enable/disable menu items
        const table = this.findTableAtPosition(x, y);
        const link = this.findLinkAtPosition(x, y);

        document.getElementById('add-relation').style.display = table ? 'block' : 'none';
        document.getElementById('delete-table').style.display = table ? 'block' : 'none';
        document.getElementById('delete-link').style.display = link ? 'block' : 'none';
        document.getElementById('edit-link').style.display = link ? 'block' : 'none';

        // Set actions for menu items
        document.getElementById('add-relation').onclick = () => this.addRelation(table);
        document.getElementById('delete-table').onclick = () => this.deleteTable(table);
        document.getElementById('delete-link').onclick = () => this.deleteLink(link);
        document.getElementById('edit-link').onclick = () => this.editLink(link);
    }

    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }

    onDragOver(ev) {
        ev.preventDefault(); // Allow the drop
    }

    onDrop(ev) {
        ev.preventDefault();
        const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
        console.log('Dropped data:', data);

        // Check if the dropped data is a dataset or a table
        if (data.datasetName) {
            const fields = data.fields.split(',');
            const types = data.types.split(',');
            const dataFields = fields.map((field, i) => ({ NAME: field, LABEL: field, TYPE: types[i] }));
            
            const inputTableData = {
                tableName: data.datasetName,
                tableLabel: 'Fetched Dataset',
                databaseName: data.datasetName,
                fields: dataFields
            };

            this.createTableDiagram(ev.clientX - 100, ev.clientY - 50, inputTableData); // Adjust x, y to center the table
        } else {
            this.fetchTableStructure(data.database, data.table, ev.clientX, ev.clientY);
        }
    }

    fetchTableStructure(database, table, x, y) {
        const url = `/table-structure/${database}/${table}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                this.drawTableAtPosition(database, table, data, x, y);
            })
            .catch(error => console.error('Failed to fetch table structure:', error));
    }

    drawTableAtPosition(database, table, tableData, x, y) {
        const inputTableData = {
            tableName: table,
            tableLabel: 'Fetched Table',
            databaseName: database,
            fields: tableData.map(field => ({
                NAME: field.NAME,
                LABEL: field.LABEL,
                TYPE: field.TYPE // Adjust according to actual data structure
            }))
        };
        this.createTableDiagram(x - 100, y - 50, inputTableData); // Adjust x, y to center the table
    }

    findTableAtPosition(x, y) {
        for (let tableName in this.ERDTables) {
            const table = this.ERDTables[tableName];
            if (x >= table.x && x <= table.x + table.width && y >= table.y && y <= table.y + table.height) {
                return table;
            }
        }
        return null;
    }

    findLinkAtPosition(x, y) {
        for (const link of this.ERDLinks) {
            const sourceTable = this.ERDTables[link.sourceTableName];
            const targetTable = this.ERDTables[link.targetTableName];
            const sourceX = sourceTable.x + sourceTable.width; // Start right of the source table
            const sourceY = sourceTable.y + 50 + link.sourceFieldIndex * 60 + 30; // Middle of the row height
            const targetX = targetTable.x; // Start at the left side of the target table
            const targetY = targetTable.y + 50 + link.targetFieldIndex * 60 + 30; // Middle of the row height

            const distToSource = Math.sqrt(Math.pow(sourceX - x, 2) + Math.pow(sourceY - y, 2));
            const distToTarget = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));

            if (distToSource < 10 || distToTarget < 10) {
                return link;
            }
        }
        return null;
    }

    addRelation(table) {
        this.createLinkPopup();
    }

    deleteTable(table) {
        console.log('Deleting table:', table.tableName);
        delete this.ERDTables[table.tableName];
        this.drawAll(); // Redraw canvas after deletion
    }

    deleteLink(link) {
        console.log('Deleting link:', link);
        const index = this.ERDLinks.indexOf(link);
        if (index > -1) {
            this.ERDLinks.splice(index, 1);
        }
        this.drawAll(); // Redraw canvas after deletion
    }

    editLink(link) {
        if (link) {
            this.selectedLink = link;
            this.createLinkPopup(link);
        }
    }

    setZoom(newScale) {
        this.scale = parseFloat(newScale);
        this.drawAll();
    }

    clearCanvas() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(this.scale, this.scale);
    }

    drawAll() {
        this.clearCanvas();

        for (const tableName in this.ERDTables) {
            const table = this.ERDTables[tableName];
            this.createTableDiagram(table.x, table.y, table);
        }
        this.drawLinks();
        editTableFieldList("SQL", this.ERDTables, this.ERDLinks); // Assuming editTableFieldList is defined elsewhere
    }

    createTableDiagram(x, y, { tableName, tableLabel, databaseName, fields }) {
        const padding = 10;
        const rowHeight = 60; // Updated row height, doubled from previous 30px to 60px
        const borderRadius = 5;

        // Calculate the width based on the longest field label to ensure all text fits
        const longestField = fields.reduce((max, field) => {
            const fieldName = `${field.NAME} (${field.TYPE})`;
            const fieldLabel = `${field.LABEL} `;
            const textWidth = Math.max(this.ctx.measureText(fieldLabel).width, this.ctx.measureText(fieldName).width);
            return Math.max(max, textWidth);
        }, 0);

        const tableWidth = Math.max(200, longestField + 2 * padding);
        const tableHeight = 70 + fields.length * rowHeight + 20; // Adjust the table height based on new row height

        this.ERDTables[tableName] = { x, y, width: tableWidth, height: tableHeight, tableName, tableLabel, databaseName, fields };

        // Create a linear gradient for the entire table
        const tableGradient = this.ctx.createLinearGradient(x, y, x, y + tableHeight);
        tableGradient.addColorStop(0, '#1E90FF'); // Start color (lighter blue)
        tableGradient.addColorStop(1, '#4169E1'); // End color (darker blue)

        // Add shadow for depth
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0,0,0,0.2)';

        // Rounded corners rectangle for the whole table
        this.ctx.beginPath();
        this.ctx.moveTo(x + borderRadius, y);
        this.ctx.arcTo(x + tableWidth, y, x + tableWidth, y + tableHeight, borderRadius);
        this.ctx.arcTo(x + tableWidth, y + tableHeight, x, y + tableHeight, borderRadius);
        this.ctx.arcTo(x, y + tableHeight, x, y, borderRadius);
        this.ctx.arcTo(x, y, x + tableWidth, y, borderRadius);
        this.ctx.closePath();

        this.ctx.fillStyle = tableGradient;
        this.ctx.fill();
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Reset shadow to avoid affecting other elements
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.shadowBlur = 0;

        // Drawing the table and database name on separate lines
        this.ctx.font = 'bold 15px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(tableName, x + padding, y + 25);
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`(${databaseName})`, x + padding, y + 45);

        // Drawing each field with labels on separate lines
        fields.forEach((field, index) => {
            const fieldY = y + 70 + index * rowHeight; // Adjusted Y position for header and fields
            this.ctx.fillStyle = index % 2 === 0 ? '#F8F8FF' : '#E6E6FA';
            this.ctx.fillRect(x, fieldY, tableWidth, rowHeight);

            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`${field.NAME} (${field.TYPE})`, x + padding, fieldY + 20);
            this.ctx.font = 'italic 12px Arial';
            this.ctx.fillText(`${field.LABEL}`, x + padding, fieldY + 40); // Adjusted text position for new row height
        });
    }

    createLinkPopup(link) {
        const modal = document.getElementById('linkModal');
        const closeButton = document.querySelector('.modal .close');
        const createLinkBtn = document.getElementById('createLinkBtn');
        const sourceTableSelect = document.getElementById('sourceTable');
        const sourceFieldSelect = document.getElementById('sourceField');
        const targetTableSelect = document.getElementById('targetTable');
        const targetFieldSelect = document.getElementById('targetField');

        // Clear previous options
        sourceTableSelect.innerHTML = '';
        sourceFieldSelect.innerHTML = '';
        targetTableSelect.innerHTML = '';
        targetFieldSelect.innerHTML = '';

        // Populate tables
        for (let tableName in this.ERDTables) {
            const tableOption = document.createElement('option');
            tableOption.value = tableName;
            tableOption.text = tableName;
            sourceTableSelect.appendChild(tableOption);

            const targetTableOption = document.createElement('option');
            targetTableOption.value = tableName;
            targetTableOption.text = tableName;
            targetTableSelect.appendChild(targetTableOption);
        }

        // Populate fields based on selected table
        const populateFields = (tableSelect, fieldSelect) => {
            const tableName = tableSelect.value;
            fieldSelect.innerHTML = '';
            if (tableName) {
                this.ERDTables[tableName].fields.forEach((field, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.text = `${field.NAME} (${field.TYPE})`;
                    fieldSelect.appendChild(option);
                });
            }
        };

        sourceTableSelect.onchange = () => populateFields(sourceTableSelect, sourceFieldSelect);
        targetTableSelect.onchange = () => populateFields(targetTableSelect, targetFieldSelect);

        // Initially populate fields for the first table
        if (sourceTableSelect.options.length > 0) {
            sourceTableSelect.selectedIndex = 0;
            populateFields(sourceTableSelect, sourceFieldSelect);
        }
        if (targetTableSelect.options.length > 0) {
            targetTableSelect.selectedIndex = 0;
            populateFields(targetTableSelect, targetFieldSelect);
        }

        // Pre-select fields if editing a link
        if (link) {
            sourceTableSelect.value = link.sourceTableName;
            populateFields(sourceTableSelect, sourceFieldSelect);
            sourceFieldSelect.value = link.sourceFieldIndex;

            targetTableSelect.value = link.targetTableName;
            populateFields(targetTableSelect, targetFieldSelect);
            targetFieldSelect.value = link.targetFieldIndex;

            document.getElementById('joinType').value = link.joinType;
        }

        // Show the modal
        modal.style.display = 'block';

        // When the user clicks on <span> (x), close the modal
        closeButton.onclick = function() {
            modal.style.display = 'none';
        };

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        // Handle link creation
        createLinkBtn.onclick = () => {
            const sourceTableName = sourceTableSelect.value;
            const sourceFieldIndex = parseInt(sourceFieldSelect.value, 10);
            const targetTableName = targetTableSelect.value;
            const targetFieldIndex = parseInt(targetFieldSelect.value, 10);
            const joinType = document.getElementById('joinType').value;

            // Create or update the link with selected fields and join type
            if (this.selectedLink) {
                this.selectedLink.sourceTableName = sourceTableName;
                this.selectedLink.sourceFieldIndex = sourceFieldIndex;
                this.selectedLink.targetTableName = targetTableName;
                this.selectedLink.targetFieldIndex = targetFieldIndex;
                this.selectedLink.joinType = joinType;
                this.selectedLink = null;
            } else {
                this.createZLink(sourceTableName, sourceFieldIndex, targetTableName, targetFieldIndex, joinType);
            }

            // Close the modal
            modal.style.display = 'none';
        };
    }

    createZLink(sourceTableName, sourceFieldIndex, targetTableName, targetFieldIndex, joinType) {
        const sourceFieldName = this.ERDTables[sourceTableName].fields[sourceFieldIndex].NAME;
        const targetFieldName = this.ERDTables[targetTableName].fields[targetFieldIndex].NAME;
        
        this.ERDLinks.push({
            sourceTableName,
            sourceFieldIndex,
            sourceFieldName,
            targetTableName,
            targetFieldIndex,
            targetFieldName,
            joinType
        });
        this.drawAll();
    }
    drawLinks() {
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'rgba(50, 50, 150, 0.5)'; // Soft blue shadow for a glowing effect

        this.ERDLinks.forEach(link => {
           
            const sourceTable = this.ERDTables[link.sourceTableName];
            const targetTable = this.ERDTables[link.targetTableName];
            const sourceField = sourceTable.fields[link.sourceFieldIndex];
            const targetField = targetTable.fields[link.targetFieldIndex];

            const sourceX = sourceTable.x + sourceTable.width; // Start right of the source table
            const sourceY = sourceTable.y + 50 + link.sourceFieldIndex * 60 + 30; // Middle of the row height
            const targetX = targetTable.x; // Start at the left side of the target table
            const targetY = targetTable.y + 50 + link.targetFieldIndex * 60 + 30; // Middle of the row height

            const midX = (sourceX + targetX) / 2; // Midpoint for Z-shape

            // Draw the Z-shaped line
            this.ctx.beginPath();
            this.ctx.moveTo(sourceX, sourceY);
            this.ctx.lineTo(midX, sourceY); // Horizontal from source to mid
            this.ctx.lineTo(midX, targetY); // Vertical line down/up to target Y
            this.ctx.lineTo(targetX, targetY); // Horizontal to target

            this.ctx.strokeStyle = '#4169E1'; // Royal blue for link lines
            this.ctx.lineWidth = 4; // Thicker line for better visibility
            this.ctx.stroke();

            // Draw balls at junctions
            this.ctx.fillStyle = 'yellow'; // Bright color for visibility
            this.ctx.beginPath();
            this.ctx.arc(midX, sourceY, 5, 0, 2 * Math.PI); // Ball at the horizontal junction
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(midX, targetY, 5, 0, 2 * Math.PI); // Ball at the vertical junction
            this.ctx.fill();

            // Text for field names at the ends
            this.ctx.fillStyle = 'black';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(sourceField.NAME, sourceX + 5, sourceY + 5); // Source field label
            this.ctx.fillText(targetField.NAME, targetX - this.ctx.measureText(targetField.NAME).width - 5, targetY + 5); // Target field label
        });

        // Reset shadow to avoid affecting other elements
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.shadowBlur = 0;
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / this.scale;
        this.mouseY = (e.clientY - rect.top) / this.scale;

        for (const tableName in this.ERDTables) {
            const table = this.ERDTables[tableName];
            if (this.mouseY > table.y && this.mouseY < table.y + 50) { // Checking header area for table dragging
                if (this.mouseX > table.x && this.mouseX < table.x + table.width) {
                    this.draggingTable = tableName;
                    this.dragOffsetX = this.mouseX - table.x;
                    this.dragOffsetY = this.mouseY - table.y;
                    return;
                }
            }

            const fieldIndex = this.getFieldIndex(this.mouseX, this.mouseY, table);
            if (fieldIndex !== -1) {
                this.draggingField = fieldIndex;
                this.draggingTableName = tableName;
                return;
            }
        }
    }

    onMouseUp(e) {
        if (this.draggingField !== null) {
            for (const tableName in this.ERDTables) {
                const table = this.ERDTables[tableName];
                const fieldIndex = this.getFieldIndex(this.mouseX, this.mouseY, table);
                if (fieldIndex !== -1 && tableName !== this.draggingTableName) {
                    this.createLinkPopup();
                    break; // Ensure only one link popup is created at a time
                }
            }
        }
        this.draggingField = null;
        this.draggingTableName = null;
        this.draggingTable = null;
        this.drawAll();
    }

    getFieldIndex(mouseX, mouseY, table) {
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

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / this.scale;
        this.mouseY = (e.clientY - rect.top) / this.scale;

        if (this.draggingTable) {
            const table = this.ERDTables[this.draggingTable];
            table.x = this.mouseX - this.dragOffsetX;
            table.y = this.mouseY - this.dragOffsetY;
            this.drawAll();
        } else if (this.draggingField !== null) {
            this.drawAll();
            this.drawDragLink();
        }
    }

    drawDragLink() {
        if (!this.draggingTableName) return;

        const table = this.ERDTables[this.draggingTableName];
        const sourceX = table.x + table.width;
        const sourceY = table.y + 50 + this.draggingField * 60 + 30;

        this.ctx.beginPath();
        this.ctx.moveTo(sourceX, sourceY);
        this.ctx.lineTo(this.mouseX, this.mouseY);
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    onMouseLeave() {
        this.draggingTable = null;
        this.draggingField = null;
        this.draggingTableName = null;
    }
}

// Example usage
const erd1 = new ERD('queryCanvas');
const erd2 = new ERD('schemacanvas');
