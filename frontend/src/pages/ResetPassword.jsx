import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";
import API from "../api";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await API.post("/reset-password", {
                token,
                new_password: password,
            });

            setMessage(response.data.message);
            setTimeout(() => {
                if (response.data.role === 'student') {
                    navigate("/student-login");
                } else {
                    navigate("/login");
                }
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-indigo-100 overflow-hidden flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_30px_60px_rgba(79,70,229,0.15)] relative z-10">
                <button
                    onClick={() => navigate("/login")}
                    className="group flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-8 hover:text-indigo-700 transition-all"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reset <span className="text-indigo-600">Password</span></h2>
                    <p className="text-slate-500 font-medium mt-2 text-sm">Enter your new secure password below.</p>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3 text-sm font-bold"
                    >
                        <CheckCircle size={20} />
                        {message}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 text-sm font-bold text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white border border-indigo-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-white border border-indigo-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : "Set New Password"}
                    </button>
                </form>

            </div>
        </motion.div>
    );
}
