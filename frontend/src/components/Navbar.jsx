import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, LayoutDashboard, ShieldCheck,
  Menu, X, BookOpen, Users, Moon, Sun, Settings, Bell, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const role = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

  // Don't show Navbar on Landing, Login, or Register pages
  const hideNavbar = ["/", "/login", "/register", "/student-login", "/teacher-login", "/register-teacher", "/register-student", "/forgot-password"].includes(location.pathname);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  // ✅ SIMULATE NOTIFICATIONS BASED ON ROLE
  useEffect(() => {
    if (!userName) return;

    const mockNotifications = [
      { id: 1, title: "System Ready", content: `Welcome back to the ${role} portal.`, time: "Just now", read: false, icon: "🛡️" },
    ];

    if (role === "student") {
      mockNotifications.push(
        { id: 2, title: "Attendance Approved", content: "Your attendance for Mathematics has been verified.", time: "10m ago", read: false, icon: "✅" },
        { id: 3, title: "New Announcement", content: "Prof. Smith posted a new notice.", time: "1h ago", read: false, icon: "📢" }
      );
    } else {
      mockNotifications.push(
        { id: 2, title: "New Enrollment", content: "A new student just joined your CSC101 class.", time: "5m ago", read: false, icon: "👨‍🎓" },
        { id: 3, title: "Scan Complete", content: "Group scan successfully identified 15 students.", time: "2h ago", read: false, icon: "📸" }
      );
    }

    setNotifications(mockNotifications);
  }, [role, userName]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  if (hideNavbar || !userName) return null;

  const handleLogout = () => {
    if (window.confirm("Disconnect from secure portal?")) {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const navLinks = [
    {
      name: "Overview",
      path: role === "teacher" ? "/teacher-dashboard" : "/student-dashboard",
      icon: <LayoutDashboard size={18} />,
      roles: ["student", "teacher"]
    },
    {
      name: "Enrollment",
      path: "/join-class",
      icon: <BookOpen size={18} />,
      roles: ["student"]
    },
    {
      name: "Classroom",
      path: "/manage-students",
      icon: <Users size={18} />,
      roles: ["teacher"]
    },
    {
      name: "Profile",
      path: "/update-profile",
      icon: <Settings size={18} />,
      roles: ["student"]
    }
  ];

  const activeLink = (path) => location.pathname === path;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] px-4 py-6 md:px-8 pointer-events-none">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`mx-auto max-w-7xl flex items-center justify-between pointer-events-auto
            bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] px-6 py-4
            shadow-[0_20px_50px_rgba(79,70,229,0.12)] transition-all duration-500
            ${scrolled ? "max-w-6xl py-3 rounded-[2rem] shadow-[0_25px_60px_rgba(79,70,229,0.2)]" : ""}
          `}
        >
          {/* BRAND IDENTITY */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className={`p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
              ${scrolled ? "p-2 rounded-xl" : ""}
            `}>
              <ShieldCheck size={scrolled ? 20 : 24} />
            </div>
            <div className="flex flex-col">
              <span className={`font-black tracking-tighter leading-none transition-all duration-500 ${scrolled ? "text-lg" : "text-xl"} text-slate-900`}>
                ATTEND<span className="text-indigo-600">IFY</span>
              </span>
              <span className={`font-black text-indigo-500/50 uppercase tracking-[0.3em] transition-all duration-500 ${scrolled ? "text-[7px]" : "text-[9px]"}`}>
                Secure Nexus
              </span>
            </div>
          </Link>

          {/* CENTRAL NAVIGATION (DESKTOP) */}
          <div className="hidden lg:flex items-center gap-1 bg-indigo-50/50 p-1.5 rounded-full border border-indigo-100/50">
            {navLinks.filter(l => l.roles.includes(role)).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all group overflow-hidden ${activeLink(link.path) ? "text-white" : "text-slate-500 hover:text-indigo-600"
                  }`}
              >
                {activeLink(link.path) && (
                  <motion.div
                    layoutId="navbarActive"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-200"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {link.icon}
                  {link.name}
                </span>
              </Link>
            ))}
          </div>

          {/* ACTION CLUSTER (DESKTOP) */}
          {/* ACTION CLUSTER (Refined for Mobile & Desktop) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* THEME TOGGLE (ALWAYS VISIBLE) */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* NOTIFICATION HUB (ALWAYS VISIBLE) */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 relative ${showNotifications ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-indigo-50 text-indigo-600 hover:bg-slate-200"}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="notification-dropdown absolute right-[-50px] sm:right-0 mt-4 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl border border-indigo-100 rounded-[2rem] shadow-[0_25px_60px_rgba(79,70,229,0.25)] overflow-hidden origin-top-right z-50"
                  >
                    <div className="notification-header p-4 border-b border-indigo-50 flex items-center justify-between bg-indigo-50/30">
                      <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest text-indigo-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[9px] sm:text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-tighter"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    <div className="notification-list max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="mx-auto text-slate-200 mb-3" size={28} />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inbox Zero</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`notification-item p-4 border-b border-slate-50 hover:bg-indigo-50/50 transition-colors cursor-pointer relative ${!n.read ? "bg-indigo-50/20" : ""}`}
                          >
                            {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                            <div className="flex gap-3">
                              <span className="text-xl sm:text-2xl">{n.icon}</span>
                              <div>
                                <h4 className="font-black text-slate-900 text-[12px] sm:text-sm leading-none mb-1">{n.title}</h4>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">{n.content}</p>
                                <p className="text-[9px] font-black text-indigo-400 uppercase mt-1.5">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="notification-footer p-3 bg-slate-50 text-center">
                      <button
                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                        onClick={() => setNotifications([])}
                      >
                        Clear History
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* USER PROFILE (DESKTOP ONLY) */}
            <div className="hidden lg:flex items-center gap-3 bg-white/50 p-1.5 rounded-2xl border border-white shadow-sm pl-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-slate-900 leading-none">{userName}</span>
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">{role} Portal</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 border-2 border-white shadow-inner flex items-center justify-center text-indigo-700 font-black">
                {userName?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* LOGOUT BUTTON (DESKTOP ONLY) */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex p-3.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-lg transition-all"
            >
              <LogOut size={20} />
            </button>

            {/* MOBILE TOGGLE */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-3.5 sm:p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.nav>
      </div>

      {/* MOBILE FULLSCREEN MENU */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[90] bg-indigo-950/20 lg:hidden flex items-end p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-[3rem] shadow-2xl p-8 pb-12 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner border border-indigo-100">
                    {userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{userName}</h3>
                    <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest">{role} Administrator</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenu(false)} className="p-3 bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {navLinks.filter(l => l.roles.includes(role)).map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenu(false)}
                    className={`flex items-center gap-5 p-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all ${activeLink(link.path)
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                      : "bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
                      }`}
                  >
                    <div className={activeLink(link.path) ? "text-white" : "text-indigo-600"}>
                      {link.icon}
                    </div>
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={toggleTheme}
                  className="flex-1 bg-slate-900 text-white p-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-rose-50 text-rose-600 p-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <LogOut size={20} /> Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC SPACER */}
      <div className={`transition-all duration-500 ${scrolled ? "h-20" : "h-28"}`} />
    </>
  );
}
