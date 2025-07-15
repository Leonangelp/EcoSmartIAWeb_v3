
let model, webcam, maxPredictions;
let useFrontCamera = true;
let isCameraOn = true;
let lastFrame = null;

const modelURL = "./model.json";
const metadataURL = "./metadata.json";

const uploadedImg = document.getElementById("uploaded-image");
const resultText = document.getElementById("result-text");
const labelContainer = document.getElementById("label-container");
const webcamContainer = document.getElementById("webcam-container");
const toggleBtn = document.getElementById("btn-toggle");

async function initCamera() {
  if (webcam) await webcam.stop();

  webcam = new tmImage.Webcam(300, 225, useFrontCamera);
  await webcam.setup({ facingMode: useFrontCamera ? "user" : "environment" });
  await webcam.play();

  webcamContainer.innerHTML = "";
  webcamContainer.appendChild(webcam.canvas);
  webcam.canvas.style.borderRadius = "10px";
  webcam.canvas.style.marginBottom = "15px";
  uploadedImg.style.display = "none";
  isCameraOn = true;
  toggleBtn.innerText = "Pausar cámara";
  window.requestAnimationFrame(loop);
}

async function initModel() {
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
  await initCamera();
}

async function loop() {
  if (isCameraOn) {
    webcam.update();
    await predict(webcam.canvas);
    lastFrame = webcam.canvas.toDataURL();
  }
  window.requestAnimationFrame(loop);
}

async function predict(source) {
  const prediction = await model.predict(source);
  prediction.sort((a, b) => b.probability - a.probability);

  labelContainer.innerHTML = "";
  if (prediction[0].probability >= 0.9) {
    resultText.innerHTML = `Parece que tu desecho es <strong>${prediction[0].className}</strong>`;
  } else {
    resultText.innerHTML = `Parece que tu desecho es <strong>___</strong>`;
  }

  prediction.forEach(p => {
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = (p.probability * 100).toFixed(0) + "%";
    fill.textContent = `${p.className} ${(p.probability * 100).toFixed(0)}%`;
    bar.appendChild(fill);
    labelContainer.appendChild(bar);
  });
}

function toggleCamera() {
  if (!isCameraOn) {
    initCamera();
  } else {
    isCameraOn = false;
    toggleBtn.innerText = "Reanudar cámara";
    const freezeFrame = new Image();
    freezeFrame.src = lastFrame;
    freezeFrame.style.borderRadius = "10px";
    freezeFrame.style.maxWidth = "100%";
    freezeFrame.style.marginBottom = "15px";
    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(freezeFrame);
  }
}

function switchCamera() {
  useFrontCamera = !useFrontCamera;
  initCamera();
}

function handleUpload(input) {
  const file = input.files[0];
  if (file) {
    uploadedImg.src = URL.createObjectURL(file);
    uploadedImg.onload = () => {
      isCameraOn = false;
      toggleBtn.innerText = "Reanudar cámara";
      uploadedImg.style.display = "block";
      webcamContainer.innerHTML = "";
      predict(uploadedImg);
    };
  }
}

initModel();
