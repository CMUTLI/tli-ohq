# 15-112-Queue
Realtime queueing for office hours.

## Running Locally
These instructions are for Mac or Linux users, because all current devs are running some kind of unix. Google the Windows equivalents!  

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

Use the Dockerfile in `./app/`.

Set the environment variable `PORT=80`.

Database: ensure a Postgres database is configured and the following environment variables are set:

- RDS_HOSTNAME
- RDS_PORT
- RDS_DB_NAME
- RDS_USERNAME
- RDS_PASSWORD

Mount `/run/secrets/` containing `sp-cert.pem` and `sp-key.pem` for shibboleth.

## Testing Procedures
- Run stress test
- Run unit tests on all browser types
- Test on mobile using chrome dev tools

