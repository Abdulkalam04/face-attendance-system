import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Camera,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  Hash,
  UserCircle,
  LogIn,
  Eye,
  EyeOff
} from "lucide-react";
import API from "../api";

export default function StudentLogin() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const [formData, setFormData] = useState({
    roll_no: "",
    teacher_id: "",
    password: "",
  });

  const startCamera = async () => {
    try {
      // Clear captured image first so <video> element mounts before stream is ready
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStarted(true);
    } catch {
      alert("Camera access denied. Biometric verification is required to login.");
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);

    video.srcObject.getTracks().forEach((track) => track.stop());
    setCameraStarted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!capturedImage) {
      alert("Please verify your face to proceed.");
      return;
    }

    setLoading(true);
    try {
      const finalData = new FormData();
      finalData.append("roll_no", formData.roll_no);
      finalData.append("teacher_id", formData.teacher_id);
      finalData.append("password", formData.password);

      const blob = await (await fetch(capturedImage)).blob();
      finalData.append("face_image", blob, "student_login_attempt.jpg");

      // 1. Send login request to backend
      const response = await API.post("/login-with-face", finalData);

      // === CLEANUP OLD DATA FIRST ===
      // This prevents stale session data (like old activeClassId or teacherId) 
      // from persisting across database resets or user switches.
      localStorage.clear();

      // 2. SAVE EVERYTHING TO LOCALSTORAGE
      // These keys must match exactly what your StudentDashboard reads
      localStorage.setItem("userName", response.data.name);      // Saves student name
      localStorage.setItem("class_id", response.data.class_id); // Saves teacher/class ID
      localStorage.setItem("userRollNo", formData.roll_no);     // Saves roll number
      localStorage.setItem("userRole", "student");

      // ✅ FIX: Save Email so Profile Page works correctly
      if (response.data.email) {
        localStorage.setItem("userEmail", response.data.email);
      }

      // If your backend sends a token, save it too
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      // 3. Save Enrolled Classes (for Multi-Class Support)
      if (response.data.classes) {
        localStorage.setItem("studentClasses", JSON.stringify(response.data.classes));
        // Always store activeClassId directly so UI uses current data not legacy
        localStorage.setItem("activeClassId", response.data.class_id);
      }

      alert(`Welcome back, ${response.data.name}!`);
      navigate("/student-dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.div
      className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-indigo-100 overflow-hidden border-4 border-indigo-200 rounded-2xl shadow-xl flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

      <div className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl border border-white p-8 md:p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(79,70,229,0.15)] relative z-10 transition-all">

        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-8 hover:text-indigo-700 transition-all"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portal
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck size={14} /> Student Workspace
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Student <span className="text-indigo-600">Portal</span></h2>
          <p className="text-slate-500 font-medium mt-3">Access your records with secure biometric verification.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col justify-center space-y-6">
            <InputField
              icon={<Hash size={18} />}
              placeholder="Roll Number"
              onChange={(val) =>
                setFormData({ ...formData, roll_no: val })
              }
            />

            <InputField
              icon={<Lock size={18} />}
              type="password"
              placeholder="Password"
              onChange={(val) =>
                setFormData({ ...formData, password: val })
              }
            />

            <div className="text-right px-1">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-indigo-400 hover:text-indigo-600 hover:underline font-bold uppercase tracking-widest transition-colors"
              >
                Reset Password?
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-indigo-50/30 rounded-[2.5rem] p-8 border border-white/50 shadow-inner group">
            <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold text-xs uppercase tracking-widest">
              <ShieldCheck size={16} /> Identity Check
            </div>

            <div className="relative w-full max-w-[240px] aspect-square bg-transparent rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-white/50">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                {capturedImage ? (
                  <img src={capturedImage} className="w-full h-full object-cover object-center" alt="Captured" />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover object-center transition-opacity duration-500 ${cameraStarted ? "opacity-100" : "opacity-0"}`}
                  />
                )}
              </div>

              {!cameraStarted && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-indigo-600 text-white p-5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                  >
                    <Camera size={28} />
                  </button>
                  <p className="text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest">Verify Biometrics</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-6 flex flex-col items-center w-full">
              {cameraStarted && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Verify Now
                </button>
              )}

              {capturedImage && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-3 text-indigo-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-indigo-800 transition-colors"
                >
                  <RefreshCw size={14} /> Retry Scan
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6 pt-4">
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={24} /> : <><LogIn size={22} /> Access Student Account</>}
            </button>

            <p className="text-center text-slate-500 font-medium">
              Don't have a student account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register-student")}
                className="text-indigo-600 font-black hover:underline ml-1"
              >
                Register Official Identity
              </button>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function InputField({ icon, placeholder, type = "text", onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600">
        {icon}
      </div>
      <input
        required
        type={isPassword ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-indigo-100 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600 transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}
