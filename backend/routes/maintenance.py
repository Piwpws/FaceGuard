from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
import cv2
import base64
import face_recognition
from database import supabase

router = APIRouter()

class UpdateProfileData(BaseModel):
    firstName: str
    lastName: str
    role: str

class ReEnrollData(BaseModel):
    images: List[str]

def decode_base64_image(base64_string):
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@router.get("/enrollees")
async def get_all_enrollees():
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not configured.")
    
    try:
        response = supabase.table("enrollees").select("id_number, first_name, last_name, role, created_at").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/enrollees/{id_number}")
async def update_enrollee_profile(id_number: str, data: UpdateProfileData):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not configured.")
        
    try:
        db_data = {
            "first_name": data.firstName,
            "last_name": data.lastName,
            "role": data.role
        }
        response = supabase.table("enrollees").update(db_data).eq("id_number", id_number).execute()
        
        if len(response.data) == 0:
             raise HTTPException(status_code=404, detail="Enrollee not found.")
             
        return {"status": "success", "message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/enrollees/{id_number}/re-enroll")
async def re_enroll_user(id_number: str, data: ReEnrollData):
    if len(data.images) < 3:
        raise HTTPException(status_code=400, detail="Please provide exactly 3 images.")
    
    encodings = []
    
    for idx, b64_img in enumerate(data.images):
        img = decode_base64_image(b64_img)
        if img is None:
            raise HTTPException(status_code=400, detail=f"Image {idx+1} could not be decoded.")
        
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        faces = face_recognition.face_locations(rgb_img)
        if len(faces) == 0:
            raise HTTPException(status_code=400, detail=f"No face found in image {idx+1}. Please retake.")
        if len(faces) > 1:
             raise HTTPException(status_code=400, detail=f"Multiple faces found in image {idx+1}. Please ensure only one face is visible.")
            
        encoding = face_recognition.face_encodings(rgb_img, faces)[0]
        encodings.append(encoding.tolist())
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not configured.")
        
    try:
        response = supabase.table("enrollees").update({"face_encodings": encodings}).eq("id_number", id_number).execute()
        
        if len(response.data) == 0:
             raise HTTPException(status_code=404, detail="Enrollee not found.")
             
        return {"status": "success", "message": "Images re-enrolled successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/enrollees/{id_number}")
async def delete_enrollee(id_number: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not configured.")
        
    try:
        response = supabase.table("enrollees").delete().eq("id_number", id_number).execute()
        
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Enrollee not found.")
            
        return {"status": "success", "message": "Record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
