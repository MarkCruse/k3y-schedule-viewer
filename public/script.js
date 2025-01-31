/// Start the processes
scheduleHourlyFetch();

//  >>>>>>>>>>>>>  F U N C T I O N S  <<<<<<<<<<<<<<<<

// Function to fetch data from the API
async function fetchData() {
  const apiUrl = "/api/schedule";

  try {
    const response = await fetch(apiUrl); // Replace with your actual API URL
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    const { schedule } = data;
    originalSchedule = [...schedule]; // Keep the original schedule to reset when necessary

    // Save JSON to a file
    // saveJsonToFile(data, "schedule.json");

    // Call a function to update the page with the new data
    updatePage(data); // Replace with your DOM manipulation logic
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  // Mock version to fetch data from a JSON file for testing
  /*
  try {
    const response = await fetch("schedule.json"); // Replace with your JSON file path
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const { schedule } = data;
    console.log(schedule);

    originalSchedule = [...schedule]; // Keep the original schedule to reset when necessary

    updatePage(data); // Replace with your DOM manipulation logic
  } catch (error) {
    console.error("Error fetching data:", error);
  }
    */
}

// Function to save JSON to a file
function saveJsonToFile(jsonData, filename) {
  const jsonString = JSON.stringify(jsonData, null, 2); // Convert JSON to string with indentation
  const blob = new Blob([jsonString], { type: "application/json" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to render a table
function renderTable(data, tableId) {
  const outputDiv = document.getElementById(tableId);
  outputDiv.textContent = ""; // Clear previous content

  if (data.length > 0) {
    // Create a table element
    const table = document.createElement("table");

    // Create the table header row
    const headerRow = document.createElement("tr");
    ["Date", "UTC Time", "Callsign", "Name", "State", "Area", "SKCC"].forEach(
      (header) => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
      }
    );
    table.appendChild(headerRow);

    // Populate the table rows with schedule data
    data.forEach((entry) => {
      const row = document.createElement("tr");
      ["date", "utcTime", "callsign", "name", "state", "area", "skcc"].forEach(
        (key) => {
          const td = document.createElement("td");
          td.textContent = entry[key] || "N/A"; // Use "N/A" if a field is missing
          row.appendChild(td);
        }
      );
      table.appendChild(row);
    });

    // Append the table to the output div
    outputDiv.appendChild(table);
  } else {
    outputDiv.textContent = "No schedule data available.";
  }
}

// Function to update the title dynamically
function updateTitle(callsign, state, area, day) {
  let main_title = "Main Schedule";
  if (callsign) {
    main_title = `Main Schedule - filtered by callsign: ${callsign}`;
  } else if (state) {
    main_title = `Main Schedule - filtered by state: ${state}`;
  } else if (area) {
    main_title = `Main Schedule - filtered by area: ${area}`;
  } else if (day) {
    main_title = `Main Schedule - filtered by date: ${day}`;
  }
  document.querySelector("#main-schedule-title").textContent = main_title;
}
// Helper function to check if an hour is within a time range (including minutes)
function isHourInRange(hour, timeRange) {
  // Split time range into start and end times (hour and minute)
  const [start, end] = timeRange.split(" - ").map((t) => {
    const [h, m] = t.split(":");
    return { hour: parseInt(h), minute: parseInt(m) };
  });

  const startHour = start.hour;
  const startMinute = start.minute;
  const endHour = end.hour;
  const endMinute = end.minute;

  // If the range spans over midnight (start hour > end hour), adjust logic
  if (
    endHour < startHour ||
    (endHour === startHour && endMinute < startMinute)
  ) {
    // Check if the hour is in the current or next day, considering minutes
    return (
      hour > startHour ||
      (hour === startHour && startMinute <= 59) ||
      hour < endHour ||
      (hour === endHour && endMinute > 0) // Fixed: exclude hour exactly at end time
    );
  }

  // Otherwise, check if the hour falls within the start and end times
  if (hour === startHour) {
    return startMinute <= 59; // Event starts before or at the hour
  }

  if (hour === endHour) {
    return endMinute > 0; // Fixed: exclude hour exactly at end time
  }

  return hour > startHour && hour < endHour; // Event is fully within the range
}

// Function to get the current UTC time and filter data for the current UTC hour and day
function getCurrentUTCTimeSchedule() {
  const currentTime = new Date();
  const currentHour = currentTime.getUTCHours();
  const nextHour = (currentHour + 1) % 24;
  const currentDay = currentTime.getUTCDate(); // Get the current numeric day in UTC (e.g., 25)

  // Define the time range for the current and next hour
  const currentHourStart = `${currentHour}:00`;
  const currentHourEnd = `${currentHour}:59`;
  const nextHourStart = `${nextHour}:00`;
  const nextHourEnd = `${nextHour}:59`;

  // Filter schedule for the current hour and current day
  const currentHourSchedule = originalSchedule.filter((entry) => {
    const entryDay = parseInt(entry["date"]); // Extract the day from the date (e.g., "2025-01-25")
    const entryTimeRange = entry["utcTime"];
    return (
      entryDay === currentDay && isHourInRange(currentHour, entryTimeRange)
    );
  });

  renderTable(currentHourSchedule, "current-hour");

  // Filter schedule for the next hour and current day
  const nextHourSchedule = originalSchedule.filter((entry) => {
    const entryDay = parseInt(entry["date"]); // Extract the day from the date
    const entryTimeRange = entry["utcTime"];
    return entryDay === currentDay && isHourInRange(nextHour, entryTimeRange);
  });

  renderTable(nextHourSchedule, "next-hour");
  document.querySelector(
    "#current-hour-title"
  ).textContent = `Current Hour Schedule ${currentHourStart}-${currentHourEnd}`;
  document.querySelector(
    "#next-hour-title"
  ).textContent = `Next Hour Schedule ${nextHourStart}-${nextHourEnd}`;
}

// Function to update the time
function updateTimes() {
  const nowUTC = new Date();
  const localTime = new Date(nowUTC.toLocaleString());

  // Format UTC time to HH:MM in 24-hour format
  const utcTimeString = nowUTC.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC", // Ensure UTC time is shown
    hour12: false, // Force 24-hour format
  });

  // Format Local time to HH:MM
  const localTimeString = localTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Use 24-hour format for local time as well
  });

  // Combine both times and display them on the same line
  document.querySelector(
    "#time-display"
  ).textContent = `${utcTimeString} UTC / ${localTimeString}`;
}

