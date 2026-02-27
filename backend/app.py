import os
import shutil
import uuid
import pickle
import socket
import face_recognition
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import io
import pandas as pd
from datetime import datetime, timedelta, timezone
import math
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
from itsdangerous import URLSafeTimedSerializer


# ---------------- APP CONFIG ----------------
app = Flask(__name__)
CORS(app, origins="*")

# Use PERSISTENT_DIR for data storage (set on Render for the persistent disk)
# Locally defaults to current directory
_PERSISTENT_DIR = os.environ.get('PERSISTENT_DIR', '.')
os.makedirs(_PERSISTENT_DIR, exist_ok=True)

# Build the SQLite path on the persistent disk
_DB_FILE = os.path.join(_PERSISTENT_DIR, 'attendance.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{_DB_FILE}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'college_project_secret_key')

# Frontend URL - set this as environment variable on Render
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


db = SQLAlchemy(app)
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# ---------------- PING ENDPOINT ----------------
@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({"status": "online", "timestamp": datetime.now(timezone.utc).isoformat()}), 200

# ---------------- PICKLE CONFIG ----------------
# On Render, use the persistent disk path. Locally, use current directory.
PERSISTENT_DIR = os.environ.get('PERSISTENT_DIR', '.')  
PICKLE_PATH = os.path.join(PERSISTENT_DIR, "face_data.pkl")

# ---------------- TIMETABLE STORAGE ----------------
TIMETABLE_DIR = os.path.join(PERSISTENT_DIR, "uploads")
os.makedirs(TIMETABLE_DIR, exist_ok=True)

# ---------------- LIVE SESSION TRACKER ----------------
active_sessions = {}

# ---------------- GEO-FENCING CONFIG ----------------
# Example: Mumbai College Coordinates
COLLEGE_LAT = 19.061056
COLLEGE_LONG = 72.920806
MAX_DISTANCE_METERS = 10000

# ---------------- EMAIL CONFIG ----------------
# It's recommended to set these in your Render or Local Environment Variables
# Using .strip() to prevent accidental spaces from environment variables
SMTP_SERVER = os.environ.get('SMTP_SERVER', "smtp.gmail.com").strip()
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', "abdulka0440r@gmail.com").strip()
# IMPORTANT: Generate a 16-character "App Password" from your Google Account
# .replace(" ", "") ensures the 16-character code works even if spaces were kept
SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', "nvbn vzpr vkoo khgn").strip().replace(" ", "")

def send_email_alert(to_email, student_name, percentage, teacher_name="Professor", teacher_email=None):
    """Send a low-attendance alert email. Reflects the teacher's identity."""
    msg = MIMEMultipart()
    
    # ✅ CLEANER HEADERS: Using quotes for the name ensures special chars don't break the header
    display_name = f"{teacher_name} (via Attendify)"
    msg['From'] = f'"{display_name}" <{SENDER_EMAIL}>'
    msg['To'] = to_email
    # ✅ REPLY-TO: If student replies, it goes to the teacher, not the system
    if teacher_email:
        msg['Reply-To'] = teacher_email
    
    msg['Subject'] = f"LOW ATTENDANCE ALERT: {student_name}"

    body = f"""
Dear {student_name},

This is an automated alert from the Attendance Tracking System.
Your attendance for the current month has dropped to {percentage}%, which is below the required 75%.

Please ensure you attend your upcoming lectures to maintain your academic standing.
Excessive absenteeism may lead to disciplinary action or hall ticket blocking.

Regards,
College Administration
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        # ✅ TRY PORT 465 (SSL) - Definitive attempt
        host = "smtp.gmail.com"
        port = 465
        print(f"🔄 Connecting to {host}:{port} for {to_email}...")
        
        # Test DNS resolution
        try:
            ip = socket.gethostbyname(host)
            print(f"� Resolved {host} to {ip}")
        except:
            print(f"❌ DNS Resolution FAILED for {host}")

        with smtplib.SMTP_SSL(host, port, timeout=15) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        print(f"📧 Alert email sent to {to_email} via Port 465 SSL")

    except smtplib.SMTPAuthenticationError:
        print("❌ SMTP Authentication Failed. This usually means the App Password is invalid or expired.")
        raise Exception("Authentication failed. Please check your App Password settings in Google.")
    except Exception as e:
        import traceback
        print(f"❌ SMTP Error for {to_email}:")
        traceback.print_exc()
        raise Exception(f"Mail Delivery failed: {str(e)}")

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in meters using Haversine formula"""
    R = 6371000 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

@app.route('/')
def health_check():
    return jsonify({"status": "online", "message": "Face Attendance API is running"}), 200

# ---------------- ADMIN RESET SYSTEM ----------------
@app.route('/api/admin/reset-system', methods=['POST'])
def reset_system():
    try:
        # 1. Clear Database Tables
        db.drop_all()
        db.create_all()
        
        # 2. Delete Face Encodings (Pickle)
        if os.path.exists(PICKLE_PATH):
            os.remove(PICKLE_PATH)
            
        # 3. Clear Uploaded Timetables
        if os.path.exists(TIMETABLE_DIR):
            for filename in os.listdir(TIMETABLE_DIR):
                file_path = os.path.join(TIMETABLE_DIR, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f'Failed to delete {file_path}. Reason: {e}')

        return jsonify({"message": "System has been completely reset. All data cleared."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email', '').lower()
    
    user = Teacher.query.filter_by(email=email).first()
    user_type = "Teacher"
    
    if not user:
        user = Student.query.filter_by(email=email).first()
        user_type = "Student"
        
    if not user:
        return jsonify({"error": "No account found with this email."}), 404
        
    # Generate Reset Token
    token = serializer.dumps(email, salt='password-reset-salt')
    reset_link = f"{FRONTEND_URL}/reset-password/{token}"
    
    # Send email
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Attendify Security <{SENDER_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = "Password Reset Request - Attendify"

        body = f"""
        Hello {user.name},

        We received a request to reset your password for your {user_type} account.
        
        Click the link below to reset your password:
        {reset_link}

        This link will expire in 15 minutes.
        If you did not request this, please ignore this email.

        Regards,
        Attendify Security Team
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return jsonify({"message": "Password reset link has been sent to your email."}), 200
    except Exception as e:
        print(f"Error sending recovery email: {e}")
        return jsonify({"error": "We couldn't send the email. Try again later."}), 500

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('new_password')
    
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=900) # 15 mins
    except Exception:
        return jsonify({"error": "The reset link is invalid or has expired."}), 400
        
    user = Teacher.query.filter_by(email=email).first()
    role = "teacher"
    
    if not user:
        user = Student.query.filter_by(email=email).first()
        role = "student"
        
    if not user:
        return jsonify({"error": "User not found."}), 404
        
    user.password = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({"message": "Password has been reset successfully.", "role": role}), 200

# ---------------- PICKLE HELPERS ----------------
def save_to_pickle(user_key, encoding):
    data = {}
    if os.path.exists(PICKLE_PATH):
        with open(PICKLE_PATH, "rb") as f:
            try:
                data = pickle.load(f)
            except Exception:
                data = {}

    data[str(user_key)] = encoding
    with open(PICKLE_PATH, "wb") as f:
        pickle.dump(data, f)


def load_pickle():
    if os.path.exists(PICKLE_PATH):
        with open(PICKLE_PATH, "rb") as f:
            return pickle.load(f)
    return {}

# ---------------- DATABASE MODELS ----------------
class Teacher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(50), nullable=False)
    division = db.Column(db.String(10))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    teacher_id = db.Column(db.String(10), db.ForeignKey('teacher.teacher_id'), nullable=True) # Now optional at registration
    last_alert_date = db.Column(db.String(30)) # To avoid spamming alerts

# ✅ NEW: Table to handle multi-class enrollments
class ClassEnrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_roll = db.Column(db.String(20), nullable=False)
    class_id = db.Column(db.String(10), nullable=False)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(100))
    teacher_id = db.Column(db.String(10))
    subject = db.Column(db.String(100))   # ✅ ADD THIS
    status = db.Column(db.String(20))
    date = db.Column(db.String(30))
    time = db.Column(db.String(20))

class LectureSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.String(10), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(30), nullable=False)
    time = db.Column(db.String(20), nullable=False)

# ---------------- MESSAGE MODEL ----------------
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.String(10), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.String(50), nullable=False)


with app.app_context():
    db.create_all()

# ---------------- TEACHER REGISTRATION ----------------
@app.route('/api/register/teacher-with-face', methods=['POST'])
def register_teacher():
    try:
        data = request.form
        image_file = request.files.get('face_image')

        unique_class_id = f"TCH{str(uuid.uuid4().int)[:3]}"

        new_teacher = Teacher(
            teacher_id=unique_class_id,
            name=data.get('name'),
            subject=data.get('subject'),
            class_name=data.get('class_name'),
            division=data.get('division'),
            email=data.get('email').lower(),
            password=generate_password_hash(data.get('password'))
        )

        if image_file:
            img = face_recognition.load_image_file(image_file)
            encs = face_recognition.face_encodings(img)
            if encs:
                save_to_pickle(new_teacher.email, encs[0])

        db.session.add(new_teacher)
        db.session.commit()

        return jsonify({"message": "Success", "class_id": unique_class_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- STUDENT REGISTRATION (GLOBAL) ----------------
@app.route('/api/register/student-with-face', methods=['POST'])
def register_student():
    data = request.form
    image_file = request.files.get('face_image')
    t_id = data.get('teacher_id')
    email = data.get('email', '').lower()

    # 1. Check if already registered
    existing = Student.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "An account with this email already exists"}), 400

    # 2. Check Teacher ID if provided
    if t_id:
        teacher = Teacher.query.filter_by(teacher_id=t_id).first()
        if not teacher:
            print(f"Registration Error: Teacher ID {t_id} not found")
            return jsonify({"error": f"Invalid Teacher ID: {t_id}. Please check the ID provided by your teacher."}), 404

    try:
        new_student = Student(
            name=data.get('name'),
            roll_no=data.get('roll_no'),
            email=email,
            password=generate_password_hash(data.get('password')),
            teacher_id=t_id if t_id else None
        )

        if image_file:
            print(f"Processing face for {email}...")
            img = face_recognition.load_image_file(image_file)
            encs = face_recognition.face_encodings(img)
            if encs:
                save_to_pickle(new_student.email, encs[0])
                print("Face encoding saved.")
            else:
                return jsonify({"error": "Face not detected in the image. Please try again with better lighting."}), 400

        db.session.add(new_student)
        db.session.commit()
        return jsonify({"message": "Global Registration Complete! You can now login."}), 201

    except Exception as e:
        print(f"Registration Database Error: {str(e)}")
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

# ---------------- PROFESSIONAL LOGIN (UNIVERSAL) ----------------
@app.route('/api/login-with-face', methods=['POST'])
def login_with_face():
    try:
        email = request.form.get('email', '').lower() # For Teachers
        roll_no = request.form.get('roll_no')         # For Students
        class_id_context = request.form.get('teacher_id') # OPTIONAL context
        password = request.form.get('password')
        image_file = request.files.get('face_image')

        if not image_file:
            return jsonify({"error": "Face detection is required for biometric access"}), 400

        user = None
        role = ""
        lookup_email = ""

        # 1. AUTHENTICATION STAGE (BY CREDENTIALS)
        if email:
            user = Teacher.query.filter_by(email=email).first()
            if user:
                role = "teacher"
                lookup_email = user.email
        
        if not user and roll_no:
            # PROFESSIONAL FIX: Find student globally by roll_no
            # In a real system, we'd prefer email, but we'll stick to roll_no + pass for now
            # as requested to make it easier for students.
            user = Student.query.filter_by(roll_no=roll_no).first()
            if user:
                role = "student"
                lookup_email = user.email

        # Check password
        if not user or not check_password_hash(user.password, password):
            return jsonify({"error": "Access Denied: Invalid credentials"}), 401

        # 2. BIOMETRIC VERIFICATION STAGE
        all_faces = load_pickle()
        stored_encoding = all_faces.get(lookup_email)

        if stored_encoding is None:
            return jsonify({"error": "Biometric record not found. Please register face."}), 400

        attempt_image = face_recognition.load_image_file(image_file)
        attempt_encodings = face_recognition.face_encodings(attempt_image)

        if not attempt_encodings:
            return jsonify({"error": "Face not clearly visible. Ensure good lighting."}), 400

        dist = face_recognition.face_distance([stored_encoding], attempt_encodings[0])[0]

        if dist > 0.6:
            return jsonify({"error": "Biometric identity mismatch"}), 401

        # 3. CONTEXTUAL DATA PREPARATION
        response = {
            "message": "Authenticated successfully",
            "role": role,
            "name": user.name,
            "email": user.email,
        }

        if role == "teacher":
            response["class_id"] = user.teacher_id
            response["subject"] = user.subject

        if role == "student":
            response["roll_no"] = user.roll_no
            
            # Handle class context (what class should the dashboard open by default?)
            active_cid = class_id_context if class_id_context else user.teacher_id
            
            # Auto-join if class_id passed but not joined yet (Backward Compatibility)
            if class_id_context:
                exists = ClassEnrollment.query.filter_by(student_roll=user.roll_no, class_id=class_id_context).first()
                if not exists and class_id_context != user.teacher_id:
                     # Verify teacher exists
                     t_check = Teacher.query.filter_by(teacher_id=class_id_context).first()
                     if t_check:
                         new_enroll = ClassEnrollment(student_roll=user.roll_no, class_id=class_id_context)
                         db.session.add(new_enroll)
                         db.session.commit()
            
            # Gather all classes for the student
            classes_list = []
            
            # A. Primary Class (linked in student table)
            if user.teacher_id:
                t = Teacher.query.filter_by(teacher_id=user.teacher_id).first()
                if t:
                    classes_list.append({"classId": t.teacher_id, "subject": t.subject, "teacherName": t.name})
            
            # B. Other Enrollments
            others = ClassEnrollment.query.filter_by(student_roll=user.roll_no).all()
            for enroll in others:
                if enroll.class_id == user.teacher_id: continue # unique check
                t = Teacher.query.filter_by(teacher_id=enroll.class_id).first()
                if t:
                    classes_list.append({"classId": t.teacher_id, "subject": t.subject, "teacherName": t.name})
            
            response["classes"] = classes_list
            # Set the "primary" class ID to return (important for dashboard init)
            response["class_id"] = active_cid if active_cid else (classes_list[0]["classId"] if classes_list else "NONE")

        return jsonify(response), 200

    except Exception as e:
        print(f"Login Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ---------------- NEW: JOIN CLASS & CLASS INFO ----------------
@app.route('/api/class-details/<class_id>', methods=['GET'])
def get_class_details(class_id):
    teacher = Teacher.query.filter_by(teacher_id=class_id).first()
    if teacher:
        return jsonify({
            "id": teacher.teacher_id,
            "subject": teacher.subject,
            "teacher_name": teacher.name
        }), 200
    return jsonify({"error": "Class not found"}), 404

@app.route('/api/join-class', methods=['POST'])
def join_class():
    data = request.json
    roll_no = data.get('roll_no')
    class_id = data.get('class_id')

    if not roll_no or not class_id:
        return jsonify({"error": "Missing data"}), 400

    # 1. Verify Class Exists
    teacher = Teacher.query.filter_by(teacher_id=class_id).first()
    if not teacher:
        return jsonify({"error": "Class ID invalid"}), 404

    # 2. Check if already joined (Main Table or Enrollment Table)
    student = Student.query.filter_by(roll_no=roll_no, teacher_id=class_id).first()
    if student:
        return jsonify({"error": "You are already in this class (Main)"}), 400
    
    existing = ClassEnrollment.query.filter_by(student_roll=roll_no, class_id=class_id).first()
    if existing:
        return jsonify({"error": "You are already enrolled in this class"}), 400

    # 3. Add Enrollment
    new_enrollment = ClassEnrollment(
        student_roll=roll_no,
        class_id=class_id
    )
    db.session.add(new_enrollment)
    db.session.commit()

    return jsonify({"message": "Joined successfully"}), 200


# ---------------- TEACHER DASHBOARD APIs ----------------
@app.route('/api/teacher/students/<class_id>')
def get_students(class_id):
    # 1. Get Main Students
    students = Student.query.filter_by(teacher_id=class_id).all()
    
    # 2. Get Enrolled Students (from other classes)
    enrollments = ClassEnrollment.query.filter_by(class_id=class_id).all()
    for enroll in enrollments:
        # Fetch detailed info from Student table (assuming uniqueness by Roll No)
        s_detail = Student.query.filter_by(roll_no=enroll.student_roll).first()
        if s_detail:
            students.append(s_detail)

    # Unique students by roll no
    unique_students = {s.roll_no: s for s in students}.values()
    
    # Check Pickled Data
    all_faces = load_pickle()

    return jsonify([
        {
            "id": s.id,
            "name": s.name, 
            "roll_no": s.roll_no, 
            "email": s.email,
            "is_enrolled": s.email in all_faces
        }
        for s in unique_students
    ])

@app.route('/api/export-attendance/<class_id>')
def export_attendance(class_id):
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # 1. Fetch data with date filtering
        query = Attendance.query.filter_by(teacher_id=class_id)
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        logs = query.all()
        if not logs:
            return jsonify({"error": "No attendance records found for this period"}), 404

        # 2. Convert to DataFrame
        data = []
        for l in logs:
            data.append({
                "Student Name": l.student_name,
                "Date": l.date,
                "Status": l.status
            })
        
        df = pd.DataFrame(data)

        # 3. Pivot the data to have dates as columns
        pivot_df = df.pivot_table(
            index="Student Name", 
            columns="Date", 
            values="Status", 
            aggfunc='first'
        ).fillna("Absent")

        # 4. Save to BytesIO for download
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            pivot_df.to_excel(writer, sheet_name='Monthly Attendance')
        
        output.seek(0)
        
        # 5. Send file response
        from flask import send_file
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"Attendance_Report_{class_id}_{datetime.now().strftime('%Y%m%d')}.xlsx"
        )

    except Exception as e:
        print(f"Export Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-student-attendance/<roll_no>/<class_id>')
def export_student_attendance(roll_no, class_id):
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # 1. Find the student to get their name (Attendance is stored by name)
        student = Student.query.filter_by(roll_no=roll_no).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        # 2. Filter logs for specific student and class
        # Fixed: Query by student_name instead of roll_no
        query = Attendance.query.filter_by(student_name=student.name, teacher_id=class_id)
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        logs = query.all()
        if not logs:
            return jsonify({"error": "No attendance records found for this period"}), 404

        data = []
        for l in logs:
            data.append({
                "Date": l.date,
                "Time": l.time,
                "Subject": l.subject,
                "Status": l.status
            })
        
        df = pd.DataFrame(data)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='My Attendance')
        output.seek(0)
        
        from flask import send_file
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"Attendance_{roll_no}_{class_id}.xlsx"
        )
    except Exception as e:
        print(f"Export Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/attendance-report/<class_id>')
def attendance_report(class_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Attendance.query.filter_by(teacher_id=class_id)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
        
    logs = query.all()
    return jsonify([
        {"name": l.student_name, "status": l.status, "date": l.date}
        for l in logs
    ])

# ---------------- UPLOAD TIMETABLE ----------------
@app.route('/api/upload-timetable', methods=['POST'])
def upload_timetable():
    file = request.files.get('timetable')
    class_id = request.form.get('classId')

    if not file:
        return jsonify({"error": "No file provided"}), 400

    filename = secure_filename(f"timetable_{class_id}_{file.filename}")
    file.save(os.path.join(TIMETABLE_DIR, filename))

    return jsonify({"message": "Timetable uploaded successfully"}), 200

# ---------------- GET TIMETABLE (REFINED) ----------------
@app.route('/api/get-timetable/<class_id>')
def get_timetable(class_id):
    # Debug: Print the ID the student is searching for
    print(f"Searching for timetable for Class ID: {class_id}")
    
    if not os.path.exists(TIMETABLE_DIR):
        return jsonify({"message": "Upload directory missing"}), 404

    # Search for any file that starts with the specific timetable prefix
    for file in os.listdir(TIMETABLE_DIR):
        if file.startswith(f"timetable_{class_id}"):
            # Construct full URL for the student to download
            return jsonify({
                "url": f"{request.host_url}uploads/{file}"
            }), 200

    return jsonify({"message": "No timetable found"}), 404


# ---------------- DELETE TIMETABLE ----------------
@app.route('/api/delete-timetable/<class_id>', methods=['DELETE'])
def delete_timetable(class_id):
    deleted = False
    for file in os.listdir(TIMETABLE_DIR):
        if file.startswith(f"timetable_{class_id}"):
            os.remove(os.path.join(TIMETABLE_DIR, file))
            deleted = True

    if deleted:
        return jsonify({"message": "Timetable deleted successfully"}), 200
    return jsonify({"message": "File not found"}), 404

# ---------------- SERVE UPLOADED FILES ----------------
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(TIMETABLE_DIR, filename)

# ---------------- REMOVE STUDENT ----------------
@app.route('/teacher/remove-student/<class_id>/<roll_no>', methods=['DELETE'])
def remove_student(class_id, roll_no):
    # Try removing from Main Student table
    student = Student.query.filter_by(
        teacher_id=class_id,
        roll_no=roll_no
    ).first()

    if student:
        db.session.delete(student)
        db.session.commit()
        return jsonify({"message": "Student removed"}), 200

    # Try removing from Enrollment
    enrollment = ClassEnrollment.query.filter_by(
        class_id=class_id,
        student_roll=roll_no
    ).first()
    
    if enrollment:
        db.session.delete(enrollment)
        db.session.commit()
        return jsonify({"message": "Student removed from enrollment"}), 200

    return jsonify({"error": "Student not found"}), 404

# ---------------- STUDENT DASHBOARD STATS (MONTH-WISE) ----------------
@app.route('/api/student/dashboard-stats/<roll_no>/<class_id>')
def get_student_dashboard_data(roll_no, class_id):
    try:
        # Check Main Table
        student = Student.query.filter_by(
            roll_no=roll_no,
            teacher_id=class_id
        ).first()

        # Check Enrollment Table if not found
        if not student:
            enrollment = ClassEnrollment.query.filter_by(student_roll=roll_no, class_id=class_id).first()
            if enrollment:
                student = Student.query.filter_by(roll_no=roll_no).first()

        teacher = Teacher.query.filter_by(
            teacher_id=class_id
        ).first()

        if not student:
            return jsonify({"error": "Student not found in this class"}), 404

        # 🗓️ DATE RANGE (Default to Current Month)
        now = datetime.now()
        default_start = now.replace(day=1).strftime("%Y-%m-%d")
        default_end = now.strftime("%Y-%m-%d")
        
        start_date = request.args.get('start_date', default_start)
        end_date = request.args.get('end_date', default_end)

        # 1️⃣ TOTAL LECTURES IN RANGE
        total_classes = LectureSession.query.filter(
            LectureSession.teacher_id == class_id,
            LectureSession.date >= start_date,
            LectureSession.date <= end_date
        ).count()

        # 2️⃣ STUDENT ATTENDED CLASSES IN RANGE
        attended_classes = Attendance.query.filter(
            Attendance.student_name == student.name,
            Attendance.teacher_id == class_id,
            Attendance.status == "Present",
            Attendance.date >= start_date,
            Attendance.date <= end_date
        ).count()

        percentage = (attended_classes / total_classes * 100) if total_classes > 0 else 0

        # 3️⃣ ATTENDANCE HISTORY IN RANGE
        history_logs = Attendance.query.filter(
            Attendance.student_name == student.name,
            Attendance.teacher_id == class_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        ).order_by(
            Attendance.date.desc(),
            Attendance.time.desc()
        ).all()

        history_data = [
            {
                "date": log.date,
                "time": log.time,
                "subject": log.subject,
                "status": log.status
            }
            for log in history_logs
        ]

        # 4️⃣ STREAK CALCULATION (Last 10 Lectures)
        last_10_lectures = LectureSession.query.filter_by(teacher_id=class_id)\
            .order_by(LectureSession.date.desc(), LectureSession.time.desc())\
            .limit(10).all()
        
        has_streak = False
        if len(last_10_lectures) >= 10:
            lecture_dates = [l.date for l in last_10_lectures]
            student_presents = Attendance.query.filter(
                Attendance.student_name == student.name,
                Attendance.teacher_id == class_id,
                Attendance.status == "Present",
                Attendance.date.in_(lecture_dates)
            ).count()
            if student_presents >= 10:
                has_streak = True

        return jsonify({
            "stats": {
                "month": now.strftime("%B"),
                "totalClasses": total_classes,
                "attended": attended_classes,
                "percentage": round(percentage, 1),
                "hasStreak": has_streak,
                "history": history_data
            },
            "profile": {
                "teacher_name": teacher.name if teacher else "N/A",
                "subject": teacher.subject if teacher else "N/A"
            }
        }), 200

    except Exception as e:
        print("Stats Error:", e)
        return jsonify({"error": "Internal Server Error"}), 500


# ---------------- NEW: OVERALL ATTENDANCE SUMMARY (ALL SUBJECTS) ----------------
@app.route('/api/teacher/leaderboard/<class_id>')
def get_leaderboard(class_id):
    try:
        now = datetime.now()
        month_start = now.replace(day=1).strftime("%Y-%m-%d")
        month_end = now.strftime("%Y-%m-%d")

        # Get attendance counts for the month
        from sqlalchemy import func
        leaderboard = db.session.query(
            Attendance.student_name,
            func.count(Attendance.id).label('present_count')
        ).filter(
            Attendance.teacher_id == class_id,
            Attendance.status == "Present",
            Attendance.date >= month_start,
            Attendance.date <= month_end
        ).group_by(Attendance.student_name)\
         .order_by(func.count(Attendance.id).desc())\
         .limit(3).all()

        return jsonify([
            {"name": l[0], "count": l[1]} for l in leaderboard
        ]), 200
    except Exception as e:
        print("Leaderboard Error:", e)
        return jsonify({"error": str(e)}), 500

def check_and_send_low_attendance_alerts(class_id, force=False):
    """
    Scan all students in a class and email those below 75% attendance.
    force=True: bypasses the 7-day cooldown and the min-3-lectures guard.
                Used when the teacher manually clicks 'Send Manual Alert'.
    """
    class_id = class_id.strip().upper()
    now = datetime.now()
    month_start = now.replace(day=1).strftime("%Y-%m-%d")
    month_end = now.strftime("%Y-%m-%d")

    # Fetch teacher info to personalize the sender
    teacher = Teacher.query.filter_by(teacher_id=class_id).first()
    t_name = teacher.name if teacher else "Professor"
    t_email = teacher.email if teacher else SENDER_EMAIL

    # 1. Gather all student roll numbers in this class
    enrollments = ClassEnrollment.query.filter_by(class_id=class_id).all()
    student_rolls = [e.student_roll for e in enrollments]

    direct_students = Student.query.filter_by(teacher_id=class_id).all()
    for s in direct_students:
        if s.roll_no not in student_rolls:
            student_rolls.append(s.roll_no)

    if not student_rolls:
        return 0  # No students in class at all

    # 2. Total lectures this month
    total_classes = LectureSession.query.filter(
        LectureSession.teacher_id == class_id,
        LectureSession.date >= month_start,
        LectureSession.date <= month_end
    ).count()

    # For automatic triggers only: skip if not enough data yet
    if not force and total_classes < 3:
        print(f"ℹ️ Skipping alerts for {class_id}: only {total_classes} lecture(s) this month.")
        return 0

    # If no lectures at all (even for manual), nothing to calculate
    if total_classes == 0:
        return 0

    alerts_sent = 0
    errors = []

    for roll in student_rolls:
        student = Student.query.filter_by(roll_no=roll).first()
        if not student:
            continue

        # Skip if alerted in the last 7 days — ONLY when not a manual trigger
        if not force and student.last_alert_date:
            try:
                last_alert = datetime.fromisoformat(student.last_alert_date)
                if (now - last_alert).days < 7:
                    continue
            except:
                pass

        # Calculate this student's attendance %
        attended = Attendance.query.filter(
            Attendance.student_name == student.name,
            Attendance.teacher_id == class_id,
            Attendance.status == "Present",
            Attendance.date >= month_start,
            Attendance.date <= month_end
        ).count()

        percentage = (attended / total_classes) * 100

        if percentage < 75:
            try:
                send_email_alert(
                    student.email, 
                    student.name, 
                    round(percentage, 1),
                    teacher_name=t_name,
                    teacher_email=t_email
                )
                student.last_alert_date = now.isoformat()
                alerts_sent += 1
            except Exception as mail_err:
                error_msg = f"Failed to email {student.email}: {mail_err}"
                print(f"❌ {error_msg}")
                errors.append(error_msg)

    db.session.commit()

    if errors:
        # Surface the first email error so the teacher sees it
        raise Exception(f"Email delivery failed for {len(errors)} student(s). First error: {errors[0]}")

    return alerts_sent


@app.route('/api/teacher/trigger-alerts/<class_id>', methods=['POST'])
def trigger_alerts(class_id):
    try:
        # force=True: teacher manually clicked the button — bypass cooldown & min-classes guard
        count = check_and_send_low_attendance_alerts(class_id, force=True)
        if count == 0:
            return jsonify({"message": "✅ All students have attendance above 75%. No alerts needed!"}), 200
        return jsonify({"message": f"✅ Done! Alert emails sent to {count} student(s) below 75% attendance."}), 200
    except Exception as e:
        print(f"Trigger Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/student/overall-stats/<roll_no>')
def get_student_overall_stats(roll_no):
    try:
        # 1. Finds all classes student is part of
        # A. Primary Class
        student_main = Student.query.filter_by(roll_no=roll_no).first()
        if not student_main:
            return jsonify({"error": "Student not found"}), 404

        class_ids = []
        
        # Primary
        if student_main.teacher_id:
            class_ids.append(student_main.teacher_id)
        
        # Secondary
        enrollments = ClassEnrollment.query.filter_by(student_roll=roll_no).all()
        for e in enrollments:
            if e.class_id not in class_ids:
                class_ids.append(e.class_id)

        overall_report = []

        # 🗓️ Date Range: Start of Time to Now (Overall Record)
        # OR you can keep it Month-wise if preferred, but "Overall" usually implies semester
        # Let's do ALL TIME for the report card feel
        
        for cid in class_ids:
            teacher = Teacher.query.filter_by(teacher_id=cid).first()
            if not teacher: continue

            # Total Lectures (Teacher's total sessions)
            total = LectureSession.query.filter_by(teacher_id=cid).count()
            
            # Student Attended
            attended = Attendance.query.filter(
                Attendance.student_name == student_main.name, # Assuming name is consistent
                Attendance.teacher_id == cid,
                Attendance.status == "Present"
            ).count()

            pct = (attended / total * 100) if total > 0 else 0

            overall_report.append({
                "subject": teacher.subject,
                "teacher": teacher.name,
                "total": total,
                "attended": attended,
                "percentage": round(pct, 1)
            })

        return jsonify(overall_report), 200

    except Exception as e:
        print("Overall Stats Error:", e)
        return jsonify({"error": str(e)}), 500


    
# Add this to your login or dashboard routes section
@app.route('/api/messages/<class_id>', methods=['GET'])
def get_messages(class_id):
    messages = Message.query.filter_by(class_id=class_id).order_by(Message.id.desc()).all()
    return jsonify([{"id": m.id, "content": m.content, "timestamp": m.timestamp} for m in messages])

@app.route('/api/messages', methods=['POST'])
def post_message():
    data = request.json
    new_msg = Message(
        class_id=data.get('classId'),
        content=data.get('content'),
        timestamp=data.get('timestamp')
    )
    db.session.add(new_msg)
    db.session.commit()
    return jsonify({"message": "Announcement posted"}), 201

@app.route('/api/messages/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    msg = Message.query.get(msg_id)
    if msg:
        db.session.delete(msg)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    return jsonify({"error": "Not found"}), 404

# ---------------- UPDATE STUDENT PROFILE ----------------
@app.route('/api/student/update/<old_roll_no>', methods=['PUT'])
def update_student(old_roll_no):
    try:
        data = request.json
        new_name = data.get('name')
        new_email = data.get('email').lower()
        new_roll_no = data.get('rollNo')
        
        # 1. Find the student by their current (old) roll number
        student = Student.query.filter_by(roll_no=old_roll_no).first()
        
        if not student:
            return jsonify({"error": "Student record not found"}), 404

        # 2. Handle Face Data Key Change (If email changed)
        # Since face data in face_data.pkl is keyed by email, we must move it 
        # to the new email key so the student can still log in.
        if student.email != new_email:
            all_faces = load_pickle()
            if student.email in all_faces:
                # Move the encoding to the new email key
                all_faces[new_email] = all_faces.pop(student.email)
                with open(PICKLE_PATH, "wb") as f:
                    pickle.dump(all_faces, f)

        # 3. Update Attendance Records 
        # PROFESSIONAL FIX: Only update records belonging to this specific student 
        # based on their name AND the classes they are actually enrolled in.
        if student.name != new_name:
            # Get list of all class IDs this student is in
            enrolled_cids = [student.teacher_id] if student.teacher_id else []
            other_enrolls = ClassEnrollment.query.filter_by(student_roll=student.roll_no).all()
            for e in other_enrolls:
                if e.class_id not in enrolled_cids:
                    enrolled_cids.append(e.class_id)
            
            # Update logs only for those classes
            Attendance.query.filter(
                Attendance.student_name == student.name,
                Attendance.teacher_id.in_(enrolled_cids)
            ).update({Attendance.student_name: new_name}, synchronize_session=False)

        # 4. Update Student Table
        student.name = new_name
        student.email = new_email
        student.roll_no = new_roll_no
        
        # Also Update Enrollments
        ClassEnrollment.query.filter_by(student_roll=old_roll_no).update({ClassEnrollment.student_roll: new_roll_no})

        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Update Error: {str(e)}")
        return jsonify({"error": "Email already exists or database error"}), 400

# ---------------- BIOMETRIC UPDATE (EXISTING USERS) ----------------
@app.route('/api/enroll-face', methods=['POST'])
def enroll_face():
    try:
        student_id = request.form.get('student_id') # This is the roll_no from frontend
        image_file = request.files.get('image')

        if not image_file or not student_id:
            return jsonify({"error": "Missing image or student identifier"}), 400

        # 1. Find Student by Roll No (or Teacher if you want to support both)
        user = Student.query.filter_by(roll_no=student_id).first()
        
        if not user:
            # Fallback check for teachers if student not found
            user = Teacher.query.filter_by(teacher_id=student_id).first()
        
        if not user:
             return jsonify({"error": "User record not found"}), 404

        # 2. Extract and Save Encoding
        img = face_recognition.load_image_file(image_file)
        encs = face_recognition.face_encodings(img)
        
        if not encs:
            return jsonify({"error": "Face not detected. Ensure good lighting."}), 400

        # Save using email as the key (consistent with registration/login)
        save_to_pickle(user.email, encs[0])

        return jsonify({"message": "Biometrics updated successfully"}), 200

    except Exception as e:
        print(f"Enroll Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
# 1. TEACHER: Start or Stop the attendance window
# @app.route('/api/attendance/toggle-session', methods=['POST'])
# def toggle_session():
#     data = request.json
#     class_id = data.get('classId')
#     is_active = data.get('active')  # True to start, False to stop
#     message = data.get('message', 'General Attendance')

#     if is_active:
#         active_sessions[class_id] = {"active": True, "message": message}
#     else:
#         active_sessions.pop(class_id, None)

#     return jsonify({"status": "updated", "active": is_active})

# 2. STUDENT: Check if their teacher has opened attendance
@app.route('/api/attendance/check-session/<class_id>', methods=['GET'])
def check_session(class_id):
    class_id = class_id.upper()
    session = active_sessions.get(class_id)
    
    if session:
        # Check if session has expired
        if "expiry_time" in session:
            # Parse as UTC
            expiry_str = session["expiry_time"]
            if not expiry_str.endswith('Z'):
                expiry_str += 'Z'
            
            expiry = datetime.fromisoformat(expiry_str.replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > expiry:
                active_sessions.pop(class_id, None)
                check_and_send_low_attendance_alerts(class_id)
                return jsonify({"active": False, "message": "Session expired."})
        return jsonify(session)
        
    return jsonify({"active": False})

# 3. STUDENT: Face Verification and Automatic Logging with Liveness Detection
@app.route('/api/attendance/verify-face', methods=['POST'])
def verify_face_attendance():
    try:
        roll_no = request.form.get('rollNo')
        class_id = request.form.get('classId', '').upper()
        image_file = request.files.get('face_image')
        
        # ✅ Location Data (Geo-Fencing)
        lat = request.form.get('latitude')
        lon = request.form.get('longitude')
        
        # ✅ NEW: Liveness Detection Flags
        liveness_verified = request.form.get('liveness_verified', 'false').lower() == 'true'
        blink_count = int(request.form.get('blink_count', '0'))

        if not image_file or not roll_no:
            return jsonify({"success": False, "message": "Missing image or roll number"}), 400

        # 1. Verify if the attendance session is open
        session = active_sessions.get(class_id)
        if not session:
            return jsonify({"success": False, "message": "No active session found for this class"}), 403

        # Check for expiry
        if "expiry_time" in session:
            expiry_str = session["expiry_time"]
            if not expiry_str.endswith('Z'):
                 expiry_str += 'Z'
            expiry = datetime.fromisoformat(expiry_str.replace('Z', '+00:00'))
            
            if datetime.now(timezone.utc) > expiry:
                active_sessions.pop(class_id, None)
                return jsonify({"success": False, "message": "Attendance session has ended."}), 403

        # ✅ NEW: Enforce liveness check (optional - can be made mandatory)
        # if not liveness_verified or blink_count < 2:
        #     return jsonify({"success": False, "message": "Liveness verification failed. Please complete the blink test."}), 403

        # ✅ GEO-FENCING CHECK
        if lat and lon:
            distance = calculate_distance(float(lat), float(lon), COLLEGE_LAT, COLLEGE_LONG)
            if distance > MAX_DISTANCE_METERS:
                return jsonify({
                    "success": False, 
                    "message": f"Location Error: You are {round(distance)}m away. You must be within {MAX_DISTANCE_METERS}m of the college."
                }), 403
        else:
             return jsonify({"success": False, "message": "Location access is required for attendance"}), 403

        # 2. Find Student (Check Main OR Enrollment)
        student = Student.query.filter_by(roll_no=roll_no, teacher_id=class_id).first()
        if not student:
             enrollment = ClassEnrollment.query.filter_by(student_roll=roll_no, class_id=class_id).first()
             if enrollment:
                 student = Student.query.filter_by(roll_no=roll_no).first()

        if not student:
            return jsonify({"success": False, "message": "Student not enrolled in this class"}), 404

        # 3. Face Verification
        all_faces = load_pickle()
        stored_encoding = all_faces.get(student.email)
        
        if stored_encoding is None:
            return jsonify({"success": False, "message": "No registered face data found"}), 404

        captured_img = face_recognition.load_image_file(image_file)
        captured_encs = face_recognition.face_encodings(captured_img)

        if not captured_encs:
            return jsonify({"success": False, "message": "Face not clear. Try again."}), 400

        match = face_recognition.compare_faces([stored_encoding], captured_encs[0], tolerance=0.5)

        if match[0]:
            # 4. INSTEAD OF SAVING TO DB, ADD TO THE TEACHER'S PENDING LIST
            if "pending" not in active_sessions[class_id]:
                active_sessions[class_id]["pending"] = []

            # Check if student is already in the pending list to avoid duplicates
            is_already_pending = any(req['roll_no'] == roll_no for req in active_sessions[class_id]["pending"])
            
            if not is_already_pending:
                request_id = str(uuid.uuid4())[:8] # Generate a short unique ID
                attendance_request = {
                    "id": request_id,
                    "name": student.name,
                    "roll_no": student.roll_no,
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "liveness_verified": liveness_verified,  # ✅ NEW: Track liveness status
                    "blink_count": blink_count  # ✅ NEW: Track blink count for audit
                }
                active_sessions[class_id]["pending"].append(attendance_request)
                
                # Log liveness status
                print(f"✅ Attendance request from {student.name} (Roll: {roll_no}) - Liveness: {liveness_verified}, Blinks: {blink_count}")
                
                return jsonify({"success": True, "message": "Face verified! Waiting for teacher approval."})
            else:
                return jsonify({"success": True, "message": "Verification already sent. Please wait."})
        
        return jsonify({"success": False, "message": "Face match failed"}), 401

    except Exception as e:
        print(f"Verify Error: {str(e)}")
        return jsonify({"success": False, "message": "Internal server error"}), 500
    
# 1. Start the Session
@app.route('/api/attendance/start-session', methods=['POST'])
def start_session():
    data = request.json
    class_id = data.get('classId', '').upper()
    duration = data.get('duration', 0) # Duration in minutes
    
    # 1️⃣ CREATE A LECTURE ENTRY
    now = datetime.now()
    lecture = LectureSession(
        teacher_id=class_id,
        subject=data.get('subject'),
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M:%S")
    )
    db.session.add(lecture)
    db.session.commit()

    # Calculate expiry using UTC
    now_utc = datetime.now(timezone.utc)
    
    session_data = {
        "active": True,
        "message": data.get('message', "Class is live!"),
        "subject": data.get('subject'),
        "lecture_id": lecture.id,
        "pending": [],
        "start_time": now_utc.isoformat().replace("+00:00", "Z"),
    }

    if duration > 0:
        expiry_time = now_utc + timedelta(minutes=int(duration))
        session_data["expiry_time"] = expiry_time.isoformat().replace("+00:00", "Z")
        session_data["duration"] = duration

# 2️⃣ STORE SESSION IN MEMORY
    active_sessions[class_id] = session_data

    return jsonify({"active": True, "expiry_time": session_data.get("expiry_time")}), 200

# ---------------- STOP ATTENDANCE SESSION ----------------
@app.route('/api/attendance/stop-session', methods=['POST'])
def stop_session():
    data = request.json
    class_id = data.get('classId', '').upper()

    if not class_id:
        return jsonify({"error": "Class ID required"}), 400

    if class_id in active_sessions:
        active_sessions.pop(class_id)
        # 📢 Check for low attendance when session is stopped manually
        check_and_send_low_attendance_alerts(class_id)
        return jsonify({
            "active": False,
            "message": "Attendance session stopped"
        }), 200

    return jsonify({
        "active": False,
        "message": "No active session found"
    }), 404

# 2. Teacher fetches the "Pending" list
@app.route('/api/attendance/pending/<class_id>', methods=['GET'])
def get_pending(class_id):
    session = active_sessions.get(class_id, {})
    # Return the pending list or empty if no session exists
    return jsonify(session.get("pending", []))

# 3. Handle Approve/Decline buttons
@app.route('/api/attendance/approve', methods=['POST'])
def approve_attendance():
    data = request.json
    req_id = data.get('requestId')
    status = data.get('status')

    if not req_id or not status:
        return jsonify({"error": "Invalid request"}), 400

    for class_id, session in active_sessions.items():
        student_req = next(
            (r for r in session['pending'] if r['id'] == req_id),
            None
        )

        if student_req:
            if status == "present":
                new_entry = Attendance(
    student_name=student_req['name'],
    teacher_id=class_id,
    subject=session.get('subject', 'N/A'),  # ✅ FIXED
    status="Present",
    date=datetime.now().strftime("%Y-%m-%d"),
    time=datetime.now().strftime("%H:%M:%S")
)

                db.session.add(new_entry)
                db.session.commit()

            # remove request after decision
            session['pending'] = [
                r for r in session['pending'] if r['id'] != req_id
            ]

            return jsonify({"message": "Attendance updated"}), 200

    return jsonify({"error": "Request not found"}), 404


# ---------------- NEW: GROUP ATTENDANCE (CCTV MODE) ----------------
@app.route('/api/attendance/group-scan', methods=['POST'])
def group_scan():
    try:
        class_id = request.form.get('classId')
        subject = request.form.get('subject') # Optional if we look up by class_id
        image_file = request.files.get('group_image')

        if not image_file or not class_id:
            return jsonify({"error": "Missing image or class ID"}), 400

        # Load teacher subject if not provided
        if not subject:
             t = Teacher.query.filter_by(teacher_id=class_id).first()
             if t: subject = t.subject
             else: subject = "Unknown Class"

        # 1. Load Group Image
        group_img = face_recognition.load_image_file(image_file)
        
        # 2. Detect ALL faces
        # 'cnn' is better for group photos but slower (requires GPU). 'hog' is fast/CPU.
        # We'll use default (hog) for speed, or try 'cnn' if you have CUDA.
        face_locations = face_recognition.face_locations(group_img)
        face_encodings = face_recognition.face_encodings(group_img, face_locations)

        if not face_encodings:
            return jsonify({"message": "No faces detected in the image.", "count": 0, "processed": []}), 200

        all_faces = load_pickle() # Student DB
        
        marked_students = []
        unknown_count = 0

        # 3. Match Each Face
        for encoding in face_encodings:
            # Compare against ALL students (or optimize to filter by class list first if pickle structured)
            # Flatten pickle values
            known_emails = list(all_faces.keys())
            known_encs = list(all_faces.values())
            
            matches = face_recognition.compare_faces(known_encs, encoding, tolerance=0.5)
            
            name = "Unknown"
            if True in matches:
                first_match_index = matches.index(True)
                email = known_emails[first_match_index]
                
                # Fetch Student Name
                student_obj = Student.query.filter_by(email=email).first()
                if student_obj:
                    name = student_obj.name
                    
                    # 4. Mark Attendance
                    # Check if already marked for today/session? 
                    # For simplicity, we just insert "Present"
                    new_entry = Attendance(
                        student_name=name,
                        teacher_id=class_id,
                        subject=subject,
                        status="Present",
                        date=datetime.now().strftime("%Y-%m-%d"),
                        time=datetime.now().strftime("%H:%M:%S")
                    )
                    db.session.add(new_entry)
                    marked_students.append(name)
            else:
                unknown_count += 1

        db.session.commit()
        
        return jsonify({
            "message": "Scan complete",
            "count": len(face_encodings),
            "marked": len(marked_students),
            "unknown": unknown_count,
            "students": marked_students
        }), 200

    except Exception as e:
        print("Group Scan Error:", e)
        return jsonify({"error": str(e)}), 500


# 4. STUDENT: Check approval status (POLLING API)
@app.route('/api/attendance/status', methods=['GET'])
def attendance_status():
    roll_no = request.args.get('rollNo')
    class_id = request.args.get('classId')

    if not roll_no or not class_id:
        return jsonify({"status": "invalid"}), 400

    # 1. If session still exists & student still pending
    session = active_sessions.get(class_id)

    if session:
        pending = session.get("pending", [])
        if any(p["roll_no"] == roll_no for p in pending):
            return jsonify({"status": "pending"})

    # 2. If NOT pending, check DB (approved)
    student = Student.query.filter_by(
        roll_no=roll_no,
        teacher_id=class_id
    ).first()
    
    if not student:
        # Check enrollment
        enrollment = ClassEnrollment.query.filter_by(student_roll=roll_no, class_id=class_id).first()
        if enrollment:
            student = Student.query.filter_by(roll_no=roll_no).first()

    if not student:
        return jsonify({"status": "invalid"}), 404

    today = datetime.now().strftime("%Y-%m-%d")

    record = Attendance.query.filter_by(
        student_name=student.name,
        teacher_id=class_id,
        date=today
    ).first()

    if record:
        return jsonify({"status": "approved"})

    # 3. Otherwise rejected / session ended
    return jsonify({"status": "rejected"})

# ---------------- START SERVER ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
