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



class OdbcDatabase {
    odbc = require('odbc');
    connection = null;
    constructor(connectionString) {
       
        this.connectionString = connectionString;
    }

    async connect() {        
        try {
            const connectionConfig = {
                connectionString: this.connectionString,
                connectionTimeout: 100,
                loginTimeout: 100,
            }
            this.connection = await this.odbc.connect(connectionConfig);
    
            this.connection.setIsolationLevel(this.odbc.SQL_TXN_READ_UNCOMMITTED);
        } catch (err) {
            console.log('Error connecting to the database:', err);
          //  throw err;
        }
    }

    async connectWrite() {
        try {
            const connectionConfig = {
                connectionString: this.connectionString,
                connectionTimeout: 10,
                loginTimeout: 10,
            }
            this.connection = await odbc.connect(connectionConfig);
            this.connection.setIsolationLevel(odbc.SQL_TXN_READ_COMMITTED);
        } catch (err) {
            console.log('Error connecting to the database:', err);
          //  throw err;
        }
    }



    async queryData(queryString) {
        try {
            const result = await this.connection.query(queryString);
            return result;
        } catch (err) {
            console.log('Error querying data:', err);
           // throw err;
        }
    }

    async updateData(updateQuery) {
        try {
            const result = await this.connection.query(updateQuery);
            return result;
        } catch (err) {
            console.log('Error updating data:', err);
           // throw err;
        }
    }

    async deleteData(deleteQuery) {
        try {
            const result = await this.connection.query(deleteQuery);
            return result;
        } catch (err) {
            console.log('Error deleting data:', err);
          //  throw err;
        }
    }

    async close() {
        try {
            await this.connection.close();
        } catch (err) {
            console.log('Error closing the database connection:', err);
     }
    }

 
    async getTablesList() {
        try {
            // Query to get list of tables in OpenEdge
            console.log("getTablesList");
            const query = `SELECT "_Owner"+'.'+"_File-Name" name, "_Desc" label FROM PUB."_File" WHERE "_file-Number">0 AND "_Owner" <> 'SYSPROGRESS' ORDER BY "_File-Name"`;
            const result = await this.connection.query(query);
           // console.log(result);
            return result;
        } catch (err) {
            console.log('Error retrieving tables list:', err);
           // throw err;
        }
    }

    async getTableFields(tableName) {
        try {
            // Query to get fields of a table in OpenEdge
            //split the table name in owner and table name
            var tableParts=tableName.split(".");
            var query = `SELECT "_Field-Name" Name, "_Data-Type" 'TYPE', "_Label" LABEL, "_Mandatory" 'MANDATORY',`;
            query+=` "_Format" 'FORMAT', "_Decimals" 'DECIMAL', "_Width" 'WIDTH', "_Initial" 'DEFAULT' FROM PUB."_Field" `;
            query+=` WHERE PUB."_Field"."_File-Recid" = (SELECT ROWID FROM PUB."_File" WHERE "_Owner" = '${tableParts[0]}' AND "_File-Name" = '${tableParts[1]}')`;
            console.log(query);
            const result = await this.connection.query(query);
            return result;
        } catch (err) {
            
            console.log(`Error retrieving fields for table ${tableName}:`, err);
          //  throw err;
        }
    }

    async getTableIndexes(tableName) {
        try {
            // Query to get indexes of a table in OpenEdge
            const query = `select "_index-name" Name from PUB."_index" idx, PUB."_file" fi where fi."_file-name"='${tableName}' and idx.rowid =(select"_file"."_prime-index" from PUB."_file" fs where fs."_file-name"='${tableName}')`; 
            console.log(query);
            const result = await this.connection.query(query);
            return result;
        } catch (err) {
            console.log(`Error retrieving indexes for table ${tableName}:`, err);
          //  throw err;
        }
    }

