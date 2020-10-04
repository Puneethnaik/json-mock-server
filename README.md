# JSON Mock Server

# Concurrency details of various methods
- GET: Reading the state provides eventual consistency; reads will eventually read the latest state of the datastore.
- POST: 
- PUT: Optimistic concurrency control through ETag
- DELETE: 

# Reference
- https://blog.4psa.com/rest-best-practices-managing-concurrent-updates/
- https://dzone.com/articles/concurrency-control-in-rest-api-with-spring-framew
- https://blog.nodeswat.com/concurrency-mysql-and-node-js-a-journey-of-discovery-31281e53572e
- https://en.wikipedia.org/wiki/Optimistic_concurrency_control
- https://expressjs.com/en/api.html#req