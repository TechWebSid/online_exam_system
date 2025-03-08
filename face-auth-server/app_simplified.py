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
    """Compare two images directly and return similarity score"""
    # Resize images to ensure consistent comparison
    img1 = img1.resize((64, 64))  # Increased resolution for better discrimination
    img2 = img2.resize((64, 64))
    
    # Convert to grayscale
    img1 = img1.convert('L')
    img2 = img2.convert('L')
    
    # Apply some blur to reduce noise (reduced radius for better detail preservation)
    img1 = img1.filter(ImageFilter.GaussianBlur(radius=1))
    img2 = img2.filter(ImageFilter.GaussianBlur(radius=1))
    
    # Normalize the images to enhance contrast
    img1 = ImageOps.equalize(img1)
    img2 = ImageOps.equalize(img2)
    
    # Convert to numpy arrays
    arr1 = np.array(img1).flatten().astype(float)
    arr2 = np.array(img2).flatten().astype(float)
    
    # Normalize the arrays
    arr1 = arr1 / 255.0
    arr2 = arr2 / 255.0
    
    # Calculate mean squared error (lower is better)
    mse = np.mean((arr1 - arr2) ** 2)
    
    # Calculate structural similarity (higher is better)
    # This is a simplified version of SSIM
    mean1 = np.mean(arr1)
    mean2 = np.mean(arr2)
    var1 = np.var(arr1)
    var2 = np.var(arr2)
    covar = np.mean((arr1 - mean1) * (arr2 - mean2))
    
    # Constants to stabilize division
    C1 = 0.01 ** 2
    C2 = 0.03 ** 2
    
    # Calculate SSIM
    numerator = (2 * mean1 * mean2 + C1) * (2 * covar + C2)
    denominator = (mean1 ** 2 + mean2 ** 2 + C1) * (var1 + var2 + C2)
    ssim = numerator / denominator
    
    # Combine MSE and SSIM for a more robust similarity score
    # Convert MSE to similarity (higher is better)
    mse_similarity = 1.0 / (1.0 + mse)
    
    # Final similarity is weighted average of MSE similarity and SSIM
    # SSIM is given more weight as it's better at structural comparison
    similarity = 0.3 * mse_similarity + 0.7 * ssim
    
    print(f"Image comparison - MSE: {mse:.4f}, SSIM: {ssim:.4f}, Combined: {similarity:.4f}")
    
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
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Invalid image data: {str(e)}'
            }), 400
        
        # Generate image hash
        image_hash = image_to_hash(image)
        print(f"Generated hash for registration image: {image_hash[:10]}...")
        
        # Check if user already has a face registered
        existing_face = face_collection.find_one({'userId': data['userId']})
        
        # Store the original image data for better comparison later
        # In a production system, you might want to store this in a file system or object storage
        # For simplicity, we'll store it in the database
        image_data = data['image']  # Keep the base64 string
        
        if existing_face:
            # Update existing face data
            face_collection.update_one(
                {'userId': data['userId']},
                {
                    '$set': {
                        'faceHash': image_hash,
                        'imageData': image_data,  # Store the original image data
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
        
        for face_data in registered_faces:
            # First try hash comparison for quick match
            if face_data['faceHash'] == image_hash:
                similarity = 1.0  # Perfect match
                print(f"Perfect hash match found for user {face_data['userId']}")
            else:
                # If we have the stored image data, use direct image comparison
                if 'imageData' in face_data and face_data['imageData']:
                    try:
                        # Convert stored image data back to PIL Image
                        stored_image = base64_to_image(face_data['imageData'])
                        # Use direct image comparison
                        similarity = compare_images(image, stored_image)
                        print(f"Direct image comparison for user {face_data['userId']}: {similarity:.4f}")
                    except Exception as e:
                        print(f"Error comparing images: {str(e)}")
                        # Fallback to hash comparison
                        matching_chars = sum(c1 == c2 for c1, c2 in zip(face_data['faceHash'], image_hash))
                        similarity = matching_chars / len(image_hash)
                        print(f"Fallback to hash similarity for user {face_data['userId']}: {similarity:.4f}")
                else:
                    # Fallback to hash comparison
                    matching_chars = sum(c1 == c2 for c1, c2 in zip(face_data['faceHash'], image_hash))
                    similarity = matching_chars / len(image_hash)
                    print(f"Hash similarity for user {face_data['userId']}: {similarity:.4f}")
            
            if similarity > best_match_similarity:
                best_match_similarity = similarity
                best_match = face_data
        
        # Threshold for considering it a match - increased for better security
        # SSIM values above 0.7 typically indicate the same person
        threshold = 0.7
        
        print(f"Best match similarity: {best_match_similarity:.4f}, threshold: {threshold}")
        
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
                'confidence': float(best_match_similarity)
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
        
        if similarity >= threshold:
            return jsonify({
                'success': True,
                'message': 'Face match confirmed',
                'match': True,
                'confidence': float(similarity)
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Different person detected',
                'warning': 'different_person',
                'match': False,
                'confidence': float(similarity)
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