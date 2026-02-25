import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Camera, RefreshCw, CheckCircle2, XCircle, Shield, ArrowLeft } from "lucide-react";
import API from "../api";

export default function FaceScanner() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  // Initialize Camera on Mount
  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, []);

  // Auto-clear result after 3 seconds to allow next scan
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        alert("Camera access denied. Please enable camera permissions.");
      });
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndVerify = async () => {
    if (scanning) return;
    setScanning(true);
    setResult(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Set canvas size to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror the image for the backend if needed (optional)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("image", blob, "scan.jpg");
      // Use classId from local storage to filter matching students
      formData.append("teacher_id", localStorage.getItem("classId"));

      try {
        const res = await API.post("/check-face", formData); if (res.data.match) {
          setResult({ status: "success", name: res.data.name });
        } else {
          setResult({ status: "error", name: "Face Not Recognized" });
        }
      } catch (err) {
        setResult({ status: "error", name: "Recognition Failed" });
      } finally {
        setScanning(false);
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="bg-[#020617] min-h-screen text-white flex flex-col items-center justify-center px-6 font-poppins">

      {/* Back Button */}
      <button
        onClick={() => navigate("/teacher-dashboard")}
        className="absolute top-10 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold text-sm"
      >
        <ArrowLeft size={18} /> BACK TO PANEL
      </button>

      {/* Scanner Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4"
        >
          <Shield className="text-indigo-500" size={32} />
        </motion.div>
        <h2 className="text-3xl font-black tracking-tight">Biometric Terminal</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
          Scanning class <span className="text-indigo-400 font-mono font-bold">{localStorage.getItem("classId")}</span>
        </p>
      </div>

      {/* Camera Viewport */}

      <div className="relative w-full max-w-sm aspect-square rounded-[3rem] border-4 border-slate-800 overflow-hidden bg-slate-900 shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)]">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* UI Overlay: Scanning Frame */}
        <div className="absolute inset-0 border-[20px] border-[#020617]" />

        {/* Animated Scan Line */}
        {!result && (
          <motion.div
            animate={{ top: ["10%", "85%", "10%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-10 right-10 h-[2px] bg-indigo-400 shadow-[0_0_20px_2px_#6366f1] z-10"
          />
        )}

        {/* Result States */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center z-20 ${result.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className={`p-6 rounded-full ${result.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
              >
                {result.status === 'success' ? <CheckCircle2 size={64} /> : <XCircle size={64} />}
              </motion.div>
              <h3 className="text-2xl font-black mt-4">{result.status === 'success' ? "Verified" : "Unknown"}</h3>
              <p className="text-sm font-medium opacity-70">{result.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Actions */}
      <div className="flex flex-col items-center gap-6 mt-12 w-full max-w-sm">
        <button
          onClick={captureAndVerify}
          disabled={scanning}
          className={`group relative w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black tracking-widest transition-all active:scale-95 ${scanning
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/30'
            }`}
        >
          {scanning ? (
            <RefreshCw className="animate-spin" size={24} />
          ) : (
            <>
              <Camera size={24} />
              <span>MARK ATTENDANCE</span>
            </>
          )}
        </button>

        <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em]">
          Automated Identity Verification
        </p>
      </div>
    </div>
  );
}