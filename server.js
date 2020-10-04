/* eslint-disable eqeqeq */
const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const datastore = require('./datastore_access')
const datastoreErrors = require('./datastore_errors')
const path = require('path')
const { remove } = require('./datastore_access')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const port = 3001

app.get('/:entity', (req, res) => {
    datastore.find(req.params.entity, req.query).then(result => {
        fs.stat(path.join(__dirname, 'datastore/store.json'), (err, stats) => {
            if (err) {
                res.status(503).send('The request could not be processed.')
            }
            res.setHeader('ETag', parseInt(stats.mtime.getTime()))
            res.json(result)
        })
    }, (error) => {
        handleError(error, res)
    })
})

app.get('/:entity/:id', (req, res) => {
    fs.stat(path.join(__dirname, 'datastore/store.json'), (err, stats) => {
        if (err) {
            res.status(503).send('The request could not be processed.')
        }
        res.setHeader('ETag', parseInt(stats.mtime.getTime()))
        datastore.find(req.params.entity, { id: req.params.id }).then(result => {
            res.json(result[0])
        }, error => {
            handleError(error, res)
        })
    })
})

app.post('/:entity', (req, res) => {
    fs.stat(path.join(__dirname, 'datastore/store.json'), (err, stats) => {
        if (err) {
            res.status(503).send('The request could not be processed.')
            return
        }
        datastore.insert(req.params.entity, req.body).then(result => {
            setTimeout(() => {
                res.json(result)
            }, 1000)
        }, error => {
            handleError(error, res)
        })
    })
})

app.put('/:entity/:id', (req, res) => {
    const requestETag = req.header('ETag')
    fs.stat(path.join(__dirname, 'datastore/store.json'), (err, stats) => {
        if (err) {
            res.status(503).send('The request could not be processed.')
            return
        }
        if (parseInt(stats.mtime.getTime()) != requestETag) {
            res.status(412).send('The data has been modified after access. Please try again later.')
            return
        }
        const entity = JSON.parse(JSON.stringify(req.body))
        entity.id = req.params.id
        datastore.update(req.params.entity, entity).then(result => {
            res.json(result)
        }, error => {
            handleError(error, res)
        })
    })
})

app.delete('/:entity/:id', (req, res) => {
    const requestETag = req.header('ETag')
    fs.stat(path.join(__dirname, 'datastore/store.json'), (err, stats) => {
        if (err) {
            res.status(503).send('The request could not be processed.')
            return
        }
        if (parseInt(stats.mtime.getTime()) != requestETag) {
            res.status(412).send('The data has been modified after access. Please try again later.')
            return
        }
        remove(req.params.entity, req.params.id).then(result => {
            res.status(200).send(result)
        }, error => {
            handleError(error, res)
        })
    })
})

app.patch('/:entity/:id', (req, res) => {
    const requestETag = req.header('ETag')
    fs.stat(path.join(__dirname, 'datastore/store.json'), (err, stats) => {
        if (err) {
            res.status(503).send('The request could not be processed.')
            return
        }
        if (parseInt(stats.mtime.getTime()) != requestETag) {
            res.status(412).send('The data has been modified after access. Please try again later.')
            return
        }
        const entity = JSON.parse(JSON.stringify(req.body))
        entity.id = req.params.id
        datastore.partialUpdate(req.params.entity, entity).then(result => {
            res.json(result)
        }, error => {
            handleError(error, res)
        })
    })
})

const handleError = (error, res) => {
    if (error instanceof datastoreErrors.TransactionFailedError) {
        res.status(503).send(error.message)
    } else if (error instanceof datastoreErrors.IntegrityConstraintViolationError) {
        res.status(403).send(error.message)
    } else if (error instanceof datastoreErrors.NoSuchEntityError) {
        res.status(403).send(error.message)
    } else if (error instanceof datastoreErrors.EntityNotPresentError) {
        res.status(403).send(error.message)
    } else {
        res.status(500).send('It is not you. It is us. Please refresh and try again.')
    }
}

app.listen(port, () => {
    console.log(`The server is listening on port ${port}`)
})

module.exports = app
