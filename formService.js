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

module.exports = function(app, client, dbName) {
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
         client.connect();
         const db = client.db(dbName);
        const collection = db.collection('datasets');

        // Insert the object into the collection
        // convert the string to json
         // Construct form data with metadata
         const dataset = {
            query: req.body.query,
            fields: req.body.fields,
            types: req.body.types,
            typeArray: req.body.typeArray,
            datasetName: req.body.datasetName,
            diagram: req.body.diagram,            
        };

        // check if the dataset exists
        const query = { datasetName: dataset.datasetName };
        // Check if a document with the given datasetName exists
        const existingDataset = await collection.findOne(query);
        var result="error";
        if (existingDataset) {
             // update the document
             result = await collection.updateOne(query, { $set: dataset });
             res.send({ message: 'Dataset updated successfully'});
        } else {
             result = await collection.insertOne(dataset);
             res.send({ message: 'Dataset stored successfully', _id: result.insertedId });
        }     
      
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("Error storing data: " + err.message);
    } 
    finally {
        await client.close();
    }
});

//store data of dataset

app.post('/storeDatasetData', async (req, res) => {

    try {
        await client.connect();
        const db = client.db(dbName);
        if (!req.body.datasetName || !req.body.data) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }
        const collection = db.collection(req.body.datasetName);
        collection.drop();
       
       // insert into collection all the data in the array req.body.data
        const result = await collection.insertMany(req.body.data);

        res.send({ message: 'Dataset data stored successfully', _id: result.insertedIds});
    
    } catch (err) {
        console.log(err.stack);
        res.status(500).send({ error: err.message });
    } finally {
        await client.close();
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
        const collection = db.collection(datasetName);
        const field = req.params.field;
        const distinctValues = await collection.distinct(field);
        if (distinctValues) {
            res.status(200).json(distinctValues);
        } else {
            res.status(404).send({error:`Distinct values for field ${field} in dataset ${datasetName} not found`});
        }
    } catch (err) {
        res.status(500).send("Error retrieving data: " + err.message);
    } finally {
        await client.close();
    }
});


// get dataset data by dataset name and filter
app.get('/getDatasetDataByFilter', async (req, res) => {
    try {
        console.log(req.query);
       
        const { datasetName, fields, value, groups, agg, funct } = req.query;
        if (!datasetName ) {
            return res.status(400).send({ error: 'Missing required parameters' });
          }
          const results = await filterDocuments(datasetName, fields, value, groups, agg, funct);
         
          res.status(200).json(results);
        } catch (err) {
            res.status(500).send({ error: err.message });
        }
      
    }
);
            

async function filterDocuments(datasetName, fields, values, groups, agg, funct) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(datasetName);
        const pipeline = [ ];
      // Split values by comma and trim whitespace
      if (fields && values) {
            const valuesArray = values.split(';').map(value => value.trim());
            const fieldsArray = fields.split(',').map(value => value.trim());
            //  console.log(valueArray);
            // Dynamically construct the query based on fields and values
            let query = {};
            fieldsArray.forEach((field, index) => {
            // Use $in if the corresponding value is an array, otherwise directly assign the value
            const values = valuesArray[index].split(',');
            query[field] =values.length>1 ? { $in: values } : values[0];
            });
            pipeline.push({ $match: query });
        }
          // check if group by and aggregation are provided
        if (groups && agg && funct) {
            console.log(groups);
              switch (funct) {
                case 'std':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $stdDevPop: `$${agg}` } } });
                break;
                case 'distinct':
                    // count distinct values
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $sum: 1 } } });
                break;
                case 'value':
                    pipeline.push({ $project: { [groups]: 1, [agg]: 1, _id: 0 } });
                break;
                case 'count':
                case 'sum':
                case 'avg':
                case 'min':
                case 'max': 
                case 'first':
                case 'last':                
                     pipeline.push({ $group: { _id: `$${groups}`, [agg]: { [`$${funct}`]: `$${agg}` } } });
                break;
               case 'percentile':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break;
                default:
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $sum: 1 } } });
                break;
                case 'var':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $variancePop: `$${agg}` } } });
                break;
                case 'regression':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break;
                case 'histogram':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break;
                case 'median':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break
                case 'mode':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break;
                case 'covariance':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break;
                case 'correlation':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break;
                case 'frequency':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $sum: 1 } } });
                break;
                case 'kmeans':
                    pipeline.push({ $group: { _id: `$${groups}`, [agg]: { $push: `$${agg}` } } });
                    pipeline.push({ $project: { [agg]: { $arrayElemAt: [`$${agg}`, 0] } } });
                break;
            }
            
           
        }
           // const results = await collection.aggregate(pipeline).toArray();
           console.log(pipeline);

        const options = {
           // skip: (page - 1) * limit, // Calculate the number of documents to skip
            limit: parseInt(1000), // Number of documents to limit the query to
          };
        const results = await collection.aggregate(pipeline,options).toArray();
        return results;
    } catch (err) {
      console.error('An error occurred:', err);
      throw err; // Rethrow the error after logging it
    }
    finally {
        await client.close();
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
        } else {
            res.status(500).send("Plot image not generated.");
        }
    });

});
    // Other form routes...
};