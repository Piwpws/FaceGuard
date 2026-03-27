from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
import cv2
import base64
import face_recognition
from database import supabase

router = APIRouter()

class EnrollmentData(BaseModel):
    firstName: str
    lastName: str
    role: str
    images: List[str] # base64 string images

def decode_base64_image(base64_string):
    # Depending on the webcam lib, it might have data:image/jpeg;base64, prefix
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@router.post("/enroll")
async def enroll_user(data: EnrollmentData):
    if len(data.images) < 3:
        raise HTTPException(status_code=400, detail="Please provide exactly 3 images.")
    
    encodings = []
    
    for idx, b64_img in enumerate(data.images):
        img = decode_base64_image(b64_img)
        if img is None:
            raise HTTPException(status_code=400, detail=f"Image {idx+1} could not be decoded.")
        
        # Convert BGR (OpenCV) to RGB (face_recognition)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Find faces
        faces = face_recognition.face_locations(rgb_img)
        if len(faces) == 0:
            raise HTTPException(status_code=400, detail=f"No face found in image {idx+1}. Please retake.")
        if len(faces) > 1:
             raise HTTPException(status_code=400, detail=f"Multiple faces found in image {idx+1}. Please ensure only one face is visible.")
            
        # Get encodings
        encoding = face_recognition.face_encodings(rgb_img, faces)[0]
        encodings.append(encoding.tolist())
    
    # We will store the list of 3 encodings as JSON string
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not configured.")
        
    try:
        # Generate ID Number logic
        import datetime, random
        year = datetime.datetime.now().year
        unique_num = random.randint(1000, 9999)
        id_number = f"{year}-{unique_num}"
        
        db_data = {
            "first_name": data.firstName,
            "last_name": data.lastName,
            "role": data.role,
            "id_number": id_number,
            "face_encodings": encodings
        }
        
        response = supabase.table("enrollees").insert(db_data).execute()
        return {"status": "success", "message": "User enrolled successfully", "id_number": id_number}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
