from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
import cv2
import base64
import face_recognition
from database import supabase
from datetime import datetime, timezone

router = APIRouter()

class ScanData(BaseModel):
    image: str

def decode_base64_image(base64_string):
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# Memory cache for today's logs to prevent spam and decide time_in / time_out
# In production, you'd use Redis or query Supabase directly for last interaction.
# Let's write robust logic using Supabase queries directly when a face is matched.

@router.post("/scan")
async def scan_face(data: ScanData):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not configured.")
        
    img = decode_base64_image(data.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")
        
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = face_recognition.face_locations(rgb_img)
    
    if len(faces) == 0:
        return {"status": "no_face"}
        
    # Take the largest face if multiple
    encoding_to_check = face_recognition.face_encodings(rgb_img, faces)[0]
    
    # Fetch all enrollees (in production, use an index filter or HNSW extension in PG)
    response = supabase.table("enrollees").select("*").execute()
    enrollees = response.data
    
    best_match_id = None
    best_match_dist = 1.0 # 0 is perfectly identical, 1.0 is totally different
    matched_user = None
    
    # Tolerance threshold for match
    TOLERANCE = 0.5 
    
    for emp in enrollees:
        stored_encodings = emp.get('face_encodings', [])
        # Compare distances for the 3 registered images
        if not stored_encodings:
             continue
             
        distances = face_recognition.face_distance(
            np.array(stored_encodings),
            np.array(encoding_to_check)
        )
        min_dist = np.min(distances)
        if min_dist < best_match_dist and min_dist <= TOLERANCE:
            best_match_dist = min_dist
            best_match_id = emp['id']
            matched_user = emp

    if best_match_id:
        # Log attendance logic
        today_str = datetime.now().date().isoformat()
        now_time = datetime.now(timezone.utc).isoformat()
        
        # Check if user already has an attendance log for today for UI message purposes
        log_response = supabase.table("attendance_logs")\
            .select("*")\
            .eq("enrollee_id", best_match_id)\
            .eq("date", today_str)\
            .execute()
            
        logs = log_response.data
        if len(logs) == 0:
            status_text = "TIME IN"
        else:
            status_text = "TIME OUT"
            
        # Always insert a new record for this scan event
        new_log = {
            "enrollee_id": best_match_id,
            "date": today_str,
            "time_in": now_time
        }
        res = supabase.table("attendance_logs").insert(new_log).execute()
            
        return {
            "status": "success",
            "action": status_text,
            "user": {
                "name": f"{matched_user['first_name']} {matched_user['last_name']}",
                "role": matched_user['role'],
                "time": datetime.now().strftime("%I:%M %p"),
                "date": datetime.now().strftime("%Y-%m-%d")
            }
        }
        
    return {"status": "unrecognized"}
