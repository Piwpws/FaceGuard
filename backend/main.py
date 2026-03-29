from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import enrollment, scanning, dashboard, maintenance

app = FastAPI(title="Facial Recognition Attendance API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enrollment.router, prefix="/api/enrollment", tags=["Enrollment"])
app.include_router(scanning.router, prefix="/api/scanning", tags=["Scanning"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["Maintenance"])

@app.get("/")
def read_root():
    return {"message": "Face Attendance API is running."}
