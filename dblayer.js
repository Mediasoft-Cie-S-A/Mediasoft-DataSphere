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

const OdbcDatabase = require('./OdbcDatabase'); 
const he = require('he');

module.exports = function(app,session, passport) {
    const checkAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) { return next(); }
        res.redirect("/login");
    };

    const dsn = 'DSN=Sports2000;UID=sysprogress;PWD=sysprogress'; 
    // Replace with your actual connection string
const db = new OdbcDatabase(dsn);

/**
 * @swagger
 * /table-structure/{tableName}:
 *   get:
 *     summary: Get table structure
 *     description: Retrieve the structure of a specified table.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table to retrieve structure.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table structure retrieved successfully.
 *       500:
 *         description: Internal Server Error
 */

app.get('/table-structure/:tableName',checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
        const structure = await db.getTableStructure(tableName);
        res.json(structure);
    } catch (err) {
        console.log('Error:', err);
        res.status(500).send('Internal Server Error');
    } finally {
        await db.close();
    }
});

/**
 * @swagger
 * /tables-list:
 *   get:
 *     summary: Get list of tables
 *     description: Retrieve a list of all tables.
 *     responses:
 *       200:
 *         description: List of tables retrieved successfully.
 *       500:
 *         description: Error retrieving tables list
 */
    
app.get('/tables-list', checkAuthenticated, async (req, res) => {
    try {
        console.log("tablesList");
        await db.connect();
        const tablesList = await db.getTablesList();
        res.json(tablesList);
    } catch (err) {
        console.log('Error:', err);
        res.status(500).send('Error retrieving tables list');
    } finally {
        await db.close();
    }
});

/**
 * @swagger
 * /table-fields/{tableName}:
 *   get:
 *     summary: Get fields of a table
 *     description: Retrieve the fields of a specified table.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table to retrieve fields.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table fields retrieved successfully.
 *       500:
 *         description: Error retrieving fields for table
 */

    
app.get('/table-fields/:tableName',checkAuthenticated, async (req, res) => {
    try {
        console.log("table-fields");
        await db.connect();
        const tableName = req.params.tableName;
        const fields = await db.getTableFields(tableName);
        res.json(fields);
    } catch (err) {
        res.status(500).send(`Error retrieving fields for table ${tableName}`);
    } finally {
        await db.close();
    }
});

 /**
 * @swagger
 * /table-indexes/{tableName}:
 *   get:
 *     summary: Get indexes of a table
 *     description: Retrieve the indexes of a specified table.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table to retrieve indexes.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table indexes retrieved successfully.
 *       500:
 *         description: Error retrieving indexes for table
 */


app.get('/table-indexes/:tableName',checkAuthenticated, async (req, res) => {
    try {
        console.log("table-indexes");
        await db.connect();
        const tableName = req.params.tableName;
        const indexes = await db.getTableIndexes(tableName);
        res.json(indexes);
    } catch (err) {
        res.status(500).send(`Error retrieving indexes for table ${tableName}`);
    } finally {
        await db.close();
    }
});

/**
 * @swagger
 * /move-to-first/{tableName}:
 *   get:
 *     summary: Move to the first record of a table
 *     description: Retrieve the first record of a specified table.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: First record retrieved successfully.
 *       500:
 *         description: Error moving to first record
 */

 app.get('/move-to-first/:tableName', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
         // Get the fields from the query string. It's a comma-separated string.
         const fields = req.query.fields ? req.query.fields.split(',') : null;

        const firstRecord = await db.moveToFirst(tableName,fields);
        res.json(firstRecord);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error moving to first record');
    } finally {
        await db.close();
    }
});


/**
 * @swagger
 * /move-to-last/{tableName}:
 *   get:
 *     summary: Move to the last record of a table
 *     description: Retrieve the last record of a specified table.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Last record retrieved successfully.
 *       500:
 *         description: Error moving to last record
 */
