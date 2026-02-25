import { useRef, useState, useEffect } from "react";
import { Camera, CheckCircle, RefreshCw, ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api";

export default function FaceEnroll() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle");
  // Statuses: idle | streaming | processing | success | error

  // Fetch identity based on role (Student: userRollNo, Teacher: classId)
  const studentId = localStorage.getItem("userRollNo") || localStorage.getItem("classId") || localStorage.getItem("teacher_id");
  const [loadingCamera, setLoadingCamera] = useState(false);

  useEffect(() => {
    // Camera remains OFF by default. User must click 'Initialize' button.
    return () => {
      console.log("Cleanup: Strictly stopping camera tracks...");
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setLoadingCamera(true);
      // We don't set status to streaming yet, only after we have the stream

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus("streaming"); // Now we show the video UI

        // Wait a tiny bit for the browser to register the source
        setTimeout(() => {
          videoRef.current?.play().catch(e => console.error("Play error:", e));
        }, 100);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Could not access camera. Please allow permissions.");
      setStatus("idle");
    } finally {
      setLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.label);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleBack = () => {
    stopCamera();
    navigate(-1);
  };

  const captureAndUpload = async () => {
    if (!studentId) {
      alert("User session expired. Please login again.");
      return;
    }

    setStatus("processing");
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("image", blob, "enrollment.jpg");
      formData.append("student_id", studentId);

      try {
        const response = await API.post("/enroll-face", formData);
        if (response.status === 200) {
          stopCamera();
          setStatus("success");
          // ✅ AUTO REDIRECT AFTER 2 SECONDS
          setTimeout(() => navigate("/student-dashboard"), 2000);
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert(err.response?.data?.error || "Face not detected. Ensure face is visible and well-lit.");
        setStatus("streaming");
      }
    }, "image/jpeg", 0.95);
  };

  const handleRetry = () => {
    setStatus("idle");
    startCamera();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-indigo-100 overflow-hidden border-4 border-indigo-200 rounded-2xl shadow-xl flex items-center justify-center p-4"
    >
      {/* Background Decor Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest hover:text-indigo-700 transition-all group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div className="max-w-xl w-full bg-white/70 backdrop-blur-2xl border border-white p-8 md:p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(79,70,229,0.15)] relative z-10 text-center">

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck size={14} /> Biometric Enrollment
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity <span className="text-indigo-600">Sync</span></h2>
          <p className="text-slate-500 font-medium mt-3">Link your physical features to your digital portal for seamless access.</p>
        </div>

        {/* Camera Display Box */}
        <div
          className="relative w-full max-w-md aspect-video flex items-center justify-center
  rounded-[2.5rem] overflow-hidden
  border-4 border-indigo-200
  bg-black
  shadow-[0_0_30px_rgba(99,102,241,0.35)]
  mb-8"
        >


          {/* 1. IDLE STATE - Entire Card Clickable for better responsiveness */}
          {status === "idle" && (
            <motion.button
              type="button"
              onClick={startCamera}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white group transition-all"
            >
              <p className="text-slate-400 text-xs font-medium mb-6 px-10 group-hover:text-indigo-400">
                Ensure you are in a well-lit area with a neutral background.
              </p>
              <div className="p-6 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 group-hover:scale-110 transition-all">
                <Camera size={32} />
              </div>
              <p className="text-indigo-600 text-[10px] mt-6 font-bold uppercase tracking-widest group-hover:tracking-[0.25em] transition-all">
                Initialize Biometrics
              </p>
            </motion.button>
          )}
          {/* 2. VIDEO STREAM */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={() => videoRef.current?.play()}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* 2.5 LOADING CAMERA OVERLAY */}
          {loadingCamera && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
              <RefreshCw className="text-white animate-spin mb-4" size={40} />
              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Accessing Lens...</p>
            </div>
          )}

          {/* 3. PROCESSING OVERLAY */}
          {status === "processing" && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <ShieldCheck size={32} className="absolute inset-0 m-auto text-indigo-600" />
              </div>
              <p className="mt-4 font-black text-indigo-600 text-xs uppercase tracking-widest animate-pulse">Mapping Face Geometry...</p>
            </div>
          )}

          {/* 4. SUCCESS OVERLAY */}
          {status === "success" && (
            <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center text-white px-8 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={56} className="text-white" />
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-2">Sync Successful</h3>
              <p className="text-emerald-50 text-sm font-medium mb-10">Your biometric signature has been securely linked to your profile.</p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => {
                    stopCamera();
                    navigate("/student-dashboard");
                  }}
                  className="w-full bg-white text-emerald-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={handleRetry}
                  className="text-white text-xs font-bold hover:underline"
                >
                  Reregister Scan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {status === "streaming" && (
          <button
            onClick={captureAndUpload}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserCheck size={24} /> Sync Biometrics Now
          </button>
        )}
      </div>
    </motion.div>
  );
}
