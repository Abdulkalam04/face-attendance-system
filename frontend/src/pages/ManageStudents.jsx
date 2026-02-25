import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, XCircle, Search, ArrowLeft, Trash2, ShieldCheck, Mail, Fingerprint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function ManageStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Using consistent key for class ID from storage, falling back to login data
  const teacherId = localStorage.getItem("classId") || localStorage.getItem("userClassId");

  useEffect(() => {
    if (teacherId) {
      fetchStudents();
    } else {
      // Ideally redirect or show error if no class ID context
      setLoading(false);
    }
  }, [teacherId]);

  const fetchStudents = async () => {
    try {
      const res = await API.get(`/teacher/students/${teacherId}`);
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (rollNo) => {
    // Note: Assuming API uses rollNo or unique ID. Check backend logic.
    // Based on previous files, endpoint might be: /teacher/remove-student/<classId>/<rollNo>
    if (window.confirm(`Are you sure you want to remove student with Roll No: ${rollNo}?`)) {
      try {
        await API.delete(`/teacher/remove-student/${teacherId}/${rollNo}`);
        setStudents(students.filter(s => s.roll_no !== rollNo));
        alert("Student removed successfully");
      } catch (err) {
        console.error(err);
        alert("Failed to remove student");
      }
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_no.toString().includes(searchTerm)
  );

  return (
    <motion.div
      className="relative w-full min-h-screen font-poppins bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-4 border-indigo-200 rounded-2xl shadow-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-200/40 blur-[100px] rounded-full" />


      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12 py-12">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold uppercase text-xs tracking-widest mb-4 transition-colors"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-3">
              <ShieldCheck size={14} /> Faculty Workspace
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Student <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Registered</span>
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Manage enrollments and view status for Class <span className="font-bold text-slate-800">{teacherId}</span></p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96 shadow-xl shadow-indigo-100/50 rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-indigo-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search by name or roll no..."
              className="block w-full pl-12 pr-4 py-4 bg-white border border-indigo-100 text-slate-900 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium transition-all placeholder:text-slate-400"
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-4 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl mb-10">
          <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm">
            <Fingerprint size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900">Biometric Registration Status</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Students marked as <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Missing</span> have not completed their face scan setup. They will not be able to mark attendance automatically until they register via their student portal.
            </p>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/80 border border-indigo-100 rounded-[2.5rem] shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-indigo-50">
                <tr>
                  <th className="px-8 py-6 text-indigo-400 font-bold uppercase text-xs tracking-widest">Student Profile</th>
                  <th className="px-8 py-6 text-indigo-400 font-bold uppercase text-xs tracking-widest">Roll No</th>
                  <th className="px-8 py-6 text-indigo-400 font-bold uppercase text-xs tracking-widest text-center">Face Data</th>
                  <th className="px-8 py-6 text-indigo-400 font-bold uppercase text-xs tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {loading ? (
                  <tr><td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-medium animate-pulse">Loading class roster...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-16 text-center">
                      <div className="inline-block p-4 bg-slate-50 rounded-full mb-3"><Users size={32} className="text-slate-300" /></div>
                      <p className="text-slate-500 font-medium">No students found matching your search.</p>
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr key={student.roll_no || student.id} className="hover:bg-indigo-50/40 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-lg">{student.name}</div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                            <Mail size={12} /> {student.email || "No email linked"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                        {student.roll_no}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {student.is_enrolled ? (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wide">
                          <CheckCircle2 size={14} /> Linked
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wide">
                          <XCircle size={14} /> Missing
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => deleteStudent(student.roll_no)}
                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                        title="Remove Student"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}