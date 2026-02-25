import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import StudentLogin from "./pages/StudentLogin";
import Home from "./pages/Home";
import RegisterTeacher from "./pages/RegisterTeacher";
import RegisterStudent from "./pages/RegisterStudent";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import FaceEnroll from "./pages/FaceEnroll";
import FaceScanner from "./pages/FaceScanner";
import ManageStudents from "./pages/ManageStudents";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StudentUpdate from "./pages/StudentUpdate";
import ScanFace from "./pages/ScanFace";
import JoinClass from "./pages/JoinClass";



const ProtectedRoute = ({ children, allowedRole }) => {
  // Try to get token OR just rely on the role for face-verified sessions
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // If there is no role saved, they definitely aren't logged in
  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required and doesn't match
  if (allowedRole && userRole !== allowedRole) {
    return (
      <Navigate
        to={userRole === "teacher" ? "/teacher-dashboard" : "/student-dashboard"}
        replace
      />
    );
  }

  return children;
};

function App() {
  return (
    <Router>
      {/* CHANGE THIS LINE: from bg-[#020617] to bg-indigo-50 */}
      <div className="min-h-screen bg-indigo-50 font-poppins">
        <Navbar />
        <Routes>
          {/* ... all your routes stay exactly the same */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/register-teacher" element={<RegisterTeacher />} />
          <Route path="/register-student" element={<RegisterStudent />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* --- TEACHER --- */}
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/face-scanner"
            element={
              <ProtectedRoute allowedRole="teacher">
                <FaceScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-students"
            element={
              <ProtectedRoute allowedRole="teacher">
                <ManageStudents />
              </ProtectedRoute>
            }
          />

          {/* --- STUDENT --- */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scan-face"
            element={
              <ProtectedRoute allowedRole="student">
                <ScanFace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enroll-face"
            element={
              <ProtectedRoute allowedRole="student">
                <FaceEnroll />
              </ProtectedRoute>
            }
          />

          {/* NEW: Route for Updating Profile */}
          <Route
            path="/update-profile"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentUpdate />
              </ProtectedRoute>
            }
          />

          {/* NEW: Join Class */}
          <Route
            path="/join-class"
            element={
              <ProtectedRoute allowedRole="student">
                <JoinClass />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
