// Smart House dashboard — interactive prototype.
// Controls currently update this browser only. Supabase/ESP32 control will be connected in a later stage.
const $ = (id) => document.getElementById(id);
const lights = { living: true, bedroom: false, kitchen: false };
let fanSpeed = 1;
let doorOpen = false;
let toastTimer;

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function addActivity(title, detail) {
  const row = document.createElement("div");
  row.className = "activity-row";
  const icon = document.createElement("span");
  icon.className = "activity-icon light-activity";
  icon.textContent = "✧";
  const content = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const small = document.createElement("small");
  small.textContent = detail + " · Demo";
  content.append(strong, small);
  const time = document.createElement("time");
  time.textContent = "Now";
  row.append(icon, content, time);
  $("activity-list").prepend(row);
  while ($("activity-list").children.length > 6) {
    $("activity-list").lastElementChild.remove();
  }
}

function renderLights() {
  let count = 0;
  Object.entries(lights).forEach(([room, isOn]) => {
    const button = document.querySelector('[data-light="' + room + '"]');
    const label = $(room + "-state");
    button.classList.toggle("on", isOn);
    button.setAttribute("aria-pressed", String(isOn));
    label.textContent = isOn ? "LIGHT ON" : "LIGHT OFF";
    label.classList.toggle("off", !isOn);
    count += isOn ? 1 : 0;
  });
  $("lights-on").textContent = count;
  $("lights-caption").textContent = count === 0 ? "All rooms are dark" : count === 1 ? "One room illuminated" : count + " rooms illuminated";
  $("light-progress").style.width = (count / 3 * 100) + "%";
}

document.querySelectorAll("[data-light]").forEach(button => {
  button.addEventListener("click", () => {
    const room = button.dataset.light;
    lights[room] = !lights[room];
    renderLights();
    const roomName = room.charAt(0).toUpperCase() + room.slice(1);
    const action = lights[room] ? "switched on" : "switched off";
    addActivity(roomName + " light " + action, "Manual control");
    notify(roomName + " light " + action + " (demo only)");
  });
});

$("all-lights").addEventListener("click", () => {
  Object.keys(lights).forEach(room => lights[room] = false);
  renderLights();
  addActivity("All room lights switched off", "Group control");
  notify("All lights switched off (demo only)");
});

function renderFan() {
  const names = ["Off", "Low", "Medium", "High"];
  $("fan-speed-label").textContent = names[fanSpeed];
  $("fan-note").textContent = fanSpeed === 0 ? "Fan is switched off" : "Fan running at " + names[fanSpeed].toLowerCase() + " speed";
  document.querySelectorAll("[data-speed]").forEach(button => {
    const selected = Number(button.dataset.speed) === fanSpeed;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector(".fan-blades").style.opacity = fanSpeed === 0 ? ".35" : "1";
  document.querySelector(".fan-blades").style.transform = fanSpeed === 0 ? "none" : "rotate(" + (fanSpeed * 35) + "deg)";
}

document.querySelectorAll("[data-speed]").forEach(button => {
  button.addEventListener("click", () => {
    fanSpeed = Number(button.dataset.speed);
    renderFan();
    const name = ["Off", "Low", "Medium", "High"][fanSpeed];
    addActivity("Fan set to " + name.toLowerCase() + (fanSpeed ? " speed" : ""), "Climate control");
    notify("Fan: " + name + " (demo only)");
  });
});

function renderDoor() {
  $("door-state").textContent = doorOpen ? "Open" : "Closed";
  $("door-graphic").classList.toggle("open", doorOpen);
  $("door-open").disabled = doorOpen;
  $("door-close").disabled = !doorOpen;
}
$("door-open").addEventListener("click", () => {
  doorOpen = true;
  renderDoor();
  addActivity("Front door opened", "Door control");
  notify("Door opened (demo only)");
});
$("door-close").addEventListener("click", () => {
  doorOpen = false;
  renderDoor();
  addActivity("Front door closed", "Door control");
  notify("Door closed (demo only)");
});

$("clear-activity").addEventListener("click", () => {
  $("activity-list").replaceChildren();
  notify("Activity list cleared");
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
    link.classList.add("active");
  });
});

function updateClock() {
  const now = new Date();
  $("today-date").textContent = now.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
  $("footer-clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
renderLights();
renderFan();
renderDoor();
updateClock();
setInterval(updateClock, 30000);