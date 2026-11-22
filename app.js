const REFRESH_MS = 5000;
const TABLE = "sensor_data";
const $ = (id) => document.getElementById(id);

function setConnection(state, label) {
  const pill = document.querySelector(".live-pill");
  pill.classList.remove("connected", "error");
  if (state) pill.classList.add(state);
  $("connection-label").textContent = label;
}

function showSetupMessage(message) {
  $("feed-message").textContent = message;
}

function renderReading(row) {
  const temp = Number(row.temperature);
  const humidity = Number(row.humidity);
  if (!Number.isFinite(temp) || !Number.isFinite(humidity)) {
    throw new Error("The latest row needs numeric temperature and humidity values.");
  }
  $("temperature").textContent = temp.toFixed(1);
  $("humidity").textContent = humidity.toFixed(0);
  $("temperature-note").textContent = temp >= 30 ? "It's getting warm in here." : temp <= 20 ? "A little cool today." : "Temperature looks comfortable.";
  $("humidity-note").textContent = humidity >= 70 ? "Air is feeling humid." : humidity <= 35 ? "The air is quite dry." : "Humidity is in a moderate range.";
  $("temperature-meter").style.width = Math.max(0, Math.min(100, temp / 50 * 100)) + "%";
  $("humidity-meter").style.width = Math.max(0, Math.min(100, humidity)) + "%";
  const date = row.created_at ? new Date(row.created_at) : new Date();
  $("last-updated").textContent = date.toLocaleTimeString();
  $("feed-message").textContent = "New reading received. The ESP32 data is safely arriving in the sensor_data table.";
}

async function loadLatestReading() {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || url.includes("PASTE_") || !key || key.includes("PASTE_")) {
    setConnection("", "SETUP NEEDED");
    showSetupMessage("Next step: add the Supabase Project URL and anon/public key in config.js. Keep secret keys out of this website.");
    return;
  }

  try {
    const endpoint = url.replace(/\/$/, "") +
      "/rest/v1/" + TABLE +
      "?select=temperature,humidity,created_at&order=created_at.desc&limit=1";
    const response = await fetch(endpoint, {
      headers: { apikey: key, Authorization: "Bearer " + key }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error("Supabase " + response.status + ": " + detail.slice(0, 180));
    }
    const rows = await response.json();
    if (!rows.length) {
      setConnection("", "WAITING FOR ESP32");
      showSetupMessage("Supabase is connected, but no readings have arrived yet. Turn on the ESP32 to send the first temperature and humidity values.");
      return;
    }
    renderReading(rows[0]);
    setConnection("connected", "LIVE");
  } catch (error) {
    console.error(error);
    setConnection("error", "CHECK SETUP");
    showSetupMessage(error.message + " Check that sensor_data exists, the column names match, and the table allows SELECT for the anon role.");
  }
}

loadLatestReading();
setInterval(loadLatestReading, REFRESH_MS);