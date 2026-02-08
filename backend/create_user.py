import requests

url = "http://localhost:8000/auth/register"
data = {"email": "test@example.com", "password": "password123"}
try:
    response = requests.post(url, json=data)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(e)
