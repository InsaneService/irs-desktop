


const $ = id => document.getElementById(id);
const desktop = $("desktop");
const startButton = $("startButton");
const startMenu = $("startMenu");



document.querySelector(".virus-shortcut")?.remove();
$("virusOverlay")?.remove();

startButton.addEventListener("click", e => {
  e.stopPropagation();
  startMenu.hidden = !startMenu.hidden;
});
document.addEventListener("click", e => {
  if (!startMenu.hidden && !startMenu.contains(e.target) && e.target !== startButton) {
    startMenu.hidden = true;
  }
});

function bringToFront(el) {
  const windows = [...document.querySelectorAll(".window")];
  const max = Math.max(30, ...windows.map(w => Number(getComputedStyle(w).zIndex) || 30));
  el.style.zIndex = max + 1;
}
function showWindow(id) {
  const win = $(id);
  if (!win) return;
  win.hidden = false;
  startMenu.hidden = true;
  bringToFront(win);
}

$("openIE").addEventListener("click", () => showWindow("videoWindow"));
$("quickIE").addEventListener("click", () => showWindow("videoWindow"));
$("openPlayer").addEventListener("click", () => showWindow("playerWindow"));
$("quickPlayer").addEventListener("click", () => showWindow("playerWindow"));
$("quickMail").addEventListener("click", () => {
  location.href = "mailto:Bookings@momo-records.com?subject=Booking%20enquiry";
});
$("openSnake").addEventListener("click", () => showWindow("snakeWindow"));
document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    const target = $(button.dataset.close);
    if (target) target.hidden = true;
  });
});


document.querySelectorAll(".window").forEach(win => {
  const bar = win.querySelector(".window-title");
  if (!bar) return;
  let drag = null;
  bar.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    const r = win.getBoundingClientRect();
    const d = desktop.getBoundingClientRect();
    const scaledSnake = win.id === "snakeWindow" &&
      window.matchMedia("(max-width: 650px)").matches;
    win.style.transform = scaledSnake ? "scale(0.85)" : "none";
    win.style.transformOrigin = scaledSnake ? "top left" : "";
    win.style.left = (r.left - d.left) + "px";
    win.style.top = (r.top - d.top) + "px";
    drag = { x:e.clientX, y:e.clientY, left:parseFloat(win.style.left), top:parseFloat(win.style.top) };
    bar.setPointerCapture(e.pointerId);
    bringToFront(win);
  });
  bar.addEventListener("pointermove", e => {
    if (!drag) return;
    const d = desktop.getBoundingClientRect();
    const maxX = Math.max(0, d.width - win.offsetWidth);
    const maxY = Math.max(0, d.height - $("taskbar").offsetHeight - 35);
    win.style.left = Math.max(0, Math.min(maxX, drag.left + e.clientX - drag.x)) + "px";
    win.style.top = Math.max(0, Math.min(maxY, drag.top + e.clientY - drag.y)) + "px";
  });
  bar.addEventListener("pointerup", () => drag = null);
  bar.addEventListener("pointercancel", () => drag = null);
});


const DESKTOP_POSITIONS_KEY = "irs-desktop-positions";

function saveDesktopPositions() {
  const positions = {};
  const bounds = desktop.getBoundingClientRect();

  document.querySelectorAll(".desktop-item").forEach(icon => {
    const rect = icon.getBoundingClientRect();
    const key = [...icon.classList].find(c => c !== "desktop-item");
    if (!key) return;

    positions[key] = {
      x: (rect.left - bounds.left) / bounds.width,
      y: (rect.top - bounds.top) / bounds.height
    };
  });

  localStorage.setItem(DESKTOP_POSITIONS_KEY, JSON.stringify(positions));
}

function restoreDesktopPositions() {
  const saved = JSON.parse(
    localStorage.getItem(DESKTOP_POSITIONS_KEY) || "{}"
  );
  const bounds = desktop.getBoundingClientRect();

  document.querySelectorAll(".desktop-item").forEach(icon => {
    const key = [...icon.classList].find(c => c !== "desktop-item");
    const pos = saved[key];
    if (!pos) return;

    icon.style.left = `${pos.x * bounds.width}px`;
    icon.style.top = `${pos.y * bounds.height}px`;
  });
}

if (!window.matchMedia("(max-width: 650px)").matches) {
  restoreDesktopPositions();
}

