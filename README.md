# 🎓 Face Attendance System

A modern, full-stack web application that uses facial recognition technology to automate attendance tracking in educational institutions. The system features secure authentication, role-based access (Teachers/Students), real-time face detection, geofencing, and automated attendance reporting.

## ✨ Features

### 👨‍🎓 For Students
- **Face Enrollment**: Register face biometrics for attendance marking
- **Quick Check-in**: Mark attendance with facial recognition
- **Attendance Dashboard**: View personal attendance history and statistics
- **Profile Management**: Update personal information and credentials
- **Attendance Reports**: Download attendance reports in Excel format
- **Low Attendance Alerts**: Email notifications when attendance falls below threshold

### 👨‍🏫 For Teachers
- **Class Management**: Create and manage classes
- **Student Management**: Register, update, and monitor student information
- **Attendance Tracking**: Monitor real-time attendance and historical records
- **Geofencing**: Enforce location-based attendance with geo-boundaries
- **Bulk Operations**: Manage multiple students efficiently
- **Reports Export**: Generate and export attendance reports

### 🔒 Security Features
- Password hashing with Werkzeug security
- JWT-based authentication
- Role-based access control
- Password reset functionality with email verification
- Secure file uploads and storage
- CORS protection

## 🛠 Tech Stack

### Backend
- **Framework**: Flask
- **Database**: SQLite with SQLAlchemy ORM
- **Face Recognition**: face_recognition library
- **Email**: SMTP (Gmail/Custom)
- **File Processing**: Pandas, OpenPyXL
- **Deployment**: Gunicorn, Docker
- **Environment Management**: Python-dotenv

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Face Detection**: MediaPipe, TensorFlow.js, Face-API.js
- **Animations**: Framer Motion, Lottie
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- Python (3.8 or higher)
- npm or yarn
- Git

## 🚀 Installation & Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create a Python virtual environment**
```bash
python -m venv venv
```

3. **Activate the virtual environment**
   - On Windows:
   ```bash
   venv\Scripts\activate
   ```
   - On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

5. **Create a `.env` file** in the backend directory:
```env
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your_secret_key_here
FRONTEND_URL=http://localhost:5173
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password
DATABASE_URL=sqlite:///attendance.db
COLLEGE_LAT=19.061056
COLLEGE_LONG=72.920806
MAX_DISTANCE_METERS=10000
```

6. **Run the Flask application**
```bash
python app.py
```
The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install Node dependencies**
```bash
npm install
```

3. **Create a `.env` file** in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

4. **Run the development server**
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

5. **Build for production**
```bash
npm run build
```

## 📁 Project Structure

```
face-attendance-system/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile             # Docker configuration
│   ├── Procfile               # Heroku/Render configuration
│   ├── runtime.txt            # Python runtime version
│   └── .env.example           # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages/views
│   │   │   ├── Login.jsx
│   │   │   ├── StudentLogin.jsx
│   │   │   ├── FaceEnroll.jsx
│   │   │   ├── FaceScanner.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── ManageStudents.jsx
│   │   │   └── ...
│   │   ├── components/       # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ...
│   │   ├── api.js            # API client configuration
│   │   ├── App.jsx           # Main App component
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   └── vercel.json           # Vercel deployment config
│
├── render.yaml               # Render deployment configuration
└── README.md                 # Project documentation
```

## 🔑 Key API Endpoints

### Authentication
- `POST /api/login` - Login for teachers
- `POST /api/student-login` - Login for students
- `POST /api/register-teacher` - Register new teacher
- `POST /api/register-student` - Register new student
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password/<token>` - Reset password with token

### Face Recognition
- `POST /api/enroll-face` - Enroll student face (requires image)
- `POST /api/check-attendance` - Mark attendance with face recognition
- `GET /api/attendance/<student_id>` - Get student attendance records

### Class Management
- `GET /api/classes` - Get all classes
- `POST /api/create-class` - Create new class (Teacher only)
- `PUT /api/update-class/<class_id>` - Update class details
- `DELETE /api/delete-class/<class_id>` - Delete class

### Student Management
- `GET /api/students` - Get all students
- `GET /api/students/<student_id>` - Get student details
- `PUT /api/update-student/<student_id>` - Update student information
- `DELETE /api/delete-student/<student_id>` - Delete student

### Attendance
- `GET /api/attendance-report` - Get attendance report
- `POST /api/export-attendance` - Export attendance to Excel
- `GET /api/attendance-stats` - Get attendance statistics

## 🌍 Deployment

### Render.com Deployment
The project includes a `render.yaml` configuration for easy deployment on Render:

```bash
# Push to GitHub and connect to Render for automatic deployment
```

### Docker Deployment
```bash
# Build Docker image
docker build -t face-attendance-system .

