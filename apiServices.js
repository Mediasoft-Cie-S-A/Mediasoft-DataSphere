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

const { compareSync } = require('bcryptjs');
const { error } = require('console');
const e = require('express');
const { stringify } = require('querystring');
const { runInThisContext } = require('vm');

module.exports = function(app, client, dbs,dbName) {
    

    const checkAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) { return next(); }
        res.redirect("/login");
    };

  
    app.get("/dashboard",checkAuthenticated, (req, res) => {   
        res.render("dashboard.ejs", {name: req.user.name})
    })
    app.post('/store-json', checkAuthenticated, async (req, res) => {
        try {
            
            const db = client.db(dbName);
            const col = db.collection('forms');
    
            // Construct form data with metadata
            const formData = {
                formId: req.body.formId, // Assuming formId is provided in the request
                formName: req.body.formName,
                formPath: req.body.formPath,
                userCreated: req.body.userCreated,
                userModified: req.body.userModified,
                modificationDate: new Date(),
                creationDate: new Date(),
                formData: req.body.formData // The actual form data
            };
    
            // Insert the form data
            const result = await col.insertOne(formData);
    
            res.send({ message: 'Form stored successfully', _id: result.insertedId });
        } catch (err) {
            console.log(err.stack);
            res.status(500).send('Error storing form');
        }
    });
    
    app.get('/list-forms', checkAuthenticated, async (req, res) => {
        try {
            // -
            const db = client.db(dbName);
            const col = db.collection('forms');
    
            const forms = await col.find({}).toArray();
    
            res.send(forms);
        } catch (err) {
            console.log(err.stack);
            res.status(500).send('Error retrieving forms');
        } 
    });
    
    app.get('/get-form/:formId', checkAuthenticated, async (req, res) => {
        try {
            // -
            const db = client.db(dbName);
            const col = db.collection('forms');
    
            const form = await col.findOne({ formId: req.params.formId });
    
            if (form) {
                res.send(form);
            } else {
                res.status(404).send('Form not found');
            }
        } catch (err) {
            console.log(err.stack);
            res.status(500).send('Error retrieving form');
        } 
    });
    
    app.put('/update-form/:formId', checkAuthenticated, async (req, res) => {
        try {
            // -
            const db = client.db(dbName);
            const col = db.collection('forms');
    
            const updateData = {
                formName: req.body.formName,
                formPath: req.body.formPath,
                userModified: req.body.userModified,
                modificationDate: new Date(),
                formData: req.body.formData
            };
    
            const result = await col.updateOne(
                { formId: req.params.formId },
                { $set: updateData }
            );
    
            if (result.matchedCount === 0) {
                res.status(404).send('Form not found');
            } else {
                res.send({ message: 'Form updated successfully' });
            }
        } catch (err) {
            console.log(err.stack);
            res.status(500).send('Error updating form');
        } 
    });
    
    app.delete('/delete-form/:formId', checkAuthenticated, async (req, res) => {
        try {
            // -
            const db = client.db(dbName);
            const col = db.collection('forms');
    
            const result = await col.deleteOne({ formId: req.params.formId });
    
            if (result.deletedCount === 0) {
                res.status(404).send('Form not found');
            } else {
                res.send({ message: 'Form deleted successfully' });
            }
        } catch (err) {
            console.log(err.stack);
            res.status(500).send('Error deleting form');
        } 
    });

    // POST endpoint to store data
    app.post('/storeDataset', async (req, res) => {
        try {
            // -
            const db = client.db(dbName);
            const collection = db.collection('datasets');
    
            // Construct dataset object
            const dataset = {
                query: req.body.query,
                fields: req.body.fields,
                types: req.body.types,
                datasetName: req.body.datasetName,
                tables: req.body.tables,
                links: req.body.links,
            };
    
            // Check if the dataset exists
            const query = { datasetName: dataset.datasetName };
            const existingDataset = await collection.findOne(query);
            
            if (existingDataset) {
                // Update the document
                await collection.updateOne(query, { $set: dataset });
                res.send({ message: 'Dataset updated successfully' });
            } else {
                const result = await collection.insertOne(dataset);
                res.send({ message: 'Dataset stored successfully', _id: result.insertedId });
            }
        } catch (err) {
            console.log(err.stack);
            res.status(500).send("Error storing data: " + err.message);
        }
    });
    
    app.post('/storeDatasetData', async (req, res) => {
        if (!req.body.datasetName || !req.body.sqlQuery) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }
        
        try {
            const keys = Object.keys(dbs.databases);
            const db = dbs.databases[keys[0]];
            
            const config = {
                dsn: db.connectionString,
                collectionName: req.body.datasetName,
            };
    
            const configBase64 = Buffer.from(JSON.stringify(config)).toString('base64');
            const currentDir = __dirname;
            console.log(currentDir);
            console.log(`${currentDir}/ETL/ETLOE2Mongo.exe ${configBase64}`);
            const { exec } = require('child_process');
            exec(`${currentDir}/ETL/ETLOE2Mongo.exe ${configBase64}`, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return res.status(500).send({ error: 'Error executing ETL process' });
                }
    
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
    
                if (stdout.includes('Load Completed')) {
                    res.send({ message: 'Dataset data stored successfully' });
                } else {
                    res.status(500).send({ error: 'Error storing data' });
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({ Error: 'Executing query' });
        }
    });