function arrangeIconsAroundWindows() {
  const desktopRect = desktop.getBoundingClientRect();
  const taskbarHeight = $("taskbar").offsetHeight;
  const icons = [...document.querySelectorAll(".desktop-item")];

  const obstacles = [
    ...document.querySelectorAll(".window:not([hidden])"),
    document.querySelector(".desktop-heading")
  ].filter(Boolean).map(el => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left - desktopRect.left - 8,
      y: r.top - desktopRect.top - 8,
      w: r.width + 16,
      h: r.height + 16
    };
  });

  const placed = [];
  const step = 12;
  const maxY = desktopRect.height - taskbarHeight - 10;

  function overlaps(a, b) {
    const gap = 10;
    return (
      a.x < b.x + b.w + gap &&
      a.x + a.w + gap > b.x &&
      a.y < b.y + b.h + gap &&
      a.y + a.h + gap > b.y
    );
  }

  icons.forEach(icon => {
    const current = icon.getBoundingClientRect();
    const desiredX = current.left - desktopRect.left;
    const desiredY = current.top - desktopRect.top;

    const w = icon.offsetWidth;
    const h = icon.offsetHeight;
    const candidates = [];

    for (let y = 8; y <= maxY - h; y += step) {
      for (let x = 8; x <= desktopRect.width - w - 8; x += step) {
        const candidate = { x, y, w, h };

        if (
          !obstacles.some(o => overlaps(candidate, o)) &&
          !placed.some(p => overlaps(candidate, p))
        ) {
          const distance =
            (x - desiredX) ** 2 + (y - desiredY) ** 2;

          candidates.push({ ...candidate, distance });
        }
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    if (candidates.length) {
      const spot = candidates[0];
      icon.style.left = `${spot.x}px`;
      icon.style.top = `${spot.y}px`;
      placed.push(spot);
    }
  });
}

requestAnimationFrame(arrangeIconsAroundWindows);

document.querySelectorAll(".desktop-item").forEach(icon => {
  let dragging = false;
  let moved = false;
  let startX, startY, startLeft, startTop;

  icon.addEventListener("dragstart", e => e.preventDefault());

  icon.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;

    dragging = true;
    moved = false;

    const rect = icon.getBoundingClientRect();
    const bounds = desktop.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left - bounds.left;
    startTop = rect.top - bounds.top;

    icon.setPointerCapture(e.pointerId);
  });

  icon.addEventListener("pointermove", e => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

    if (moved) {
      icon.style.left = `${startLeft + dx}px`;
      icon.style.top = `${startTop + dy}px`;
    }
  });

  icon.addEventListener("pointerup", e => {
    dragging = false;
    if (moved) saveDesktopPositions();
    if (icon.hasPointerCapture(e.pointerId)) {
      icon.releasePointerCapture(e.pointerId);
    }
  });

  icon.addEventListener("pointercancel", () => {
    dragging = false;
  });
});



$("playVideo").addEventListener("click", () => {
  $("videoFrame").innerHTML =
    '<iframe src="https://www.youtube.com/embed/3NJEFZtLr9I?autoplay=1" title="Insane Revenue Service video" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
});


const TRACKS = [
  { title:"Take It", artist:"Flowered Up", src:"assets/music/Track01.mp3" },
  { title:"There's No Other Way", artist:"Blur", src:"assets/music/Track02.mp3" },
  { title:"Right Here Right Now", artist:"Jesus Jones", src:"assets/music/Track03.mp3" },
  { title:"Fools Gold", artist:"The Stone Roses", src:"assets/music/Track04.mp3" },
  { title:"Movin' On Up", artist:"Primal Scream", src:"assets/music/Track05.mp3" },
  { title:"Bitter Sweet Symphony", artist:"The Verve", src:"assets/music/Track06.mp3" },
  { title:"IRS", artist:"Insane Revenue Service", src:"assets/music/IRS.mp3" },
  { title:"International Bright Young Thing", artist:"Jesus Jones", src:"assets/music/Track07.mp3" },
  { title:"Praise You", artist:"Fatboy Slim", src:"assets/music/Track08.mp3" },
  { title:"Loaded", artist:"Primal Scream", src:"assets/music/Track09.mp3" }
];
const audio = $("audio");
const playlist = $("playlist");
let current = -1;
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  return String(Math.floor(seconds/60)).padStart(2,"0") + ":" +
    String(Math.floor(seconds%60)).padStart(2,"0");
}
function renderPlaylist() {
  playlist.innerHTML = "";
  TRACKS.forEach((track, i) => {
    const li = document.createElement("li");
    li.textContent = String(i+1).padStart(2,"0") + "  " + track.title + " — " + track.artist;
    li.className = i === current ? "active" : "";
    li.addEventListener("click", () => loadTrack(i, true));
    playlist.append(li);
  });
}
function loadTrack(index, playNow=false) {
  current = (index + TRACKS.length) % TRACKS.length;
  audio.src = TRACKS[current].src;
  $("trackName").textContent = TRACKS[current].title.toUpperCase();
  renderPlaylist();
  if (playNow) audio.play().catch(() => {});
}
$("play").addEventListener("click", () => {
  if (current < 0) loadTrack(0);
  audio.play().catch(() => {});
});
$("pause").addEventListener("click", () => audio.pause());
$("stop").addEventListener("click", () => { audio.pause(); audio.currentTime = 0; });
$("prev").addEventListener("click", () => loadTrack(current-1, true));
$("next").addEventListener("click", () => loadTrack(current+1, true));
$("volume").addEventListener("input", e => audio.volume = Number(e.target.value));
$("seek").addEventListener("input", e => {
  if (audio.duration) audio.currentTime = audio.duration * Number(e.target.value) / 100;
});
audio.addEventListener("timeupdate", () => {
  $("elapsed").textContent = formatTime(audio.currentTime);
  $("duration").textContent = formatTime(audio.duration);
  if (audio.duration) $("seek").value = audio.currentTime / audio.duration * 100;
});
audio.addEventListener("ended", () => loadTrack(current+1, true));
renderPlaylist();
audio.volume = 0.7;

