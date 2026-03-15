import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, School, ArrowRight, ScanFace, Moon, Sun } from "lucide-react";
import Lottie from "lottie-react";

export default function Home() {
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState("");
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  const fullText = "Face Recognition";

  // Use a reliable theme sync that matches Navbar.jsx
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  // Fetch High-Quality Lottie Animation
  useEffect(() => {
    fetch("/animations/face-scan.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Error loading animation:", err));
  }, []);

  // Professional fluid typing animation
  useEffect(() => {
    let currentChar = 0;
    const typingInterval = setInterval(() => {
      if (currentChar <= fullText.length) {
        setTypedText(fullText.slice(0, currentChar));
        currentChar++;
      } else {
        clearInterval(typingInterval);
      }
    }, 120);
    return () => clearInterval(typingInterval);
  }, []);

  const playClickSound = () => {
    try {
      const audio = new Audio("/click.mp3");
      audio.play().catch(() => { /* ignore */ });
    } catch {
      // Audio not supported or missing
    }
  };

  const words = typedText.split(" ");
  const firstWord = words[0];
  const restOfWords = words.slice(1).join(" ");

  return (
    <motion.main
      className="relative w-full min-h-screen font-poppins text-slate-900 border-4 border-indigo-200 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-100 transition-all duration-500 selection:bg-indigo-500/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Ambience Layers (Matched to Dashboard) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full pointer-events-none" />

      {/* Subtle Mesh Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      {/* Theme Toggle Button - Premium Style */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          style={{
            backgroundColor: theme === 'dark' ? '#1e293b' : '#f0f4ff',
            color: theme === 'dark' ? '#818cf8' : '#4f46e5'
          }}
          className="p-3.5 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl border border-indigo-100 dark:border-slate-700"
        >
          {theme === "light" ? <Moon size={22} strokeWidth={2.5} /> : <Sun size={22} strokeWidth={2.5} />}
        </button>
      </div>

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-screen flex flex-col justify-center lg:flex-row 
                   items-center px-6 md:px-12 lg:px-20 gap-16 lg:gap-10 w-full 
                   max-w-[1440px] mx-auto py-20 relative z-10"
      >
        {/* Left Typography & Action Content */}
        <motion.div
          className="flex-1 flex flex-col items-start justify-center space-y-8 max-w-2xl"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
          >
            <ShieldCheck size={16} className="animate-pulse" /> AI Biometric Nexus
          </motion.div>

          {/* Fluid Typing Heading (With proper padding to fix 'e' clipping) */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter text-slate-900 dark:text-white mb-2 py-1 pr-4">
            <span className="bg-gradient-to-r from-indigo-700 to-blue-500 bg-clip-text text-transparent filter drop-shadow-sm px-2">
              {firstWord}
            </span>
            {words.length > 1 && (
              <>
                <br />
                <motion.span
                  className="text-indigo-900 inline-block mt-2"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  {restOfWords}
                </motion.span>
              </>
            )}

          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl lg:text-2xl max-w-lg leading-relaxed font-light">
            Next-generation <span className="text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-500/20">automated attendance</span>.
            Precision facial mapping powered by neural networks. Seamless integration, absolute security.
          </p>

          {/* Interactive Action Hub */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(79, 70, 229, 0.3)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { playClickSound(); navigate("/register-teacher"); }}
              className="group relative flex items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-500 
                         text-white px-8 py-4 md:py-5 rounded-2xl shadow-xl transition-all font-bold overflow-hidden w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimer_1.5s_infinite]" />
              <School size={22} className="group-hover:rotate-12 transition-transform" />
              <span>Teacher Portal</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: "rgba(79, 70, 229, 0.05)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { playClickSound(); navigate("/register-student"); }}
              className="flex items-center justify-center gap-4 bg-white border-2 border-indigo-500/30 
                         text-indigo-700 hover:border-indigo-400 px-8 py-4 md:py-5 rounded-2xl 
                         transition-all font-bold w-full sm:w-auto group shadow-sm"
            >
              <Users size={22} className="text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              <span>Student Portal</span>
            </motion.button>
          </div>

          <button
            onClick={() => setShowLearnMore(true)}
            className="text-indigo-400 font-medium flex items-center gap-2 hover:gap-3 transition-all group mt-2 hover:text-indigo-300"
          >
            <ScanFace size={18} />
            Explore System Architecture
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform opacity-70" />
          </button>
        </motion.div>

        {/* Right Illustration: The Cybernetic HUD */}
        <motion.div
          className="relative flex-1 flex items-center justify-center w-full min-h-[350px] md:min-h-[500px] lg:min-h-[600px] mt-10 lg:mt-0"
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        >
          {/* Animated HUD Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="w-[280px] h-[280px] md:w-[450px] md:h-[450px] border border-dashed border-indigo-500/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              className="absolute w-[230px] h-[230px] md:w-[380px] md:h-[380px] border-2 border-blue-500/10 rounded-full"
            />
          </div>

          {/* Holographic Image Container */}
          <div className="relative z-10 p-4 md:p-6 w-full max-w-[300px] md:max-w-[400px] lg:max-w-[480px]">
            {/* Tech Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-2xl opacity-70"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-2xl opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-400 rounded-bl-2xl opacity-70"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-2xl opacity-70"></div>

            {/* Glowing Face Image */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-transparent pb-4 pt-4 px-4 flex justify-center">
              {animationData && (
                <motion.div
                  className="w-full max-w-[450px] relative z-10"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <Lottie
                    animationData={animationData}
                    loop={true}
                    className="w-full transition-all duration-700"
                    style={{
                      mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
                      filter: theme === 'dark' ? 'invert(1) brightness(1.5) sepia(1) hue-rotate(190deg) saturate(5) drop-shadow(0 0 10px rgba(99,102,241,0.8))' : 'none'
                    }}
                  />
                </motion.div>
              )}

              {/* Scanning Laser inside the image box */}
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent shadow-[0_0_20px_#818cf8] z-30 pointer-events-none"
              />

              {/* Scan Overlay Effect */}
              <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay pointer-events-none z-20"></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Architecture Overview Modal */}
      <AnimatePresence>
        {showLearnMore && (
          <motion.div
            className="fixed inset-0 bg-indigo-900/30 backdrop-blur-xl flex items-center justify-center z-[999] px-4 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLearnMore(false)}
          >
            <motion.div
              className="bg-white p-8 md:p-14 rounded-[2rem] shadow-2xl max-w-2xl w-full text-center border border-indigo-100 relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Accent Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-500" />

              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight flex items-center justify-center gap-3">
                <ScanFace className="text-indigo-600" size={32} /> System Architecture
              </h2>

              <div className="text-left space-y-6 md:space-y-8 mb-10">
                {[
                  { id: "01", title: "Global Registration", desc: "Administrators provision secure Class Keys for instantaneous database synchronization." },
                  { id: "02", title: "Biometric Extraction", desc: "Advanced neural networks map 128 unique nodal points for immutable identity persistence." },
                  { id: "03", title: "Real-time Verification", desc: "Edge computing handles live stream ingestion for sub-second attendance verification." }
                ].map((item) => (
                  <div key={item.id} className="flex gap-4 md:gap-6 group items-start">
                    <div className="text-2xl md:text-3xl font-black text-indigo-100 group-hover:text-indigo-400 transition-colors uppercase tracking-widest pt-1">{item.id}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base md:text-lg mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-sm md:text-base leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-indigo-100">
                <button
                  onClick={() => setShowLearnMore(false)}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 mx-auto block"
                >
                  Return to Portal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>

      {/* 
        ROLLBACK OPTION: 
        If you want the original image back, replace the <motion.div> (Right Illustration) content with this:
        
        <img
          src="/images/face.png"
          alt="Face Recognition Illustration"
          className="relative h-[50vh] md:h-[70vh] w-auto object-contain drop-shadow-2xl"
        />
      */}
    </motion.main>
  );
}