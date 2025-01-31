# k3y-schedule-viewer
This Node.js-based API scrapes, processes, and serves the K3Y operator schedule from the SKCC website. It allows filtering of the main schedule by callsign, state, area, and day. The API provides data for both currently scheduled operators and the upcoming hour's schedule.


How to Run Everything
Install Dependencies:
```bash
npm install express axios cheerio
```
Run the Server:
```bash
node server.js
```
Access the Webpage:

Open your browser and go to: ```http://localhost:3000```.

View the Results:

The app will fetch and display the filtered schedule in a table format.
If no schedule matches, it will display a "No schedule found" message.

---

## Run Script in the Background: Use a process manager like pm2 to run the script continuously.  

1. Install pm2 globally  
```bash 
npm install -g pm2  
```

2. Start the script with pm2:  
```bash
pm2 start k3y-schedule-viewer.js --name "k3y-schedule-viewer"
```
To explicitly set the working directory:
```bash
pm2 start server.js --name "k3y-schedule-viewer" --cwd ~/documents/k3y-schedule-viewer
```

3. To check its status:  
```bash
pm2 status
```

4. Stop the script:  
```bash
pm2 stop k3y-schedule-viewer
```

5. After making changes to the javascript
```bash
pm2 reload k3y-schedule-viewer  # Use this after making changes
