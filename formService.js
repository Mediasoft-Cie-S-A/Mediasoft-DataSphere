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

const { error } = require('console');
const { stringify } = require('querystring');

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
            await client.connect();
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
        } finally {
            await client.close();
        }
    });
    
    app.get('/list-forms', checkAuthenticated, async (req, res) => {
        try {
            await client.connect();
            const db = client.db(dbName);
            const col = db.collection('forms');
    
            const forms = await col.find({}).toArray();
    
            res.send(forms);
        } catch (err) {
            console.log(err.stack);
            res.status(500).send('Error retrieving forms');
        } finally {
            await client.close();
        }
    });
    
    app.get('/get-form/:formId', checkAuthenticated, async (req, res) => {
        try {
            await client.connect();
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
        } finally {
            await client.close();
        }
    });
    
    app.put('/update-form/:formId', checkAuthenticated, async (req, res) => {
        try {
            await client.connect();
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
        } finally {
            await client.close();
        }
    });
    
    app.delete('/delete-form/:formId', checkAuthenticated, async (req, res) => {
        try {
            await client.connect();
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
        } finally {
            await client.close();
        }
    });

    // POST endpoint to store data
    app.post('/storeDataset', async (req, res) => {
        try {
            await client.connect();
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
        } finally {
            await client.close();
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
        await client.connect();
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
    } finally {
        await client.close();
    }
});





// get dataset data distinct values by field
app.get('/getDatasetDataDistinct/:datasetName/:field', async (req, res) => {
   try {
       await client.connect();
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
   } finally {
       await client.close();
   }
});



// get dataset data by dataset name and filter
app.post('/getDatasetDataByFilter', async (req, res) => {
    console.log("getDatasetDataByFilter");
  
    try {
        const { datasetName, groups, agg, funct } = req.query;
     
        if (!datasetName ) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }
        console.log(req.body);
        //if req.body is not defined, set it to an empty object
        const filters = req.body.filters.filters || [];
        // if req.body.view is not defined, set it to empty string
        const view = req.body.filters.view || '';
        // if req.body.columns is not defined, set it to an empty array
        const columns = req.body.columns || [];
        // if req.body.pivot is not defined, set it to an empty array
        const pivot = req.body.pivot || [];
        
        // check if in the colums exits the limit field
        const limit = req.body.limit
        // if limit not exits set it to 1000
        const limitValue = limit ? limit.value : 1000;
        // check if in the colums exits the sort field
        const sort = req.body.sort;
        // check if in the colums exits the direction field
       if (sort) {
            var direction = sort.direction;
            var sortfield = sort.field;
        }
        

        var results = await filterDocuments(datasetName, view, filters, columns, agg,sortfield,direction,limitValue);
        
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
        res.status(200).json(results);
        
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Filter documents in a collection based on the given fields and values
// Function to filter documents in a collection
async function filterDocuments(datasetName, view,  filters, columns, groups, sort, direction,limitValue) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(datasetName);
        const pipeline = [];
        const agg = columns.map(col => col.fieldName);
        const funct = columns.map(col => col.functionName);
        //groups , agg, funct
        // adding fieldName in columns arrato to the pipeline groups array 



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

                const condition = values.length > 1 ? { [filter.field]: { $in: values } } : { [filter.field]: values[0] };
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
               // check if the filter is "" or null and skip it
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

                const condition = { [filter.field]: { [`${convertOperator(filter.operator)}`]: value } };
                console.log(condition);
                conditions.push(condition);
            });

            if (conditions.length === 1) {
                pipeline.push({ $match: conditions[0] });
            } else if (conditions.length > 1) {
                pipeline.push({ $match: { $and: conditions } });
            }
        }
        console.log("groups ");
        console.log( groups);
        console.log("agg ");
        console.log(agg);
        console.log("funct ");
        console.log(funct);
        // Check if group by and aggregation are provided

        // remove from groups the agg field
        if (groups && agg && funct) {
            if (agg.includes(groups)) {
                const index = agg.indexOf(agg);
                if (index > -1) {
                    agg.remove(index);
                }
            }
        }
        if (groups && agg && funct) {
            switch (funct[0]) {
                case 'std':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $stdDevPop: `$${agg}` } } });
                    break;
                case 'distinct':
                    // Count distinct values
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $sum: 1 } } });
                    break;
                case 'value':
                    console.log("value");
                    pipeline.push({ $project: { [groups]: 1, [agg]: 1, _id: 0 } });
                    break;
                case 'count':
                case 'sum':
                case 'avg':
                case 'min':
                case 'max':
                case 'first':
                case 'last':
                    console.log("sum");
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { [`$${funct}`]: `$${agg}` } } });
                    break;
                case 'percentile':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                    break;
                case 'var':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $variancePop: `$${agg}` } } });
                    break;
                case 'regression':
                case 'histogram':
                case 'median':
                case 'mode':
                case 'covariance':
                case 'correlation':
                case 'kmeans':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                    break;
                case 'frequency':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $sum: 1 } } });
                    break;
                default:
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $sum: 1 } } });
                    break;
            }
        }

        console.log(pipeline);
        var results ;
        if (sort) {
            console.log("sort");
         results = await collection.aggregate(pipeline).sort({ [sort]: direction === 'asc' ? 1 : -1 }).limit(limitValue).toArray();
        }   
        else {
            results = await collection.aggregate(pipeline).limit(limitValue).toArray();
        }
        // console.log(results);
        return results;
    } catch (err) {
        console.error('An error occurred:', err);
        throw err; // Rethrow the error after logging it
    } finally {
        await client.close();
    }
}

// Function to filter documents in a collection

function pivotData(data,  columnFields,pivotFields) {
    console.log("pivotData");
    const pivotData = {};
    const result = [];
   // get values of pivotFields
    const pivotValues = data.map(item => item[pivotFields[0]]);
    const uniquePivotValues = [...new Set(pivotValues)];
    const pivotField= data.map(item => item[pivotFields[1]]);
    const uniquePivotField = [...new Set(pivotField)];

    // Loop through the data and pivot the values

    data.forEach(item => {
        const pivotValue = item[pivotFields[0]];
        const pivotField = item[pivotFields[1]];
        if (!pivotData[pivotValue]) {
            pivotData[pivotValue] = {};
        }
        if (!pivotData[pivotValue][pivotField]) {
            pivotData[pivotValue][pivotField] = item;
        }
    });
 
   // now loop through the pivotData hierarchy and create the result array
    for (const [key, value] of Object.entries(pivotData)) {
    
      for (const [k, v] of Object.entries(value)) {
        const obj = {};
        obj[key] = k;
        for (const [k1, v1] of Object.entries(v)) {
       
            if (k1!==pivotFields[0] && k1!==pivotFields[1]) {
                obj[k1] = v1;
          }
          result.push(obj);
          
        }
      }
    }
   // console.log(result);
    return result;
}
// function to convert the operator to mongodb operator
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


// GET endpoint to retrieve all datasets
app.get('/getAllDatasets', async (req, res) => {  
    try {
        await client.connect();
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
    } finally {
        await client.close();
    }
});

// get dataset list
app.get('/getDatasetList', async (req, res) => {  
    try {
        await client.connect();
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
    } finally {
        await client.close();
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
};