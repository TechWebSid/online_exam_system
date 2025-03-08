import os
import base64
import io
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import face_recognition
import numpy as np
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=os.getenv('ALLOWED_ORIGINS', '*').split(','))

# MongoDB connection
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
db_name = os.getenv('DB_NAME', 'exam_system')
collection_name = os.getenv('COLLECTION_NAME', 'face_data')

client = MongoClient(mongo_uri)
db = client[db_name]
face_collection = db[collection_name]

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    return np.array(image)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/register', methods=['POST'])
def register_face():
    """Register a face for a user"""
    try:
        data = request.json
        
        if not data or 'image' not in data or 'userId' not in data or 'name' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required fields: image, userId, and name'
            }), 400
        
        # Convert base64 image to numpy array
        image = base64_to_image(data['image'])
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return jsonify({
                'success': False,
                'message': 'No face detected in the image'
            }), 400
        
        if len(face_locations) > 1:
            return jsonify({
                'success': False,
                'message': 'Multiple faces detected. Please provide an image with only one face'
            }), 400
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_encodings:
            return jsonify({
                'success': False,
                'message': 'Failed to encode face'
            }), 400
        
        # Convert numpy array to list for MongoDB storage
        face_encoding = face_encodings[0].tolist()
        
        # Check if user already has a face registered
        existing_face = face_collection.find_one({'userId': data['userId']})
        
        if existing_face:
            # Update existing face data
            face_collection.update_one(
                {'userId': data['userId']},
                {
                    '$set': {
                        'faceEncoding': face_encoding,
                        'name': data['name'],
                        'updatedAt': datetime.now()
                    }
                }
            )
            message = 'Face updated successfully'
        else:
            # Insert new face data
            face_collection.insert_one({
                'userId': data['userId'],
                'name': data['name'],
                'faceEncoding': face_encoding,
                'isVerified': False,
                'registeredAt': datetime.now(),
                'lastVerifiedAt': None,
                'verificationCount': 0
            })
            message = 'Face registered successfully'
        
        return jsonify({
            'success': True,
            'message': message
        }), 200
        
    except Exception as e:
        print(f"Error in register_face: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing request: {str(e)}'
        }), 500

@app.route('/verify', methods=['POST'])
def verify_face():
    """Verify a face against stored face encodings"""
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required field: image'
            }), 400
        
        # Optional userId for targeted verification
        user_id = data.get('userId')
        
        # Convert base64 image to numpy array
        image = base64_to_image(data['image'])
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return jsonify({
                'success': False,
                'message': 'No face detected in the image'
            }), 400
        
        if len(face_locations) > 1:
            return jsonify({
                'success': False,
                'message': 'Multiple faces detected. Please provide an image with only one face'
            }), 400
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_encodings:
            return jsonify({
                'success': False,
                'message': 'Failed to encode face'
            }), 400
        
        # Get the face encoding from the image
        face_encoding = face_encodings[0]
        
        # Query to find matching face
        query = {}
        if user_id:
            query['userId'] = user_id
        
        # Find all registered faces (or just the specific user's face)
        registered_faces = list(face_collection.find(query))
        
        if not registered_faces:
            return jsonify({
                'success': False,
                'message': 'No registered faces found' if not user_id else f'No face registered for user {user_id}'
            }), 404
        
        # Check for matches
        best_match = None
        best_match_distance = 1.0  # Lower is better, 0.6 is typically a good threshold
        
        for face_data in registered_faces:
            # Convert stored list back to numpy array
            stored_encoding = np.array(face_data['faceEncoding'])
            
            # Calculate face distance (lower is better)
            face_distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
            
            if face_distance < best_match_distance:
                best_match_distance = face_distance
                best_match = face_data
        
        # Threshold for considering it a match (0.6 is a common threshold)
        threshold = 0.6
        
        if best_match and best_match_distance < threshold:
            # Update verification stats
            face_collection.update_one(
                {'_id': best_match['_id']},
                {
                    '$set': {
                        'lastVerifiedAt': datetime.now(),
                        'isVerified': True
                    },
                    '$inc': {
                        'verificationCount': 1
                    }
                }
            )
            
            return jsonify({
                'success': True,
                'message': 'Face verification successful',
                'match': True,
                'userId': best_match['userId'],
                'name': best_match['name'],
                'confidence': float(1 - best_match_distance)  # Convert to confidence percentage
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Face verification failed',
                'match': False,
                'confidence': float(1 - best_match_distance) if best_match else 0
            }), 200
        
    except Exception as e:
        print(f"Error in verify_face: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing request: {str(e)}'
        }), 500

@app.route('/monitor', methods=['POST'])
def monitor_face():
    """Monitor a face during an exam"""
    try:
        data = request.json
        
        if not data or 'image' not in data or 'userId' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required fields: image and userId'
            }), 400
        
        # Convert base64 image to numpy array
        image = base64_to_image(data['image'])
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(image)
        
        # Check if any face is detected
        if not face_locations:
            return jsonify({
                'success': False,
                'message': 'No face detected',
                'warning': 'face_missing'
            }), 200
        
        # Check if multiple faces are detected
        if len(face_locations) > 1:
            return jsonify({
                'success': False,
                'message': 'Multiple faces detected',
                'warning': 'multiple_faces',
                'faceCount': len(face_locations)
            }), 200
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_encodings:
            return jsonify({
                'success': False,
                'message': 'Failed to encode face',
                'warning': 'encoding_failed'
            }), 200
        
        # Get the face encoding from the image
        face_encoding = face_encodings[0]
        
        # Find the user's registered face
        user_face = face_collection.find_one({'userId': data['userId']})
        
        if not user_face:
            return jsonify({
                'success': False,
                'message': f'No face registered for user {data["userId"]}',
                'warning': 'not_registered'
            }), 200
        
        # Convert stored list back to numpy array
        stored_encoding = np.array(user_face['faceEncoding'])
        
        # Calculate face distance (lower is better)
        face_distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
        
        # Threshold for considering it a match (0.6 is a common threshold)
        threshold = 0.6
        
        if face_distance < threshold:
            return jsonify({
                'success': True,
                'message': 'Face match confirmed',
                'match': True,
                'confidence': float(1 - face_distance)
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Different person detected',
                'warning': 'different_person',
                'match': False,
                'confidence': float(1 - face_distance)
            }), 200
        
    except Exception as e:
        print(f"Error in monitor_face: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing request: {str(e)}',
            'warning': 'processing_error'
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 