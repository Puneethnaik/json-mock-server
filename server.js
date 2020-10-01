const express = require("express");
const fs = require("fs");
const datastore = require("./datastore_access");
const datastore_errors = require("./datastore_errors");


let app = express();

let port = 3001;

app.get("/:entity", async (req, res) => {
    try {
        let result = await datastore.find(req.params.entity);
        res.json(result);
    } catch(e) {
        if(e instanceof datastore_errors.EntityNotPresentError) {
            res.status(404).send("The requested entity was not found.");
        }
    }
})

app.get("/:entity/:id", async (req, res) => {
    try {
        let result = await datastore.find(req.params.entity, {id: req.params.id})
    }
})

app.listen(port, () => {
    console.log(`The server is listening on port ${port}`);
})