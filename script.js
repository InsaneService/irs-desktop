const $ = id => document.getElementById(id);
const desktop = $("desktop");
const startButton = $("startButton");
const startMenu = $("startMenu");

// Remove the obsolete fake-virus desktop shortcut and its unused overlay.
// John de Mol is the replacement.
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

// Movable Windows-style application windows.
document.querySelectorAll(".window").forEach(win => {
  const bar = win.querySelector(".window-title");
  if (!bar) return;
  let drag = null;
  bar.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    const r = win.getBoundingClientRect();
    const d = desktop.getBoundingClientRect();
    win.style.transform = "none";
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

// Proper click-and-hold desktop icon dragging
document.querySelectorAll(".desktop-item").forEach(icon => {
  let dragging = false;
  let moved = false;
  let startX, startY, startLeft, startTop;

  icon.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;

    dragging = true;
    moved = false;

    const rect = icon.getBoundingClientRect();
    const desktop = document.querySelector("#desktop").getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left - desktop.left;
    startTop = rect.top - desktop.top;

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
    icon.releasePointerCapture(e.pointerId);
  });

  icon.addEventListener("pointercancel", () => {
    dragging = false;
  });
});



// YouTube loads only after the user clicks.
$("playVideo").addEventListener("click", () => {
  $("videoFrame").innerHTML =
    '<iframe src="https://www.youtube.com/embed/3NJEFZtLr9I?autoplay=1" title="Insane Revenue Service video" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
});

// Winamp playlist. The malformed array in the live version was the fatal syntax error.
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

// Snake 97 game.
const canvas = $("snakeCanvas");
const ctx = canvas.getContext("2d");
const cell = 20, cols = canvas.width/cell, rows = canvas.height/cell;
let snake, food, direction, nextDirection, score, snakeTimer;
let running = false, paused = false;
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
    ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.font="bold 17px Courier New";
    ctx.fillText(score===undefined ? "SNAKE 97" : "GAME OVER",canvas.width/2,canvas.height/2);
    ctx.font="12px Courier New";
    ctx.fillText("PRESS START / RESTART",canvas.width/2,canvas.height/2+23);
  } else if (paused) {
    ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.font="bold 20px Courier New";
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
  $("snakeScore").textContent=score; $("snakeStatus").textContent="PLAYING";
  snakeTimer=setInterval(tickSnake,115); drawSnake();
}
function tickSnake() {
  if (!running || paused) return;
  direction=nextDirection;
  const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
  if (head.x<0 || head.x>=cols || head.y<0 || head.y>=rows ||
      snake.some(p=>p.x===head.x && p.y===head.y)) {
    stopSnake(); $("snakeStatus").textContent="GAME OVER"; return;
  }
  snake.unshift(head);
  if (head.x===food.x && head.y===food.y) {
    score+=10; $("snakeScore").textContent=score; food=randomFood();
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
document.querySelectorAll("[data-dir]").forEach(b => {
  b.addEventListener("click", () => setSnakeDirection(b.dataset.dir));
});
snake=[{x:8,y:7},{x:7,y:7},{x:6,y:7}];
score=undefined; food={x:14,y:7}; drawSnake();

// John de Mol: simulated cascade of in-page dialogs, never browser alerts.
let johnCount = 0;
let johnTimers = [];
function spawnJohnDialog() {
  const overlay=$("johnOverlay");
  const box=document.createElement("div");
  box.className="john-warning";
  box.style.left=Math.max(4,Math.random()*(desktop.clientWidth-280))+"px";
  box.style.top=Math.max(4,Math.random()*(desktop.clientHeight-180))+"px";
  box.innerHTML='<strong>JOHN DE MOL APPLICATION</strong><p>you will never work in the entertainment business again.</p><button type="button">OK</button>';
  box.querySelector("button").addEventListener("click", () => {
    box.remove(); johnCount--;
    if (johnCount===0) overlay.hidden=true;
  });
  overlay.append(box);
playPopupSound();
johnCount++;
}
$("openJohn").addEventListener("click", () => {
  const overlay=$("johnOverlay");
  overlay.innerHTML="";
  johnCount=0;
  johnTimers.forEach(clearTimeout);
  johnTimers=[];
  overlay.hidden=false;
  for (let i=0;i<360;i++) johnTimers.push(setTimeout(spawnJohnDialog,i*55));
});

// Zine publishing switch: add a PDF in assets/zines/, then enable it here.
const ZINE = {
  enabled: true,
  file: "assets/zines/YOUR-ZINE.pdf",
  label: "Download the zine"
};
if (ZINE.enabled) {
  $("zineMenuLink").href=ZINE.file;
  $("zineMenuLink").download="";
  $("zineMenuLabel").textContent=ZINE.label;
  $("zineMenuLink").hidden=false;
}

// Jonkotrain: image approaches, grows, then exits; sound follows its approach.
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

  oscillator.type = "triangle";

  oscillator.frequency.setValueAtTime(440, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    180,
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
