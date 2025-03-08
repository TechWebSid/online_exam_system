# Face Authentication Server

A Flask-based microservice for face registration and verification in the Secure Online Exam System.

## Features

- Face registration: Register a user's face and store encodings in MongoDB
- Face verification: Verify a user's face against stored encodings
- Face monitoring: Continuously monitor a user's face during an exam
- Anti-cheating measures: Detect multiple faces or absence of a face

## Requirements

- Python 3.8+
- MongoDB
- face_recognition library (which requires dlib)
- Flask and other dependencies listed in requirements.txt

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env` file:

```
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1
MONGO_URI=mongodb://localhost:27017/
DB_NAME=exam_system
COLLECTION_NAME=face_data
PORT=5001
ALLOWED_ORIGINS=http://localhost:3000
```

## Running the Server

Start the Flask server:

```bash
python app.py
```

The server will run on port 5001 by default.

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the server.

### Register Face

```
POST /register
```

Register a face for a user.

**Request Body:**
```json
{
  "userId": "user_id",
  "name": "User Name",
  "image": "base64_encoded_image"
}
```

### Verify Face

```
POST /verify
```

Verify a face against stored face encodings.

**Request Body:**
```json
{
  "image": "base64_encoded_image",
  "userId": "optional_user_id"
}
```

### Monitor Face

```
POST /monitor
```

Monitor a face during an exam.

**Request Body:**
```json
{
  "userId": "user_id",
  "image": "base64_encoded_image"
}
```

## Integration with Node.js Backend

The Node.js backend should communicate with this Flask server to handle face authentication requests. See the main project documentation for details on integration.

## Notes

- The face_recognition library uses dlib which requires C++ build tools. If you encounter installation issues, refer to the dlib installation guide.
- For production deployment, consider using gunicorn or a similar WSGI server.
- Ensure MongoDB is running and accessible from the server. 