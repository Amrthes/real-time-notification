Commands for your friend
1. Install Node.js dependencies
npm install


2. Start Redis using Docker
If Docker Desktop is installed and running on her computer:
docker run -d --name notification-redis -p 6379:6379 redis:7


3. Verify Redis
docker exec -it notification-redis redis-cli ping


Expected output:
PONG


4. Start the Node.js server
node server.js


Expected output:
Connected to Redis
Server running at http://localhost:3000


5. Open the application
Visit http://localhost:3000 in her browser.
6. Test a notification
Open a second PowerShell terminal in the same project folder and run:
Invoke-RestMethod -Uri "http://localhost:3000/follow" -Method POST -ContentType "application/json" -Body '{"followerId":"menaja","followedId":"dhoni"}'


The notification should appear in the browser without refreshing the page.
