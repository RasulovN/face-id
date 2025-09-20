const socket = io(); // Socket.io connection
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resultDiv = document.getElementById('result');

// FaceMesh setup
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

// Handle face results and compare
async function onFaceResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks) {
    results.multiFaceLandmarks.forEach((landmarks) => {
      // Drawing face landmarks
      landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
      });

      // Compare faces with data stored in MongoDB
      const imageData = canvas.toDataURL('image/png');
      socket.emit('check', imageData);
    });
  }
}

// Receive the verification result from the server
socket.on('verification_result', (result) => {
  resultDiv.textContent = result ? 'Face Verified!' : 'Verification Failed!';
});

// Get user media
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => console.error('Error accessing camera:', err));
