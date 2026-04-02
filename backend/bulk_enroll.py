import os
import cv2
import face_recognition
import argparse
import re
from database import supabase

def main():
    parser = argparse.ArgumentParser(description="Bulk enroll students from folders.")
    parser.add_argument("directory", help="The absolute path to the root directory containing student folders.")
    args = parser.parse_args()

    root_dir = args.directory

    if not os.path.exists(root_dir):
        print(f"Error: Directory '{root_dir}' does not exist.")
        return

    enrolled_count = 0

    print(f"Starting bulk enrollment from {root_dir}")
    print("-" * 50)

    for folder_name in os.listdir(root_dir):
        folder_path = os.path.join(root_dir, folder_name)
        
        # Only process directories
        if not os.path.isdir(folder_path):
            continue
            
        # Check if folder name contains a year (like 2024) and ends with 'IC'
        # re.search(r"20\d{2}", folder_name) matches years 2000-2099
        if "IC" in folder_name.upper() and re.search(r"20\d{2}", folder_name):
            
            # Extract student number by removing 'IC' at the end
            # Using case-insensitive replacement if it's always at the end
            student_number = folder_name
            if student_number.upper().endswith("IC"):
                student_number = student_number[:-2].strip()
            
            print(f"\nProcessing student: {student_number} (Folder: {folder_name})")
            
            # Get images from the folder
            image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            
            # We want exactly the first 3 images
            images_to_process = image_files[:3]
            
            if len(images_to_process) < 3:
                print(f"  -> Skipping {folder_name}: Not enough images (found {len(image_files)}, need at least 3).")
                continue
                
            encodings = []
            valid_images = True
            
            for img_file in images_to_process:
                img_path = os.path.join(folder_path, img_file)
                
                # Load image with OpenCV to mimic the API enrollment logic
                img = cv2.imread(img_path)
                if img is None:
                    print(f"  -> Error: Could not read image {img_file}")
                    valid_images = False
                    break
                    
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                
                # Find faces
                faces = face_recognition.face_locations(rgb_img)
                if len(faces) == 0:
                    print(f"  -> Error: No face found in {img_file}")
                    valid_images = False
                    break
                if len(faces) > 1:
                     print(f"  -> Error: Multiple faces found in {img_file}. Only one face allowed.")
                     valid_images = False
                     break
                     
                # Get Face Encodings
                encoding = face_recognition.face_encodings(rgb_img, faces)[0]
                encodings.append(encoding.tolist())
            
            if not valid_images:
                continue
            
            try:
                # Since real names are in SSMS, we use placeholders to satisfy the Supabase schema's NOT NULL constraint.
                # You can join the id_number with your SSMS database later if needed.
                db_data = {
                    "first_name": "SSMS",
                    "last_name": "Record",
                    "role": "Student",
                    "id_number": student_number,
                    "face_encodings": encodings
                }
                
                # Check if student is already enrolled in Supabase
                exist_check = supabase.table("enrollees").select("id").eq("id_number", student_number).execute()
                if exist_check.data and len(exist_check.data) > 0:
                    print(f"  -> Student {student_number} is already enrolled. Skipping.")
                    continue
                
                # Insert into Supabase
                supabase.table("enrollees").insert(db_data).execute()
                print(f"  -> Successfully enrolled {student_number}!")
                enrolled_count += 1
                
            except Exception as e:
                print(f"  -> Error enrolling {student_number}: {e}")
                
    print(f"\nDone! Successfully enrolled {enrolled_count} students.")

if __name__ == "__main__":
    main()