app.get('/move-to-last/:tableName', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
         // Get the fields from the query string. It's a comma-separated string.
         const fields = req.query.fields ? req.query.fields.split(',') : null;

        const lastRecord = await db.moveToLast(tableName,fields);
        res.json(lastRecord);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error moving to last record');
    } finally {
        await db.close();
    }
});

/**
 * @swagger
 * /move-to-next/{tableName}/{currentRowId}:
 *   get:
 *     summary: Move to the next record of a table
 *     description: Retrieve the next record of a specified table based on the current row ID.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table.
 *         schema:
 *           type: string
 *       - in: path
 *         name: currentRowId
 *         required: true
 *         description: Current row ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Next record retrieved successfully.
 *       500:
 *         description: Error moving to next record
 */
app.get('/move-to-next/:tableName/:currentRowId', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
        const currentRowId = req.params.currentRowId;
         // Get the fields from the query string. It's a comma-separated string.
         const fields = req.query.fields ? req.query.fields.split(',') : null;

        const nextRecord = await db.moveToNext(tableName, fields, currentRowId);
        res.json(nextRecord);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error moving to next record');
    } finally {
        await db.close();
    }
});

/**
 * @swagger
 * /move-to-previous/{tableName}/{currentRowId}:
 *   get:
 *     summary: Move to the previous record of a table
 *     description: Retrieve the previous record of a specified table based on the current row ID.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table.
 *         schema:
 *           type: string
 *       - in: path
 *         name: currentRowId
 *         required: true
 *         description: Current row ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Previous record retrieved successfully.
 *       500:
 *         description: Error moving to previous record.
 */
app.get('/move-to-previous/:tableName/:currentRowId', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
        const currentRowId = req.params.currentRowId;
         // Get the fields from the query string. It's a comma-separated string.
         const fields = req.query.fields ? req.query.fields.split(',') : null;

        const previousRecord = await db.moveToPrevious(tableName,fields, currentRowId);
        res.json(previousRecord);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error moving to previous record');
    } finally {
        await db.close();
    }
});
//get record by rowid
app.get('/get-record-by-rowid/:tableName/:rowID', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
        const rowID = req.params.rowID;
         // Get the fields from the query string. It's a comma-separated string.
         const fields = req.query.fields ? req.query.fields.split(',') : null;

        const record = await db.getRecordByRowID(tableName,fields, rowID);
        res.json(record);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error moving to previous record');
    } finally {
        await db.close();
    }
});

/**
 * @swagger
 * /getROWID/{tableName}/{currentRowId}:
 *   get:
 *     summary: Get ROWID of a record in a table
 *     description: Retrieve the ROWID of a record in a specified table based on the current row ID.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table.
 *         schema:
 *           type: string
 *       - in: path
 *         name: currentRowId
 *         required: true
 *         description: Current row ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ROWID retrieved successfully.
 *       500:
 *         description: Error retrieving ROWID.
 */

app.get('/getROWID/:tableName/:currentRowId', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
        const currentRowId = req.params.currentRowId;
        const nextRecord = await db.getROWID(tableName, currentRowId);
        res.json(nextRecord);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error moving to next record');
    } finally {
        await db.close();
    }
});

/**
 * @swagger
 * /update-record/{tableName}/{rowID}:
 *   put:
 *     summary: Update a record in a table
 *     description: Update a specific record in a table.
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table where the record is to be updated.
 *         schema:
 *           type: string
 *       - in: path
 *         name: rowID
 *         required: true
 *         description: ID of the record to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: Data to update in the record
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *               field2:
 *                 type: string
 *               # Add other fields as required
 *     responses:
 *       200:
 *         description: Record updated successfully.
 *       500:
 *         description: Error updating record.
 */
