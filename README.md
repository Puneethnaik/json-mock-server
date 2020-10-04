# JSON Mock Server

# Concurrency details of various methods
- GET: Reading the state provides eventual consistency; reads will eventually read the latest state of the datastore.
- POST: No concurrency control, no conflicts as if A and B both make POST requests whoever successfully completes the request(lets say A), these changes will NOT BE OVERRIDDEN as an IntegrityViolationError is raised for Bs request, and is not processed.
- PUT: Optimistic concurrency control through ETag
- DELETE: Optimistic concurrency control through ETag 

# Granularity of concurrency
Right now, the modified time of store.json file is considered, which means the granularity of concurrency is on the whole file. 
This means that if two requests are updating any resource simultaneously, the second request is not allowed. 


# Reference
- https://blog.4psa.com/rest-best-practices-managing-concurrent-updates/
- https://dzone.com/articles/concurrency-control-in-rest-api-with-spring-framew
- https://blog.nodeswat.com/concurrency-mysql-and-node-js-a-journey-of-discovery-31281e53572e
- https://en.wikipedia.org/wiki/Optimistic_concurrency_control
- https://expressjs.com/en/api.html#req