# Run container
docker run -p 5000:5000 face-attendance-system
```

### Vercel Deployment (Frontend)
The frontend is configured for Vercel deployment. Connect your GitHub repo to Vercel for automatic deployments.

## 🔐 Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_ENV` | Flask environment | development |
| `SECRET_KEY` | Secret key for sessions | college_project_secret_key |
| `FRONTEND_URL` | Frontend application URL | http://localhost:5173 |
| `SMTP_SERVER` | Email SMTP server | smtp.gmail.com |
| `SMTP_PORT` | SMTP port | 587 |
| `SENDER_EMAIL` | Sender email address | - |
| `SENDER_PASSWORD` | Email app password | - |
| `COLLEGE_LAT` | College latitude for geofencing | 19.061056 |
| `COLLEGE_LONG` | College longitude | 72.920806 |
| `MAX_DISTANCE_METERS` | Max distance for geofencing | 10000 |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | http://localhost:5000 |

## 📸 Screenshots

### Student Interface
- Login page with email/password authentication
- Face enrollment interface with live camera feed
- Attendance marking with real-time face detection
- Personal attendance dashboard with statistics

### Teacher Interface
- Dashboard with class overview
- Student management interface
- Attendance tracking and reporting
- Bulk operations for efficiency

## 🤖 How Face Recognition Works

1. **Face Enrollment**: Students register their face biometrics during enrollment
2. **Feature Extraction**: The system extracts 128-dimensional face encodings using deep learning
3. **Storage**: Encoded features are stored securely in the database
4. **Recognition**: During attendance, the system compares live face encodings with stored data
5. **Matching**: Uses Euclidean distance to determine if faces match (threshold-based)
6. **Attendance Marking**: Automatic marking when match confidence is above threshold

## 🎯 Usage Guide

### For Students
1. Register with email and password
2. Complete face enrollment with clear lighting
3. Mark attendance by scanning face during class
4. View attendance history on dashboard
5. Receive email alerts for low attendance

### For Teachers
1. Register and create classes
2. Add students to manage
3. Monitor real-time attendance
4. Set geofencing boundaries
5. Export attendance reports for analysis

## 🐛 Troubleshooting

### Face Recognition Not Working
- Ensure proper lighting conditions
- Face should be clearly visible (front-facing)
- Remove glasses or sunglasses if possible
- Camera resolution should be adequate

### API Connection Issues
- Verify backend is running on correct port
- Check CORS settings in backend
- Ensure `VITE_API_BASE_URL` is correct in frontend
- Check firewall/network settings

### Email Notifications Not Sending
- Verify SMTP credentials are correct
- For Gmail: Use App Passwords (not account password)
- Enable less secure apps if needed
- Check firewall allows SMTP port 587

### Database Issues
- Ensure SQLite database file has write permissions
- On deployment, use persistent storage volume
- Check `PERSISTENT_DIR` environment variable

## 📝 Database Schema

### User Models
- **Teacher**: Email, hashed password, name, department
- **Student**: Email, password, name, roll number, class ID, face encoding

### Attendance Models
- **Attendance**: Student ID, timestamp, status, latitude, longitude
- **Class**: Name, teacher ID, timetable, geofencing coordinates

## 🔄 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Project**: Face Attendance System
- **Year**: 2025

## 🤝 Support

For support, email your questions or create an issue in the GitHub repository.

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [face_recognition Library](https://github.com/ageitgey/face_recognition)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🎉 Acknowledgments

- face_recognition library for facial recognition
- Flask and React communities
- All contributors and testers

---

**Made with ❤️ for automated attendance systems**
