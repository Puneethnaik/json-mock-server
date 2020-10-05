/* eslint-disable eqeqeq */
const fs = require('fs')
const path = require('path')

const errors = require('./datastore_errors')

const find = (entity, conditions) => {
    return new Promise((resolve, reject) => {
        entityPresent(entity).then((isEntityPresent) => {
            if (!isEntityPresent) {
                reject(new errors.EntityNotPresentError())
                return
            }
            fs.readFile('datastore/store.json', (err, data) => {
                if (err) {
                    reject(new errors.TransactionFailedError())
                    return
                }
                // get the JSON of the data from the file
                data = JSON.parse(data)
                let entities = data[entity]
                if (conditions) {
                    for (const condition in conditions) {
                        if (conditions[condition].indexOf('{') == -1) {
                        } else {
                            // condition is an Object
                            conditions[condition] = JSON.parse(conditions[condition])
                        }
                    }
                    entities = entities.filter((entity) => {
                        let shouldInclude = true
                        for (const condition in conditions) {
                            if (condition.indexOf('_') == -1) {
                                const entityConditionValue = getValueOfEntityGivenCondition(entity, condition)
                                let doesEntityHaveConditionValueForCondition
                                if (conditions[condition] instanceof Object) {
                                    doesEntityHaveConditionValueForCondition = (entityConditionValue === JSON.stringify(conditions[condition]))
                                } else {
                                    doesEntityHaveConditionValueForCondition = (entityConditionValue === conditions[condition])
                                }
                                shouldInclude &= (doesEntityHaveConditionValueForCondition)
                            }
                        }
                        return shouldInclude
                    })
                    // sort the dataset if _sort is defined
                    if (conditions._sort) {
                        if (conditions._order) {
                            if (conditions._order === 'asc') {
                                entities.sort((A, B) => {
                                    if (getValueOfEntityGivenCondition(A, conditions._sort) < getValueOfEntityGivenCondition(B, conditions._sort)) {
                                        return -1
                                    } else {
                                        return 1
                                    }
                                })
                            } else if (conditions._order === 'desc') {
                                entities.sort((A, B) => {
                                    if (getValueOfEntityGivenCondition(A, conditions._sort) > getValueOfEntityGivenCondition(B, conditions._sort)) {
                                        return -1
                                    } else {
                                        return 1
                                    }
                                })
                            }
                        } else {
                            // default order is asc if _sort is defined.
                            entities.sort((A, B) => {
                                if (getValueOfEntityGivenCondition(A, conditions._sort) < getValueOfEntityGivenCondition(B, conditions._sort)) {
                                    return -1
                                } else {
                                    return 1
                                }
                            })
                        }
                    }
                }
                resolve(entities)
            })
        }, (err) => {
            console.log(err)
            reject(new errors.TransactionFailedError())
        })
    })
}
const getValueOfEntityGivenCondition = (entity, conditionName) => {
    const positionOfFirstDotOperator = conditionName.indexOf('.')
    if (positionOfFirstDotOperator !== -1) {
        const keyToFilterOn = conditionName.slice(0, positionOfFirstDotOperator)
        return getValueOfEntityGivenCondition(entity[keyToFilterOn], conditionName.slice(positionOfFirstDotOperator + 1))
    } else {
        if (!entity || !entity[conditionName]) {
            return null
        }
        if (entity[conditionName] instanceof Object) {
            return JSON.stringify(entity[conditionName])
        } else {
            return entity[conditionName]
        }
    }
}

const entityPresent = (entity) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'datastore/metadata.json'), (err, metaData) => {
            if (err) {
                reject(err)
                return
            }
            metaData = JSON.parse(metaData)
            resolve(metaData[entity] !== undefined)
        })
    })
}

const insert = (entity, item) => {
    return new Promise((resolve, reject) => {
        if (!item.id) {
            reject(new errors.IdNotPresentError())
            return
        }
        fs.readFile(path.join(__dirname, 'datastore/metadata.json'), (err, metaData) => {
            if (err) {
                reject(new errors.TransactionFailedError())
                return
            }
            metaData = JSON.parse(metaData)
            const newMetaData = JSON.parse(JSON.stringify(metaData))
            if (!newMetaData[entity]) {
                newMetaData[entity] = true
            }
            fs.readFile(path.join(__dirname, 'datastore/store.json'), (err, data) => {
                if (err) {
                    reject(new errors.TransactionFailedError())
                    return
                }
                data = JSON.parse(data)
                if (!data[entity]) {
                    data[entity] = []
                }
                for (const subEntity of data[entity]) {
                    if (subEntity.id == item.id) {
                        reject(new errors.IntegrityConstraintViolationError())
                        return
                    }
                }
                data[entity].push(item)
                fs.writeFile(path.join(__dirname, 'datastore/metadata.json'), JSON.stringify(newMetaData), (err) => {
                    if (err) {
                        reject(new errors.TransactionFailedError())
                        return
                    }
                    fs.writeFile(path.join(__dirname, 'datastore/store.json'), JSON.stringify(data), (err) => {
                        if (err) {
                            rollBack(path.join(__dirname, 'datastore/metadata.json'), metaData)
                            reject(new errors.TransactionFailedError())
                            return
                        }
                        resolve('OK')
                    })
                })
            })
        })
    })
}

