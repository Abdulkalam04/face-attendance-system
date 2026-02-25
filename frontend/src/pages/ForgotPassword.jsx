import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import API from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/forgot-password", { email });
      setSent(true);
    } catch (err) {
      alert(err.response?.data?.error || "User not found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative w-full min-h-screen font-poppins 
  bg-gradient-to-br from-indigo-50 via-white to-indigo-100 
  border-4 border-indigo-200 rounded-2xl shadow-xl overflow-hidden
  flex items-center justify-center"

      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-indigo-100 p-8 rounded-[2.5rem] shadow-2xl relative z-10">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-semibold mb-6 hover:gap-3 transition-all">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-indigo-900">Reset Password</h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            {sent
              ? "Your temporary password has been sent!"
              : "Enter your email to receive a temporary login password."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600">
                <Mail size={18} />
              </div>
              <input
                required
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-indigo-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : <><Send size={18} /> Send Password to Email</>}
            </button>
          </form>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-lg transition-all"
          >
            Return to Login
          </button>
        )}
      </div>
    </motion.div>
  );
}