import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection parameters
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
db_name = os.getenv('DB_NAME', 'exam-system')
collection_name = os.getenv('COLLECTION_NAME', 'face_data')

# Create MongoDB client
client = MongoClient(mongo_uri)
db = client[db_name]
face_collection = db[collection_name]

def initialize_db():
    """Initialize database with indexes"""
    # Create index on userId for faster queries
    face_collection.create_index('userId', unique=True)
    print(f"Database initialized: {db_name}.{collection_name}")

def get_face_by_user_id(user_id):
    """Get face data by user ID"""
    return face_collection.find_one({'userId': user_id})

def save_face_data(user_id, name, face_encoding):
    """Save face data to database"""
    # Check if user already exists
    existing_face = get_face_by_user_id(user_id)
    
    if existing_face:
        # Update existing face data
        result = face_collection.update_one(
            {'userId': user_id},
            {
                '$set': {
                    'faceEncoding': face_encoding,
                    'name': name
                }
            }
        )
        return result.modified_count > 0, 'updated'
    else:
        # Insert new face data
        result = face_collection.insert_one({
            'userId': user_id,
            'name': name,
            'faceEncoding': face_encoding,
            'isVerified': False,
            'registeredAt': None,
            'lastVerifiedAt': None,
            'verificationCount': 0
        })
        return result.inserted_id is not None, 'inserted'

def get_all_faces():
    """Get all face data"""
    return list(face_collection.find())

def update_verification_status(face_id, verified=True):
    """Update verification status"""
    return face_collection.update_one(
        {'_id': face_id},
        {
            '$set': {
                'isVerified': verified,
                'lastVerifiedAt': None
            },
            '$inc': {
                'verificationCount': 1
            }
        }
    )

def delete_face(user_id):
    """Delete face data"""
    return face_collection.delete_one({'userId': user_id})

# Initialize database when module is imported
if __name__ == '__main__':
    initialize_db()
    print("Database utility initialized") 