// get data of dataset
app.get('/getDatasetData/:datasetName', async (req, res) => {
    try {
        // -
        const db = client.db(dbName);
        const datasetName = req.params.datasetName;
        const collection = db.collection(datasetName);
      
        const datasetData = await collection.find({}).toArray();
        
        if (datasetData) {
            res.status(200).json(datasetData);
        } else {
            res.status(404).send(`Dataset data with name ${datasetName} not found`);
        }
    } catch (err) {
        res.status(500).send("Error retrieving data: " + err.message);
    } 
});





// get dataset data distinct values by field
app.get('/getDatasetDataDistinct/:datasetName/:field', async (req, res) => {
   try {
       // -
       const db = client.db(dbName);
       const datasetName = req.params.datasetName;
       const field = req.params.field;
       const collection = db.collection(datasetName);
       const distinctValues = await collection.distinct(field);
       if (distinctValues) {
           res.status(200).json(distinctValues);
       } else {
           res.status(404).send(`Distinct values for field ${field} not found`);
       }
   } catch (err) {
       res.status(500).send("Error retrieving data: " + err.message);
   } 
});

// get dataset data distinct values by field
app.get('/getDatasetDataNoDuplication/:datasetName', async (req, res) => {
    try {
        // Get fields list in the query string
        const fields = req.query.fields.split(',');   

        if (fields.length === 0) {
            return res.status(400).send('Fields are required');
        }

        const db = client.db(dbName);
        const datasetName = req.params.datasetName;
        const collection = db.collection(datasetName);

        // Use aggregation to project only specified fields, group by those fields to remove duplicates, and sort the output
        const pipeline = [
            {
                $project: fields.reduce((acc, field) => {
                    acc[field] = 1;
                    return acc;
                }, {})
            },
            {
                $group: {
                    _id: fields.reduce((acc, field) => {
                        acc[field] = `$${field}`;
                        return acc;
                    }, {}),
                    doc: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$doc" }
            },
            {
                $sort: fields.reduce((acc, field) => {
                    acc[field] = 1;
                    return acc;
                }, {})
            }
        ];

        const distinctValues = await collection.aggregate(pipeline).toArray();
        // remove _id field
        distinctValues.forEach(item => {
            delete item._id;
        });
        if (distinctValues.length > 0) {
            res.status(200).json(distinctValues);
        } else {
            res.status(404).send(`Distinct values not found for dataset ${datasetName}`);
        }
    } catch (err) {
        res.status(500).send("Error retrieving data: " + err.message);
    }
});




// get dataset data by dataset name and filter
app.post('/getDatasetDataByFilter', async (req, res) => {
    console.log("getDatasetDataByFilter");
  
    try {
        const { datasetName, groups, agg,  } = req.query;
     
        if (!datasetName ) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }
       
        //if req.body is not defined, set it to an empty object
        const filters = req.body.filters.filters || [];
        // if req.body.view is not defined, set it to empty string
        const view = req.body.view || '';
        // if req.body.columns is not defined, set it to an empty array
        const columns = req.body.columns || [];
        // if req.body.pivot is not defined, set it to an empty array
        const pivot = req.body.pivot || [];

        
        // check if in the colums exits the limit field
        const limit = req.body.limit
        // if limit not exits set it to 1000
        const limitValue = limit ? limit.value : 100;
        // check if in the colums exits the sort field
        const sort = req.body.sort;
        // check if in the colums exits the direction field
        const links = req.body.links;
       if (sort) {
            var direction = sort.direction;
            var sortfield = sort.field;
        }
       
        // get all the results by
        var results = await filterDocuments(datasetName, view, filters, columns, agg,sortfield,direction,limitValue);
      

        // get all the results by 
        if ( pivot.length >0) {
            // get pivot years
            console.log("pivot data");
            pFields = pivot.map(p => p.fieldName);
            console.log(pFields);
            pColumns = columns.map(p => p.fieldName);
            console.log(pColumns);
            results = pivotData(results,  pColumns,pFields);
          //  console.log(results);
        }
        // limit the results
        if (limitValue) {
            results = results.slice(0, limitValue);
        }
        res.status(200).json(results);
        
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});


// get dataset data by dataset name and filter
function flattenJSON(data,columns) {
    const results = [];
    for (let i = 0; i < data.length; i++) {
        const obj = {};
        for (const key in data[i]) {
            if (!Array.isArray(data[i][key])) {
                obj[key]= data[i][key] ;
            }else{
                // for each value in the array
                for (let j = 0; j < data[i][key].length; j++) {
                    //  the sub object
                    const subObj = {};
                    // add obj key,value to subObj
                    for (const key1 in obj) {
                        subObj[key1] = obj[key1];
                    }
                    for (const key1 in data[i][key][j]) {
                        // if key1 exists in subObj, not add it
                        if (key1 in subObj) {
                            continue;
                        }
                        subObj[key1] = data[i][key][j][key1];
                    }
                    results.push(subObj);
                }
            }
        }
      //  results.push(obj);
    
    }

    return results;
}
// Function to get data from a view

async function filterDocuments(viewName, view, filters, columns, groups, sort, direction, limitValue) {
    try {
       
        const db = client.db(dbName);
        const collection = db.collection(viewName); // Use the viewName instead of datasetName
        const pipeline = [];
        
        // if groups is not defined, set it to column.fieldName
           

        // Construct the query based on the view type
        if (view === 'standard') {
            let conditions = [];
            filters.forEach(filter => {
                const values = filter.values.map(value => {
                    if (!isNaN(value)) {
                        return parseFloat(value); // Numeric value
                    } else if (!isNaN(Date.parse(value))) {
                        return new Date(value); // Date value
                    } else {
                        return value; // String value
                    }
                });

                const condition = values.length > 1 ? { [`${filter.field}`]: { $in: values } } : { [`${filter.field}`]: values[0] };
                console.log(condition);
                conditions.push(condition);
            });

            if (conditions.length === 1) {
                pipeline.push({ $match: conditions[0] });
            } else if (conditions.length > 1) {
                pipeline.push({ $match: { $and: conditions } });
            }
        } else if (view === 'advanced') {
            let conditions = [];
            filters.forEach(filter => {
                // Check if the filter is "" or null and skip it
                if (filter.value === "" || filter.value === null) {
                    return;
                }
                let value;
                if (!isNaN(filter.value)) {
                    value = parseFloat(filter.value); // Numeric value
                } else if (!isNaN(Date.parse(filter.value))) {
                    value = new Date(filter.value); // Date value
                } else {
                    value = filter.value; // String value
                }

                const condition = { [`${filter.field}`]: { [`${convertOperator(filter.operator)}`]: value } };
                console.log(condition);
                conditions.push(condition);
            });

            if (conditions.length === 1) {
                pipeline.push({ $match: conditions[0] });
            } else if (conditions.length > 1) {
                pipeline.push({ $match: { $and: conditions } });
            }
        }
        
        console.log("groups ", groups);
        console.log("columns ", columns);
        
        // Check if group by and aggregation are provided
        if (groups && columns.length>1) {
            const agg = columns.map(col => col.fieldName);
            const funct = columns.map(col => col.functionName);

            if (agg.includes(groups)) {
                const index = agg.indexOf(groups);
                if (index > -1) {
                    agg.splice(index, 1);
                }
            }

            switch (funct[0]) {
                case 'std':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { $stdDevPop: `$${agg[0]}` } } });
                    break;
                case 'distinct':
                    // Count distinct values
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { $sum: 1 } } });
                    break;
                case 'value':
                    console.log("value");
                    const projection = {};
                    columns.forEach(col => {
                        projection[col.fieldName] = `$${col.fieldName}`;
                    });
                    pipeline.push({ $project: projection });
                    
                    break;
                case 'count':
                case 'sum':
                case 'avg':
                case 'min':
                case 'max':
                case 'first':
                case 'last':
                    console.log("aggregation function");
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { [`$${funct[0]}`]: `$${agg[0]}` } } });
                    break;
                case 'percentile':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { $push: `$${agg[0]}` } } });
                    pipeline.push( { $project: { [agg[0]]: { $arrayElemAt: [`$${agg[0]}`, 0] } } });
                    break;
                case 'var':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { $variancePop: `$${agg[0]}` } } });
                    break;
                case 'regression':
                case 'histogram':
                case 'median':
                case 'mode':
                case 'covariance':
                case 'correlation':
                case 'kmeans':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { $push: `$${agg[0]}` } } });
                    pipeline.push({ $project: { [agg[0]]: { $arrayElemAt: [`$${agg[0]}`, 0] } } });
                    break;
                case 'frequency':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { $sum: 1 } } });
                    break;
                default:
                    pipeline.push({ $group: { _id: `$${groups}`, [agg[0]]: { $sum: 1 } } });
                    break;
            }
        }else if (columns.length==1) {
            switch (columns[0].functionName) {
                case 'sum':
                case 'avg':
                case 'min':
                case 'max':
                case 'first':
                case 'last':
                    pipeline.push({ $group: { _id: null, [columns[0].fieldName]: { [`$${columns[0].functionName}`]: `$${columns[0].fieldName}` } } });
                    break;
                case 'count':
                    pipeline.push({ $group: { _id: null, [columns[0].fieldName]: { $sum: 1 } } });
                    break;
                case 'distinct':
                    pipeline.push({ $group: { _id: null, [columns[0].fieldName]: { $sum: 1 } } });
                    break;
                case 'std':
                    pipeline.push({ $group: { _id: null, [columns[0].fieldName]: { $stdDevPop: `$${columns[0].fieldName}` } } });
                    break;
                case 'var':
                    pipeline.push({ $group: { _id: null, [columns[0].fieldName]: { $variancePop: `$${columns[0].fieldName}` } } });
                    break;
                case 'percentile':
                    pipeline.push({ $group: { _id: null, [columns[0].fieldName]: { $push: `$${columns[0].fieldName}` } } });
                    pipeline.push( { $project: { [columns[0].fieldName]: { $arrayElemAt: [`$${columns[0].fieldName}`, 0] } } });
                    break;
                case 'value':
                    const projection = {};
                    columns.forEach(col => {
                        projection[col.fieldName] = `$${col.fieldName}`;
                    });
                    pipeline.push({ $project: projection });
                    break;  
        } 
        }else {
            const projection = {};
            columns.forEach(col => {
                projection[col.fieldName] = `$${col.fieldName}`;
            });
            pipeline.push({ $project: projection });
        }   

        console.log(pipeline);
        var results;
        if (sort) {
            console.log("sort");
            results = await collection.aggregate(pipeline).sort({ [sort]: direction === 'asc' ? 1 : -1 }).limit(limitValue).toArray();
        } else {
            results = await collection.aggregate(pipeline).limit(limitValue).toArray();
        }
        
        return results;
    } catch (err) {
        console.error('An error occurred:', err);
        throw err; // Rethrow the error after logging it
    } 
}



