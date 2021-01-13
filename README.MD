# Start CouchDB
```bash
docker stop query 
docker rm query
docker run -d -p 5984:5984 -e COUCHDB_USER=<user> -e COUCHDB_PASSWORD=<password> --name query couchdb
```

# Start fabric-explorer
```bash
npm run start:dev
```
