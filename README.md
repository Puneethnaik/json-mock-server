# JSON Mock Server

# Concurrency details of various methods
- GET: Reading the state provides eventual consistency; reads will eventually read the latest state of the datastore.
- POST: 
- PUT: Optimistic concurrency control through ETag
- DELETE: 