// Function to convert the operator to MongoDB operator
function convertOperator(operator) {
    switch (operator) {
        case '=':
            return '$eq';
        case '!=':
            return '$ne';
        case '>':
            return '$gt';
        case '>=':
            return '$gte';
        case '<':
            return '$lt';
        case '<=':
            return '$lte';
        case 'in':
            return '$in';
        case 'not in':
            return '$nin';
        case 'like':
            return '$regex';
        default:
            return '$eq';        
    }
}




// Function to filter documents in a collection

function pivotData(data,columnFields,pivotFields ) {
    console.log("pivotData");

    const pivotData = [];
    const result = [];

    // Get all the distinct values of the first pivot field
    const pivotValues = Array.from(new Set(data.map(item => item[pivotFields[0]])));
    console.log(pivotValues);

    // Group data by the distinct values of the first pivot field
    data.forEach(item => {
            
       pivotValues.forEach(value => {
           if (item[pivotFields[0]] === value) {
              item[value] = item[pivotFields[1]];
              }
            else {
            item[value] = 0;
            }
        });
        pivotFields.forEach(field => {
            delete item[field];
        });
        // delete _id field
        if (item._id) {
            delete item._id;
        }
        result.push(item);
    });

    return result;
}

// GET endpoint to retrieve all datasets
app.get('/getAllDatasets', async (req, res) => {  
    try {
       
        const db = client.db(dbName);
        const collection = db.collection('datasets');

        // Find all documents in the collection
        const datasets = await collection.find({}).toArray();

        if (datasets.length > 0) {
            res.status(200).json(datasets);
        } else {
            res.status(404).send("No datasets found");
        }
    } catch (err) {
        res.status(500).send("Error retrieving data: " + err.message);
    } 
});