// Snake game.
const canvas = $("snakeCanvas");
const ctx = canvas.getContext("2d");
const cell = 20, cols = canvas.width/cell, rows = canvas.height/cell;
let snake, food, direction, nextDirection, score, snakeTimer;
let running = false, paused = false;
// Shared Snake 97 leaderboard
const SUPABASE_URL = "https://wyygbaxkwqjuloywnxns.supabase.co";
const SUPABASE_KEY = "sb_publishable_8iKzf4qBwlOCemlWt3H7uA_ucIFxN0Y";
const LEADERBOARD_URL = `${SUPABASE_URL}/rest/v1/snake_leaderboard`;

async function loadSnakeLeaderboard() {
  const list = $("snakeLeaderboardList");
  list.textContent = "LOADING...";

  try {
    const response = await fetch(
      `${LEADERBOARD_URL}?select=player_name,score&order=score.desc,created_at.asc&limit=10`,
      { headers: { apikey: SUPABASE_KEY } }
    );

    if (!response.ok) throw new Error("Could not load scores");

    const scores = await response.json();
    list.innerHTML = "";

    if (!scores.length) {
      list.textContent = "NO SCORES YET — BE THE FIRST!";
      return;
    }

    scores.forEach((entry, index) => {
      const item = document.createElement("li");
      item.textContent = `${entry.player_name} — ${entry.score}`;
      list.append(item);
    });
  } catch (error) {
    list.textContent = "LEADERBOARD UNAVAILABLE";
    console.error(error);
  }
}

async function submitSnakeScore() {
  const nameInput = $("snakePlayerName");
  const status = $("snakeSubmitStatus");
  const name = nameInput.value.trim();

  if (!name || name.length > 16) {
    status.textContent = "ENTER A NAME (1–16 CHARACTERS)";
    return;
  }

  const button = $("snakeSubmitScore");
  button.disabled = true;
  status.textContent = "SUBMITTING...";

  try {
    const response = await fetch(LEADERBOARD_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        player_name: name,
        score: score
      })
    });

    if (!response.ok) throw new Error(await response.text());

    status.textContent = "SCORE SAVED!";
    $("snakeSubmit").hidden = true;
    await loadSnakeLeaderboard();
  } catch (error) {
    status.textContent = "SUBMISSION FAILED — TRY AGAIN";
    console.error(error);
  } finally {
    button.disabled = false;
  }
}

$("snakeSubmitScore").addEventListener("click", submitSnakeScore);

const snakeLeaderboardWrap = $("snakeLeaderboardWrap");
const snakeLeaderboardToggle = $("snakeLeaderboardToggle");

snakeLeaderboardToggle.addEventListener("click", () => {
  const expanded = snakeLeaderboardWrap.classList.toggle("is-open");
  snakeLeaderboardToggle.setAttribute("aria-expanded", String(expanded));
  snakeLeaderboardToggle.textContent = expanded
    ? "WORLD HIGH SCORES ▴"
    : "WORLD HIGH SCORES ▾";
});
$("snakePlayerName").addEventListener("keydown", event => {
  if (event.key === "Enter") submitSnakeScore();
});

