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


const he = require('he');

class dblayer{

    
        dbList = [];
        databases = [];
        dbCache = [];
       checkAuthenticated = (req, res, next) => {
                if (req.isAuthenticated()) { return next(); }
                res.redirect("/login");
            };


        // for each dns entre create a db object
       constructor(app,session, passport)
        {
            console.log("dblayer constructor");           
            this.dbList = app.config.dblist;
            this.generateRoutes = this.generateRoutes.bind(this);
            this.checkAuthenticated = this.checkAuthenticated.bind(this);
            // get key value from dblist           
        }
      
        async init()
        {
            for (const [key, value] of Object.entries(this.dbList)) {
                console.log(`${key}: ${value}`);
                const OdbcDatabase = require('./OdbcDatabase'); 
                this.databases[key] = new OdbcDatabase(value);
                // store the db structure in the cache
                
                await this.databases[key].connect();                
                this.dbCache[key] = await  this.databases[key].getTablesList();   
              //  console.log(this.dbCache[key]);     
                await  this.databases[key].close();    
                this.tableToDatabaseMapping = this.createTableDatabaseMapping(this.dbCache);
            }
        }

                // Function to get all table names from a given database cache
 getTableNames(dbCache, dbName) {
    return dbCache[dbName].map(table => table.NAME.toLowerCase());
}

// Function to generate a mapping of tables to their databases
 createTableDatabaseMapping(dbCache) {
    const mapping = {};
    for (const [dbName, tables] of Object.entries(dbCache)) {
        for (const table of tables) {
            mapping[table.NAME.toLowerCase()] = dbName;
        }
    }

    return mapping;
}

// Function to safely convert BigInt to int or string
 convertBigIntToInt(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => this.convertBigIntToInt(item));
    } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                if (typeof value === 'bigint') {
                    // Convert to a safe integer if possible, otherwise to a string
                    return [key, (value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER)
                        ? Number(value)
                        : value.toString()];
                }
                return [key, value];
            })
        );
    }
    return obj;
}
// Function to execute a query on the appropriate database(s)
async  executeQuery(databases,  sqlQuery) {
    console.log("executeQuery");
    // check if exist only one database
    console.log(databases.length );
    // extract keys of databases
    const keys = Object.keys(databases);
    console.log(keys[0]);

    if (keys.length === 1) {
        console.log("databases:"+databases[0]);
        const db = databases[keys[0]];
        await db.connect();
        const result = await db.queryData(sqlQuery);
        await db.close();
        return result;
    }


    /*

    const dbRegex = /FROM\s+([A-Z0-9_]+\.[A-Z0-9_]+|[A-Z0-9_]+)/i;
    const dbMatches = new Set();
    let match;

    while ((match = dbRegex.exec(sqlQuery)) !== null) {
        const tableName = match[1].toLowerCase();
        const dbName = this.tableToDatabaseMapping[tableName];
        if (dbName) {
            console.log("dbName:"+dbName);
            dbMatches.add(dbName);
        }
    }

    // Execute the query on a single database or handle external joins
    if (dbMatches.size === 1) {
        const db = [...dbMatches][0];
        console.log("--->db:"+db);
        
        const conn= databases[db];
        if (!conn) {
            throw new Error(`No connection found for database: ${db}`);
        }
       
        await conn.connect();
     //   console.log("sqlQuery:"+sqlQuery);
     //   console.log("db:"+db);
        const result = await conn.queryData(sqlQuery);
        await conn.close();
        return result;
    } else if (dbMatches.size > 1) {
        // Handle external join manually
        const data = {};

        for (const dbName of dbMatches) {
            const query = dbs.adjustQueryForDb(sqlQuery, dbName);
            const conn= databases[dbName];
            await conn.connect();            
            data[dbName] = await conn.queryData(query);
            await conn.close();
        }

        // Assuming JOINs are based on specific logic, you can now merge `data`
        // into the desired joined result here
        return mergeData(data);
    }

    throw new Error('No matching database found for query.');
    */
}

// Function to adjust the SQL query for each database (if required)
 adjustQueryForDb(sqlQuery, dbName) {
    // Adjust query logic as needed based on dbName
    return sqlQuery;
}

