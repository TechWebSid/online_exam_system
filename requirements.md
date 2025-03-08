Secure Online Examination System – Requirements Document
1️⃣ Project Overview
The Secure Online Examination System is a web-based platform for conducting MCQ-based exams with face authentication to ensure exam integrity. It supports admin and student modules, allowing dynamic exam creation, management, and real-time monitoring of candidates.

🔹 Tech Stack:

Frontend: Next.js, Tailwind CSS
Backend: Express.js, Node.js, MongoDB
Face Authentication: TensorFlow.js
Database: MongoDB
2️⃣ Features & Functionality
🟢 User Module (Students)
✅ Sign Up & Login (JWT Authentication)
✅ Face Authentication before starting an exam
✅ Exam Selection (Choose from available subjects & exams)
✅ Exam Interface (Timer, MCQs, Auto-Submit on time-out)
✅ Live Proctoring (Face tracking using TensorFlow.js)
✅ Exam Submission & Result Display

🟠 Admin Module
✅ Dashboard (Stats for exams, students, and performance)
✅ Manage Subjects (Add/Edit/Delete subjects)
✅ Manage Exams (Create/Edit/Delete exams for subjects)
✅ Manage Questions (CRUD operations on exam questions)
✅ Monitor Exams (View real-time student status & activity)
✅ View Student Performance (Results, scores, and timestamps)

 Authentication & Security
🔹 JWT Authentication for users and admin
🔹 Face Recognition via TensorFlow.js for identity verification
🔹 Session Handling & Auto Logout after inactivity

 Exam Proctoring (Face Monitoring)
🔹 TensorFlow.js for real-time face tracking
🔹 Alerts when face is not visible or multiple faces detected
🔹 Logs violations in the database

6️⃣ UI & UX (Tailwind CSS)
🎨 Beautiful, interactive, and light-themed UI
🖥 Responsive design for desktop & mobile
📌 Sticky Navbar & Sidebar for Admin Panel

 cheating detection (eye movement tracking)
9️⃣ Conclusion
This system provides a secure,  online examination experience with face authentication and real-time monitoring. It ensures academic integrity while being easy to manage for administrators. 🚀

