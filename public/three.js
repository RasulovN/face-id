const socket = io(); // Socket.io connection
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Three.js setup
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
const scene = new THREE.Scene();
const camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(640, 480);
document.getElementById('dcontainer').appendChild(renderer.domElement);

// Add a simple cube to the scene
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera3D.position.z = 5;

// FaceMesh setup for face detection
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

// Face detection and AR lines (on face landmarks)
function onFaceResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks) {
    results.multiFaceLandmarks.forEach((landmarks) => {
      // Drawing face landmarks as small circles on the canvas
      landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
      });

      // Draw AR lines (e.g., nose to left eye)
      const nose = results.multiFaceLandmarks[0][1]; // Nose tip
      const leftEye = results.multiFaceLandmarks[0][33]; // Left eye

      ctx.beginPath();
      ctx.moveTo(nose.x * canvas.width, nose.y * canvas.height);
      ctx.lineTo(leftEye.x * canvas.width, leftEye.y * canvas.height);
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }
}

// Send video frames to the server
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    setInterval(() => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/png'); // Get base64 image
      socket.emit('stream', imageData); // Send to server
    }, 100); // Send every 100ms
  })
  .catch((err) => console.error('Error accessing camera:', err));

// Receive modified frames from server and render on canvas
socket.on('render', (modifiedFrame) => {
  const img = new Image();
  img.src = modifiedFrame;
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
});

// Three.js rendering loop (for 3D scene)
function animate() {
  requestAnimationFrame(animate);

  // Rotate the cube based on detected face position (optional example)
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const face = results.multiFaceLandmarks[0];

    // You can use the face landmarks to calculate rotation or movement in the 3D scene
    const nose = face[1];
    const leftEye = face[33];

    // Simple example: Use the distance between the nose and left eye to rotate the cube
    const deltaX = leftEye.x - nose.x;
    cube.rotation.x += deltaX * 0.1; // Adjust rotation sensitivity
    cube.rotation.y += deltaX * 0.1;
  }

  // Render the Three.js scene
  renderer.render(scene, camera3D);
}

animate();
