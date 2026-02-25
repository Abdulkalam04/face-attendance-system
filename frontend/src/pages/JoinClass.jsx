import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, School, CheckCircle, Search, AlertCircle, BookOpen, RefreshCw } from "lucide-react";
import API from "../api";

export default function JoinClass() {
    const navigate = useNavigate();
    const [classId, setClassId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [classDetails, setClassDetails] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!classId) return;

        setLoading(true);
        setError("");
        setClassDetails(null);

        try {
            // 1. Verify if class exists
            const res = await API.get(`/class-details/${classId}`);
            setClassDetails(res.data);
        } catch (err) {
            setError("Class not found. Please check the Class ID.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setLoading(true);
        setError("");

        try {
            const email = localStorage.getItem("userName"); // Using name as proxy or fetch email if stored
            // Better: Use the API to join which handles backend logic
            const rollNo = localStorage.getItem("userRollNo");

            const res = await API.post("/join-class", {
                roll_no: rollNo,
                class_id: classId
            });

            setSuccess(true);

            // Update Local Storage with new class
            const currentClasses = JSON.parse(localStorage.getItem("studentClasses") || "[]");

            // Avoid duplicates in local storage
            if (!currentClasses.some(c => c.classId === classId)) {
                const newClass = {
                    classId: classId,
                    subject: classDetails?.subject || "New Class",
                    teacherName: classDetails?.teacher_name || "Teacher"
                };
                const updatedClasses = [...currentClasses, newClass];
                localStorage.setItem("studentClasses", JSON.stringify(updatedClasses));

                // Switch to this new class automatically
                localStorage.setItem("activeClassId", classId);
            }

            setTimeout(() => {
                navigate("/student-dashboard");
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.error || "Failed to join class. You might already be enrolled.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center justify-center p-4 font-poppins relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

            <div className="w-full max-w-xl bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-[0_30px_60px_rgba(79,70,229,0.15)] border border-white overflow-hidden relative z-10 p-8 md:p-12">

                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-10 hover:text-indigo-700 transition-all"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
                        <CheckCircle size={12} /> Live Enrollment
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Join a <span className="text-indigo-600">Class</span></h1>
                    <p className="text-slate-500 font-medium mt-2">Enter the unique Class ID provided by your teacher to enroll instantly.</p>
                </div>

                {!success ? (
                    <div className="space-y-8">
                        {/* SEARCH INPUT */}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter Class ID (e.g., TCH123)"
                                value={classId}
                                onChange={(e) => setClassId(e.target.value.toUpperCase())}
                                className="w-full bg-white border-2 border-indigo-50 text-indigo-900 text-xl font-black px-8 py-5 rounded-[2rem] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-indigo-200 shadow-sm group-hover:shadow-md"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading || !classId}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                            >
                                <Search size={22} />
                            </button>
                        </div>

                        {/* CLASS PREVIEW */}
                        {classDetails && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                                <div className="relative flex items-center gap-6">
                                    <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-lg shadow-indigo-200">
                                        <School size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight">{classDetails.subject}</h3>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Instructor: <span className="text-indigo-600">{classDetails.teacher_name}</span></p>
                                        <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-indigo-400 bg-indigo-50 w-fit px-3 py-1 rounded-lg">
                                            <BookOpen size={12} /> {classDetails.id}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleJoin}
                                    disabled={loading}
                                    className="w-full mt-8 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <>Confirm Enrollment <CheckCircle size={18} /></>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* ERROR MESSAGE */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-4 p-5 bg-rose-50 text-rose-600 rounded-[1.5rem] text-sm font-black border border-rose-100 shadow-sm uppercase tracking-tight"
                            >
                                <AlertCircle size={20} />
                                {error}
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-emerald-200/50">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Successfully Joined!</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing your workspace...</p>
                    </motion.div>
                )}

            </div>
        </motion.div>
    );
}
