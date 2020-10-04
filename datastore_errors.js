class EntityNotPresentError extends Error {
    constructor () {
        super()
        this.message = 'The requested entity is not found in metadata.'
    }
}

class NoSuchEntityError extends Error {
    constructor () {
        super()
        this.message = 'The requested entity is not found in the store.'
    }
}

class TransactionFailedError extends Error {
    constructor () {
        super()
        this.message = 'The transaction has failed.'
    }
}

class IntegrityConstraintViolationError extends Error {
    constructor () {
        super()
        this.message = 'Performing an operation caused an integrity constraint violation.'
    }
}

module.exports = {
    EntityNotPresentError,
    NoSuchEntityError,
    TransactionFailedError,
    IntegrityConstraintViolationError
}
