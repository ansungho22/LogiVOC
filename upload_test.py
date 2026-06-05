import requests
import time
import sys

base_url = "http://localhost:8000/api/v1"

def login():
    res = requests.post(f"{base_url}/auth/login", data={"username": "admin", "password": "admin"})
    res.raise_for_status()
    return res.json()["access_token"]

def upload_file(token, file_path):
    headers = {"Authorization": f"Bearer {token}"}
    with open(file_path, "rb") as f:
        files = {"file": f}
        # Send data payload. Using generic category and prompt.
        data = {
            "prompt": "데이터를 구조화하고 중복을 제거해줘",
            "new_category": "테스트 데이터"
        }
        res = requests.post(f"{base_url}/files/upload", headers=headers, files=files, data=data)
        res.raise_for_status()
        return res.json()["task_id"]

def check_task(token, task_id):
    headers = {"Authorization": f"Bearer {token}"}
    while True:
        res = requests.get(f"{base_url}/tasks/{task_id}", headers=headers)
        res.raise_for_status()
        status = res.json()["status"]
        if status in ["SUCCESS", "FAILED"]:
            return res.json()
        print(f"Task {task_id} status: {status}...")
        time.sleep(2)

def main():
    files_to_upload = [
        "/Users/horange/Downloads/OG0605_20221128_장애처리매뉴얼_스마트멀티인증플랫폼_v1.0.xlsx",
        "/Users/horange/Downloads/OG0609_20250310_장애처리매뉴얼_유무선통합결제_v1.35_수정.xlsx",
        "/Users/horange/Downloads/PG0339_20250325_장애처리매뉴얼_SMSVAS_수정.xlsx"
    ]
    
    try:
        token = login()
        print("Logged in successfully.")
    except Exception as e:
        print("Login failed:", e)
        return

    for fp in files_to_upload:
        print(f"\nUploading {fp}...")
        try:
            task_id = upload_file(token, fp)
            print(f"Upload successful. Task ID: {task_id}")
            print("Waiting for processing to complete...")
            result = check_task(token, task_id)
            print(f"Task {task_id} finished with status: {result['status']}")
            if result['status'] == 'FAILED':
                print("Error:", result.get("error"))
        except Exception as e:
            print(f"Failed to process {fp}:", e)

if __name__ == "__main__":
    main()
