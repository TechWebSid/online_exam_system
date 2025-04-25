from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import spacy
import os
from dotenv import load_dotenv
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# MongoDB connection
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/exam_system')
client = MongoClient(mongo_uri)
db = client.get_database()
faq_collection = db.faq

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_md")
    print("SpaCy model loaded successfully")
except OSError:
    print("Downloading SpaCy model...")
    os.system("python -m spacy download en_core_web_md")
    nlp = spacy.load("en_core_web_md")
    print("SpaCy model loaded successfully")

# Preprocess text
def preprocess_text(text):
    # Convert to lowercase and process with spaCy
    doc = nlp(text.lower().strip())
    
    # Remove stopwords and punctuation
    tokens = [token.text for token in doc if not token.is_stop and not token.is_punct]
    
    return " ".join(tokens)

# Calculate similarity between two texts
def calculate_similarity(text1, text2):
    # Get vector representations
    doc1 = nlp(text1)
    doc2 = nlp(text2)
    
    # Calculate cosine similarity
    return doc1.similarity(doc2)

# Find best matching question
def find_best_match(user_question, stored_questions):
    best_match = None
    highest_similarity = 0
    
    # Preprocess user question
    processed_user_question = preprocess_text(user_question)
    
    # Store all matches and their scores for debugging
    all_matches = []
    
    for question_data in stored_questions:
        stored_question = question_data["question"]
        processed_stored_question = preprocess_text(stored_question)
        
        # Calculate similarity
        similarity = calculate_similarity(processed_user_question, processed_stored_question)
        
        # Store this match and score
        all_matches.append({
            "question": stored_question,
            "similarity": similarity
        })
        
        if similarity > highest_similarity:
            highest_similarity = similarity
            best_match = question_data
    
    # Sort matches by similarity for debugging
    all_matches.sort(key=lambda x: x["similarity"], reverse=True)
    
    # Print top 3 matches for debugging
    print("\nUser Question:", user_question)
    print("Top matches:")
    for i, match in enumerate(all_matches[:3]):
        print(f"{i+1}. {match['question']} (Similarity: {match['similarity']:.2f})")
    
    # Return best match if similarity is above threshold (lowered from 0.8 to 0.7)
    if highest_similarity >= 0.7:
        print(f"Best match found: {best_match['question']} (Similarity: {highest_similarity:.2f})")
        return best_match, highest_similarity
    else:
        print(f"No good match found. Highest similarity: {highest_similarity:.2f}")
        return None, highest_similarity

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    user_question = data.get('question', '')
    
    if not user_question:
        return jsonify({
            'success': False,
            'message': 'Question is required'
        }), 400
    
    # Get all questions from MongoDB
    stored_questions = list(faq_collection.find())
    
    # Find best match
    best_match, similarity = find_best_match(user_question, stored_questions)
    
    if best_match:
        return jsonify({
            'success': True,
            'answer': best_match['answer'],
            'similarity': float(similarity),
            'matched_question': best_match['question']
        })
    else:
        return jsonify({
            'success': False,
            'answer': 'Contact the administrator for more information.',
            'similarity': float(similarity)
        })

@app.route('/api/faq', methods=['GET'])
def get_all_faqs():
    faqs = list(faq_collection.find({}, {'_id': 0}))
    return jsonify({
        'success': True,
        'data': faqs
    })

@app.route('/api/faq', methods=['POST'])
def add_faq():
    data = request.json
    question = data.get('question', '')
    answer = data.get('answer', '')
    
    if not question or not answer:
        return jsonify({
            'success': False,
            'message': 'Question and answer are required'
        }), 400
    
    # Insert new FAQ
    faq_collection.insert_one({
        'question': question,
        'answer': answer
    })
    
    return jsonify({
        'success': True,
        'message': 'FAQ added successfully'
    })

@app.route('/api/faq/<question_id>', methods=['PUT'])
def update_faq(question_id):
    data = request.json
    question = data.get('question', '')
    answer = data.get('answer', '')
    
    if not question or not answer:
        return jsonify({
            'success': False,
            'message': 'Question and answer are required'
        }), 400
    
    # Update FAQ
    result = faq_collection.update_one(
        {'_id': question_id},
        {'$set': {'question': question, 'answer': answer}}
    )
    
    if result.modified_count > 0:
        return jsonify({
            'success': True,
            'message': 'FAQ updated successfully'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'FAQ not found'
        }), 404

@app.route('/api/faq/<question_id>', methods=['DELETE'])
def delete_faq(question_id):
    # Delete FAQ
    result = faq_collection.delete_one({'_id': question_id})
    
    if result.deleted_count > 0:
        return jsonify({
            'success': True,
            'message': 'FAQ deleted successfully'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'FAQ not found'
        }), 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Chatbot server is running'
    })

