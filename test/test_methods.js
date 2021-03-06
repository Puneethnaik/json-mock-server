const chai = require('chai')
const { describe, before, it } = require('mocha')
const chaiHttp = require('chai-http')
const uuid = require('uuid')
const fs = require('fs')
const server = require('../server')

chai.use(chaiHttp)

let entity
let book
let etag

describe('Store', () => {
    before(done => {
        entity = uuid.v4()
        book = {
            id: uuid.v4(),
            name: uuid.v4(),
            author: uuid.v4(),
            address: {
                building: uuid.v4(),
                street: uuid.v4(),
                landmark: uuid.v4()
            }
        }
        done()
    })
    describe('/POST', () => {
        it('it should POST a book', done => {
            // chai.request(url)
            // client
            chai.request(server)
                .post(`/${entity}`)
                .send(book)
                .end((err, res) => {
                    if (err) {
                        throw err
                    }
                    chai.expect(res.status).to.be.equal(200)
                    chai.expect(res.body).to.be.equal('OK')
                    fs.readFile('datastore/store.json', (err, data) => {
                        if (err) {
                            throw err
                        }
                        data = JSON.parse(data)
                        let entityFound = false
                        for (const _entity of data[entity]) {
                            if (JSON.stringify(_entity) === JSON.stringify(book)) {
                                entityFound = true
                                break
                            }
                        }
                        chai.expect(entityFound).to.be.equal(true)
                        done()
                    })
                })
        })
        it('it should fetch a book', done => {
            // chai.request(url)

            // client
            chai.request(server)
                .get(`/${entity}/${book.id}`)
                .end((err, res) => {
                    if (err) {
                        throw err
                    }
                    console.log(`GET /${entity}/${book.id}`)
                    etag = res.header.etag
                    chai.expect(res.status).to.be.equal(200)
                    chai.expect(JSON.stringify(res.body)).to.be.equal(JSON.stringify(book))
                    done()
                })
        })
        it('it should DELETE a book', done => {
            // chai.request(url)

            // client
            chai.request(server)
                .delete(`/${entity}/${book.id}`)
                .set('ETag', etag)
                .end((err, res) => {
                    if (err) {
                        throw err
                    }
                    chai.expect(res.status).to.be.equal(200)
                    fs.readFile('datastore/store.json', (err, data) => {
                        if (err) {
                            throw err
                        }
                        data = JSON.parse(data)
                        chai.expect(data[entity] === undefined).to.be.equal(true)
                        done()
                    })
                })
        })
    })
})
