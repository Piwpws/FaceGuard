import requests
import json

data = {
    "firstName": "Test",
    "lastName": "User",
    "role": "Student",
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg==", "data:image/jpeg;base64,/9j/4AAQSkZJRg==", "data:image/jpeg;base64,/9j/4AAQSkZJRg=="]
}

try:
    response = requests.post("http://localhost:8000/api/enrollment/enroll", json=data)
    print("Status:", response.status_code)
    print("Response JSON:", response.text)
except Exception as e:
    print("Exception:", str(e))
