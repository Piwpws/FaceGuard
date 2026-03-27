-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create Enrollees Table
CREATE TABLE public.enrollees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_number VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('Student', 'Faculty', 'Part Timer', 'Utility')),
    face_encodings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Attendance Logs Table
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollee_id UUID REFERENCES public.enrollees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_in TIMESTAMP WITH TIME ZONE NOT NULL,
    time_out TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) but allow anonymous access since this is backend-only or specific application
ALTER TABLE public.enrollees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anonymous users for this specific project example
-- (In production, you'd want tighter security, but for this system, we will use Service Key in backend or open anon access)
CREATE POLICY "Enable read access for all users" ON public.enrollees FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.enrollees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.enrollees FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.attendance_logs FOR UPDATE USING (true);