function startMinuteUpdates() {
  // Display the time immediately
  updateTimes();

  // Get the current time
  const now = new Date();

  // Calculate the milliseconds until the next minute starts
  const timeToNextMinute =
    60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

  // Set a timeout to sync at the start of the next minute
  setTimeout(() => {
    // Call the update function immediately at the start of the next minute
    updateTimes();

    // Then start the interval to repeat every minute
    setInterval(updateTimes, 60000);
  }, timeToNextMinute);
}

// Function to update the current and next hour schedules every hour
function startHourlyUpdates() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0); // Reset to the top of the current hour
  nextHour.setHours(now.getHours() + 1); // Move to the next hour

  const timeUntilNextHour = nextHour - now; // Time difference in milliseconds

  // Schedule the first hourly update
  setTimeout(() => {
    // Call the function to refresh tables
    getCurrentUTCTimeSchedule();

    // Then schedule it to run every hour
    setInterval(getCurrentUTCTimeSchedule, 60 * 60 * 1000);
  }, timeUntilNextHour);
}

// Function to schedule hourly fetches and refresh the tables
function scheduleHourlyFetch(data) {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0); // Reset to the top of the current hour
  nextHour.setHours(now.getHours() + 1); // Move to the next hour

  const timeUntilNextHour = nextHour - now; // Time difference in milliseconds
  const timeUntilNextHourInMinutes = timeUntilNextHour / 1000 / 60; // Convert to minutes

  console.log(
    `Next fetch scheduled in ${timeUntilNextHourInMinutes.toFixed(
      2
    )} minutes at ${nextHour.toLocaleTimeString()}`
  );

  // Fetch data immediately and update tables
  fetchData().then(() => {
    getCurrentUTCTimeSchedule(); // Refresh the current/next hour tables after fetching data
    const currentTime = new Date();
    console.log(`Fetching schedule at ${currentTime.toLocaleTimeString()}`);
  });

  // Schedule the next fetch at the top of the next hour
  setTimeout(() => {
    scheduleHourlyFetch(); // Recursively schedule the next fetch
  }, timeUntilNextHour);
  startHourlyUpdates();
  startMinuteUpdates();
}

