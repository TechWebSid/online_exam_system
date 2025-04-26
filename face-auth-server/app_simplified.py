import os
import base64
import io
import json
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import numpy as np
from PIL import Image, ImageFilter, ImageOps
# import face_recognition  # Comment out as we're using the simplified version
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Custom JSON encoder to handle non-serializable types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, bool):
            return bool(obj)
        if isinstance(obj, (int, float)):
            return float(obj) if isinstance(obj, float) else int(obj)
        if obj is None:
            return None
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64, 
                           np.uint8, np.uint16, np.uint32, np.uint64)):
            return int(obj)
        if isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)
        if isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        return super(CustomJSONEncoder, self).default(obj)

app = Flask(__name__)
app.json_encoder = CustomJSONEncoder  # Use custom JSON encoder
CORS(app, origins=os.getenv('ALLOWED_ORIGINS', '*').split(','))

# MongoDB connection
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
db_name = os.getenv('DB_NAME', 'exam-system')
collection_name = os.getenv('COLLECTION_NAME', 'face_data')

client = MongoClient(mongo_uri)
db = client[db_name]
face_collection = db[collection_name]

# Store previous face data for movement detection
face_data_cache = {}
# Store consecutive movement counts for each session
movement_counts = {}
# Movement threshold - calibrated for the new comparison method
MOVEMENT_THRESHOLD = 0.15  # Lower threshold for the new method
MAX_CONSECUTIVE_MOVEMENTS = 3  # Require 3 consecutive movements
# Store recent movement values for stabilization
recent_movements = {}
# Number of recent movements to consider for stabilization
MOVEMENT_HISTORY_SIZE = 5

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    return image

def image_to_hash(image):
    """Convert image to a hash for simple comparison"""
    # Resize image to ensure consistent hash (higher resolution for better discrimination)
    image = image.resize((64, 64))
    # Convert to grayscale
    image = image.convert('L')
    # Apply some blur to reduce noise (reduced radius for better detail preservation)
    image = image.filter(ImageFilter.GaussianBlur(radius=1))
    # Normalize the image to enhance contrast
    image = ImageOps.equalize(image)
    
    # Compute a perceptual hash (pHash) which is better for image comparison
    # First, resize to 32x32 which is good for DCT
    image = image.resize((32, 32), Image.LANCZOS)
    # Convert to numpy array
    pixels = np.array(image).flatten()
    # Calculate the mean
    avg = pixels.mean()
    # Create a hash based on whether pixels are above or below the mean
    bits = pixels > avg
    # Convert boolean array to hash string
    phash = ''.join(['1' if bit else '0' for bit in bits])
    # Convert binary string to hexadecimal for storage
    hex_hash = hex(int(phash, 2))[2:]
    
    # Also compute a traditional MD5 hash for the flattened array
    md5_hash = hashlib.md5(pixels.tobytes()).hexdigest()
    
    # Combine both hashes for better discrimination
    combined_hash = md5_hash + hex_hash[:16]  # Limit hex_hash to 16 chars
    
    return combined_hash

