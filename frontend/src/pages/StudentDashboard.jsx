import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Calendar, CheckCircle, Clock, LogOut,
  ShieldCheck, LayoutDashboard, ExternalLink,
  IdCard, TrendingUp, Bell, Settings, BookOpen, Flame, Send, Trash2, Camera, FileDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [timetableUrl, setTimetableUrl] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  // NEW STATES FOR MULTI-CLASS SUPPORT
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);

  const userName = localStorage.getItem("userName");
  const rollNo = localStorage.getItem("userRollNo");

  // DATE STATES FOR FILTERING
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Helper to fetch messages
  const fetchMessages = async (cid) => {
    try {
      const res = await API.get(`/messages/${cid}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  // 1. INITIALIZE CLASSES
  useEffect(() => {
    const roll = localStorage.getItem("userRollNo");

    // Try to get multi-class list
    let storedClasses = JSON.parse(
      localStorage.getItem("studentClasses") || "[]"
    );

    // BACKWARD COMPATIBILITY
    if (storedClasses.length === 0) {
      const legacyClassId = localStorage.getItem("class_id") || localStorage.getItem("classId");
      if (legacyClassId) {
        storedClasses = [{
          classId: legacyClassId,
          subject: "Main Class",
          teacherName: "Class Teacher"
        }];
        localStorage.setItem("studentClasses", JSON.stringify(storedClasses));
      }
    }

    const activeId =
      localStorage.getItem("activeClassId") ||
      storedClasses[0]?.classId;

    if (activeId) {
      localStorage.setItem("activeClassId", activeId);
    }

    if (!roll || storedClasses.length === 0 || !activeId) {
      navigate("/student-login", { replace: true });
      return;
    }

    setClasses(storedClasses);
    setActiveClass(activeId);

    const activeClassData = storedClasses.find(c => c.classId === activeId);
    if (activeClassData) {
      setProfile(prev => ({
        ...prev,
        teacher_name: activeClassData.teacherName,
        subject: activeClassData.subject
      }));
    }
  }, [navigate]);

  // 2. FETCH DATA WHEN ACTIVE CLASS CHANGES
  useEffect(() => {
    if (!activeClass) return;

    const storedClasses = JSON.parse(localStorage.getItem("studentClasses") || "[]");
    const activeClassData = storedClasses.find(c => c.classId === activeClass);

    if (activeClassData) {
      setProfile(prev => ({
        ...prev,
        teacher_name: activeClassData.teacherName,
        subject: activeClassData.subject
      }));
    }

    const roll = localStorage.getItem("userRollNo");

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await API.get(
          `/student/dashboard-stats/${roll}/${activeClass}`,
          { params: { start_date: startDate, end_date: endDate } }
        );

        setStats(res.data.stats);
        if (res.data.profile) {
          setProfile(res.data.profile);
        }

        try {
          const timeRes = await API.get(`/get-timetable/${activeClass}`);
          setTimetableUrl(timeRes.data?.url || null);
        } catch {
          setTimetableUrl(null);
        }

        await fetchMessages(activeClass);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [activeClass, startDate, endDate]);

  // 3. REFRESH SESSION STATUS EVERY 5 SECONDS
  useEffect(() => {
    if (!activeClass) return;

    const checkSession = async () => {
      try {
        const cid = activeClass.trim().toUpperCase();
        console.log(`Checking session for student class: [${cid}]`);
        const res = await API.get(`/attendance/check-session/${cid}`);

        if (res.data && res.data.active) {
          console.log("Active session found for student:", res.data);
          setActiveSession(res.data);
        } else {
          setActiveSession(null);
        }
      } catch (err) {
        // 404 or network error
        if (activeSession) setActiveSession(null);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, [activeClass, activeSession]); // added activeSession to avoid stale state issues in callback

  const handleClassChange = (cid) => {
    setActiveClass(cid);
    localStorage.setItem("activeClassId", cid);
    setLoading(true);
  };

  const [showReport, setShowReport] = useState(false);
  const [overallStats, setOverallStats] = useState([]);

  const fetchOverallReport = async () => {
    try {
      const res = await API.get(`/student/overall-stats/${rollNo}`);
      setOverallStats(res.data);
      setShowReport(true);
    } catch (err) {
      console.error("Failed to fetch report", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const handleDownloadReport = async () => {
    try {
      const url = `${API.defaults.baseURL}/export-student-attendance/${rollNo}/${activeClass}?start_date=${startDate}&end_date=${endDate}`;
      window.open(url, "_blank");
    } catch (err) {
      alert("Failed to download report");
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 font-poppins">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-indigo-600 font-bold tracking-widest animate-pulse uppercase">Syncing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-indigo-100 border-4 border-indigo-200 rounded-2xl shadow-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-16 py-12">

        {/* TOP NAVBAR AREA (TeacherDashboard Style) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-3">
              <ShieldCheck size={14} /> Student Workspace
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Welcome, <span className="text-indigo-600">{userName}</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Attending Class: <span className="font-bold text-slate-900">{profile?.subject}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/update-profile")}
              className="p-3 bg-white border border-indigo-100 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm"
              title="Edit Profile"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 px-6 py-3 bg-white border border-red-100 text-red-500 text-sm font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
            >
              <span className="group-hover:translate-x-1 transition-transform">Logout</span>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* MAIN STATS GRID (TeacherDashboard 2+1 Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* Attendance Performance Card (Large Gradient) */}
          <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/30 group">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all" />

            <div className="relative z-10">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp size={14} /> Current Course Performance
              </p>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                  {stats?.percentage}%
                </h2>
                <button
                  onClick={fetchOverallReport}
                  className="self-start sm:self-auto mb-2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all border border-white/10"
                  title="View Overall Progress"
                >
                  <BookOpen size={24} />
                </button>
              </div>
              <div className="mt-8">
                <div className="flex justify-between text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">
                  <span>Monthly Goal: 75%</span>
                  <span>{stats?.percentage >= 75 ? "Excellent" : "Under Threshold"}</span>
                </div>
                <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.percentage}%` }} transition={{ duration: 1 }} className={`h-full ${stats?.percentage >= 75 ? "bg-emerald-400" : "bg-rose-400"}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment / Profile Card WITH Action */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                <User size={24} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 leading-tight">Prof. {profile?.teacher_name}</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                Subject: {profile?.subject}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">
                <IdCard size={14} /> {activeClass}
              </div>
            </div>

            <button
              onClick={() => navigate("/join-class")}
              className="mt-6 flex items-center justify-between px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-indigo-600 hover:text-white transition-all group"
            >
              Join Other Classes
              <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* TWO COLUMN LOGIC SECTION (TeacherDashboard Layout) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">

          {/* LEFT COL: Live Status & Quick Stats */}
          <div className="space-y-8">

            {/* 1. Live Scan Call to Action */}
            <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              {activeSession && (
                <div className="absolute top-0 right-0 p-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}

              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Camera size={20} /></div>
                Biometric Verification
              </h3>

              {!activeSession ? (
                <div className="text-center py-6 bg-slate-50/50 rounded-3xl border border-indigo-50">
                  <p className="text-gray-400 font-medium italic">No active session at the moment.</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-block p-4 rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
                    <ShieldCheck size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-1">Session Live</h4>
                  <p className="text-slate-500 mb-6 font-medium">Verify your face to mark attendance.</p>
                  <button
                    onClick={() => navigate("/scan-face")}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    SCAN FACE NOW
                  </button>
                </div>
              )}
            </div>

            {/* 2. Attendance Summary Widget */}
            <div className="bg-white/90 border border-amber-100 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-amber-500"><TrendingUp size={80} /></div>
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><BookOpen size={20} /></div>
                Quick Analytics
              </h3>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Lectures</p>
                  <p className="text-3xl font-black text-slate-900">{stats?.totalClasses}</p>
                </div>
                <div className="p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attended</p>
                  <p className="text-3xl font-black text-indigo-600">{stats?.attended}</p>
                </div>
                <div className="p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Missed</p>
                  <p className="text-3xl font-black text-rose-500">{stats?.totalClasses - stats?.attended}</p>
                </div>
                <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg border border-indigo-700">
                  <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Progress</p>
                  <p className="text-3xl font-black">{stats?.percentage}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COL: Tools & Data (TeacherDashboard Layout) */}
          <div className="space-y-8">

            {/* 1. Announcements */}
            <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Bell size={20} /></div>
                Announcements
              </h3>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 italic py-4">No new notices for this class.</p>
                ) : (
                  messages.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                      <p className="text-slate-800 font-medium text-sm leading-relaxed">{m.content}</p>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase mt-2">{m.timestamp}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Timetable Widget */}
            <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Calendar size={20} /></div>
                Class Timetable
              </h3>

              {!timetableUrl ? (
                <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-indigo-50/20">
                  <p className="text-sm font-bold text-indigo-900">No Timetable Uploaded</p>
                  <p className="text-xs text-indigo-400 mt-1">Check back later for updates.</p>
                </div>
              ) : (
                <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                      <LayoutDashboard size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">Active Schedule</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">System Ref: {activeClass}</p>
                    </div>
                  </div>
                  <a href={timetableUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
                    <ExternalLink size={18} />
                  </a>
                </div>
              )}
            </div>

            {/* 3. Subject Switcher (Enhanced) */}
            <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><BookOpen size={20} /></div>
                Subject Portal
              </h3>
              <div className="space-y-2">
                {classes.map(cls => (
                  <button
                    key={cls.classId}
                    onClick={() => handleClassChange(cls.classId)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${activeClass === cls.classId ? "bg-indigo-600 text-white border-indigo-700 shadow-lg scale-[1.02]" : "bg-white border-indigo-50 text-slate-600 hover:border-indigo-200"}`}
                  >
                    <div className="text-left font-bold text-sm">
                      <p className={activeClass === cls.classId ? "text-indigo-100" : "text-gray-400 text-[10px] uppercase mb-0.5"}>Current Subject</p>
                      <p className="leading-tight">{cls.subject}</p>
                    </div>
                    {activeClass === cls.classId && <CheckCircle size={18} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY LOGS (TeacherDashboard Bottom Table Style) */}
        <div className="bg-white border border-indigo-100 rounded-[2.5rem] shadow-xl overflow-hidden mb-12">
          <div className="p-8 border-b border-indigo-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <LayoutDashboard className="text-indigo-600" />
                Personal Attendance Record
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-indigo-100 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-indigo-100 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <FileDown size={18} />
              Download My Record (Excel)
            </button>
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-sm">
                <tr className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats?.history?.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700">{log.date}</td>
                    <td className="px-8 py-5 text-sm font-mono text-slate-400">{log.time}</td>
                    <td className="px-8 py-5 text-right">
                      <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                        PRESENT (VERIFIED)
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.history || stats.history.length === 0) && (
                  <tr>
                    <td colSpan="3" className="px-8 py-10 text-center text-gray-400 italic font-medium">No activity records found for this course yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* OVERALL REPORT MODAL */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-2xl w-full border-4 border-indigo-100"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" /> Overall Report Card
              </h2>
              <button onClick={() => setShowReport(false)} className="p-2 bg-indigo-50 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
                <LogOut size={16} className="rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {overallStats.map((item, idx) => (
                <div key={idx} className="p-5 border border-indigo-50 rounded-2xl bg-gradient-to-br from-white to-indigo-50/50 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-lg">{item.subject}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.percentage >= 75 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                      {item.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-medium italic">Prof. {item.teacher}</p>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2 shadow-inner">
                    <div className={`h-full rounded-full ${item.percentage >= 75 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${item.percentage}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Present: {item.attended}</span>
                    <span>Total: {item.total}</span>
                  </div>
                </div>
              ))}
              {overallStats.length === 0 && (
                <p className="col-span-2 text-center text-gray-400 italic">No enrolled classes found.</p>
              )}
            </div>

            <div className="mt-8">
              <button onClick={() => setShowReport(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100">
                Close Report
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}