class EntityNotPresentError extends Error {
    constructor() {
        super();
        this.message = "The requested entity is not found";
    }
}

module.exports = {
    EntityNotPresentError
}