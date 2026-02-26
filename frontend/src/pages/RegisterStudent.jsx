import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Key,
  Hash,
  Camera,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";
import API from "../api";

export default function StudentRegister() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    roll_no: "",
    email: "",
    password: "",
    class_id: "", // This is the Teacher ID input
  });

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStarted(true);
    } catch {
      alert("Camera access denied. Face enrollment is mandatory.");
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
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraStarted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!capturedImage) {
      alert("Please capture your face photo.");
      return;
    }

    setLoading(true);
    try {
      const finalData = new FormData();
      finalData.append("name", formData.name);
      finalData.append("roll_no", formData.roll_no);
      finalData.append("email", formData.email.toLowerCase());
      finalData.append("password", formData.password);

      // FIXED: Sending 'teacher_id' to match your backend's data.get('teacher_id') 
      finalData.append("teacher_id", formData.class_id.trim());

      const response = await fetch(capturedImage);
      const blob = await response.blob();
      finalData.append("face_image", blob, "student_face.jpg");

      await API.post("/register/student-with-face", finalData);

      alert("Student Registration Successful!");
      navigate("/student-login");
    } catch (err) {
      console.error("Full Error:", err);
      const errorMsg = err.response?.data?.error || "Registration failed. Please check if the server is online and the URL is correct.";
      alert(errorMsg);
    }
    finally {
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

      <div className="w-full max-w-5xl bg-white/70 backdrop-blur-2xl border border-white p-8 md:p-12 rounded-[3rem] shadow-[0_30px_60px_rgba(79,70,229,0.15)] relative z-10 transition-all">
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
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Student <span className="text-indigo-600">Onboarding</span></h2>
          <p className="text-slate-500 font-medium mt-3">Create your global biometric identity. You can join classes anytime.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-5">
            <InputField icon={<User size={18} />} placeholder="Full Name" onChange={(v) => setFormData({ ...formData, name: v })} />
            <InputField icon={<Hash size={18} />} placeholder="Roll Number" onChange={(v) => setFormData({ ...formData, roll_no: v })} />
            <InputField icon={<Key size={18} />} placeholder="Join first class (Optional - Enter ID)" onChange={(v) => setFormData({ ...formData, class_id: v })} required={false} />
            <InputField icon={<Mail size={18} />} type="email" placeholder="Email Address" onChange={(v) => setFormData({ ...formData, email: v })} />
            <InputField icon={<Lock size={18} />} type="password" placeholder="Password" onChange={(v) => setFormData({ ...formData, password: v })} />
          </div>

          <div className="flex flex-col items-center justify-center bg-indigo-50/30 rounded-[2.5rem] p-8 border border-white/50 shadow-inner group">
            <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold text-xs uppercase tracking-widest">
              <Camera size={14} className="group-hover:rotate-12 transition-transform" />
              Face Enrollment
            </div>

            <div className="relative w-full max-w-[240px] aspect-square bg-transparent rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-white/50">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                {capturedImage ? (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover object-center" />
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
                  <p className="text-slate-400 text-xs font-medium mb-4 leading-relaxed">Position your face in the center of the frame</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                  >
                    <Camera size={28} />
                  </button>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-6 flex flex-col items-center w-full">
              {cameraStarted && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Capture & Verify Identity
                </button>
              )}
              {capturedImage && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-2 text-indigo-600 flex items-center gap-2 text-xs font-bold hover:text-indigo-800 transition-colors"
                >
                  <RefreshCw size={14} /> Retake Biometric Scan
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6 pt-4">
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-4 rounded-2xl font-black text-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={24} />
              ) : (
                "Complete Student Registration"
              )}
            </button>

            <p className="text-center text-slate-500 font-medium">
              Already have a student account?{" "}
              <button
                type="button"
                onClick={() => navigate("/student-login")}
                className="text-indigo-600 font-black hover:underline ml-1"
              >
                Sign In to Student Portal
              </button>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function InputField({ icon, placeholder, type = "text", onChange, required = true }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600">
        {icon}
      </div>
      <input
        required={required}
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