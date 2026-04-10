from fastapi import APIRouter, HTTPException
from database import supabase
from datetime import datetime

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats():
    if not supabase:
        return {"error": "Database not configured"}
        
    try:
        # Total Enrolled (active users only)
        enrollees_res = supabase.table("enrollees").select("id, role, face_encodings").execute()
        active_enrollees = []
        for e in enrollees_res.data:
            encodings = e.get("face_encodings")
            if encodings and len(encodings) > 0:
                active_enrollees.append(e)
                
        total_enrolled = len(active_enrollees)
        
        # Today's attendance
        today_str = datetime.now().date().isoformat()
        att_res = supabase.table("attendance_logs").select("enrollee_id, enrollees(role)").eq("date", today_str).execute()
        
        unique_present_today = set()
        students_present = 0
        present_today = 0
        
        for a in att_res.data:
            eid = a['enrollee_id']
            if eid not in unique_present_today:
                unique_present_today.add(eid)
                present_today += 1
                if a.get('enrollees', {}).get('role') == 'Student':
                    students_present += 1

        non_students_present = present_today - students_present
        
        attendance_rate = 0
        if total_enrolled > 0:
             attendance_rate = round((present_today / total_enrolled) * 100)
             
        # Recent attendees (last 5 logs) for today
        recent_res = supabase.table("attendance_logs")\
            .select("id, enrollee_id, time_in, enrollees(first_name, last_name, role)")\
            .eq("date", today_str)\
            .order("time_in", desc=True)\
            .limit(5)\
            .execute()
            
        recent = []
        # Calculate if it's considered a time out by checking chronological order
        # For simplicity in stats, we just show the scan time and say "Scanned"
        for r in recent_res.data:
            user = r.get('enrollees', {})
            recent.append({
                "id": r['id'],
                "name": f"{user.get('first_name')} {user.get('last_name')}",
                "role": user.get('role'),
                "time": r['time_in'],
                "status": "Scanned"
            })
            
        return {
            "totalEnrolled": total_enrolled,
            "presentToday": present_today,
            "attendanceRate": attendance_rate,
            "studentsPresent": students_present,
            "nonStudentsPresent": non_students_present,
            "recentAttendees": recent
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports")
async def get_reports():
    if not supabase:
        return {"error": "Database not configured"}
        
    # fetch all reports
    reports_res = supabase.table("attendance_logs").select("id, enrollee_id, date, time_in, enrollees(first_name, last_name, role)").order("date", desc=True).limit(500).execute()
    
    grouped = {}
    for r in reports_res.data:
        user = r.get('enrollees', {})
        if not user:
             continue
        key = (r['enrollee_id'], r['date'])
        if key not in grouped:
            grouped[key] = {
                "id": r['id'],
                "name": f"{user.get('first_name')} {user.get('last_name')}",
                "role": user.get('role'),
                "date": r['date'],
                "scans": []
            }
        grouped[key]["scans"].append(r['time_in'])
        
    formatted = []
    for g in grouped.values():
        scans = sorted(g["scans"])
        time_in = scans[0]
        time_out = scans[-1] if len(scans) > 1 else "--"
        
        formatted.append({
            "id": g["id"],
            "name": g["name"],
            "role": g["role"],
            "date": g["date"],
            "timeIn": time_in,
            "timeOut": time_out,
            "status": "Present"
        })
        
    formatted.sort(key=lambda x: (x['date'], x['timeIn']), reverse=True)
    return formatted

@router.get("/logs")
async def get_logs():
    if not supabase:
        return {"error": "Database not configured"}
        
    # fetch all raw chronological logs
    logs_res = supabase.table("attendance_logs").select("id, date, time_in, enrollees(first_name, last_name, role)").order("time_in", desc=True).limit(200).execute()
    
    formatted = []
    for r in logs_res.data:
        user = r.get('enrollees', {})
        if not user:
             continue
        formatted.append({
            "id": r['id'],
            "name": f"{user.get('first_name')} {user.get('last_name')}",
            "role": user.get('role'),
            "timeIn": r['time_in']
        })
    return formatted
