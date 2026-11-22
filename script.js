const $ = (id) => document.getElementById(id);
const startButton = $("startButton"), startMenu = $("startMenu");
startButton.addEventListener("click", (e) => { e.stopPropagation(); startMenu.hidden = !startMenu.hidden; });
document.addEventListener("click", e => { if (!startMenu.hidden && !startMenu.contains(e.target) && e.target !== startButton) startMenu.hidden = true; });

function showWindow(id){ $(id).hidden = false; startMenu.hidden = true; }
$("videoShortcut").addEventListener("click",()=>showWindow("videoWindow"));
$("quickVideo").addEventListener("click",()=>showWindow("videoWindow"));
$("openPlayer").addEventListener("click",()=>showWindow("playerWindow"));
$("quickPlayer").addEventListener("click",()=>showWindow("playerWindow"));
$("quickMail").addEventListener("click",()=>location.href="mailto:Bookings@momo-records.com?subject=Booking%20enquiry");
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).hidden=true));

$("playVideo").addEventListener("click",()=>{
  $("videoFrame").innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/3NJEFZtLr9I?autoplay=1" title="Insane Revenue Service video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
});

// Pointer-based desktop dragging. Save percentage positions so they remain sensible across screen sizes.
const desktop = $("desktop");
const draggable = [...document.querySelectorAll(".desktop-item")];
draggable.forEach((el,i)=>{
  const key = "irs-position-"+(el.classList[1]||i);
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if(saved && innerWidth > 650){ el.style.left=saved.x+"%"; el.style.top=saved.y+"%"; }
  } catch {}
  let drag=null;
  el.addEventListener("pointerdown",e=>{
    if(e.target.closest("a") && e.pointerType==="mouse" && e.button!==0)return;
    const r=el.getBoundingClientRect(), d=desktop.getBoundingClientRect();
    drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top,moved:false,startX:e.clientX,startY:e.clientY};
    el.setPointerCapture(e.pointerId);
    el.style.zIndex=20;
  });
  el.addEventListener("pointermove",e=>{
    if(!drag || drag.id!==e.pointerId)return;
    const d=desktop.getBoundingClientRect();
    if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;
    if(!drag.moved)return;
    let x=e.clientX-d.left-drag.dx, y=e.clientY-d.top-drag.dy;
    x=Math.max(0,Math.min(d.width-el.offsetWidth,x));
    y=Math.max(0,Math.min(d.height-$("taskbar").offsetHeight-el.offsetHeight,y));
    el.style.left=(x/d.width*100)+"%";el.style.top=(y/d.height*100)+"%";
  });
  el.addEventListener("pointerup",e=>{
    if(!drag)return;
    if(drag.moved){
      const left=parseFloat(el.style.left),top=parseFloat(el.style.top);
      localStorage.setItem(key,JSON.stringify({x:left,y:top}));
      // prevent the click following a drag
      el.dataset.dragged="1";setTimeout(()=>delete el.dataset.dragged,100);
    }
    drag=null;
  });
  el.addEventListener("click",e=>{if(el.dataset.dragged==="1"){e.preventDefault();e.stopImmediatePropagation();}});
});

// Winamp-style player: add tracks later by editing the TRACKS list below.
const TRACKS = [
  // Example: { title: "Track title", artist: "Insane Revenue Service", src: "assets/music/track01.mp3" }
];
const audio=$("audio"), playlist=$("playlist");
let current=-1;
function time(s){if(!Number.isFinite(s))return "00:00";return String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0")}
function renderPlaylist(){
  playlist.innerHTML="";
  if(!TRACKS.length){playlist.innerHTML='<li class="empty-playlist">NO AUDIO RECORDS ON FILE — TRACKLIST PENDING</li>';return}
  TRACKS.forEach((t,i)=>{const li=document.createElement("li");li.textContent=String(i+1).padStart(2,"0")+"  "+t.title+" — "+(t.artist||"IRS");li.className=i===current?"active":"";li.addEventListener("click",()=>loadTrack(i,true));playlist.append(li)});
}
function loadTrack(i,play=false){
  if(!TRACKS.length)return;current=(i+TRACKS.length)%TRACKS.length;
  audio.src=TRACKS[current].src;$("trackName").textContent=TRACKS[current].title.toUpperCase();renderPlaylist();
  if(play)audio.play().catch(()=>{});
}
$("play").addEventListener("click",()=>{if(!TRACKS.length){$("trackName").textContent="NO RECORDS — ADD MP3 FILES LATER";return}if(current<0)loadTrack(0);audio.play().catch(()=>{})});
$("pause").addEventListener("click",()=>audio.pause());
$("stop").addEventListener("click",()=>{audio.pause();audio.currentTime=0});
$("prev").addEventListener("click",()=>loadTrack(current-1,true));
$("next").addEventListener("click",()=>loadTrack(current+1,true));
$("volume").addEventListener("input",e=>audio.volume=Number(e.target.value));
$("seek").addEventListener("input",e=>{if(audio.duration)audio.currentTime=audio.duration*Number(e.target.value)/100});
audio.addEventListener("timeupdate",()=>{$("elapsed").textContent=time(audio.currentTime);$("duration").textContent=time(audio.duration);if(audio.duration)$("seek").value=audio.currentTime/audio.duration*100});
audio.addEventListener("ended",()=>loadTrack(current+1,true));
renderPlaylist();audio.volume=.7;

// Keep all elements usable on touch; avoid selecting text while dragging.