if __name__ == '__main__':
    # Create indexes for faster retrieval
    faq_collection.create_index([('question', 'text')])
    
    # Add some initial FAQs if collection is empty
    if faq_collection.count_documents({}) == 0:
        initial_faqs = [
            # Certificate Questions
            {
                'question': 'Will I get a certificate after the exam?',
                'answer': 'Yes, you will receive a certificate if you pass the exam!'
            },
            {
                'question': 'How can I download my certificate?',
                'answer': 'You can download your certificate from your profile page after passing an exam. Look for the "View Certificate" button next to your passed exams.'
            },
            {
                'question': 'Can I print my certificate?',
                'answer': 'Yes, after downloading your certificate as a PDF, you can print it or share it digitally as needed.'
            },
            {
                'question': 'Is the certificate valid internationally?',
                'answer': 'Our certificates are recognized by many institutions, but please check with your specific organization about their acceptance policies.'
            },
            
            # Exam Format Questions
            {
                'question': 'What is the format of the exams?',
                'answer': 'Our exams are multiple-choice questions (MCQs) with four options per question. Each exam has a specific number of questions and time limit.'
            },
            {
                'question': 'How many questions are in each exam?',
                'answer': 'The number of questions varies by exam, but most exams contain 5-10 questions. You can see the exact number on the exam details page.'
            },
            {
                'question': 'What is the passing score for exams?',
                'answer': 'The passing score is 60% for most exams. Each exam may have different requirements, which are displayed on the exam details page.'
            },
            
            # Retake Questions
            {
                'question': 'Can I retake an exam if I fail?',
                'answer': 'Yes, you can retake exams, but there may be a limit on the number of attempts. Check the exam details for specific retake policies.'
            },
            {
                'question': 'Is there a waiting period before retaking an exam?',
                'answer': 'There is typically a 24-hour waiting period before you can retake an exam. This gives you time to review and prepare better.'
            },
            
            # Monitoring Questions
            {
                'question': 'How is the exam monitored?',
                'answer': 'Exams are monitored using face detection technology to prevent cheating. The system tracks your face during the exam and flags suspicious activities.'
            },
            {
                'question': 'What happens if I look away from the screen during the exam?',
                'answer': 'If you look away from the screen for too long, the system will issue warnings. Multiple warnings may result in exam termination.'
            },
            {
                'question': 'Can I use multiple monitors during the exam?',
                'answer': 'No, using multiple monitors is not allowed during exams. The system is designed to work with a single screen.'
            },
            
            # Technical Questions
            {
                'question': 'What browsers are supported for taking exams?',
                'answer': 'We recommend using the latest versions of Chrome, Firefox, or Edge. Safari may have limited compatibility with some features.'
            },
            {
                'question': 'Do I need a webcam for the exam?',
                'answer': 'Yes, a working webcam is required for all exams as it\'s used for identity verification and proctoring.'
            },
            {
                'question': 'What happens if my internet disconnects during the exam?',
                'answer': 'The system will try to save your progress. If you can reconnect quickly, you may be able to continue. For longer disconnections, contact support.'
            },
            
            # Time-related Questions
            {
                'question': 'How much time do I have to complete an exam?',
                'answer': 'Each exam has a specific time limit, typically 15-30 minutes. The time remaining is displayed during the exam.'
            },
            {
                'question': 'Can I pause the exam and continue later?',
                'answer': 'No, once you start an exam, the timer continues running. You should complete it in one sitting.'
            },
            {
                'question': 'What happens if I run out of time?',
                'answer': 'If you run out of time, the exam will automatically submit with your current answers. Unanswered questions will be marked as incorrect.'
            },
            
            # Content Questions
            {
                'question': 'How should I prepare for the exams?',
                'answer': 'Review the subject materials thoroughly, take practice quizzes if available, and ensure you understand the core concepts of the subject.'
            },
            {
                'question': 'Are the questions randomized?',
                'answer': 'Yes, questions are typically randomized for each attempt to ensure exam integrity.'
            },
            
            # Account Questions
            {
                'question': 'How do I reset my password?',
                'answer': 'You can reset your password by clicking on the "Forgot Password" link on the login page and following the instructions sent to your email.'
            },
            {
                'question': 'Can I change my email address?',
                'answer': 'Yes, you can update your email address in your profile settings. You may need to verify the new email address.'
            },
            
            # Results Questions
            {
                'question': 'When will I get my exam results?',
                'answer': 'Exam results are displayed immediately after you submit your exam.'
            },
            {
                'question': 'Where can I see my past exam results?',
                'answer': 'You can view all your past exam results in your profile page under the "Exam History" section.'
            },
            {
                'question': 'Can I review my answers after the exam?',
                'answer': 'Yes, after completing an exam, you can review your answers, see which ones were correct or incorrect, and learn from your mistakes.'
            }
        ]
        faq_collection.insert_many(initial_faqs)
        print(f"Added {len(initial_faqs)} initial FAQs to the database")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5002, debug=True) 