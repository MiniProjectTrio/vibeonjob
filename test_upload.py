import requests

files = {'resume': ('test.pdf', b'fake pdf content', 'application/pdf')}
data = {'job_description': 'Looking for a Python developer.'}
response = requests.post('http://127.0.0.1:8000/api/analyze', files=files, data=data)
print(response.status_code)
print(response.text)