    async queryDataWithPagination(tableName, page, pageSize,fields,filter) {
        try {
             // create filter base on filer paramenter, for search based on the input values, 
             //with field name and value separated by | and each filter separated by ,
             // and build the query where clause
             if (filter && filter.length > 0) {
                var filterList=filter.split(",");
                var filter="";
                for (var i=0;i<filterList.length;i++) {
                    var filterField=filterList[i].split("|");
                    if (filterField.length==2) {
                        if (filter.length>0) {
                            filter+=" and ";
                        }
                        filter+=`${filterField[0]} like '%${filterField[1]}%'`;
                    }
                }   
            }
                

            if (fields && fields.length > 0) {
                const fieldList = fields.join(', ');
                const offset = (page - 1) * pageSize;
                
                var paginatedQuery = `select  ${fieldList} FROM "${tableName}"`;
                if (filter && filter.length > 0) {
                    paginatedQuery+=` WHERE ${filter} `;
                }
                paginatedQuery+=` OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
                console.log(paginatedQuery)
                const result = await this.connection.query(paginatedQuery);
                return result;
                }
            return null;
        } catch (err) {
            console.error('Error querying data with pagination:', err);
            throw err;
        }
    }

// CURSOR

 // Move to the first record
 async moveToFirst(tableName, fields) {
    // Construct the SQL query based on the fields provided
    let query;
    if (fields && fields.length > 0) {
        const fieldList = fields.join(', ');
        console.log(fieldList);
        const query = `SELECT TOP 1 ${fieldList} FROM ${tableName} `;
        return this.queryData(query);
    }
    return null;
}

// Move to the last record
async moveToLast(tableName , fields) {
    // OpenEdge doesn't have a direct way to select the last record, so you might need to use an ORDER BY clause
    // with DESC and then select the TOP 1 record. This assumes you have a column to order by.
    if (fields && fields.length > 0) {
        const fieldList = fields.join(', ');
        const query = `SELECT ${fieldList} FROM ${tableName} ORDER BY 1 desc `;    
        return this.queryData(query);
    }
    return null;
}

// Move to the next record
async moveToNext(tableName, fields, currentRowId) {
    if (fields && fields.length > 0) {
        const fieldList = fields.join(', ');
        // Assuming 'currentRowId' is the ROWID of the current record
        const query = `SELECT ${fieldList} FROM ${tableName}  OFFSET ${currentRowId} ROWS FETCH NEXT 1 ROWS ONLY`;
        console.log(query);
        return this.queryData(query);
    }
    return null;
    
}

// Move to the previous record
async moveToPrevious(tableName, fields, currentRowId) {
    // This is a bit tricky as OpenEdge doesn't support fetching the previous record directly
    // You might need to fetch all records with ROWID less than the current one and then take the last one
    if (fields && fields.length > 0) {
        const fieldList = fields.join(', ');
            const query = `SELECT ${fieldList} FROM ${tableName} OFFSET ${currentRowId} ROWS FETCH NEXT 1 ROWS ONLY`;
            console.log(query);
            return this.queryData(query);
        }
        return null;
}

// Move to the row with the specified ROWID
async getRecordByRowID(tableName, fields, rowID) {
    // Assuming 'rowID' is the ROWID of the record to move to
    if (fields && fields.length > 0) {
        const fieldList = fields.join(', ');
        const query = `SELECT ${fieldList} FROM ${tableName} WHERE ROWID = '${rowID}'`;
        console.log(query);
        return this.queryData(query);
    }
    return null;
}



// Move to the next record
async getROWID(tableName, currentRowId) {
    // Assuming 'currentRowId' is the ROWID of the current record
    const query = `SELECT ROWID FROM ${tableName}  OFFSET ${currentRowId} ROWS FETCH NEXT 1 ROWS ONLY`;
    console.log(query);
    return this.queryData(query);
}

    async updateRecord(tableName, data, rowID) {
        try {
            
            // Construct the full SQL statement
            const sql = `UPDATE  ${tableName} SET ${data.body} WHERE ROWID = '${rowID}'`;
    
        console.log(sql);
            // Execute the query
            const result = await this.connection.query(sql);
            
            return result;
        } catch (err) {
            console.log('Error updating record:', err);
            throw err;
        }
    }

// insert new record
async insertRecord(tableName, data) {
    try {
        // Construct the full SQL statement
        const sql = `INSERT INTO ${tableName} (${data.fields}) VALUES (${data.values})`;
        console.log(sql);
        // Execute the query
        const result = await this.connection.query(sql);

        return result;
    } catch (err) {
        console.log('Error inserting record:', err);
        throw err;
    }
}

// SCHEMA Modification
// Alter table
// Alter table
async alterTable(tableName, columnName, columnType) {
    try {
        // Construct the SQL statement
        const sql = `ALTER TABLE ${tableName} ADD ${columnName} ${columnType}`;
        console.log(sql);
        // Execute the query
        const result = await this.connection.query(sql);

        return result;
    } catch (err) {
        console.log('Error altering table:', err);
        throw err;
    }
}

// Alter table column
async alterTableColumn(tableName, columnName, newColumnName, newColumnType) {
    try {
        // Construct the SQL statement for renaming the column
        let sql = `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${newColumnName}`;

        // Execute the query
        let result = await this.connection.query(sql);

               return result;
    } catch (err) {
        console.log('Error altering table column:', err);
        throw err;
    }
}

// Create table
async createTable(tableName, columns) {
    try {
        // Construct the SQL statement
        const sql = `CREATE TABLE ${tableName} (${columns.join(', ')})`;
        console.log(sql);
        // Execute the query
        const result = await this.connection.query(sql);

        return result;
    } catch (err) {
        console.log('Error creating table:', err);
        throw err;
    }
}

// select distinct values from column
async selectDistinct(tableName, columnName, filter) {
    try {
        // Construct the SQL statement
        // if filter is not empty, add it to the query

        var sql = `SELECT DISTINCT ${columnName} FROM ${tableName} `;	
        if (filter && filter.length > 0) {
            sql+=` WHERE ${filter} `;
        }
        console.log(sql);
        // Execute the query
        const result = await this.connection.query(sql);

        return result;
    } catch (err) {
        console.log('Error selecting distinct values:', err);
        throw err;
    }
}

// ----------------------------------
// Export table to CSV
// ----------------------------------
    async exportTableToCSV(tableName, fields) {
        try {
            // Construct the SQL statement
            const fieldList = fields.join(', ');
            const sql = `SELECT ${fieldList} FROM ${tableName}`;
            console.log(sql);
            // Execute the query
            const result = await this.connection.query(sql);
            // convert result form json to csv
            const json2csv = require('json2csv').parse;
           const csv = json2csv(result);
           // console.log(csv);   

            
            return csv;
        } catch (err) {
            console.log('Error exporting table to CSV:', err);
            throw err;
        }
        }
}

module.exports = OdbcDatabase;
