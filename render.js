const { ipcRenderer } = require("electron");

let interval = null;
let counter = 0;
let locked = false;

const CYCLE = 120;
const ALARM_START = 105;

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function beep() {
  const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAA");
  audio.play();
}

function toggleLock() {
  locked = !locked;
  ipcRenderer.send("toggle-clickthrough", locked);
  document.getElementById("lockBtn").innerText = locked ? "🔒" : "🔓";
}

function isEvenMinute() {
  return new Date().getMinutes() % 2 === 0;
}

function delayToNextEvenMinute() {
  const now = new Date();
  const min = now.getMinutes();
  const nextEven = min % 2 === 0 ? min + 2 : min + 1;

  const target = new Date(now);
  target.setMinutes(nextEven);
  target.setSeconds(0);
  target.setMilliseconds(0);

  return target - now;
}

ipcRenderer.on("auto-stop", () => {
  stop();
  document.getElementById("status").innerText = "GAME MINIMIZED";
});

function startCycle() {
  counter = 0;
  ipcRenderer.send("set-running", true);
  document.getElementById("status").innerText = "FARMING";

  interval = setInterval(() => {
    document.getElementById("timer").innerText = formatTime(counter);

    if (counter >= ALARM_START) {
      document.getElementById("status").innerText = "🚨 PICK NESO!";
      document.getElementById("timer").classList.add("alarm");
      beep();
      ipcRenderer.send("shake-window");
    } else {
      document.getElementById("timer").classList.remove("alarm");
    }

    counter++;

    if (counter > CYCLE) {
      counter = 0;
      document.getElementById("status").innerText = "FARMING";
    }

  }, 1000);
}

function start() {
  if (interval) return;

  if (!isEvenMinute()) {
    document.getElementById("status").innerText = "WAIT EVEN MINUTE";
    const delay = delayToNextEvenMinute();
    setTimeout(startCycle, delay);
  } else {
    startCycle();
  }
}

function stop() {
  clearInterval(interval);
  interval = null;
  ipcRenderer.send("set-running", false);
  document.getElementById("timer").innerText = "00:00";
  document.getElementById("status").innerText = "STOPPED";
}
