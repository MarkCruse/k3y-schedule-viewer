const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs"); // Import the File System module

// Function to fetch and process schedule
async function fetchAndSaveSchedule() {
  const url = "https://www.skccgroup.com/k3y/slot_list.php";

  try {
    console.log("Fetching schedule from:", url);
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);
    const table = $("table").first();

    if (!table.length) {
      console.error("No table found on the page");
      return;
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

    // Wrap the processed schedule in an object
    const scheduleData = { schedule: processedSchedule };

    // Save the processed schedule to a file
    fs.writeFile(
      "schedule.json",
      JSON.stringify(scheduleData, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing file", err);
        } else {
          console.log("schedule.json has been saved.");
        }
      }
    );
  } catch (error) {
    console.error("Error fetching or processing schedule:", error.message);
  }
}

// Call the function to fetch and save the schedule
fetchAndSaveSchedule();
