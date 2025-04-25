# Exam System Chatbot Guide

This guide explains how to set up, run, and use the chatbot system for the online examination platform.

## Overview

The chatbot system consists of two main components:

1. **Backend Server**: A Flask API that handles NLP processing and MongoDB integration
2. **Frontend Component**: A React component that provides the chat interface

The chatbot uses natural language processing (NLP) to understand user questions and provide relevant answers from a database of FAQs.

## Setup Instructions

### 1. Set Up the Backend Server

#### Prerequisites
- Python 3.7 or higher
- MongoDB installed and running
- pip (Python package manager)

#### Installation Steps

1. Navigate to the chatbot server directory:
   ```bash
   cd chatbot-server
   ```

2. Run the setup script to install dependencies and download the spaCy model:
   - On Windows:
     ```bash
     setup.bat
     ```
   - On Linux/Mac:
     ```bash
     chmod +x setup.sh
     ./setup.sh
     ```

3. Start the chatbot server:
   - On Windows:
     ```bash
     run.bat
     ```
   - On Linux/Mac:
     ```bash
     python app.py
     ```

4. Verify the server is running by accessing:
   ```
   http://localhost:5002/health
   ```

### 2. Configure the Frontend

1. Make sure the `.env.local` file in the root directory contains:
   ```
   NEXT_PUBLIC_CHATBOT_URL=http://localhost:5002/api
   ```

2. The chatbot component is already integrated into the student dashboard layout.

## Using the Chatbot

### For Students

1. Log in to your student account
2. Navigate to the student dashboard
3. Click the chat icon in the bottom-right corner to open the chatbot
4. Type your question and press Enter or click the send button
5. The chatbot will respond with the most relevant answer from its knowledge base

### For Administrators

1. Log in to your admin account
2. Navigate to Admin Dashboard > FAQ Management
3. Here you can:
   - View all existing FAQs
   - Add new FAQs
   - Edit existing FAQs
   - Delete FAQs

## Managing FAQs

### Adding New FAQs

1. Go to the FAQ Management page
2. Fill in the "Question" and "Answer" fields
3. Click "Add FAQ"

### Editing FAQs

1. Find the FAQ you want to edit
2. Click the "Edit" button
3. Modify the question and/or answer
4. Click "Save"

### Deleting FAQs

1. Find the FAQ you want to delete
2. Click the "Delete" button
3. Confirm the deletion

## How the Chatbot Works

1. When a user asks a question, the frontend sends it to the backend API
2. The backend processes the question using spaCy's NLP capabilities
3. It compares the processed question with all stored questions using cosine similarity
4. If a match with similarity > 80% is found, it returns the corresponding answer
5. If no good match is found, it returns a default message

## Testing the Chatbot

You can test the chatbot functionality using the provided test script:

```bash
cd chatbot-server
python test_chatbot.py
```

This will run a series of test questions and display the responses.

## Troubleshooting

### Chatbot Server Won't Start

1. Check if MongoDB is running
2. Verify that all dependencies are installed
3. Check the console for error messages

### Chatbot Not Responding

1. Verify the chatbot server is running
2. Check the browser console for any errors
3. Ensure the `NEXT_PUBLIC_CHATBOT_URL` environment variable is set correctly

### Poor Answer Quality

If the chatbot is not providing good answers:

1. Add more FAQs to cover common questions
2. Rephrase existing questions to better match how users ask them
3. Consider lowering the similarity threshold in `app.py` (default is 0.8)

## Extending the Chatbot

### Adding More Features

You can extend the chatbot by:

1. Adding user feedback for answers
2. Implementing conversation history
3. Adding more sophisticated NLP techniques
4. Integrating with external knowledge bases

### Customizing the UI

The chatbot UI can be customized by modifying the `components/Chatbot.js` file. 