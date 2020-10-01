const fs = require("fs");
const errors = require("./datastore_errors");

let find = function(entity, conditions) {
    let isEntityPresent = entityPresent(entity);
    if(!isEntityPresent) {
        throw new errors.EntityNotPresentError;
    }
    let datastore = fs.readFile("datastore/store.json", (err, data) => {
        if(err) {
            throw err;
        }
        //get the JSON of the data from the file
        data = JSON.parse(data);
        let entities = data[entity];
        if(conditions) {
            entities.filter((entity) => {
                let shouldInclude = true;
                for(let condition in conditions) {
                    shouldInclude &= (entity[condition] === conditions[condition]);
                }
                return shouldInclude;
            })
            
        } else {
        }
        return new Promise(resolve => {
            resolve(entities);
        })
    })
}
let entityPresent = (entity) => {
  let metadata = fs.readFile("datastore/metadata.json", (err, metaData) => {
    if(err) {
        throw err;
    }
    metaData = JSON.parse(metaData);
    if(metaData[entity] !== undefined) {
        return false;
    } else {
        return true;
    }
  })  
}

module.exports = {
    find,
    entityPresent
}