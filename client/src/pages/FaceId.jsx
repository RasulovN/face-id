import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useParams } from "react-router-dom";
import io from 'socket.io-client';
import API_BASE_URL from '../config';

const FaceId = () => {
  const { companyName, groupName } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const socketRef = useRef(null);

  // Kamerani ishga tushirish
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Kamera xatosi: ", err));
  };

  // Modellarni yuklash
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
    startVideo();

    // Connect to socket
    socketRef.current = io();
    socketRef.current.on('verification_result', (result) => {
      setVerificationResult(result[0]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Yuzni aniqlash va tekshirish
  useEffect(() => {
    if (!modelsLoaded) return;

    const interval = setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi
          .detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptors();

        const canvas = canvasRef.current;
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        };
        faceapi.matchDimensions(canvas, displaySize);

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        // Send frame for verification
        if (detections.length > 0 && companyName && groupName) {
          const imageData = canvas.toDataURL('image/jpeg');
          socketRef.current.emit('verify_face', {
            imageData,
            companyName,
            groupName
          });
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [modelsLoaded, companyName, groupName]);

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-4">
        Face Verification for {companyName} - {groupName}
      </h1>
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          width="640"
          height="480"
          style={{ borderRadius: "12px" }}
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>
      {verificationResult && (
        <div className={`mt-4 p-4 rounded ${verificationResult.verified ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className="text-lg font-semibold">
            {verificationResult.verified ? '✅ Verified' : '❌ Not Verified'}
          </p>
          <p>Name: {verificationResult.name}</p>
          {verificationResult.distance && <p>Distance: {verificationResult.distance}</p>}
        </div>
      )}
    </div>
  );
};

export default FaceId;


// /svsfdvfd