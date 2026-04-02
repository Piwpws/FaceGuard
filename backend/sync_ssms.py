import os
import pyodbc
from dotenv import load_dotenv
from database import supabase

# Load environment variables
load_dotenv()

def sync_names_from_ssms():
    server = os.environ.get("(localdb)\MSSQLLocalDB")
    database = os.environ.get("FaceTrackDB")
    username = os.environ.get("SSMS_USERNAME")
    password = os.environ.get("SSMS_PASSWORD")

    if not all([server, database]):
        print("Please set your SSMS_SERVER and SSMS_DATABASE in the .env file!")
        return

    print("Connecting to SSMS Database...")
    try:
        # Connection string for SQL Server. If you don't use a username/password due to Windows Authentication,
        # we can adjust this to use "Trusted_Connection=yes;".
        if username and password:
            conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
        else:
            # Assuming Windows Authentication if no username is provided
            conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;"

        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        print("Successfully connected to SSMS!")
    except pyodbc.Error as e:
        print("Failed to connect to SSMS. Error:")
        print(e)
        print("\nNote: Make sure your ODBC Driver is installed (e.g., 'ODBC Driver 17 for SQL Server')")
        return

    print("\nFetching records from dbo.students...")
    
    # Select our fields from SSMS
    try:
        cursor.execute("SELECT student_number, first_name, last_name FROM dbo.students")
        rows = cursor.fetchall()
        print(f"Found {len(rows)} students in SSMS.")
    except Exception as e:
        print("Error reading from dbo.students. Error:")
        print(e)
        return

    updated_count = 0
    not_found_count = 0

    print("\nSyncing with Supabase...")
    for row in rows:
        ssms_student_number = row.student_number
        first_name = row.first_name
        last_name = row.last_name
        
        # We need to strip the "IC" (or "-IC") from the SSMS student number so it perfectly matches the one in Supabase
        cleaned_number = ssms_student_number
        if isinstance(cleaned_number, str):
            if cleaned_number.upper().endswith("IC"):
                cleaned_number = cleaned_number[:-2].strip()
            if cleaned_number.endswith("-"):
                cleaned_number = cleaned_number[:-1].strip()

        # Because bulk_enroll.py accidentally inserted IDs with a trailing dash (e.g. "2025-0292-"),
        # we make sure to match that exact string when looking in Supabase.
        search_number = cleaned_number + "-" 

        # Update the record in Supabase where the id_number matches
        try:
            # First check if the student even exists in Supabase to avoid unnecessary error messages
            exist_check = supabase.table("enrollees").select("id").eq("id_number", search_number).execute()
            
            # If not found with dash, try without dash just in case
            if not exist_check.data:
                exist_check = supabase.table("enrollees").select("id").eq("id_number", cleaned_number).execute()
                if exist_check.data:
                    search_number = cleaned_number
            
            if exist_check.data and len(exist_check.data) > 0:
                # Student exists, update their real name
                update_data = {
                    "first_name": first_name,
                    "last_name": last_name
                }
                supabase.table("enrollees").update(update_data).eq("id_number", search_number).execute()
                print(f"  -> Updated {first_name} {last_name} ({search_number})")
                updated_count += 1
            else:
                not_found_count += 1
                
        except Exception as e:
            print(f"  -> Error updating student {cleaned_number} in Supabase: {e}")

    print("-" * 50)
    print(f"Sync Complete! Updated {updated_count} students in Supabase.")
    print(f"Skipped {not_found_count} students because they weren't enrolled in Supabase yet.")

if __name__ == "__main__":
    sync_names_from_ssms()