const rollBack = (fileName, oldData) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, oldData, (err) => {
            if (err) {
                reject(err)
                return
            }
            resolve('Rollback successful')
        })
    })
}

const update = (entity, item) => {
    return new Promise((resolve, reject) => {
        if (!item.id) {
            reject(new errors.IdNotPresentError())
            return
        }
        entityPresent(entity).then(isEntityPresent => {
            if (!isEntityPresent) {
                reject(new errors.EntityNotPresentError())
                return
            }
            fs.readFile('datastore/store.json', (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                data = JSON.parse(data)
                const entities = data[entity]
                let entityFound = false
                for (const key in entities) {
                    if (entities[key].id == item.id) {
                        entityFound = true
                        entities[key] = item
                        break
                    }
                }
                if (!entityFound) {
                    reject(new errors.NoSuchEntityError())
                    return
                }
                data[entity] = entities
                fs.writeFile('datastore/store.json', JSON.stringify(data), (err) => {
                    if (err) {
                        reject(new errors.TransactionFailedError())
                        return
                    }
                    resolve('OK')
                })
            })
        }, _ => {
            reject(new errors.TransactionFailedError())
        })
    })
}

const partialUpdate = (entity, item) => {
    return new Promise((resolve, reject) => {
        entityPresent(entity).then(isEntityPresent => {
            if (!isEntityPresent) {
                reject(new errors.EntityNotPresentError())
                return
            }
            fs.readFile('datastore/store.json', (err, data) => {
                if (err) {
                    reject(new errors.TransactionFailedError())
                }
                data = JSON.parse(data)
                const entities = data[entity]
                let entityFound = false
                for (const key in entities) {
                    if (entities[key].id == item.id) {
                        entityFound = true
                        const entityToUpdate = entities[key]
                        for (const key in item) {
                            entityToUpdate[key] = item[key]
                        }
                        break
                    }
                }
                if (!entityFound) {
                    reject(new errors.NoSuchEntityError())
                    return
                }
                data[entity] = entities
                fs.writeFile('datastore/store.json', JSON.stringify(data), (err) => {
                    if (err) {
                        reject(new errors.TransactionFailedError())
                        return
                    }
                    resolve('OK')
                })
            })
        }, _ => {
            reject(new errors.TransactionFailedError())
        })
    })
}

const remove = (entity, id) => {
    return new Promise((resolve, reject) => {
        entityPresent(entity).then(isEntityPresent => {
            if (!isEntityPresent) {
                reject(new errors.EntityNotPresentError())
                return
            }
            fs.readFile('datastore/store.json', (err, data) => {
                if (err) {
                    reject(new errors.TransactionFailedError())
                    return
                }
                data = JSON.parse(data)
                const entities = data[entity]
                let entityFound = false
                let entityToDelete
                for (let i = 0; i < entities.length; i++) {
                    if (entities[i].id == id) {
                        entityFound = true
                        entityToDelete = i
                        break
                    }
                }
                if (!entityFound) {
                    reject(new errors.NoSuchEntityError())
                    return
                }
                entities.splice(entityToDelete, 1)
                if (entities.length === 0) {
                    fs.readFile(path.join(__dirname, 'datastore/metadata.json'), (err, metaData) => {
                        if (err) {
                            reject(new errors.TransactionFailedError())
                            return
                        }
                        metaData = JSON.parse(metaData)
                        const newMetaData = JSON.parse(JSON.stringify(metaData))
                        delete newMetaData[entity]
                        delete data[entity]
                        fs.writeFile('datastore/metadata.json', JSON.stringify(newMetaData), (err) => {
                            if (err) {
                                reject(new errors.TransactionFailedError())
                                return
                            }
                            fs.writeFile('datastore/store.json', JSON.stringify(data), (err) => {
                                if (err) {
                                    rollBack('datastore/metadata.json', metaData).then(result => {
                                        reject(new errors.TransactionFailedError())
                                    }, _ => {
                                        reject(new errors.TransactionFailedError())
                                    })
                                } else {
                                    resolve('OK')
                                }
                            })
                        })
                    })
                } else {
                    data[entity] = entities
                    fs.writeFile('datastore/store.json', JSON.stringify(data), (err) => {
                        if (err) {
                            reject(new errors.TransactionFailedError())
                            return
                        }
                        resolve('OK')
                    })
                }
            })
        }, _ => {
            reject(new errors.TransactionFailedError())
        })
    })
}

module.exports = {
    find,
    insert,
    update,
    remove,
    partialUpdate,
    entityPresent
}
