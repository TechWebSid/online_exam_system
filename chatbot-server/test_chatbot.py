import requests
import json

# Configuration
API_URL = "http://localhost:5002/api"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{API_URL}/health")
    data = response.json()
    
    print("Health Check:")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(data, indent=2)}")
    print()
    
    return response.status_code == 200

def test_chatbot(question):
    """Test the chatbot endpoint with a question"""
    response = requests.post(
        f"{API_URL}/chatbot",
        json={"question": question}
    )
    data = response.json()
    
    print(f"Question: {question}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(data, indent=2)}")
    print()
    
    return response.status_code == 200

def test_faq_list():
    """Test the FAQ list endpoint"""
    response = requests.get(f"{API_URL}/faq")
    data = response.json()
    
    print("FAQ List:")
    print(f"Status: {response.status_code}")
    print(f"Number of FAQs: {len(data.get('data', []))}")
    print()
    
    return response.status_code == 200

def main():
    """Run all tests"""
    print("=== Chatbot API Test ===\n")
    
    # Test health endpoint
    if not test_health():
        print("Health check failed. Make sure the server is running.")
        return
    
    # Test FAQ list
    test_faq_list()
    
    # Test chatbot with various questions
    test_questions = [
        "Will I get a certificate after passing the exam?",
        "How do I download my certificate?",
        "What's the passing score?",
        "Can I take the exam again if I fail?",
        "How is cheating prevented?",
        "This is a completely unrelated question about pizza"
    ]
    
    for question in test_questions:
        test_chatbot(question)
    
    print("=== Test Complete ===")

if __name__ == "__main__":
    main() 