#Online Office Hours Queue 
Realtime queueing for course office hours. 

This branch is designed to for creating instances for other courses. This is a temporary fix.

##Steps

1. Get list of Google emails for TAs .
2. Add to prod seeds, using full email not just andrew id. 
3. Run createdb. 
4. Create a docker compose entry. Set the DB_NAME environmental variable and relevant course names.  Update 15-112 in index.html. 
5. Setup an nginx virtual host and a subdomain for the course. 
6. Setup certbot and HTTPS. 
7. Start up nodeapp. 
8. Run knex seed.  