loadSnakeLeaderboard();
function randomFood() {
  let p;
  do { p = {x:Math.floor(Math.random()*cols), y:Math.floor(Math.random()*rows)}; }
  while (snake.some(s => s.x===p.x && s.y===p.y));
  return p;
}
function drawSnake() {
  ctx.fillStyle = "#101a0d"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "#25351d"; ctx.lineWidth = .5;
  for (let x=0; x<=canvas.width; x+=cell) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y=0; y<=canvas.height; y+=cell) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }
  if (food) {
    ctx.fillStyle = "#d8df48";
    ctx.fillRect(food.x*cell+3,food.y*cell+3,cell-6,cell-6);
  }
  (snake || []).forEach((p,i) => {
    ctx.fillStyle = i===0 ? "#d7e58a" : "#83a94a";
    ctx.fillRect(p.x*cell+1,p.y*cell+1,cell-2,cell-2);
  });
  if (!running) {
    ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.font="bold 17px MS Sans Serif";
    ctx.fillText(score===undefined ? "SNAKE 97" : "GAME OVER",canvas.width/2,canvas.height/2);
    ctx.font="12px MS Sans Serif";
    ctx.fillText("PRESS START / RESTART",canvas.width/2,canvas.height/2+23);
  } else if (paused) {
    ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.font="bold 20px MS Sans Serif";
    ctx.fillText("PAUSED",canvas.width/2,canvas.height/2);
  }
}
function stopSnake() {
  clearInterval(snakeTimer); running=false; paused=false; drawSnake();
}
function startSnake() {
  clearInterval(snakeTimer);
  snake=[{x:8,y:7},{x:7,y:7},{x:6,y:7}];
  direction={x:1,y:0}; nextDirection={x:1,y:0};
  score=0; food=randomFood(); running=true; paused=false;
  $("snakeSubmit").hidden = true;
$("snakeSubmitStatus").textContent = "";
  $("snakeScore").textContent=score; $("snakeStatus").textContent="PLAYING";
  snakeTimer=setInterval(tickSnake,115); drawSnake();
}
function tickSnake() {
  if (!running || paused) return;
  direction=nextDirection;
  const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
  if (head.x<0 || head.x>=cols || head.y<0 || head.y>=rows ||
      snake.some(p=>p.x===head.x && p.y===head.y)) {
    stopSnake();
$("snakeStatus").textContent = "GAME OVER";
if (score > 0) {
  $("snakeSubmit").hidden = false;
  $("snakePlayerName").value = "";
  $("snakeSubmitStatus").textContent = "";
}
return;
  }
  snake.unshift(head);
  if (head.x===food.x && head.y===food.y) {
    score+=10;
$("snakeScore").textContent=score;
checkRecycleUnlock();
food=randomFood();
  } else snake.pop();
  drawSnake();
}
function setSnakeDirection(name) {
  const dirs={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  const d=dirs[name];
  if (d && running && (d.x!==-direction.x || d.y!==-direction.y)) nextDirection=d;
}
document.addEventListener("keydown", e => {
  const dirs={ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down",
    ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right"};
  if (dirs[e.key] && !$("snakeWindow").hidden) {
    e.preventDefault(); setSnakeDirection(dirs[e.key]);
  }
  if (e.code==="Space" && !$("snakeWindow").hidden) {
    e.preventDefault(); $("snakePause").click();
  }
});
$("snakeStart").addEventListener("click", startSnake);
$("snakePause").addEventListener("click", () => {
  if (!running) return;
  paused=!paused;
  $("snakeStatus").textContent=paused ? "PAUSED" : "PLAYING";
  drawSnake();
});
const joystick = $("snakeJoystick");
const joystickKnob = $("snakeJoystickKnob");
let joystickPointer = null;

function resetSnakeJoystick() {
  joystickPointer = null;
  joystickKnob.style.setProperty("--joy-x", "0px");
  joystickKnob.style.setProperty("--joy-y", "0px");
}

function moveSnakeJoystick(event) {
  const rect = joystick.getBoundingClientRect();
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const viewport = isIOS ? window.visualViewport : null;
  const centerX = rect.left + rect.width / 2 + (viewport?.offsetLeft || 0);
  const centerY = rect.top + rect.height / 2 + (viewport?.offsetTop || 0);

  const scaleX = rect.width / joystick.offsetWidth;
  const scaleY = rect.height / joystick.offsetHeight;
  let dx = (event.clientX - centerX) / scaleX;
  let dy = (event.clientY - centerY) / scaleY;

  const maxDistance = joystick.offsetWidth / 2 - joystickKnob.offsetWidth / 2 - 5;
  const distance = Math.hypot(dx, dy);

  if (distance > maxDistance) {
    const ratio = maxDistance / distance;
    dx *= ratio;
    dy *= ratio;
  }

  joystickKnob.style.setProperty("--joy-x", `${dx}px`);
  joystickKnob.style.setProperty("--joy-y", `${dy}px`);

  if (distance < 10) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    setSnakeDirection(dx > 0 ? "right" : "left");
  } else {
    setSnakeDirection(dy > 0 ? "down" : "up");
  }
}

joystick.addEventListener("pointerdown", event => {
  event.preventDefault();
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  moveSnakeJoystick(event);
});

joystick.addEventListener("pointermove", event => {
  if (event.pointerId === joystickPointer) {
    moveSnakeJoystick(event);
  }
});

joystick.addEventListener("pointerup", event => {
  if (event.pointerId === joystickPointer) resetSnakeJoystick();
});

joystick.addEventListener("pointercancel", resetSnakeJoystick);
snake=[{x:8,y:7},{x:7,y:7},{x:6,y:7}];
score=undefined; food={x:14,y:7}; drawSnake();


let johnCount = 0;
let johnTimers = [];

function spawnJohnDialog() {
  const overlay = $("johnOverlay");
  const box = document.createElement("div");

  box.className = "john-warning";
  box.style.left = Math.max(4, Math.random() * (desktop.clientWidth - 280)) + "px";
  box.style.top = Math.max(4, Math.random() * (desktop.clientHeight - 180)) + "px";

  box.innerHTML = `
    <strong>JOHN DE MOL ULTIMATUM</strong>
    <p>you will never work in the entertainment industry again.</p>
    <button type="button">OK</button>
  `;

  box.querySelector("button").addEventListener("click", () => {
    box.remove();
    johnCount--;
    if (johnCount === 0) overlay.hidden = true;
  });

  overlay.append(box);
  playPopupSound();
  johnCount++;
}

$("openJohn").addEventListener("click", () => {
  const overlay = $("johnOverlay");

  overlay.innerHTML = "";
  johnCount = 0;
  johnTimers.forEach(clearTimeout);
  johnTimers = [];

  overlay.hidden = false;

  const intro = document.createElement("div");
  intro.className = "john-warning john-intro";

  intro.innerHTML = `
    <strong>JOHN DE MOL APPLICATION</strong>
    <p>give me irrevocable rights to all you creative assets and your likeness.</p>
    <button type="button" class="john-ok">OK</button>
    <button type="button" class="john-reject">GET LOST JOHN</button>
  `;

  overlay.append(intro);
  playPopupSound();

  intro.querySelector(".john-ok").addEventListener("click", () => {
    overlay.hidden = true;
  });

  intro.querySelector(".john-reject").addEventListener("click", () => {
    intro.remove();

    for (let i = 0; i < 360; i++) {
      johnTimers.push(setTimeout(spawnJohnDialog, i * 55));
    }
  });
});

// Zine publishing: add a PDF in assets/zines/, then enable it here.
const ZINE = {
  enabled: true,
  file: "assets/zines/IRS COC.jpg",
  label: "CODE OF CONDUCT briefing"
};
if (ZINE.enabled) {
  $("zineMenuLink").href=ZINE.file;
  $("zineMenuLink").download="";
  $("zineMenuLabel").textContent=ZINE.label;
  $("zineMenuLink").hidden=false;
}


let trainAudio=null, trainAnimation=null;
$("startTrain").addEventListener("click", () => {
  const layer=$("trainLayer"), image=$("trainImage");
  if (trainAnimation) cancelAnimationFrame(trainAnimation);
  if (trainAudio) { trainAudio.pause(); trainAudio.currentTime=0; }
  trainAudio=new Audio("assets/jonkotrain.mp3");
  trainAudio.volume=0;
  layer.classList.add("active");
  const duration=9000, start=performance.now();
  trainAudio.play().catch(() => {});
  function frame(now) {
    const p=Math.min(1,(now-start)/duration);
    const scale=.12+Math.pow(p,1.8)*1.8;
    image.style.transform=`translate(-50%,-50%) scale(${scale})`;
    image.style.top=(57-p*15)+"%";
    image.style.opacity=String(Math.min(1,p*5,(1-p)*7+.15));
    if (trainAudio && !trainAudio.paused) {
      const fade=p>.82 ? Math.max(0,(1-p)/.18) : 1;
      trainAudio.volume=Math.min(1,.08+p*.92)*fade;
    }
    if (p<1) trainAnimation=requestAnimationFrame(frame);
    else {
      layer.classList.remove("active");
      trainAudio?.pause(); trainAudio=null; trainAnimation=null;
    }
  }
  trainAnimation=requestAnimationFrame(frame);
});


function playPopupSound() {
  const audio = new (window.AudioContext || window.webkitAudioContext)();

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.connect(gain);
  gain.connect(audio.destination);

  oscillator.type = "sawtooth";

  oscillator.frequency.setValueAtTime(130, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    90,
    audio.currentTime + 0.35
  );
 
  gain.gain.setValueAtTime(0.25, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audio.currentTime + 0.4
  );

  oscillator.start();
  oscillator.stop(audio.currentTime + 0.4);
}
document.querySelectorAll(".desktop-item").forEach(icon => {
  icon.addEventListener("dragstart", e => e.preventDefault());
});


const GUESTLIST_URL =
  "https://wyygbaxkwqjuloywnxns.supabase.co/rest/v1/guestlist";

$("guestlistForm").addEventListener("submit", async event => {
  event.preventDefault();

  const input = $("guestlistName");
  const button = $("guestlistSubmit");
  const status = $("guestlistStatus");
  const name = input.value.trim();

  if (!name) return;

  button.disabled = true;
  status.textContent = "ADDING YOU...";

  try {
    const response = await fetch(GUESTLIST_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ name })
    });

    if (!response.ok) throw new Error(await response.text());

    input.value = "";
    status.textContent = "YOU'RE ON THE LIST!";
  } catch (error) {
    console.error(error);
    status.textContent = "SOMETHING WENT WRONG. TRY AGAIN.";
  } finally {
    button.disabled = false;
  }
});