// get dataset list
app.get('/getDatasetList', async (req, res) => {  
    try {
        // -
        const db = client.db(dbName);
        const collection = db.collection('datasets');

        // Find all documents in the collection
        const datasets = await collection.find({}).toArray();

        if (datasets.length > 0) {
            res.status(200).json(datasets);
        } else {
            res.status(404).send("No datasets found");
        }
    } catch (err) {
        res.status(500).send("Error retrieving data: " + err.message);
    } 
    });




// ptyhon code 
app.post('/generate-plot', (req, res) => {
    const { data, fields, legend, plot_type, x_label, y_label, title, file_name, custom_code } = req.body;
    // Prepare the input for the Python script as a JSON string
    const inputForPython = JSON.stringify({ data, fields, legend, plot_type, x_label, y_label, title, file_name, custom_code });

    // Execute the Python script
    const fs = require('fs');
    const path = require('path');
    const { spawn } = require('node:child_process');
  //  console.log(path.join(__dirname, 'plot.py'));
   // console.log(inputForPython);
    const pythonProcess = spawn('py', [path.join(__dirname, 'plot.py'), inputForPython]);
    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        // Assuming the Python script saves the image as 'plot.png' in the current directory
        const imagePath = path.join(__dirname, file_name);

        // Check if the image was generated and exists
        if (fs.existsSync(imagePath)) {
            // Read the image and send it as a response
            fs.readFile(imagePath, (err, image) => {
                if (err) {
                    res.status(500).send("Error reading the plot image.");
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Disposition': 'attachment; filename=plot.png',
                    });
                    res.end(image, 'binary');
                }
            });
            // Delete the image file after sending it
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Error deleting the plot image.");
                }
            });
        } else {
            res.status(500).send("Plot image not generated.");
        }
    });

});
    // Other form routes...

    app.post('/storeOrUpdateMetaschema', checkAuthenticated, async (req, res) => {
        try {
           
            const db = client.db(dbName);
            const col = db.collection('metaschemaLinks');

            // Check if the document already exists
            const metaschemaLinks = req.body;
            const existingLink = await col.findOne({});

            if (existingLink) {
                // Drop the existing document
                await col.drop();
                // Insert new document
                const result = await col.insertOne(metaschemaLinks);
                res.send({ message: 'Metaschema links updated successfully', _id: result.insertedId });
            } else {
                // Insert new document
                const result = await col.insertOne(metaschemaLinks);
                res.send({ message: 'Metaschema links stored successfully', _id: result.insertedId });
            }

            // Create or update the view
            await createViewFromConfig(metaschemaLinks, db);

        } catch (err) {
            console.log(err.stack);
            res.status(500).send('Error storing or updating metaschema links');
        } 
    });

    async function createViewFromConfig(config,db) {
    
        try {
          const database =db;
      
          // Extract the main table name
          const mainTable = Object.keys(config.tables)[0];
      
          // Define the view pipeline based on the JSON configuration
          const pipeline = config.links.map(link => ({
            $lookup: {
              from: link.targetTableName,
              localField: link.sourceFieldName,
              foreignField: link.targetFieldName,
              as: link.targetTableName
            }
          }));
      
          // Create the view
          await database.createCollection(`metaschemaView`, {
            viewOn: mainTable,
            pipeline: pipeline
          });
      
          console.log('View created successfully');
        } catch (error) {
          console.error('Error creating view:', error);
        } 
      }
        

// Fetch a specific metaschema link by ID
app.get('/getMetaschema', checkAuthenticated, async (req, res) => {
    try {
       
        const db = client.db(dbName);
        const col = db.collection('metaschemaLinks');
        // find the first document in the collection
        const metaschemaLink = await col.findOne({});
        

        if (metaschemaLink) {
            res.send(metaschemaLink);
        } else {
            res.status(404).send({error:'Metaschema link not found'});
        }
    } catch (err) {
        console.log(err.stack);
        res.status(500).send({error:'Error retrieving metaschema link'});
    } 
});

// Delete a specific metaschema link by ID
app.delete('/deleteMetaschemaLink/:id', checkAuthenticated, async (req, res) => {
    try {
        // -
        const db = client.db(dbName);
        const col = db.collection('metaschemaLinks');

        const result = await col.deleteOne({ _id: new require('mongodb').ObjectID(req.params.id) });

        if (result.deletedCount === 0) {
            res.status(404).send('Metaschema link not found');
        } else {
            res.send({ message: 'Metaschema link deleted successfully' });
        }
    } catch (err) {
        console.log(err.stack);
        res.status(500).send('Error deleting metaschema link');
    } 
});

};