# Add a new function for direct image comparison
def compare_images(img1, img2):
    """Compare two images directly and return similarity score using a more reliable method"""
    # Resize images to a standard size
    img1 = img1.resize((64, 64))  # Increase from 32x32 for more detail preservation
    img2 = img2.resize((64, 64))
    
    # Convert to grayscale
    img1 = img1.convert('L')
    img2 = img2.convert('L')
    
    # Apply lighter blur to preserve facial features better
    img1 = img1.filter(ImageFilter.GaussianBlur(radius=1.0))  # Reduced from 1.5
    img2 = img2.filter(ImageFilter.GaussianBlur(radius=1.0))
    
    # Convert to numpy arrays
    arr1 = np.array(img1).astype(float)
    arr2 = np.array(img2).astype(float)
    
    # Normalize the arrays to account for lighting changes
    arr1 = (arr1 - np.mean(arr1)) / (np.std(arr1) + 1e-5)
    arr2 = (arr2 - np.mean(arr2)) / (np.std(arr2) + 1e-5)
    
    # Calculate absolute difference between the images
    diff = np.abs(arr1 - arr2)
    
    # Calculate mean absolute difference (MAD)
    mad = np.mean(diff)
    
    # Calculate a similarity score based on regions
    # Divide image into regions and compare them separately
    # This makes the algorithm more robust to changes in expression and position
    
    # Create a 4x4 grid of regions
    region_scores = []
    rows, cols = arr1.shape
    region_rows, region_cols = rows // 4, cols // 4
    
    for i in range(4):
        for j in range(4):
            r_start, r_end = i * region_rows, (i + 1) * region_rows
            c_start, c_end = j * region_cols, (j + 1) * region_cols
            
            region1 = arr1[r_start:r_end, c_start:c_end]
            region2 = arr2[r_start:r_end, c_start:c_end]
            
            region_diff = np.abs(region1 - region2)
            region_mad = np.mean(region_diff)
            region_similarity = np.exp(-region_mad)
            region_scores.append(region_similarity)
    
    # Sort region scores and take the average of the best 10 regions (out of 16)
    # This allows for some facial regions to change while still maintaining a match
    region_scores.sort(reverse=True)
    best_regions_similarity = np.mean(region_scores[:10])
    
    # Blend with the overall similarity for a balanced approach
    similarity = 0.7 * best_regions_similarity + 0.3 * np.exp(-mad)
    
    # Print debug info occasionally
    if np.random.random() < 0.05:  # 5% of the time
        print(f"Image comparison - MAD: {mad:.4f}, Overall: {np.exp(-mad):.4f}, Best Regions: {best_regions_similarity:.4f}, Final: {similarity:.4f}")
    
    return similarity

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
        
        print(f"Registering face for user ID: {data['userId']}, name: {data['name']}")
        
        # Convert base64 image to PIL Image
        try:
            image = base64_to_image(data['image'])
            
            # Basic validation: check if image is of reasonable size
            if image.width < 100 or image.height < 100:
                return jsonify({
                    'success': False,
                    'message': 'Image is too small. Please provide a larger image.'
                }), 400
                
            # Check if image is too large (to prevent DoS)
            if image.width > 2000 or image.height > 2000:
                # Resize to reasonable dimensions
                image = image.resize((1000, int(1000 * image.height / image.width)))
                print(f"Image resized to {image.width}x{image.height}")
                
            # Create variations of the image for more robust matching
            variations = []
            
            # Original image
            variations.append(image.copy())
            
            # Slightly shifted to simulate position changes (4 variations)
            for dx, dy in [(5, 0), (-5, 0), (0, 5), (0, -5)]:
                shifted = Image.new('RGBA', image.size, (0, 0, 0, 0))
                shifted.paste(image, (dx, dy))
                variations.append(shifted.convert('RGB'))
                
            # Small rotation variations (2 variations)
            for angle in [2, -2]:
                rotated = image.rotate(angle, resample=Image.BICUBIC, expand=False)
                variations.append(rotated)
                
            # Slightly different brightness/contrast (2 variations)
            brighter = ImageOps.autocontrast(image, cutoff=3)
            variations.append(brighter)
            
            darker = Image.new('RGB', image.size)
            for x in range(image.width):
                for y in range(image.height):
                    r, g, b = image.getpixel((x, y))
                    darker.putpixel((x, y), (int(r*0.95), int(g*0.95), int(b*0.95)))
            variations.append(darker)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Invalid image data: {str(e)}'
            }), 400
        
        # Convert each variation to base64 for storage
        variation_data = []
        for i, var_img in enumerate(variations):
            # Convert to base64
            buffered = io.BytesIO()
            var_img.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            variation_data.append({
                'index': i,
                'data': 'data:image/jpeg;base64,' + img_str
            })
            
        # Generate image hash for the original image
        image_hash = image_to_hash(image)
        print(f"Generated hash for registration image: {image_hash[:10]}...")
        
        # Check if user already has a face registered
        existing_face = face_collection.find_one({'userId': data['userId']})
        
        # Store the original image data and variations
        image_data = data['image']  # Keep the base64 string
        
        if existing_face:
            # Update existing face data
            face_collection.update_one(
                {'userId': data['userId']},
                {
                    '$set': {
                        'faceHash': image_hash,
                        'imageData': image_data,  # Store the original image data
                        'variations': variation_data,  # Store variations
                        'name': data['name'],
                        'updatedAt': datetime.now()
                    }
                }
            )
            message = 'Face updated successfully'
            print(f"Updated face data for user {data['userId']}")
        else:
            # Insert new face data
            face_collection.insert_one({
                'userId': data['userId'],
                'name': data['name'],
                'faceHash': image_hash,
                'imageData': image_data,  # Store the original image data
                'variations': variation_data,  # Store variations
                'isVerified': False,
                'registeredAt': datetime.now(),
                'lastVerifiedAt': None,
                'verificationCount': 0
            })
            message = 'Face registered successfully'
            print(f"Inserted new face data for user {data['userId']}")
        
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
    """Verify a face against stored face hash"""
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required field: image'
            }), 400
        
        # Optional userId for targeted verification
        user_id = data.get('userId')
        print(f"Verifying face for user ID: {user_id}")
        
        # Convert base64 image to PIL Image
        image = base64_to_image(data['image'])
        
        # Generate image hash for logging
        image_hash = image_to_hash(image)
        print(f"Generated hash for verification image: {image_hash[:10]}...")
        
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
        
        print(f"Found {len(registered_faces)} registered faces to compare against")
        
        # Check for matches using direct image comparison
        best_match = None
        best_match_similarity = 0  # Higher is better
        best_variation_index = -1
        
        for face_data in registered_faces:
            # First try hash comparison for quick match
            if face_data['faceHash'] == image_hash:
                similarity = 1.0  # Perfect match
                print(f"Perfect hash match found for user {face_data['userId']}")
                best_match = face_data
                best_match_similarity = similarity
                break
            
            # Check all variations
            current_best_similarity = 0
            current_best_variation = -1
            
            # Try the original image first
            if 'imageData' in face_data and face_data['imageData']:
                try:
                    stored_image = base64_to_image(face_data['imageData'])
                    similarity = compare_images(image, stored_image)
                    if similarity > current_best_similarity:
                        current_best_similarity = similarity
                        current_best_variation = 0
                except Exception as e:
                    print(f"Error comparing with original image: {str(e)}")
            
            # Try all stored variations if available
            if 'variations' in face_data and face_data['variations']:
                for variation in face_data['variations']:
                    try:
                        var_image = base64_to_image(variation['data'])
                        similarity = compare_images(image, var_image)
                        if similarity > current_best_similarity:
                            current_best_similarity = similarity
                            current_best_variation = variation['index']
                    except Exception as e:
                        print(f"Error comparing with variation {variation.get('index')}: {str(e)}")
            
            # If we didn't find any valid variations, fallback to hash comparison
            if current_best_similarity == 0:
                matching_chars = sum(c1 == c2 for c1, c2 in zip(face_data['faceHash'], image_hash))
                current_best_similarity = matching_chars / len(image_hash)
            
            # Update best match if this face is better
            if current_best_similarity > best_match_similarity:
                best_match_similarity = current_best_similarity
                best_match = face_data
                best_variation_index = current_best_variation
                print(f"New best match: user {face_data['userId']}, similarity: {best_match_similarity:.4f}, variation: {best_variation_index}")
        
        # Threshold for considering it a match
        threshold = 0.6  # Reduced from 0.7 to be more lenient with different expressions
        
        print(f"Best match similarity: {best_match_similarity:.4f}, threshold: {threshold}, variation: {best_variation_index}")
        
        # Additional security check: if we're verifying a specific user,
        # make sure the best match is actually that user
        if user_id and best_match and best_match['userId'] != user_id:
            print(f"Security warning: Best match user {best_match['userId']} doesn't match requested user {user_id}")
            return jsonify({
                'success': False,
                'message': 'Face verification failed - identity mismatch',
                'match': False,
                'confidence': float(best_match_similarity)
            }), 200
        
        if best_match and best_match_similarity >= threshold:
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
                'confidence': float(best_match_similarity),
                'bestVariation': best_variation_index
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': f'Face verification failed - confidence {best_match_similarity:.2f} below threshold {threshold:.2f}',
                'match': False,
                'confidence': float(best_match_similarity) if best_match else 0
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
        
        # Convert base64 image to PIL Image
        image = base64_to_image(data['image'])
        
        # Generate image hash
        image_hash = image_to_hash(image)
        
        # Find the user's registered face
        user_face = face_collection.find_one({'userId': data['userId']})
        
        if not user_face:
            return jsonify({
                'success': False,
                'message': f'No face registered for user {data["userId"]}',
                'warning': 'not_registered'
            }), 200
        
        # Simple string comparison
        if user_face['faceHash'] == image_hash:
            similarity = 1.0  # Perfect match
        else:
            # Count matching characters as a simple similarity measure
            matching_chars = sum(c1 == c2 for c1, c2 in zip(user_face['faceHash'], image_hash))
            similarity = matching_chars / len(image_hash)
        
        # Threshold for considering it a match (0.8 is arbitrary for this simple method)
        threshold = 0.8
        
        response_data = {}
        
        if similarity >= threshold:
            response_data = {
                'success': True,
                'message': 'Face match confirmed',
                'match': True,
                'confidence': float(similarity)
            }
        else:
            response_data = {
                'success': False,
                'message': 'Different person detected',
                'warning': 'different_person',
                'match': False,
                'confidence': float(similarity)
            }
        
        # Ensure all values are JSON serializable
        for key in response_data:
            if isinstance(response_data[key], bool):
                response_data[key] = bool(response_data[key])
            elif response_data[key] is None:
                response_data[key] = "null"
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error in monitor_face: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing request: {str(e)}',
            'warning': 'processing_error'
        }), 500