const irsTvVideo = $("irsTvVideo");
const irsTvWindow = $("irsTvWindow");
const irsTvScreen = $("irsTvScreen");
const irsTvVideoHost = $("irsTvVideoHost");

const IRS_TV_VIDEOS = [
  "https://dn710208.ca.archive.org/0/items/pkmn-vol-1-vhs/pkmn-vol1%20%281%29.mp4",
  "https://ia600909.us.archive.org/22/items/vts-01-1_20250717_0338/VTS_01_3.mp4",
  "https://ia600909.us.archive.org/22/items/vts-01-1_20250717_0338/VTS_01_1.mp4",
  "https://dn601203.us.archive.org/0/items/blank-vhs-nick/BLANK%20VHS%20Nick%20Part%201.mp4"
];

let irsTvIndex = Math.floor(Math.random() * IRS_TV_VIDEOS.length);
let irsTvInitialStart = true;

function irsTvPlay() {
  irsTvVideo.play().catch(() => {
  
  });
}

function irsTvLoad(index) {
  irsTvIndex = (index + IRS_TV_VIDEOS.length) % IRS_TV_VIDEOS.length;
  irsTvVideo.src = IRS_TV_VIDEOS[irsTvIndex];
  irsTvVideo.load();
}

irsTvVideo.addEventListener("loadedmetadata", () => {
  if (irsTvInitialStart) {
    irsTvInitialStart = false;

    // Begin at a random point
    if (Number.isFinite(irsTvVideo.duration) && irsTvVideo.duration > 30) {
      irsTvVideo.currentTime =
        Math.random() * (irsTvVideo.duration - 20);
    }
  }

  irsTvPlay();
});

