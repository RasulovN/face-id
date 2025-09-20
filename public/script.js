const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const socket = io(); // Socket.io connection

// MediaPipe FaceMesh setup
const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
faceMesh.onResults(onFaceResults);

// Camera setup
const camera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({ image: video });
  },
  width: 640,
  height: 480,
});
camera.start();

// Handle face results
function onFaceResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks) {
    results.multiFaceLandmarks.forEach((landmarks) => {
      landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
      });
    });
  }
}

// Save face data to the server
document.getElementById('saveButton').addEventListener('click', () => {
  const landmarks = getFaceLandmarksFromCanvas();
  fetch('/detection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ landmarks }),
  })
    .then((response) => response.json())
    .then((data) => alert(data.message || 'Error saving face data'))
    .catch((err) => alert('Error saving face data: ' + err));
});

// Get face landmarks from the canvas (simplified)
function getFaceLandmarksFromCanvas() {
  // For now, we are just sending random data.
  // You can extract the actual landmarks from the faceMesh results
  return [{ x: 0.5, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.7, y: 0.5 }];
}