@app.route('/detect-movement', methods=['POST'])
def detect_movement():
    """Detect head movement between frames using improved image comparison"""
    try:
        data = request.json
        
        if not data or 'image' not in data or 'sessionId' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required fields: image and sessionId'
            }), 400
        
        session_id = data['sessionId']
        
        # Convert base64 image to PIL Image
        current_image = base64_to_image(data['image'])
        
        # Check if face is present in the image (basic check)
        if current_image.size[0] < 10 or current_image.size[1] < 10:
            return jsonify({
                'success': False,
                'message': 'Invalid image or no face detected',
                'warning': 'face_missing'
            }), 200
        
        # Initialize response data
        response_data = {
            'success': True,
            'movement': 0.0,
            'movementDetected': False,
            'warning': None,
            'consecutiveMovements': 0
        }
        
        # Initialize movement history for this session if it doesn't exist
        if session_id not in recent_movements:
            recent_movements[session_id] = []
        
        # Check if we have previous data for this session
        if session_id in face_data_cache:
            prev_image = face_data_cache[session_id]['image']
            
            # Compare current and previous images using the improved method
            similarity = compare_images(current_image, prev_image)
            
            # Calculate movement (1 - similarity)
            movement = 1.0 - similarity
            
            # Add current movement to history
            recent_movements[session_id].append(movement)
            
            # Keep only the most recent N movements
            if len(recent_movements[session_id]) > MOVEMENT_HISTORY_SIZE:
                recent_movements[session_id] = recent_movements[session_id][-MOVEMENT_HISTORY_SIZE:]
            
            # Calculate average movement over recent history for stability
            avg_movement = sum(recent_movements[session_id]) / len(recent_movements[session_id])
            
            # Apply moderate smoothing
            smoothed_movement = 0.4 * movement + 0.6 * avg_movement
            
            # Check if movement exceeds threshold
            is_movement_detected = smoothed_movement > MOVEMENT_THRESHOLD
            
            # Add a moderate time between detections
            current_time = datetime.now()
            last_detection_time = face_data_cache[session_id].get('last_detection_time')
            
            # Only count as movement if enough time has passed since last detection (1 second)
            if last_detection_time and (current_time - last_detection_time).total_seconds() < 1.0:
                is_movement_detected = False
            
            # Update consecutive movement count
            if is_movement_detected:
                if session_id in movement_counts:
                    movement_counts[session_id] += 1
                else:
                    movement_counts[session_id] = 1
                # Record the detection time
                face_data_cache[session_id]['last_detection_time'] = current_time
            else:
                # Gradually decrease the count
                if session_id in movement_counts and movement_counts[session_id] > 0:
                    movement_counts[session_id] -= 0.5
                    if movement_counts[session_id] < 0:
                        movement_counts[session_id] = 0
                else:
                    movement_counts[session_id] = 0
            
            # Check if consecutive movements exceed the maximum allowed
            consecutive_movements = movement_counts.get(session_id, 0)
            if consecutive_movements >= MAX_CONSECUTIVE_MOVEMENTS:
                response_data['warning'] = 'excessive_movement'
                # Reset counter after warning
                movement_counts[session_id] = 0
            
            # Update response data - ensure all values are JSON serializable
            response_data['movement'] = float(smoothed_movement)
            response_data['rawMovement'] = float(movement)
            response_data['avgMovement'] = float(avg_movement)
            response_data['movementDetected'] = bool(is_movement_detected)
            response_data['consecutiveMovements'] = int(consecutive_movements)
            response_data['threshold'] = float(MOVEMENT_THRESHOLD)
            
            # Add debug info
            response_data['debug'] = {
                'historySize': len(recent_movements[session_id]),
                'threshold': MOVEMENT_THRESHOLD,
                'maxConsecutive': MAX_CONSECUTIVE_MOVEMENTS,
                'similarity': float(similarity),
                'timeSinceLastDetection': (current_time - last_detection_time).total_seconds() if last_detection_time else None
            }
        
        # Store current data for next comparison
        face_data_cache[session_id] = {
            'image': current_image,
            'timestamp': datetime.now().isoformat(),
            'last_detection_time': face_data_cache.get(session_id, {}).get('last_detection_time')
        }
        
        # Clean up old sessions (optional)
        if len(face_data_cache) > 1000:
            # Get sessions older than 1 hour
            current_time = datetime.now()
            old_sessions = []
            for sess_id, data in face_data_cache.items():
                if sess_id != session_id:
                    try:
                        timestamp = datetime.fromisoformat(data['timestamp'])
                        if (current_time - timestamp).total_seconds() > 3600:
                            old_sessions.append(sess_id)
                    except:
                        old_sessions.append(sess_id)
            
            # Remove old sessions
            for sess_id in old_sessions:
                face_data_cache.pop(sess_id, None)
                movement_counts.pop(sess_id, None)
                if sess_id in recent_movements:
                    recent_movements.pop(sess_id, None)
        
        # Convert any None values to null for JSON compatibility
        for key in response_data:
            if response_data[key] is None:
                response_data[key] = "null"
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error in detect_movement: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing request: {str(e)}',
            'warning': 'processing_error'
        }), 500

@app.route('/check-multiple-faces', methods=['POST'])
def check_multiple_faces():
    """Check if multiple faces are present in the image"""
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required field: image'
            }), 400
        
        # Convert base64 image to PIL Image
        image = base64_to_image(data['image'])
        
        # In a simplified version, we can't reliably detect multiple faces
        # This would require a face detection library like face_recognition
        # For now, we'll return a placeholder response
        
        response_data = {
            'success': True,
            'multipleFaces': False,
            'message': 'Multiple face detection not available in simplified version'
        }
        
        # Ensure all values are JSON serializable
        for key in response_data:
            if isinstance(response_data[key], bool):
                response_data[key] = bool(response_data[key])
            elif response_data[key] is None:
                response_data[key] = "null"
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error in check_multiple_faces: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing request: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 