// Move to the next video when one finishes.
irsTvVideo.addEventListener("ended", () => {
  irsTvLoad(irsTvIndex + 1);
});

// Skip a video if it fails to load.
irsTvVideo.addEventListener("error", () => {
  irsTvLoad(irsTvIndex + 1);
});

// Start muted in the background when the site loads.
irsTvVideo.muted = true;
irsTvLoad(irsTvIndex);

// Open TV: show the window, move the video into the screen and enable sound.
$("openIRSTV").addEventListener("click", () => {
  showWindow("irsTvWindow");

  irsTvScreen.appendChild(irsTvVideo);
  irsTvVideo.muted = false;
  irsTvVideo.volume = 0.8;

  irsTvPlay();
});

// Close TV: but do not stop it.
document
  .querySelector('[data-close="irsTvWindow"]')
  .addEventListener("click", () => {
    irsTvVideo.muted = true;
    irsTvVideoHost.appendChild(irsTvVideo);
  });
/* SECRET SCREENSAVER + RECYCLE BIN */

const SAVER_CASSETTE_KEY = "irs-screensaver-cassette-collected";
const RECYCLE_UNLOCK_KEY = "irs-recycle-unlocked";
const RECYCLE_COLLECTED_KEY = "irs-recycle-collected";

let saverTimer;
let saverFrame;
let saverActive = false;
let saverCornerHit = false;
let saverX = 30;
let saverY = 30;
let saverVX = 3.2;
let saverVY = 2.7;
let lastSaverTime = 0;

const saver = $("screensaver");
const saverLogo = $("screensaverLogo");
const saverConfetti = $("screensaverConfetti");

function resetSaverTimer() {
  clearTimeout(saverTimer);
  if (!saverActive) saverTimer = setTimeout(startScreensaver, 60000);
}

function startScreensaver() {
  if (saverActive) return;
  saverActive = true;
  saverCornerHit = false;
  saver.hidden = false;
  saverX = 30;
  saverY = 30;
  saverVX = 3.2;
  saverVY = 2.7;
  lastSaverTime = 0;
  saverFrame = requestAnimationFrame(moveSaverLogo);
}

function stopScreensaver() {
  if (!saverActive) return;
  saverActive = false;
  cancelAnimationFrame(saverFrame);
  saver.hidden = true;
  saverConfetti.innerHTML = "";

  if (saverCornerHit &&
      localStorage.getItem(SAVER_CASSETTE_KEY) !== "yes") {
    $("screenCassette").hidden = false;
  }
  resetSaverTimer();
}

function makeConfetti() {
  for (let i = 0; i < 100; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = "50%";
    piece.style.top = "50%";
    piece.style.background = `hsl(${Math.random() * 360},90%,60%)`;
    piece.style.setProperty("--dx", `${(Math.random() - .5) * innerWidth}px`);
    piece.style.setProperty("--dy", `${(Math.random() - .5) * innerHeight}px`);
    saverConfetti.append(piece);
  }
}

