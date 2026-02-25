import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, School, ArrowRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const fullText = ["Face", "Recognition"];
  const [displayedLines, setDisplayedLines] = useState(["", ""]);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Typing animation for "Face Recognition"
  useEffect(() => {
    let currentChar = 0;
    const combinedText = fullText.join(" ");
    const typingInterval = setInterval(() => {
      if (currentChar <= combinedText.length) {
        const typed = combinedText.slice(0, currentChar);
        const [line1, line2] = typed.split(" ");
        setDisplayedLines([line1 || "", line2 || ""]);
        currentChar++;
      } else {
        clearInterval(typingInterval);
      }
    }, 150);
    return () => clearInterval(typingInterval);
  }, []);

  // Play button sound
  const playClickSound = () => {
    const audio = new Audio("/click.mp3");
    audio.play().catch(() => {}); // Catch error if sound file doesn't exist
  };

  return (
    <motion.div
      className="relative w-full min-h-screen font-poppins 
                 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 
                 overflow-hidden border-4 border-indigo-200 rounded-2xl shadow-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 blur-[100px] rounded-full" />

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-[calc(100vh-80px)] flex flex-col-reverse md:flex-row 
                   items-center justify-between px-4 md:px-16 gap-10 w-full 
                   max-w-7xl mx-auto py-12"
      >
        {/* Left Content */}
        <motion.div
          className="flex-1 flex flex-col items-start justify-center space-y-6 z-10 max-w-xl md:pl-8 lg:pl-12"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> AI Attendance System v1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-slate-900">
            <span className="bg-gradient-to-r from-indigo-700 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
              {displayedLines[0]}
            </span>
            <br />
            <motion.span
              className="text-indigo-900"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              {displayedLines[1]}
            </motion.span>
          </h1>

          <p className="text-gray-700 text-lg md:text-xl max-w-lg leading-relaxed">
            Unlock the future of <span className="font-semibold text-indigo-700">classroom management</span>. 
            Automated tracking with biometric precision. Secure, seamless, and paper-free.
          </p>

          {/* ROLE SELECTION BUTTONS */}
          <div className="flex flex-wrap gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClickSound(); navigate("/register-teacher"); }}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 
                         text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-200
                         transition font-bold tracking-wide"
            >
              <School size={20} /> Teacher Portal
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClickSound(); navigate("/register-student"); }}
              className="flex items-center gap-3 bg-white border-2 border-indigo-600 
                         text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-2xl 
                         transition font-bold tracking-wide"
            >
              <Users size={20} /> Student Portal
            </motion.button>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => setShowLearnMore(true)}
              className="text-indigo-500 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
            >
              Learn how it works <ArrowRight size={16}/>
            </button>
          </div>
        </motion.div>

        {/* Right Illustration */}
        <motion.div
          className="relative flex-1 flex items-center justify-center hero-image md:pr-8 lg:pr-12"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0, y: [0, -15, 0] }}
          transition={{
            opacity: { duration: 1, ease: "easeOut", delay: 0.4 },
            y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
          }}
        >
          <img
            src="/images/face.png"
            alt="Face Recognition Illustration"
            className="relative h-[50vh] md:h-[70vh] w-auto object-contain drop-shadow-2xl"
          />
        </motion.div>
      </section>

      {/* Learn More Modal */}
      <AnimatePresence>
        {showLearnMore && (
          <motion.div
            className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLearnMore(false)}
          >
            <motion.div
              className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-xl text-center border border-indigo-100"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-extrabold text-indigo-900 mb-4">
                Smart Attendance Flow
              </h2>
              <div className="text-left space-y-4 mb-8">
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-800">Registration:</span> Teachers generate a Class ID; Students join using that ID.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-800">Enrollment:</span> Students register their 128-point facial map via the portal.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-800">Verification:</span> AI Scanner identifies faces and marks attendance instantly.</p>
                 </div>
              </div>
              <button
                onClick={() => setShowLearnMore(false)}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 
                           text-white px-6 py-4 rounded-xl font-bold shadow-md transition"
              >
                Got it, let's start
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}