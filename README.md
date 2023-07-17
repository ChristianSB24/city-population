# City Population

In this project my goal was to create a highly performant service. The service has two routes:

```
GET /api/population/state/:state/city/:city
PUT /api/population/state/:state/city/:city
```
The GET route returns the population of the requested state/city combination. The PUT route updates the state/city population or creates a new entry if one doesn't already exist. 

## Setup

Running the service:
```
npm install
npm run start
```

The service runs on port 5555

## Usage

Example requests:

Returns the population of Hunstville, Alabama
```
curl http://127.0.0.1:5555/api/population/state/alabama/city/huntsville
```
It returns the data in this format:
```
{ "population": 216963 }
```
Updates the population of Huntsville, Alabama. The body needs to be in plain text.
```
curl -X PUT -H 'Content-Type: text/plain' -d '220000' http://127.0.0.1:5555/api/population/state/alabama/city/huntsville
```

## How I built the service
Since my service needed to have fast response times, I created an in-memory cache. This would make the GET requests extremely quick. For the updates, I updated the cache first and then the database since the cache is the main data store. For the database client, I chose the better-sqlite3 node package since it is more performant than other SQLite packages.

Originally, I used the Fastify REST framework since it is known for its speed. However, since my service is extremely simple, I opted to create my own custom server. Using the Fastify REST framework, my request latency was already extremely low, however, with my own custom server I saw a significant decrease. In particular, the PUT requests were approximately 20% faster based on my own testing. The GET requests were also faster.

One area of improvement is to run multiple instances of the service to improve concurrency. This is not a simple task since the in-memory global cache needs to be shared across all instances. I looked into using the cluster and worker_threads packages, but sharing the cache between all threads over-complicated the service. I chose to run the service on a single thread since Node works very well with the service's I/O operations. However, including a distributed cache such as Redis would improve the service's performance. This could be a future improvement.

