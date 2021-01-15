# Start CouchDB
```bash
docker stop query 
docker rm query
docker run -d -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=Password123 --name query couchdb
```

# Run fabric-explorer
```bash
docker run \
  --env EXPLORER_WALLET_URL="<url>" \
  --env EXPLORER_WALLET_IDENTITY=issuer \
  --env EXPLORER_DB_URL="http://admin:Password123@query:5984" \
  -v "network-config.json":/config/network-config.json \
  --name etl \
   pravici/fabric-explorer
```
