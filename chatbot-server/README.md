# Exam System Chatbot Server

This is a Flask-based chatbot server that uses NLP to answer common questions about the exam system. It uses spaCy for natural language processing and MongoDB for storing FAQ data.

## Features

- NLP-based similarity matching for questions
- MongoDB integration for storing Q&A pairs
- RESTful API for chatbot interactions
- Admin interface for managing FAQs

## Setup

1. Install the required packages:

```bash
pip install -r requirements.txt
```

2. Download the spaCy model:

```bash
python -m spacy download en_core_web_md
```

3. Set up MongoDB:
   - Make sure MongoDB is running on your system
   - The default connection string is `mongodb://localhost:27017/exam_system`
   - You can customize the connection string by setting the `MONGO_URI` environment variable

4. Run the server:

```bash
python app.py
```

The server will run on port 5002 by default.

## API Endpoints

- `POST /api/chatbot`: Send a question to the chatbot
  - Request body: `{ "question": "your question here" }`
  - Response: `{ "success": true, "answer": "answer text", "similarity": 0.85, "matched_question": "original question" }`

- `GET /api/faq`: Get all FAQs
  - Response: `{ "success": true, "data": [{ "question": "...", "answer": "..." }, ...] }`

- `POST /api/faq`: Add a new FAQ
  - Request body: `{ "question": "...", "answer": "..." }`
  - Response: `{ "success": true, "message": "FAQ added successfully" }`

- `PUT /api/faq/:id`: Update an existing FAQ
  - Request body: `{ "question": "...", "answer": "..." }`
  - Response: `{ "success": true, "message": "FAQ updated successfully" }`

- `DELETE /api/faq/:id`: Delete an FAQ
  - Response: `{ "success": true, "message": "FAQ deleted successfully" }`

- `GET /health`: Health check endpoint
  - Response: `{ "status": "ok", "message": "Chatbot server is running" }`

## How It Works

1. The chatbot uses spaCy's word embeddings to convert questions into vector representations
2. When a user asks a question, it's compared with all stored questions using cosine similarity
3. If a match with similarity > 80% is found, the corresponding answer is returned
4. If no match is found, a default message is returned

## Initial FAQs

The server comes with some initial FAQs about the exam system:
- Certificate availability
- Certificate download process
- Passing scores
- Exam retake policy
- Exam monitoring 