function moveSaverLogo(time) {
  if (!saverActive) return;

  const width = saver.clientWidth;
  const height = saver.clientHeight;
  const logoWidth = saverLogo.offsetWidth || 150;
  const logoHeight = saverLogo.offsetHeight || 110;
  const maxX = Math.max(0, width - logoWidth);
  const maxY = Math.max(0, height - logoHeight);

  const elapsed = lastSaverTime ? Math.min((time - lastSaverTime) / 16.67, 2) : 1;
  lastSaverTime = time;

  saverX += saverVX * elapsed;
  saverY += saverVY * elapsed;

  let hitX = false;
  let hitY = false;

  if (saverX <= 0 || saverX >= maxX) {
    saverX = Math.max(0, Math.min(maxX, saverX));
    saverVX *= -1;
    hitX = true;
  }
  if (saverY <= 0 || saverY >= maxY) {
    saverY = Math.max(0, Math.min(maxY, saverY));
    saverVY *= -1;
    hitY = true;
  }

  if (hitX && hitY && !saverCornerHit) {
    saverCornerHit = true;
    makeConfetti();
    saverVX *= 1.08;
    saverVY *= 1.08;
  }

  saverLogo.style.left = `${saverX}px`;
  saverLogo.style.top = `${saverY}px`;
  saverFrame = requestAnimationFrame(moveSaverLogo);
}

["pointerdown", "pointermove", "keydown", "touchstart"].forEach(eventName => {
  document.addEventListener(eventName, () => {
    if (saverActive) stopScreensaver();
    else resetSaverTimer();
  }, { passive: true });
});

$("screenCassette").addEventListener("click", () => {
  $("screenCassette").hidden = true;
  localStorage.setItem(SAVER_CASSETTE_KEY, "yes");
  showWindow("playerWindow");
  TRACKS.push({
    title: "Spread Eagle",
    artist: "Insane Revenue Service - RECOVERED FILE",
    src: "assets/SpreadEagle.mp3"
  });
  loadTrack(TRACKS.length - 1, true);
});

$("yeahDawgTape").addEventListener("click", () => {
  $("yeahDawgTape").hidden = true;
  const trackSrc = "assets/20%20past%204.mp3";
  let trackIndex = TRACKS.findIndex(track => track.src === trackSrc);

  if (trackIndex === -1) {
    TRACKS.push({
      title: "20 past 4",
      artist: "Insane Revenue Service - RECOVERED FILE",
      src: trackSrc
    });
    trackIndex = TRACKS.length - 1;
  }

  showWindow("playerWindow");
  loadTrack(trackIndex, true);
});

if (localStorage.getItem(SAVER_CASSETTE_KEY) === "yes") {
  $("screenCassette").hidden = true;
}
resetSaverTimer();


/* RECYCLE BIN UNLOCK */

function checkRecycleUnlock() {
  if (Number(score) > 200) {
    localStorage.setItem(RECYCLE_UNLOCK_KEY, "yes");
    $("openRecycle").hidden = false;
  }
}

if (localStorage.getItem(RECYCLE_UNLOCK_KEY) === "yes") {
  $("openRecycle").hidden = false;
}

$("openRecycle").addEventListener("click", () => {
  showWindow("recycleWindow");
  loadRecycleFiles();
  loadRecycleMessages();
});


/* RECYCLE BIN FILES */

const RECYCLE_FILES = [
  { name: "805a7a0a-84db-43a7-99b6-d4f4591037b7.JPG", type: "image" },
  { name: "9e9863933bdc425e982649741af946a9.mov", type: "video" },
  { name: "IMG_6441.mov", type: "video" },
  { name: "Sanctuary I.mp3", type: "audio" }
];

