import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, Mail, Hash, Camera, Save, 
  ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 
} from "lucide-react";
import API from "../api";

export default function StudentUpdate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const [formData, setFormData] = useState({
    name: localStorage.getItem("userName") || "",
    email: localStorage.getItem("userEmail") || "",
    rollNo: localStorage.getItem("userRollNo") || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put(`/student/update/${localStorage.getItem("userRollNo")}`, formData);
      if (res.status === 200) {
        localStorage.setItem("userName", formData.name);
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem("userRollNo", formData.rollNo);
        setStatus({ type: "success", msg: "Database Synchronized!" });
        setTimeout(() => navigate("/student-dashboard"), 1500);
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Update failed. Check your connection." });
    } finally { setLoading(false); }
  };

  return (
    /* MAIN WRAPPER: Matches Dashboard Border and Gradient */
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-indigo-100 border-4 border-indigo-200 rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Background Decor Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-16 py-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <button 
            onClick={() => navigate("/student-dashboard")}
            className="flex items-center gap-2 bg-white border-2 border-indigo-100 text-indigo-600 px-6 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} /> Back to Workspace
          </button>
          
          <div className="text-right hidden md:block">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              Account Management
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side Info Card - Matches Dashboard Stats style */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <ShieldCheck size={40} className="mb-4 text-indigo-200" />
                <h2 className="text-2xl font-black mb-2">Security Hub</h2>
                <p className="text-indigo-100 text-sm leading-relaxed">
                  Keeping your credentials updated ensures seamless biometric recognition and accurate reporting.
                </p>
              </div>
              <ShieldCheck size={140} className="absolute -right-8 -bottom-8 text-white/10" />
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-indigo-100 p-6 rounded-[2rem] shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Links</p>
              <button 
                onClick={() => navigate("/enroll-face")}
                className="w-full flex items-center gap-3 p-4 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
              >
                <Camera size={20} /> Update Biometrics
              </button>
            </div>
          </div>

          {/* Right Side Form - The Main Dashboard-style Card */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative">
              <h1 className="text-4xl font-black text-slate-900 mb-2">Edit Profile</h1>
              <p className="text-slate-500 font-medium mb-10">Sync your details with the central database.</p>

              {status.msg && (
                <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border ${
                  status.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                }`}>
                  {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p className="text-sm font-black">{status.msg}</p>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-8">
                {/* Input components with Dashboard-style focus rings */}
                {[
                  { label: "Full Name", name: "name", icon: User, type: "text" },
                  { label: "Email Address", name: "email", icon: Mail, type: "email" },
                  { label: "Roll Number", name: "rollNo", icon: Hash, type: "text" }
                ].map((field) => (
                  <div key={field.name} className="group">
                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 ml-1">
                      {field.label}
                    </label>
                    <div className="relative">
                      <field.icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input 
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.5rem] outline-none font-bold text-slate-800 transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : <><Save size={20} /> Save Changes</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/student-dashboard")}
                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}