import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ShieldCheck, RefreshCcw, XCircle, ArrowLeft, Loader2, Sparkles, MoveHorizontal, CheckCircle, Zap } from "lucide-react";
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';
import API from "../api";

export default function ScanFace() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const modelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const [modelLoaded, setModelLoaded] = useState(false);

  // Liveness Detection States - HEAD MOVEMENT
  const [livenessStage, setLivenessStage] = useState("idle");
  const [livenessTimer, setLivenessTimer] = useState(20);
  const [debugInfo, setDebugInfo] = useState("");
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);

  // Geo-Fencing Location
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationError, setLocationError] = useState(false);

  const classId = localStorage.getItem("activeClassId") || localStorage.getItem("classId") || localStorage.getItem("class_id");
  const rollNo = localStorage.getItem("userRollNo");

  // Load BlazeFace model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("📦 Loading BlazeFace model...");
        const model = await blazeface.load();
        modelRef.current = model;
        setModelLoaded(true);
        console.log("✅ BlazeFace model loaded successfully!");
      } catch (err) {
        console.error("❌ Failed to load model:", err);
        setStatus("error");
        setErrorMsg("Failed to load AI model. Please refresh the page.");
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    startCamera();

    // ✅ NEW: Capture GPS Location for Geo-Fencing
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
          console.log("📍 Location captured:", pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error("📍 Location access denied:", err);
          setLocationError(true);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError(true);
    }

    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Liveness detection timer
  useEffect(() => {
    if (livenessStage === "blink_required" && livenessTimer > 0) {
      const timer = setTimeout(() => {
        setLivenessTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (livenessStage === "blink_required" && livenessTimer === 0) {
      setStatus("error");
      setErrorMsg("Time's up! Please try again and move your head clearly.");
      setLivenessStage("idle");
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    }
  }, [livenessStage, livenessTimer]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus("ready");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Camera access denied. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ✅ STEP 1: Detect head movement using nose position
  const detectHeadMovement = async () => {
    if (!modelRef.current || !videoRef.current) return null;

    try {
      const predictions = await modelRef.current.estimateFaces(videoRef.current, false);

      if (predictions.length > 0) {
        const face = predictions[0];

        // Nose landmark
        const nose = face.landmarks[2]; // [x, y]

        return {
          detected: true,
          noseX: nose[0],
        };
      }
    } catch (err) {
      console.error(err);
    }

    return null;
  };

  // ✅ STEP 3: Head movement detection
  const startLivenessCheck = async () => {
    if (!modelLoaded) {
      setStatus("error");
      setErrorMsg("AI model not loaded yet. Please wait and try again.");
      return;
    }

    console.log("🚀 Starting AI-powered head movement detection...");
    setStatus("liveness_check");
    setLivenessStage("calibrating");
    setLivenessTimer(20);
    setLeftDone(false);
    setRightDone(false);

    let centerX = 0;
    let leftDone = false;
    let rightDone = false;

    // Calibrate center
    for (let i = 0; i < 10; i++) {
      const res = await detectHeadMovement();

      if (res?.detected) {
        centerX += res.noseX;
      }

      await new Promise(r => setTimeout(r, 100));
    }

    centerX /= 10;
    console.log(`📊 Center calibrated at: ${centerX.toFixed(1)}`);

    setLivenessStage("blink_required"); // Reusing this state for head movement

    detectionIntervalRef.current = setInterval(async () => {
      const res = await detectHeadMovement();

      if (!res) {
        setDebugInfo("⚠️ No face detected");
        return;
      }

      const diff = res.noseX - centerX;

      setDebugInfo(`Position: ${diff.toFixed(1)} | Left: ${leftDone ? '✓' : '○'} | Right: ${rightDone ? '✓' : '○'}`);

      // Turn Left (nose moves right in video, which is left for user)
      if (diff > 30 && !leftDone) {
        leftDone = true;
        setLeftDone(true);
        console.log("✅ LEFT turn detected!");
      }

      // Turn Right (nose moves left in video, which is right for user)
      if (diff < -30 && !rightDone) {
        rightDone = true;
        setRightDone(true);
        console.log("✅ RIGHT turn detected!");
      }

      if (leftDone && rightDone) {
        clearInterval(detectionIntervalRef.current);
        console.log("🎉 Head movement verified!");
        setLivenessStage("verified");
        setDebugInfo("Liveness Verified! Face forward...");

        // Give the user 1.5 seconds to face the camera again before capturing
        setTimeout(() => {
          handleFinalCapture();
        }, 1500);
      }
    }, 200);
  };

  // Final capture and verification
  const handleFinalCapture = async () => {
    setStatus("scanning");
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    // Capture at full video resolution (640x480) for better backend recognition
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("rollNo", rollNo);
      formData.append("classId", classId);
      formData.append("face_image", blob, "capture.jpg");
      formData.append("liveness_verified", "true");
      formData.append("blink_count", "2");

      // ✅ Location Data for Geo-Fencing
      if (location.lat && location.lon) {
        formData.append("latitude", location.lat);
        formData.append("longitude", location.lon);
      }

      try {
        const res = await API.post("/attendance/verify-face", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data.success) {
          stopCamera(); // Stop camera automatically after the scan has succeeded!
          setStatus("success");
          const interval = setInterval(async () => {
            try {
              const check = await API.get("/attendance/status", {
                params: { rollNo, classId },
              });
              if (check.data.status === "approved") {
                clearInterval(interval);
                navigate("/student-dashboard", { replace: true });
              }
              if (check.data.status === "rejected") {
                clearInterval(interval);
                setStatus("error");
                setErrorMsg("Attendance rejected by teacher");
              }
            } catch (err) {
              console.error(err);
            }
          }, 5000);
        } else {
          throw new Error(res.data.message);
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg(err.response?.data?.message || err.message);
        setLivenessStage("idle");

        // ✅ AUTO REFRESH ON ERROR AFTER 5 SECONDS
        setTimeout(() => window.location.reload(), 5000);
      }
    }, "image/jpeg");
  };

  return (
    <motion.div
      className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-indigo-100 border-4 border-indigo-200 rounded-2xl shadow-xl flex flex-col items-center justify-center px-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

      {/* Header Section */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="relative z-10 mb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-3">
          <Zap size={14} className={modelLoaded ? "text-emerald-600" : "animate-pulse"} />
          {modelLoaded ? "AI Head Movement Detection" : "Loading AI Model..."}
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Face <span className="text-indigo-600">Authentication</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2">Roll No: {rollNo}</p>

        {/* Calibration Status */}
        {livenessStage === "calibrating" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200"
          >
            <Loader2 className="text-blue-600 animate-spin" size={16} />
            <span className="text-blue-700 font-bold text-sm">
              Calibrating AI... Face forward!
            </span>
          </motion.div>
        )}

        {/* Liveness Status Indicator */}
        {livenessStage === "blink_required" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 inline-flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
              <MoveHorizontal className="text-amber-600 animate-pulse" size={16} />
              <span className="text-amber-700 font-bold text-sm">
                Turn head left & right slowly ({livenessTimer}s)
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-lg max-w-xs truncate">
              {debugInfo}
            </p>
          </motion.div>
        )}

        {livenessStage === "verified" && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200"
          >
            <ShieldCheck className="text-emerald-600" size={16} />
            <span className="text-emerald-700 font-bold text-sm">
              Verification Successful! Look at camera for photo... ✓
            </span>
          </motion.div>
        )}
      </motion.div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Glass Container */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-[0_30px_60px_rgba(79,70,229,0.15)] border border-white p-5">

          {/* Camera Viewport */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl ring-4 ring-white/50">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all duration-1000 ${status === "success" || status === "scanning" ? "scale-110 blur-sm opacity-40" : "scale-100 opacity-100"
                }`}
            />
            <canvas ref={canvasRef} width="400" height="300" className="hidden" />

            {/* Calibration Overlay */}
            {livenessStage === "calibrating" && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <Zap className="text-white drop-shadow-lg" size={64} />
                </motion.div>
              </div>
            )}

            {/* Head Movement Detection Overlay */}
            {livenessStage === "blink_required" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-64 h-64 border-4 border-amber-400 rounded-[3rem] shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-8">
                  <motion.div
                    animate={{ x: leftDone ? 0 : [-10, 0] }}
                    transition={{ repeat: leftDone ? 0 : Infinity, duration: 1 }}
                    className={`${leftDone ? 'text-emerald-400' : 'text-amber-400'}`}
                  >
                    <ArrowLeft size={40} className="drop-shadow-lg" />
                  </motion.div>
                  <motion.div
                    animate={{ x: rightDone ? 0 : [10, 0] }}
                    transition={{ repeat: rightDone ? 0 : Infinity, duration: 1 }}
                    className={`${rightDone ? 'text-emerald-400' : 'text-amber-400'}`}
                  >
                    <ArrowLeft size={40} className="drop-shadow-lg rotate-180" />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Futuristic Scanning Overlays */}
            {status === "ready" && livenessStage === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="w-72 h-72 border border-indigo-400/30 rounded-full border-dashed"
                />
                <div className="absolute w-64 h-64 border-[3px] border-indigo-500/40 rounded-[3rem]" />
                <motion.div
                  animate={{ y: [-100, 100, -100] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50 shadow-[0_0_15px_indigo]"
                />
              </div>
            )}

            {/* Animated Status Layers */}
            <AnimatePresence>
              {status === "scanning" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-900/40 backdrop-blur-md"
                >
                  <Loader2 className="text-white animate-spin mb-4" size={48} />
                  <p className="text-white font-black tracking-widest text-sm italic">MATCHING BIOMETRICS...</p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-emerald-600/20 backdrop-blur-md"
                >
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 mb-6">
                    <ShieldCheck size={48} className="text-white" />
                  </div>
                  <p className="font-black text-3xl text-white drop-shadow-lg">IDENTITY VERIFIED</p>
                  <p className="text-emerald-50 text-sm mt-3 font-semibold px-4">
                    Please wait. Redirecting after teacher approval...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Area */}
          <div className="mt-6 px-2 pb-4">
            {status === "error" ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="inline-flex p-4 bg-rose-50 rounded-3xl mb-4 border border-rose-100">
                  <XCircle className="text-rose-500" size={32} />
                </div>
                <h3 className="text-rose-700 font-black mb-2 uppercase tracking-tight">Verification Failed</h3>
                <p className="text-rose-500/80 font-medium text-sm mb-6 leading-relaxed">
                  {errorMsg} <br />
                  <span className="text-xs opacity-70">Target Class ID: {classId || "None"}</span>
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  RETRY SCAN
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Location Status Warning */}
                {locationError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <Zap size={20} className="fill-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-orange-700 uppercase tracking-tight">Location Blocked</p>
                      <p className="text-[10px] text-orange-600 font-bold">Please enable GPS/Location in your browser to verify you are on campus.</p>
                    </div>
                  </motion.div>
                )}

                {/* Movement Progress Display */}
                {livenessStage === "blink_required" && (
                  <div className="flex justify-center gap-3">
                    <motion.div
                      animate={leftDone ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${leftDone
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-lg"
                        : "bg-slate-100 border-slate-300 text-slate-400"
                        }`}
                    >
                      {leftDone ? <CheckCircle size={24} /> : <ArrowLeft size={24} />}
                    </motion.div>
                    <motion.div
                      animate={rightDone ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${rightDone
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-lg"
                        : "bg-slate-100 border-slate-300 text-slate-400"
                        }`}
                    >
                      {rightDone ? <CheckCircle size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
                    </motion.div>
                  </div>
                )}

                <div className="flex items-center gap-3 justify-center bg-indigo-50/50 py-3 px-4 rounded-2xl border border-indigo-100">
                  <Sparkles className="text-indigo-400" size={16} />
                  <p className="text-indigo-900 font-bold text-xs uppercase tracking-tight">
                    {status === "success"
                      ? "Awaiting Session Confirmation"
                      : livenessStage === "calibrating"
                        ? "AI is learning your face..."
                        : livenessStage === "blink_required"
                          ? "Turn head left and right slowly"
                          : "Center your face in the guide"}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startLivenessCheck}
                  disabled={status === "scanning" || status === "success" || status === "liveness_check" || !modelLoaded}
                  className={`w-full py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all shadow-2xl
                  ${status === "scanning" || status === "success" || status === "liveness_check" || !modelLoaded
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-200"
                    }`}
                >
                  {status === "scanning" ? (
                    <RefreshCcw className="animate-spin" size={22} />
                  ) : status === "success" ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : !modelLoaded ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <Camera size={22} />
                  )}
                  <span className="tracking-tighter text-lg">
                    {status === "scanning"
                      ? "VERIFYING..."
                      : status === "success"
                        ? "AWAITING TEACHER"
                        : status === "liveness_check"
                          ? "AI DETECTING..."
                          : !modelLoaded
                            ? "LOADING AI..."
                            : "START IDENTITY SCAN"}
                  </span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <motion.button
        whileHover={{ x: -5 }}
        onClick={() => navigate(-1)}
        className="mt-12 flex items-center gap-2 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-indigo-600 transition-colors z-10"
      >
        <ArrowLeft size={18} />
        <span>Return to Dashboard</span>
      </motion.button>
    </motion.div>
  );
}