app.put('/update-record/:tableName/:rowID',  checkAuthenticated, async (req, res) => {
    const { tableName, rowID } = req.params;
    const data = req.body; // Assuming the updated data is sent in the request body
    console.log(data);    
    try {
        await db.connectWrite();
        const result = await db.updateRecord(tableName, data, rowID);
        res.json({ message: 'Record updated successfully', result });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating record');
    } finally {
        await db.close();
    }
});

// insert record
app.post('/insert-record/:tableName', checkAuthenticated, async (req, res) => {
    const { tableName } = req.params;
    const data = req.body; // Assuming the updated data is sent in the request body
    console.log(data);    
    try {
        await db.connectWrite();
        const result = await db.insertRecord(tableName, data);
        res.json({ message: 'Record inserted successfully', result });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error inserting record');
    } finally {
        await db.close();
    }
});

//GRID
app.get('/table-data/:tableName/:page/:pageSize', checkAuthenticated,  async (req, res) => {
    try {
        
        const { tableName, page, pageSize } = req.params;
        await db.connect();
        
        // Convert page and pageSize to numbers
        const pageNum = parseInt(page, 10);
        const pageSizeNum = parseInt(pageSize, 10);
         // Get the fields from the query string. It's a comma-separated string.
         const fields = req.query.fields ? req.query.fields.split(',') : null;
        const filter = req.query.filter ? req.query.filter : null;
       
        const data = await db.queryDataWithPagination(tableName, pageNum, pageSizeNum,fields,filter);
        res.json(data);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error fetching paginated data');
    } finally {
        await db.close();
    }
});

//Schema modification
//Alter table
app.post('/alter-table/:tableName', checkAuthenticated, async (req, res) => {
    try {
        await db.connectWrite();
        const tableName = req.params.tableName;
        const { action, columnName, columnType, newColumnName, newColumnType } = req.body;

        let result;
        if (action === 'add') {
            result = await db.alterTable(tableName, columnName, columnType);
        } else if (action === 'modify') {
            result = await db.alterTableColumn(tableName, columnName, newColumnName, newColumnType);
        } else {
            throw new Error('Invalid action');
        }

        res.json({ message: 'Table altered successfully', result });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error altering table');
    } finally {
        await db.close();
    }
});
//Create table  
app.post('/create-table/:tableName', checkAuthenticated, async (req, res) => {
    try {
        await db.connectWrite();
        const tableName = req.params.tableName;
        const columns = req.body.columns;
        const result = await db.createTable(tableName, columns);
        res.json({ message: 'Table created successfully', result });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating table');
    } finally {
        await db.close();
    }
});

function decodeSpecialChars(data)
{
 // replace %20 by space
    data=data.replaceAll("%20", " ").replaceAll("%27", "'").replaceAll("%2C", ",").replaceAll("%3A", ":").replaceAll("%3B", ";").replaceAll("%3D", "=").replaceAll("%3F", "?").replaceAll("%40", "@");
   
    return data;
}

//select distinct values for a field
app.get('/select-distinct/:tableName/:fieldName', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
        const fieldName = req.params.fieldName;
       
        // convert html code to special characters
    
        const filter = req.query.filter ?  decodeSpecialChars(req.query.filter) : null;
       
        const result = await db.selectDistinct(tableName, fieldName,filter);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error selecting distinct values');
    } finally {
        await db.close();
    }
});


// export table to csv
// set html mime type in header
app.get('/export-table/:tableName', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const tableName = req.params.tableName;
        const fields = req.query.fields ? req.query.fields.split(',') : null;
        const result = await db.exportTableToCSV(tableName,fields);
        // res set header
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename=${tableName}.csv`);
        res.status(200).send(result);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Error exporting table');
    } finally {
        await db.close();
    }
});

// return json passing sql query
app.get('/query/:sqlQuery', checkAuthenticated, async (req, res) => {
    try {
        await db.connect();
        const sqlQuery = req.params.sqlQuery;
        const result = await db.queryData(sqlQuery);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error executing query');
    } finally {
        await db.close();
    }
});


}
