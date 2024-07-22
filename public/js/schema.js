// list all the dataset schema in the datasetListBar div


function saveSchema(event) {
    // get the schema editor
    var schema=  { links: erd2.ERDLinks, tables: erd2.ERDTables };
    
    metadata = schema;
    console.log(schema);
    // save the schema data to the server
    const SchemaBarBodyBodyTextArea = document.getElementById('SchemaBarBodyBodyTextArea');
    SchemaBarBodyBodyTextArea.value = JSON.stringify(schema);
    // save the schema data to the server storeOrUpdateMetaschemaLinks
    fetch('/storeOrUpdateMetaschema', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // show the success message
        showToast('Success!', 5000); // Show toast for 5 seconds
    })
}

function loadSchema(draw=false) {
    // get the schema data from the server
    fetch('/getMetaschema')
    .then(response => response.json())
    .then(schema => {
        metadata = schema;       
        // load the schema data to the editor
        if (draw)
            {
            const SchemaBarBodyBodyTextArea = document.getElementById('SchemaBarBodyBodyTextArea');
            SchemaBarBodyBodyTextArea.value = JSON.stringify(schema);
            erd2.ERDTables = schema.tables;
        
            erd2.ERDLinks = schema.links;
        
            erd2.drawAll();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}