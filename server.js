const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
//const cors = require("cors");
const fs = require("fs"); // Import the File System module
const app = express();
const PORT = 3000;

// Enable CORS to handle requests from different origins
//app.use(cors());

// Serve static files from the "public" directory
app.use(express.static("public"));

// API route to fetch and process schedule
app.get("/api/schedule", async (req, res) => {
  const url = "https://www.skccgroup.com/k3y/slot_list.php";
  const callsign = (req.query.callsign || "").toUpperCase(); // Convert callsign to uppercase or empty string if not provided

  try {
    console.log("Fetching schedule from:", url);
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);
    const table = $("table").first();

    if (!table.length) {
      console.error("No table found on the page");
      return res
        .status(500)
        .json({ error: "No schedule table found on the page" });
    }

    const rows = [];
    table.find("tr").each((i, row) => {
      const cells = [];
      $(row)
        .find("td, th")
        .each((j, cell) => {
          cells.push($(cell).text().trim());
        });
      rows.push(cells);
    });

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const schedule = dataRows.map((row) =>
      headers.reduce((obj, header, index) => {
        obj[header] = row[index] || "";
        return obj;
      }, {})
    );

    // If a callsign is provided, filter the schedule to match
    const filteredSchedule = callsign
      ? schedule.filter(
          (entry) =>
            entry["Operator ID"] &&
            entry["Operator ID"].toUpperCase().startsWith(callsign)
        )
      : schedule; // If no callsign is provided, return the full schedule

    // Process the schedule to format the data
    const processedSchedule = schedule.map((entry) => {
      const operatorId = entry["Operator ID"] || "";
      const [Callsign, Name, State, SKCCRaw] = operatorId.split("-", 4);
      const StartUTC = entry["Start"];
      const EndUTC = entry["End"];
      const DateStr = entry["Jan"];
      const Area = entry["Area"];

      const SKCC =
        SKCCRaw && SKCCRaw.includes("_") ? SKCCRaw.split("_")[0] : SKCCRaw;

      return {
        date: `${DateStr}`,
        utcTime: `${StartUTC} - ${EndUTC}`,
        callsign: Callsign || "N/A",
        name: Name || "N/A",
        state: State || "N/A",
        area: Area || "N/A",
        skcc: SKCC || "N/A",
      };
    });

    //console.log("Processed schedule:", processedSchedule); // Debug log the processed schedule

    // Save the processed schedule to a file
    /*     fs.writeFile(
      "schedule.json",
      JSON.stringify(processedSchedule, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing file", err);
        } else {
          console.log("schedule.json has been saved.");
        }
      }
    ); */

    res.json({ schedule: processedSchedule });
  } catch (error) {
    console.error("Error fetching or processing schedule:", error.message);
    res.status(500).json({ error: "Failed to fetch or process the schedule" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
