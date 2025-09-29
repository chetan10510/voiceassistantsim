const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const copyBtn = document.getElementById("copy");
const downloadBtn = document.getElementById("download");
const clearBtn = document.getElementById("clear");
const statusEl = document.getElementById("status");
const output = document.getElementById("output");

let recog, finalText = "", audioContext, analyser, micStream;

async function getAIResponse(prompt) {
  if (!window.env || !window.env.GROQ_API_KEY) {
    return "❌ API Key missing. Please set GROQ_API_KEY in Netlify.";
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.env.GROQ_API_KEY
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "⚠️ No response";
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  speechSynthesis.speak(utterance);
}

function initWebSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusEl.textContent = "❌ Not supported in this browser.";
    return null;
  }
  const rec = new SpeechRecognition();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;
  rec.onstart = () => { statusEl.textContent = "🎧 Listening..."; setListeningState(true); };
  rec.onend = () => {
    if (startBtn.disabled) rec.start();
    else { statusEl.textContent = "Stopped."; setListeningState(false); }
  };
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalText += transcript.trim() + " ";
        getAIResponse(finalText).then(response => {
          output.textContent = response;
          speak(response);
          [copyBtn, downloadBtn, clearBtn].forEach(btn => btn.classList.remove("hidden"));
        });
      } else {
        interim += transcript;
      }
    }
  };
  return rec;
}

async function startMicVolume() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(micStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  function update() {
    analyser.getByteFrequencyData(dataArray);
    let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    updateVolume(avg / 255);
    requestAnimationFrame(update);
  }
  update();
}

function stopMicVolume() {
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

startBtn.onclick = async () => {
  finalText = "";
  output.textContent = "";
  recog = initWebSpeech();
  if (recog) recog.start();
  await startMicVolume();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  [copyBtn, downloadBtn, clearBtn].forEach(btn => btn.classList.add("hidden"));
};

stopBtn.onclick = () => {
  if (recog) recog.stop();
  stopMicVolume();
  speechSynthesis.cancel();
  startBtn.disabled = false;
  stopBtn.disabled = true;
};

copyBtn.onclick = async () => {
  await navigator.clipboard.writeText(output.textContent);
  statusEl.textContent = "✅ Copied!";
  setTimeout(() => { statusEl.textContent = "🎧 Listening..."; }, 2000);
};

downloadBtn.onclick = () => {
  const blob = new Blob([output.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transcript_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

clearBtn.onclick = () => {
  finalText = "";
  output.textContent = "";
  speechSynthesis.cancel();
  [copyBtn, downloadBtn, clearBtn].forEach(btn => btn.classList.add("hidden"));
};
