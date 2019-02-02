# 15-112-Queue
Realtime queueing for office hours.

## Running Locally
This tutorial is mostly for Mac users, because all current devs have macs. Google the Windows' equivalents!  

Run postgresql locally if not already running:
```
pg_ctl -D /usr/local/var/postgres start
```
If you don't have `knex`:
```
sudo npm install knex -g
```
Then:
```
cd app
npm install 
knex migrate:latest
knex seed:run
npm start
```

Navigate to `localhost:3000`. Don't use `127.0.0.1:3000`. It will break parts of the queue (a cookie domain issue). 

## Interacting with the database

### Local
```
psql queue
```

### Prod (please only do this if you know what you are doing)

Make sure there is a security group that allows for `ssh` access on the DB instance.
```
psql --host=aaxorijd436n8a.cxxtl6ujavn8.us-east-2.rds.amazonaws.com --user=queue --db=ebdb
```
Note: the host address (`aaxorijd436n8a.cxxtl6ujavn8.us-east-2.rds.amazonaws.com`) will change as RDS provisions new boxes for our DB, so just check RDS for the exact url if we ever upgrade/change instances.

## Testing Procedures
- Run stress test
- Run unit tests on all browser types
- Test on mobile using chrome dev tools

## Database Environmental Variables
- RDS_HOSTNAME 
- RDS_PORT 
- RDS_DB_NAME 
- RDS_USERNAME 
- RDS_PASSWORD 