// ****************  C A L L S I G N  ****************************
// Function to update the page with fetched data (customize this)
function updatePage(data) {
  const { schedule } = data;
  const originalSchedule = [...schedule]; // Keep the original schedule to reset when necessary
  // Filter by callsign
  document.getElementById("callsign").addEventListener("input", (e) => {
    const value = e.target.value.toUpperCase();

    // Reset state and area inputs
    document.getElementById("state").value = "";
    document.getElementById("area").value = "";
    document.getElementById("day").value = "";

    if (value) {
      const filteredByCallsign = originalSchedule.filter((entry) =>
        entry.callsign.toUpperCase().includes(value)
      );
      renderTable(filteredByCallsign, "output");

      // Update title based on callsign
      updateTitle(value, "");
    } else {
      renderTable(originalSchedule, "output"); // Reset to the original schedule if no callsign is entered
      updateTitle("", ""); // Reset title when there's no input
    }
  });

  // ****************  S T A T E S  ****************************
  // Store all unique states for the dropdown and sort them alphabetically
  const states = [...new Set(schedule.map((entry) => entry.state))].sort();

  // Get the state dropdown element
  const stateDropdown = document.getElementById("state-dropdown");

  // Clear the existing options in the dropdown to avoid duplication
  stateDropdown.innerHTML = "";

  // Populate the state dropdown with all unique states
  states.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateDropdown.appendChild(option);
  });

  // Filter by state (text input)
  document.getElementById("state").addEventListener("input", (e) => {
    const value = e.target.value.toUpperCase();

    // Reset callsign and area inputs
    document.getElementById("callsign").value = "";
    document.getElementById("area").value = "";
    document.getElementById("day").value = "";

    const filteredByState = originalSchedule.filter((entry) =>
      entry.state.toUpperCase().includes(value)
    );
    renderTable(filteredByState, "output");

    // Update title based on state
    updateTitle("", value);

    // If no results, clear the input and show all data
    if (filteredByState.length === 0) {
      document.getElementById("state").value = "";
      renderTable(originalSchedule, "output");
      updateTitle("", "", ""); // Reset title when no valid state is entered
    }
  });

  // Filter by state selection (when state is selected from the dropdown)
  document.getElementById("state-dropdown").addEventListener("change", (e) => {
    const value = e.target.value.toUpperCase();

    // Clear callsign input box when state is selected
    document.getElementById("callsign").value = "";
    document.getElementById("area").value = "";

    const filteredByState = originalSchedule.filter(
      (entry) => entry.state.toUpperCase() === value
    );
    renderTable(filteredByState, "output");

    // Update title based on state
    updateTitle("", value);

    // If no results, clear the input and show all data
    if (filteredByState.length === 0) {
      document.getElementById("state-dropdown").value = "";
      renderTable(originalSchedule, "output");
      updateTitle("", ""); // Reset title when no valid state is selected
    }
  });

  // *************************** A R E A S  *****************************
  // Store all unique areas for the dropdown and sort them alphabetically
  const areas = [
    ...new Set(schedule.map((entry) => entry.area.toUpperCase())),
  ].sort();

  // Get the area dropdown element
  const areaDropdown = document.getElementById("area-dropdown");

  // Clear the existing options in the dropdown to avoid duplication
  areaDropdown.innerHTML = "";

  // Populate the area dropdown with all unique areas
  areas.forEach((area) => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    areaDropdown.appendChild(option);
  });

  // Filter by area (text input)
  document.getElementById("area").addEventListener("input", (e) => {
    const value = e.target.value.toUpperCase();

    // Reset callsign and state inputs
    document.getElementById("callsign").value = "";
    document.getElementById("state").value = "";

    const filteredByArea = originalSchedule.filter((entry) =>
      entry.area.toUpperCase().includes(value)
    );
    renderTable(filteredByArea, "output");

    // Update the title dynamically
    updateTitle("", "", value);

    // If no results, clear the input and show all data
    if (filteredByArea.length === 0) {
      document.getElementById("area").value = "";
      renderTable(originalSchedule, "output");
      updateTitle("", "", ""); // Reset title when no valid area is entered
    }
  });

  // Filter by area selection (when area is selected from the dropdown)
  document.getElementById("area-dropdown").addEventListener("change", (e) => {
    const value = e.target.value.toUpperCase();

    // Clear other input boxes when area is selected
    document.getElementById("callsign").value = "";
    document.getElementById("state").value = "";
    document.getElementById("day").value = "";

    const filteredByArea = originalSchedule.filter(
      (entry) => entry.area.toUpperCase() === value
    );
    renderTable(filteredByArea, "output");

    // Update the title dynamically
    updateTitle("", "", value);

    // If no results, clear the input and show all data
    if (filteredByArea.length === 0) {
      document.getElementById("area-dropdown").value = "";
      renderTable(originalSchedule, "output");
      updateTitle("", "", ""); // Reset title when no valid area is selected
    }
  });

  // *************************** D A Y S  *****************************
  // Store all unique days for the dropdown and sort them alphabetically
  const days = [...new Set(schedule.map((entry) => entry.date))].sort();
  // Get the area dropdown element
  const dayDropdown = document.getElementById("day-dropdown");

  // Clear the existing options in the dropdown to avoid duplication
  dayDropdown.innerHTML = "";

  // Populate the area dropdown with all unique areas
  days.forEach((day) => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    dayDropdown.appendChild(option);
  });

  // Filter by day (text input)
  document.getElementById("day").addEventListener("input", (e) => {
    const value = e.target.value;

    // Reset inputs
    document.getElementById("callsign").value = "";
    document.getElementById("state").value = "";
    document.getElementById("area").value = "";

    const filteredByDay = originalSchedule.filter((entry) =>
      entry.date.includes(value)
    );

    filteredByDay.sort((a, b) => {
      const getTimeInMinutes = (timeRange) => {
        if (!timeRange) return 0;
        const startTime = timeRange.split(" - ")[0];
        const [hours, minutes] = startTime.split(":").map(Number);
        return hours * 60 + minutes;
      };

      return getTimeInMinutes(a["utcTime"]) - getTimeInMinutes(b["utcTime"]);
    });

    renderTable(filteredByDay, "output");

    // Update the title dynamically
    updateTitle("", "", "", value);

    // If no results, clear the input and show all data
    if (filteredByDay.length === 0) {
      document.getElementById("area").value = "";
      renderTable(originalSchedule, "output");
      updateTitle("", "", ""); // Reset title when no valid area is entered
    }
  });

  // Filter by day selection (when day is selected from the dropdown)
  document.getElementById("day-dropdown").addEventListener("change", (e) => {
    const value = e.target.value;

    // Clear other input boxes when area is selected
    document.getElementById("callsign").value = "";
    document.getElementById("state").value = "";
    document.getElementById("area").value = "";

    const filteredByDay = originalSchedule.filter(
      (entry) => entry.date === value
    );
    renderTable(filteredByDay, "output");

    // Update the title dynamically
    updateTitle("", "", "", value);

    // If no results, clear the input and show all data
    if (filteredByDay.length === 0) {
      document.getElementById("day-dropdown").value = "";
      renderTable(originalSchedule, "output");
      updateTitle("", "", ""); // Reset title when no valid area is selected
    }
  });

  // Get references to the inputs and reset button
  const callsignInput = document.getElementById("callsign");
  const stateInput = document.getElementById("state");
  const areaInput = document.getElementById("area");
  const dayInput = document.getElementById("day");
  const resetButton = document.getElementById("reset-button");

  // Add event listener to reset button
  resetButton.addEventListener("click", () => {
    // Clear the filter inputs
    callsignInput.value = "";
    stateInput.value = "";
    areaInput.value = "";
    dayInput.value = "";

    // Reset the schedule title
    const mainScheduleTitle = document.getElementById("main-schedule-title");
    mainScheduleTitle.textContent = "Main Schedule";

    // Refresh the schedule table
    renderTable(originalSchedule, "output");
  });

  // Call the function to initiate updates
  startMinuteUpdates();

  // Display current and next hour schedules
  getCurrentUTCTimeSchedule();

  // Initial rendering of the table
  renderTable(originalSchedule, "output");
}
