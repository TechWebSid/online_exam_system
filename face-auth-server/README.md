# Face Authentication and Monitoring Server

This server provides face authentication and monitoring capabilities for the Online Examination System.

## Features

- **Face Registration**: Register a user's face for future authentication
- **Face Verification**: Verify a user's identity by comparing with registered face
- **Face Monitoring**: Monitor a user's face during an exam for suspicious activities
- **Head Movement Detection**: Detect excessive head movements during an exam
- **Multiple Face Detection**: Detect if multiple faces are present in the frame

## Setup

1. Make sure you have Python 3.7+ installed
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
3. Configure the `.env` file with your MongoDB connection details (if needed)

## Running the Server

### Standard Version (with face_recognition)

The standard version uses the `face_recognition` library for more accurate face detection and recognition.

```
# Windows
start.bat

# Linux/Mac
./start.sh
```

### Simplified Version (without face_recognition)

The simplified version uses basic image comparison techniques and doesn't require the `face_recognition` library.

```
# Windows
start_simplified.bat

# Linux/Mac
python app_simplified.py
```

## API Endpoints

### Health Check
```
GET /health
```

### Face Registration
```
POST /register
{
  "userId": "user123",
  "image": "base64-encoded-image"
}
```

### Face Verification
```
POST /verify
{
  "userId": "user123",
  "image": "base64-encoded-image"
}
```

### Face Monitoring
```
POST /monitor
{
  "userId": "user123",
  "image": "base64-encoded-image"
}
```

### Head Movement Detection
```
POST /detect-movement
{
  "sessionId": "exam_session_123",
  "image": "base64-encoded-image"
}
```

### Multiple Face Detection
```
POST /check-multiple-faces
{
  "image": "base64-encoded-image"
}
```

## Integration with the Exam System

The face monitoring server works alongside the main exam application:

1. The exam application captures frames from the user's webcam
2. These frames are sent to the face monitoring server for analysis
3. The server detects suspicious activities (head movement, multiple faces, etc.)
4. The exam application displays warnings based on the server's response

## Troubleshooting

- If you encounter issues with the `face_recognition` library, try using the simplified version
- Make sure your webcam is properly connected and accessible
- Check that the server is running on the expected port (default: 5001)
- Ensure CORS is properly configured if the exam application is running on a different domain 