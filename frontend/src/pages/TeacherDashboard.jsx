import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Copy,
  CheckCircle,
  LogOut,
  UserCheck,
  Calendar,
  ShieldCheck,
  LayoutDashboard,
  Trash2,
  ExternalLink,
  Bell,
  Send,
  Clock,
  Play,
  Check,
  X,
  Plus,
  Camera,
  Download,
  FileDown,
  Trophy,
  Medal,
  Settings,
  AlertTriangle
} from "lucide-react";
import Navbar from "../components/Navbar";
import API from "../api";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingAlerts, setSendingAlerts] = useState(false);

  // New States for Timetable Management
  const [timetableUrl, setTimetableUrl] = useState(null);

  // We no longer need local search term for student list since we removed the table
  // const [searchTerm, setSearchTerm] = useState("");

  const [teacherInfo, setTeacherInfo] = useState({
    name: localStorage.getItem("userName") || "Professor",
    classId:
      localStorage.getItem("classId") ||
      localStorage.getItem("class_name") ||
      "NOT-ASSIGNED",
    subject: localStorage.getItem("subject") || "General",
  });

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      if (teacherInfo.classId && teacherInfo.classId !== "NOT-ASSIGNED") {
        try {
          const res = await API.get(`/class-details/${teacherInfo.classId}`);
          if (res.data) {
            setTeacherInfo(prev => ({
              ...prev,
              subject: res.data.subject,
              name: res.data.teacher_name
            }));
            localStorage.setItem("subject", res.data.subject);
            localStorage.setItem("userName", res.data.teacher_name);
          }
        } catch (err) {
          console.error("Failed to fetch teacher details", err);
        }
      }
    };

    if (teacherInfo.subject === "General") {
      fetchTeacherDetails();
    }
  }, [teacherInfo.classId, teacherInfo.subject]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [sessionData, setSessionData] = useState({ duration: 5, message: "Class is live!" });
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]); // Students who scanned face

  // Date Filtering States
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (teacherInfo.classId !== "NOT-ASSIGNED") fetchMessages();
  }, [teacherInfo.classId]);

  const fetchMessages = async () => {
    const res = await API.get(`/messages/${teacherInfo.classId}`);
    setMessages(res.data);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await API.post("/messages", {
      classId: teacherInfo.classId,
      content: newMessage,
      timestamp: new Date().toLocaleString(),
    });
    setNewMessage("");
    fetchMessages();
  };

  const handleDeleteMessage = async (id) => {
    await API.delete(`/messages/${id}`);
    fetchMessages();
  };

  useEffect(() => {
    if (
      teacherInfo.classId &&
      teacherInfo.classId !== "NOT-ASSIGNED" &&
      teacherInfo.classId !== "Loading..."
    ) {
      fetchStudents();
      fetchAttendance();
      fetchTimetable(); // Fetch timetable status on load
      fetchLeaderboard();
    }
  }, [teacherInfo.classId, startDate, endDate]);

  const fetchLeaderboard = async () => {
    try {
      const res = await API.get(`/teacher/leaderboard/${teacherInfo.classId}`);
      setLeaderboard(res.data || []);
    } catch (err) { console.error("Leaderboard fetch failed", err); }
  };

  // ✅ REFRESH PENDING REQUESTS EVERY 5 SECONDS
  useEffect(() => {
    let interval;
    // Always fetch request regardless of session for manual updates or lingering requests
    if (teacherInfo.classId !== "NOT-ASSIGNED") {
      fetchPendingRequests(); // initial call
      interval = setInterval(fetchPendingRequests, 5000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, teacherInfo.classId]);

  const fetchStudents = async () => {
    try {
      const res = await API.get(`/teacher/students/${teacherInfo.classId}`);
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await API.get(`/attendance-report/${teacherInfo.classId}`, {
        params: { start_date: startDate, end_date: endDate }
      });
      setAttendanceData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    }
  };

  // ---------------- NEW: FETCH TIMETABLE ----------------
  const fetchTimetable = async () => {
    try {
      const res = await API.get(`/get-timetable/${teacherInfo.classId}`);
      if (res.data && res.data.url) {
        setTimetableUrl(res.data.url);
      }
    } catch (err) {
      // console.error("No timetable found"); 
      // Silently fail is common if no timetable exists
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("timetable", file);
    formData.append("classId", teacherInfo.classId);

    setUploading(true);
    try {
      const res = await API.post("/upload-timetable", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Timetable uploaded successfully!");
      fetchTimetable(); // Refresh state to show view/delete options
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload timetable.");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- NEW: DELETE TIMETABLE ----------------
  const handleDeleteTimetable = async () => {
    if (!window.confirm("Are you sure you want to delete the timetable?")) return;
    try {
      await API.delete(`/delete-timetable/${teacherInfo.classId}`);
      setTimetableUrl(null);
      alert("Timetable deleted successfully.");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete timetable.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(teacherInfo.classId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  // ✅ CHECK IF ATTENDANCE SESSION IS ALREADY RUNNING (ON PAGE LOAD)
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const res = await API.get(
          `/attendance/check-session/${teacherInfo.classId}`
        );
        if (res.data.active) {
          setIsSessionActive(true);
          setSessionData(prev => ({
            ...prev,
            message: res.data.message || "Class is live!"
          }));

          if (res.data.expiry_time) {
            updateTimer(res.data.expiry_time);
          }
        }
      } catch (err) {
        console.error("Session check failed", err);
      }
    };

    if (
      teacherInfo.classId &&
      teacherInfo.classId !== "NOT-ASSIGNED"
    ) {
      checkExistingSession();
    }
  }, [teacherInfo.classId]);

  const updateTimer = (expiryIso) => {
    const expiry = new Date(expiryIso).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      setIsSessionActive(false);
      setTimeLeft("");
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    let timerInterval;
    if (isSessionActive) {
      timerInterval = setInterval(async () => {
        // Re-check session status from server occasionally
        try {
          const res = await API.get(`/attendance/check-session/${teacherInfo.classId}`);
          if (!res.data.active) {
            setIsSessionActive(false);
            setTimeLeft("");
            clearInterval(timerInterval);
          } else if (res.data.expiry_time) {
            updateTimer(res.data.expiry_time);
          }
        } catch (e) {
          console.error("Timer update failed", e);
        }
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isSessionActive, teacherInfo.classId]);

  // ✅ NEW STATES FOR ATTENDANCE FLOW

  // ✅ FETCH PENDING REQUESTS (Call this in a useEffect or use Socket.io)
  const fetchPendingRequests = async () => {
    try {
      const res = await API.get(`/attendance/pending/${teacherInfo.classId}`);
      setPendingRequests(res.data || []);
    } catch (err) { console.error("Error fetching requests", err); }
  };

  // ✅ START ATTENDANCE SESSION
  const startAttendanceSession = async () => {
    try {
      const res = await API.post("/attendance/start-session", {
        classId: teacherInfo.classId,
        subject: teacherInfo.subject,
        duration: sessionData.duration,
        message: sessionData.message
      });
      setIsSessionActive(true);
      if (res.data.expiry_time) {
        updateTimer(res.data.expiry_time);
      }
      alert(`Attendance session started for ${sessionData.duration} minutes!`);
    } catch (err) { alert("Failed to start session."); }
  };
  // ✅ STOP ATTENDANCE SESSION
  const stopAttendanceSession = async () => {
    if (!window.confirm("Are you sure you want to stop the attendance session?")) return;
    try {
      await API.post("/attendance/stop-session", {
        classId: teacherInfo.classId,
      });
      setIsSessionActive(false);
      alert("Attendance session stopped.");
    } catch (err) {
      console.error("Failed to stop session", err);
      // Even if the API fails, we likely want to toggle the UI state
      setIsSessionActive(false);
    }
  };
  // ✅ APPROVE / DECLINE LOGIC
  const handleApproval = async (requestId, status) => {
    try {
      await API.post("/attendance/approve", {
        requestId,
        classId: teacherInfo.classId,
        status,
      });
      fetchPendingRequests();
      fetchAttendance();
    } catch (err) {
      console.error("Approval error", err);
    }
  };

  const handleDownloadReport = async () => {
    try {
      // Use window.open for direct file download from the endpoint
      const url = `${API.defaults.baseURL}/export-attendance/${teacherInfo.classId}?start_date=${startDate}&end_date=${endDate}`;
      window.open(url, "_blank");
    } catch (err) {
      alert("Failed to download report");
    }
  };

  const handleManualAlerts = async () => {
    if (!window.confirm("This will scan all students and send email alerts to those below 75% attendance for this month. Proceed?")) return;

    setSendingAlerts(true);
    try {
      const res = await API.post(`/teacher/trigger-alerts/${teacherInfo.classId}`);
      alert(res.data.message || "Alerts sent successfully!");
    } catch (err) {
      console.error("Alert trigger failed", err);
      alert(err.response?.data?.error || "Failed to send alerts. Check if SMTP is configured correctly.");
    } finally {
      setSendingAlerts(false);
    }
  };

  const handleResetSystem = async () => {
    const confirm1 = window.confirm("🚨 CRITICAL WARNING: This will PERMANENTLY delete ALL students, teachers, attendance logs, and bimoetric data. Are you sure?");
    if (!confirm1) return;

    const confirm2 = window.confirm("LAST CHANCE: Everything will be reset to defaults. Proceed?");
    if (!confirm2) return;

    try {
      setUploading(true); // use a loading state
      await API.post("/admin/reset-system");
      alert("System Reset Complete! Logged out for safety.");
      handleLogout();
    } catch (err) {
      alert("Reset failed: " + (err.response?.data?.error || "Server error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-indigo-100 border-4 border-indigo-200 rounded-2xl shadow-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12 py-10">

        {/* TOP NAVBAR AREA */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-3">
              <ShieldCheck size={14} /> Faculty Workspace
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Welcome, <span className="text-indigo-600">{teacherInfo.name}</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Managing Class: <span className="font-bold text-slate-900">{teacherInfo.subject}</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 px-6 py-3 bg-white border border-red-100 text-red-500 text-sm font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
          >
            <span className="group-hover:translate-x-1 transition-transform">Logout</span>
            <LogOut size={18} />
          </button>
        </header>

        {/* MAIN STATS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* Class Code Card */}
          <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/30 group">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all" />

            <div className="relative z-10">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Users size={14} /> Classroom Access Code
              </p>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                  {teacherInfo.classId}
                </h2>
                <button
                  onClick={copyToClipboard}
                  className="self-start sm:self-auto mb-2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all border border-white/10"
                  title="Copy Code"
                >
                  {copied ? <CheckCircle size={24} className="text-emerald-400" /> : <Copy size={24} />}
                </button>
              </div>
              <p className="mt-6 text-indigo-200/80 text-sm font-medium">
                Share this code with students to let them join your class directly.
              </p>
            </div>
          </div>

          {/* Student Count Card WITH LINK */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                <Users size={24} />
              </div>
              <h3 className="text-5xl font-black text-slate-900">{students.length}</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                Total Enrolled Students
              </p>
            </div>

            {/* LINK TO MANAGE STUDENTS PAGE */}
            <button
              onClick={() => navigate("/manage-students")}
              className="mt-6 flex items-center justify-between px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-indigo-600 hover:text-white transition-all group"
            >
              View Full Registrations
              <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* TWO COLUMN LOGIC SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">

          {/* LEFT COL: Live Control & Approvals */}
          <div className="space-y-8">

            {/* 1. Live Session Control */}
            <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              {isSessionActive && (
                <div className="absolute top-0 right-0 p-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}

              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Clock size={20} /></div>
                Live Attendance Control
              </h3>

              <div className="space-y-4">
                {!isSessionActive ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Session Note</label>
                        <input
                          type="text"
                          placeholder="e.g. Lecture 5"
                          value={sessionData.message}
                          onChange={(e) => setSessionData({ ...sessionData, message: e.target.value })}
                          className="w-full mt-1 px-5 py-3 rounded-xl border border-indigo-100 bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Duration</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            value={sessionData.duration}
                            onChange={(e) => setSessionData({ ...sessionData, duration: e.target.value })}
                            className="w-full px-5 py-3 rounded-xl border border-indigo-100 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <span className="absolute right-3 top-3.5 text-xs font-bold text-gray-400">min</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={startAttendanceSession}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Play size={16} fill="currentColor" /> Start Session
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="inline-block p-4 rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
                      <ShieldCheck size={32} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-1">Session Active</h4>
                    {timeLeft && (
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-mono text-xl font-bold tracking-wider">
                          {timeLeft}
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Remaining</span>
                      </div>
                    )}
                    <p className="text-slate-500 mb-6 font-medium">Students can now scan their faces.</p>
                    <button
                      onClick={stopAttendanceSession}
                      className="px-8 py-3 bg-rose-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all"
                    >
                      Stop Attendance
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Monthly Leaderboard (NEW) */}
            <div className="bg-white/90 border border-amber-100 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-amber-500">
                <Trophy size={80} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Trophy size={20} /></div>
                Monthly Leaderboard
              </h3>

              <div className="space-y-4 relative z-10">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 italic py-4">Scanning records for Top 3...</p>
                ) : (
                  leaderboard.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? "bg-amber-50 border-amber-200 outline outline-2 outline-amber-400 shadow-md" :
                        idx === 1 ? "bg-slate-50 border-slate-200" : "bg-orange-50/30 border-orange-100"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? "bg-amber-400 text-white" :
                          idx === 1 ? "bg-slate-400 text-white" : "bg-orange-400 text-white"
                          }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none flex items-center gap-2">
                            {item.name}
                            {idx === 0 && <Medal size={14} className="text-amber-500" />}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Most Regular</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-900 leading-none">{item.count}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Classes</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Pending Approvals List */}
            <div className={`bg-white/90 border-4 border-dashed ${pendingRequests.length > 0 ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'} p-8 rounded-[2.5rem] transition-colors`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">Pending Approvals</h3>
                {pendingRequests.length > 0 && <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md">{pendingRequests.length}</span>}
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    <UserCheck size={40} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium text-slate-400">No students waiting...</p>
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={req.id}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-indigo-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{req.name}</p>
                          {req.liveness_verified && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold"
                              title={`Liveness verified with ${req.blink_count} blinks`}
                            >
                              <ShieldCheck size={12} /> LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">{req.rollNo}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproval(req.id, "present")}
                          className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => handleApproval(req.id, "absent")}
                          className="w-10 h-10 flex items-center justify-center bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COL: Tools & Data */}
          <div className="space-y-8">

            {/* 1. Announcements */}
            <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Bell size={20} /></div>
                Announcements
              </h3>

              <div className="relative mb-6">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Message to class..."
                  className="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50 border border-indigo-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md"
                >
                  <Send size={18} />
                </button>
              </div>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 italic py-4">No announcements shared.</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <p className="text-slate-800 font-medium text-sm leading-relaxed">{m.content}</p>
                        <button onClick={() => handleDeleteMessage(m.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase mt-2">{m.timestamp}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Timetable Widget */}
            <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Calendar size={20} /></div>
                Timetable
              </h3>

              {!timetableUrl ? (
                <div className="relative group border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center hover:bg-indigo-50/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="pointer-events-none">
                    <div className="mx-auto w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Plus size={20} />
                    </div>
                    <p className="text-sm font-bold text-indigo-900">Upload Schedule</p>
                    <p className="text-xs text-indigo-400 mt-1">PDF or Image</p>
                  </div>
                  {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-indigo-600 rounded-full border-t-transparent" /></div>}
                </div>
              ) : (
                <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                      <LayoutDashboard size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">Active</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Timetable Live</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={timetableUrl} target="_blank" rel="noreferrer" className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-100 shadow-sm">
                      <ExternalLink size={16} />
                    </a>
                    <button onClick={handleDeleteTimetable} className="p-2 bg-white text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors border border-rose-100 shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
              {/* 3. GROUP CCTV ATTENDANCE (NEW) */}
              <div className="bg-white/90 border border-indigo-100 p-8 rounded-[2.5rem] shadow-xl mt-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Users size={20} /></div>
                  Group Attendance (CCTV)
                </h3>

                <div className="relative group border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center hover:bg-indigo-50/50 transition-colors cursor-pointer bg-indigo-50/20">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append("group_image", file);
                      formData.append("classId", teacherInfo.classId);
                      formData.append("subject", teacherInfo.subject);

                      setUploading(true);
                      try {
                        const res = await API.post("/attendance/group-scan", formData, { headers: { "Content-Type": "multipart/form-data" } });
                        alert(`Found ${res.data.count} faces.\nMarked ${res.data.marked} students Present.`);
                        fetchAttendance(); // Refresh logs
                      } catch (err) {
                        alert("Scan failed.");
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className="pointer-events-none relative z-10">
                    <div className="mx-auto w-12 h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <p className="text-sm font-bold text-indigo-900">Upload Classroom Photo</p>
                    <p className="text-xs text-indigo-400 mt-1 max-w-[200px] mx-auto">Detect and mark multiple students at once from a single group picture.</p>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-30">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-bold text-indigo-600 animate-pulse">Processing Faces...</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RECENT LOGS - MOVED TO FULL WIDTH BOTTOM */}
        <div className="bg-white border border-indigo-100 rounded-[2.5rem] shadow-xl overflow-hidden mb-12">
          <div className="p-8 border-b border-indigo-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <LayoutDashboard className="text-indigo-600" />
                Recent Activity Logs
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-indigo-100 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-xs font-bold text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-indigo-100 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                disabled={sendingAlerts}
                onClick={handleManualAlerts}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {sendingAlerts ? <Clock size={18} className="animate-spin" /> : <Bell size={18} />}
                Send Manual Alerts
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <FileDown size={18} />
                Download Official Record (Excel)
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-sm">
                <tr className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Student</th>
                  <th className="px-8 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendanceData.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 text-sm text-slate-500">{a.date}</td>
                    <td className="px-8 py-4 font-bold text-slate-700">{a.name}</td>
                    <td className="px-8 py-4 text-right">
                      <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DANGER ZONE - HIDDEN BY DEFAULT / ACCESS THROUGH SETTINGS LOGIC */}
        <div className="mt-12 mb-20 p-8 bg-rose-50 border border-rose-200 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 items-center text-center md:text-left">
            <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">Danger Zone</h4>
              <p className="text-rose-600 font-medium text-sm">Delete all system data and start from scratch.</p>
            </div>
          </div>
          <button
            onClick={handleResetSystem}
            className="group flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
          >
            <Settings size={20} className="group-hover:rotate-90 transition-transform" />
            Reset Entire System
          </button>
        </div>

      </div>
    </motion.div>
  );
}