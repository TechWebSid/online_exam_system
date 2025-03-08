import base64
import io
import numpy as np
import face_recognition
from PIL import Image

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    return np.array(image)

def detect_faces(image):
    """Detect faces in an image"""
    face_locations = face_recognition.face_locations(image)
    return face_locations

def encode_face(image, face_location=None):
    """Encode a face in an image"""
    if face_location:
        face_locations = [face_location]
    else:
        face_locations = face_recognition.face_locations(image)
        
    if not face_locations:
        return None
        
    face_encodings = face_recognition.face_encodings(image, face_locations)
    
    if not face_encodings:
        return None
        
    return face_encodings[0]

def compare_faces(known_encoding, unknown_encoding, tolerance=0.6):
    """Compare faces and return True if they match"""
    if isinstance(known_encoding, list):
        known_encoding = np.array(known_encoding)
        
    results = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=tolerance)
    return results[0] if results else False

def face_distance(known_encoding, unknown_encoding):
    """Calculate face distance (lower is better)"""
    if isinstance(known_encoding, list):
        known_encoding = np.array(known_encoding)
        
    distances = face_recognition.face_distance([known_encoding], unknown_encoding)
    return distances[0] if len(distances) > 0 else 1.0

def find_best_match(face_encoding, registered_faces, threshold=0.6):
    """Find the best match for a face encoding among registered faces"""
    best_match = None
    best_match_distance = 1.0
    
    for face_data in registered_faces:
        stored_encoding = np.array(face_data['faceEncoding'])
        distance = face_distance(stored_encoding, face_encoding)
        
        if distance < best_match_distance:
            best_match_distance = distance
            best_match = face_data
    
    if best_match and best_match_distance < threshold:
        return best_match, best_match_distance
    else:
        return None, best_match_distance 