// Example function to merge data from multiple databases (for simplicity, using dummy merging)
 mergeData(data) {
    const mergedData = [];
    for (const dbResults of Object.values(data)) {
        mergedData.push(...(dbResults.rows || []));
    }
    return mergedData;
}

        generateRoutes(app,dbs)
        {
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
        app.get('/table-structure/:database/:tableName', dbs.checkAuthenticated, async function(req, res) {
            try {
                
                const {database, tableName } = req.params;
                console.log("table-structure");
                console.log(database);
                console.log(tableName);
               // console.log(dbs);
                const db= dbs.databases[database];
                await db.connect();             
                const structure = await db.getTableFields(tableName);
                res.json(structure);
                await db.close();
            } catch (err) {
                console.log('Error:', err);
                res.status(500).send('Internal Server Error');
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
            
        app.get('/tables-list', dbs.checkAuthenticated, async (req, res) => {
            console.log("tables-list"); 
            try {
                var outJson={};
                //console.log(dbs.dbCache);
                // for each database get the tables list
                for (const [key, value] of Object.entries(dbs.dbCache)) {
                    console.log("db:"+key);
                    outJson[key]= dbs.dbCache[key];
                }
                res.json(outJson);

            } catch (err) {
                console.log('Error:', err);
                res.status(500).send('Error retrieving tables list');
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

            
        app.get('/table-fields/:database/:tableName',dbs.checkAuthenticated, async (req, res) => {
            try {
                console.log("table-fields");
                const {database, tableName } = req.params;
                const db= dbs.databases[database];
                await db.connect();              
                const fields = await db.getTableFields(tableName);
                res.json(fields);
                await db.close();
            } catch (err) {
                res.status(500).send(`Error retrieving fields for table ${tableName}`);
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


        app.get('/table-indexes/:database/:tableName',dbs.checkAuthenticated, async (req, res) => {
            try {
                console.log("table-indexes");
                const {database, tableName } = req.params;
                const db= dbs.databases[database];
                await db.connect();
                const indexes = await db.getTableIndexes(tableName);
                res.json(indexes);
                await db.close();
            } catch (err) {
                res.status(500).send(`Error retrieving indexes for table ${tableName}`);
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

        app.get('/move-to-first/:database/:tableName', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName } = req.params;
               
                const db= dbs.databases[database];
                // Get the fields from the query string. It's a comma-separated string.
                const fields = req.query.fields ? req.query.fields.split(',') : null;
                await db.connect();
                const firstRecord = await db.moveToFirst(tableName,fields);
                res.json(firstRecord);
                await db.close();
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Error moving to first record');
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
        app.get('/move-to-last/:database/:tableName', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName } = req.params;
           
                // Get the fields from the query string. It's a comma-separated string.
                const fields = req.query.fields ? req.query.fields.split(',') : null;
                const db= dbs.databases[database];
                await db.connect();
                const lastRecord = await db.moveToLast(tableName,fields);
                res.json(lastRecord);
                await db.close();
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Error moving to last record');
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
        app.get('/move-to-next/:database/:tableName/:currentRowId', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName,currentRowId } = req.params;
              
              
                // Get the fields from the query string. It's a comma-separated string.
                const fields = req.query.fields ? req.query.fields.split(',') : null;
                const db= dbs.databases[database];
                await db.connect();
                const nextRecord = await db.moveToNext(tableName, fields, currentRowId);
                res.json(nextRecord);
                await db.close();
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Error moving to next record');
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
        app.get('/move-to-previous/:database/:tableName/:currentRowId', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName,currentRowId } = req.params;
              
                // Get the fields from the query string. It's a comma-separated string.
                const fields = req.query.fields ? req.query.fields.split(',') : null;
                const db= dbs.databases[database];
                await db.connect();
                const previousRecord = await db.moveToPrevious(tableName,fields, currentRowId);
                res.json(previousRecord);
                await db.close();
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Error moving to previous record');
            } 
        });
        //get record by rowid
        app.get('/get-record-by-rowid/:database/:tableName/:rowID', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName,rowID } = req.params;
              
              
                // Get the fields from the query string. It's a comma-separated string.
                const fields = req.query.fields ? req.query.fields.split(',') : null;
                const db= dbs.databases[database];
                await db.connect();
                const record = await db.getRecordByRowID(tableName,fields, rowID);
                res.json(record);
                await db.close();
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Error moving to previous record');
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

        app.get('/getROWID/:database/:tableName/:currentRowId', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName, currentRowId } = req.params;
              
                const db= dbs.databases[database];
                await db.connect();
                const nextRecord = await db.getROWID(tableName, currentRowId);
                res.json(nextRecord);
                await db.close();
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Error moving to next record');
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
        app.put('/update-record/:database/:tableName/:rowID',  dbs.checkAuthenticated, async (req, res) => {
            const { database, tableName, rowID } = req.params;
            const data = req.body; // Assuming the updated data is sent in the request body
            console.log(data);    
            try {
                const db= dbs.databases[database];
                await db.connectWrite();
                const result = await db.updateRecord(tableName, data, rowID);
                res.json({ message: 'Record updated successfully', result });
                await db.close();
            } catch (err) {
                console.error(err);
                res.status(500).send('Error updating record');
            } 
        });

        // insert record
        app.post('/insert-record/:database/:tableName', dbs.checkAuthenticated, async (req, res) => {
            const {database, tableName } = req.params;
            const data = req.body; // Assuming the updated data is sent in the request body
            console.log(data);    
            try {
                const db= dbs.databases[database];
                await db.connectWrite();
                const result = await db.insertRecord(tableName, data);
                res.json({ message: 'Record inserted successfully', result });
                await db.close();
            } catch (err) {
                console.error(err);
                res.status(500).send('Error inserting record');
            } 
        });

        //GRID
        app.get('/table-data/:database/:tableName/:page/:pageSize', dbs.checkAuthenticated,  async (req, res) => {
            try {
                
                const { database, tableName, page, pageSize } = req.params;
                const db= dbs.databases[database];
                await db.connect();
                
                // Convert page and pageSize to numbers
                const pageNum = parseInt(page, 10);
                const pageSizeNum = parseInt(pageSize, 10);
                // Get the fields from the query string. It's a comma-separated string.
                const fields = req.query.fields ? req.query.fields.split(',') : null;
                const filter = req.query.filter ? req.query.filter : null;
            
                const data = await db.queryDataWithPagination(tableName, pageNum, pageSizeNum,fields,filter);
                res.json(data);
                await db.close();
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Error fetching paginated data');
            } 
        });

        //Schema modification
        //Alter table
        app.post('/alter-table/:database/:tableName', dbs.checkAuthenticated, async (req, res) => {
            try {
                await db.connectWrite();
                const {database, tableName } = req.params;
                const { action, columnName, columnType, newColumnName, newColumnType } = req.body;
                const db= dbs.databases[database];
                let result;
                if (action === 'add') {
                    result = await db.alterTable(tableName, columnName, columnType);
                } else if (action === 'modify') {
                    result = await db.alterTableColumn(tableName, columnName, newColumnName, newColumnType);
                } else {
                    throw new Error('Invalid action');
                }

                res.json({ message: 'Table altered successfully', result });
                await db.close();
            } catch (err) {
                console.error(err);
                res.status(500).send('Error altering table');
            } 
        });
        //Create table  
        app.post('/create-table/:database/:tableName', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName } = req.params;
                const db= dbs.databases[database];
                await db.connectWrite();
                
                const columns = req.body.columns;
                const result = await db.createTable(tableName, columns);
                res.json({ message: 'Table created successfully', result });
                await db.close();
            } catch (err) {
                console.error(err);
                res.status(500).send('Error creating table');
            } 
        });

        function decodeSpecialChars(data)
        {
        // replace %20 by space
            data=data.replaceAll("%20", " ").replaceAll("%27", "'").replaceAll("%2C", ",").replaceAll("%3A", ":").replaceAll("%3B", ";").replaceAll("%3D", "=").replaceAll("%3F", "?").replaceAll("%40", "@");
        
            return data;
        }

        //select distinct values for a field
        app.get('/select-distinct/:database/:tableName/:fieldName', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName, fieldName } = req.params;
                const db= dbs.databases[database];
                await db.connect();
               
            
                // convert html code to special characters
            
                const filter = req.query.filter ?  decodeSpecialChars(req.query.filter) : null;
            
                const result = await db.selectDistinct(tableName, fieldName,filter);
                res.json(result);
                await db.close();
            } catch (err) {
                console.error(err);
                res.status(500).send('Error selecting distinct values');
            } 
        });


        // export table to csv
        // set html mime type in header
        app.get('/export-table/:database/:tableName', dbs.checkAuthenticated, async (req, res) => {
            try {
                const {database, tableName} = req.params;
                const db= dbs.databases[database];
                await db.connect();
       
                const fields = req.query.fields ? req.query.fields.split(',') : null;
                const result = await db.exportTableToCSV(tableName,fields);
                // res set header
                res.set('Content-Type', 'text/csv');
                res.set('Content-Disposition', `attachment; filename=${tableName}.csv`);
                res.status(200).send(result);
                await db.close();
            } catch (err) {
                console.error(err);
                res.status(500).send('Error exporting table');
            } 
        });

        // return json passing sql query
        app.get('/query/:sqlQuery', dbs.checkAuthenticated, async (req, res) => {
            try {
                const { sqlQuery } = req.params;
                const decodedQuery = decodeURIComponent(sqlQuery);
                console.log(sqlQuery);
                // Execute the query and return the result
                const result = await dbs.executeQuery(dbs.databases, decodedQuery);
                const safeResult = dbs.convertBigIntToInt(result);
                res.json(safeResult);
                
            } catch (err) {
                console.error(err);
                res.status(500).send('Error executing query');
            }
        });
} // end of generateRoutes




} // end of class

module.exports = dblayer;
