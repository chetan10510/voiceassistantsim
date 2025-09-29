const orbCanvas = document.getElementById("voiceOrb");
const ctx = orbCanvas.getContext("2d");
orbCanvas.width = 220;
orbCanvas.height = 220;

let t = 0;
let listening = false;
let volume = 0;

function drawOrb() {
  ctx.clearRect(0, 0, orbCanvas.width, orbCanvas.height);

  const cx = orbCanvas.width / 2;
  const cy = orbCanvas.height / 2;
  const baseRadius = listening ? 70 : 55;
  const spikes = 60;
  const step = (Math.PI * 2) / spikes;

  ctx.beginPath();
  for (let i = 0; i <= spikes; i++) {
    const theta = i * step;
    const offset = Math.sin(i * 0.4 + t) * (listening ? 10 : 4);
    const react = listening ? volume * 40 : 0;
    const r = baseRadius + offset + react;
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = listening ? "#d1d5db" : "#444";
  ctx.fill();

  t += 0.03;
  requestAnimationFrame(drawOrb);
}
drawOrb();

window.setListeningState = (state) => { listening = state; };
window.updateVolume = (v) => { volume = v; };
