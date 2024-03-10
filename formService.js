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
        await client.connect();
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
        res.status(500).send("Error storing data: " + err.message);
    } finally {
        await client.close();
    }
});

// GET endpoint to retrieve data
app.get('/getDataset/:datasetName', async (req, res) => {   
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('datasets');

        // Find the document in the collection
        const datasetName = req.params.datasetName;
        const query = { datasetName: datasetName };
        const dataset = await collection.findOne(query);

        if (dataset) {
            res.status(200).json(dataset);
        } else {
            res.status(404).send(`Dataset with name ${datasetName} not found`);
        }
    } catch (err) {
        res.status(500).send("Error retrieving data: " + err.message);
    } finally {
        await client.close();
    }
});

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

    // Other form routes...
};