function getCollectedFiles() {
  try {
    return JSON.parse(localStorage.getItem(RECYCLE_COLLECTED_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadRecycleFiles() {
  const container = $("recycleFiles");
  const collected = getCollectedFiles();
  container.innerHTML = "";

  RECYCLE_FILES.filter(file => !collected.includes(file.name)).forEach(file => {
    const button = document.createElement("button");
    button.className = "recycle-file";
    button.type = "button";

    const image = document.createElement("img");
    image.src = file.type === "audio" ? "assets/cassette.png" : "assets/Document.png";
    image.alt = "";

    const label = document.createElement("span");
    label.textContent = file.type === "audio" ? "collectable tape 2" : file.name;

    button.append(image, label);
    button.addEventListener("click", () => openRecycleFile(file));
    container.append(button);
  });

  if (!container.children.length) {
    container.textContent = "NO FILES REMAIN.";
  }
}

function openRecycleFile(file) {
  if (file.type === "audio") {
    collectRecycleAudio(file);
    return;
  }

  const viewer = $("recycleViewer");
  viewer.hidden = false;
  viewer.innerHTML = "";

  let media;
  if (file.type === "image") {
    media = document.createElement("img");
  } else {
    media = document.createElement("video");
    media.controls = true;
    media.playsInline = true;
  }

  media.src = `assets/recycle/${encodeURIComponent(file.name)}`;
  viewer.append(media);

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "CLOSE";
  close.addEventListener("click", () => {
    media.pause?.();
    viewer.hidden = true;
    viewer.innerHTML = "";
  });
  viewer.append(close);
}

function collectRecycleAudio(file) {
  const collected = getCollectedFiles();
  if (!collected.includes(file.name)) collected.push(file.name);
  localStorage.setItem(RECYCLE_COLLECTED_KEY, JSON.stringify(collected));

  TRACKS.push({
    title: file.name.replace(/\.mp3$/i, ""),
    artist: "Insane Revenue Service - RECOVERED FILE",
    src: `assets/recycle/${encodeURIComponent(file.name)}`
  });

  loadRecycleFiles();
  showWindow("playerWindow");
  loadTrack(TRACKS.length - 1, true);
}


/* SHARED NOTEPAD MESSAGES — SUPABASE */

const RECYCLE_MESSAGES_URL =
  `${SUPABASE_URL}/rest/v1/recycle_bin_messages`;

async function loadRecycleMessages() {
  const list = $("recycleMessages");
  list.textContent = "LOADING MESSAGES...";

  try {
    const response = await fetch(
      `${RECYCLE_MESSAGES_URL}?select=author,message,created_at&order=created_at.desc&limit=50`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    if (!response.ok) throw new Error("Could not load messages");

    const messages = await response.json();
    list.innerHTML = "";

    if (!messages.length) {
      list.textContent = "NO MESSAGES YET.";
      return;
    }

    messages.forEach(entry => {
      const item = document.createElement("div");
      item.className = "recycle-message";

      const meta = document.createElement("small");
      meta.textContent =
        `${entry.author || "ANONYMOUS"} · ${new Date(entry.created_at).toLocaleString()}`;

      const message = document.createElement("div");
      message.textContent = entry.message;

      item.append(meta, message);
      list.append(item);
    });
  } catch (error) {
    list.textContent = "MESSAGES UNAVAILABLE.";
    console.error(error);
  }
}

$("sendRecycleMessage").addEventListener("click", async () => {
  const author = $("recycleAuthor").value.trim() || "ANONYMOUS";
  const message = $("recycleMessage").value.trim();
  const status = $("recycleMessageStatus");
  const button = $("sendRecycleMessage");

  if (!message || message.length > 500) {
    status.textContent = "ENTER A MESSAGE (1–500 CHARACTERS).";
    return;
  }

  button.disabled = true;
  status.textContent = "SAVING...";

  try {
    const response = await fetch(RECYCLE_MESSAGES_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ author: author.slice(0, 30), message })
    });

    if (!response.ok) throw new Error(await response.text());

    $("recycleMessage").value = "";
    status.textContent = "MESSAGE SAVED.";
    await loadRecycleMessages();
  } catch (error) {
    status.textContent = "COULD NOT SAVE MESSAGE.";
    console.error(error);
  } finally {
    button.disabled = false;
  }
});

  /* YEAH DAWG SECRET */

const yeahDawg = $("yeahDawg");
const yeahDawgImage = $("yeahDawgImage");

let yeahDawgTimer;
let yeahDawgActive = false;
let yeahDawgCollected = false;

function showYeahDawg() {
  if (yeahDawgActive || yeahDawgCollected) return;

  yeahDawgActive = true;
  yeahDawg.hidden = false;
  yeahDawg.classList.add("peeking");

  yeahDawgTimer = setTimeout(() => {
    yeahDawg.classList.remove("peeking");
    yeahDawg.hidden = true;
    yeahDawgActive = false;
    scheduleYeahDawg();
  }, 5000);
}

function scheduleYeahDawg() {
  setTimeout(showYeahDawg, 1 * 60 * 1000);
}

yeahDawg.addEventListener("click", async () => {
  if (!yeahDawgActive || yeahDawgCollected) return;

  yeahDawgActive = false;
  clearTimeout(yeahDawgTimer);
  yeahDawgCollected = true;

  const dogAudio = new Audio("assets/yeahdawg.mp3");
  dogAudio.play().catch(() => {});

  yeahDawgImage.src = "assets/yeahdawg2.png";
  await new Promise(resolve => setTimeout(resolve, 800));

  yeahDawgImage.src = "assets/yeahdawg1.png";
  await new Promise(resolve => setTimeout(resolve, 100));

  yeahDawgImage.src = "assets/yeahdawg2.png";
  yeahDawg.classList.remove("peeking");

  await new Promise(resolve => setTimeout(resolve, 800));

  yeahDawg.hidden = true;

  const tape = $("yeahDawgTape");
  tape.hidden = false;
});

scheduleYeahDawg();
