
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Documents table (publicly readable)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  document_type TEXT CHECK (document_type IN ('act', 'circular', 'order', 'GR', 'notification', 'gazette', 'court_order', 'rule', 'form', 'directive')),
  category TEXT CHECK (category IN ('labour', 'tax', 'gst', 'corporate', 'environment', 'fssai', 'municipal', 'bfsi', 'export')),
  state TEXT CHECK (state IN ('central', 'maharashtra', 'karnataka', 'gujarat', 'tamil_nadu', 'telangana', 'andhra_pradesh')),
  original_language TEXT,
  original_text TEXT,
  translated_text TEXT,
  translation_confidence TEXT CHECK (translation_confidence IN ('high', 'medium', 'low')),
  ai_summary TEXT,
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  urgency TEXT CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  tags TEXT[],
  affected_industries TEXT[],
  affected_headcount_min INTEGER,
  affected_headcount_max INTEGER,
  effective_date DATE,
  deadline_date DATE,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  is_amendment BOOLEAN DEFAULT false,
  previous_version_id UUID REFERENCES public.documents(id)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documents are publicly readable" ON public.documents FOR SELECT USING (true);

-- User profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  primary_state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Liability profiles
CREATE TABLE public.liability_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  industry_type TEXT,
  headcount_bracket TEXT,
  contract_worker_bracket TEXT,
  workforce_nature TEXT,
  employs_women BOOLEAN,
  has_canteen BOOLEAN,
  in_sez BOOLEAN,
  states TEXT[],
  primary_city TEXT,
  multiple_locations BOOLEAN,
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.liability_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own liability" ON public.liability_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liability" ON public.liability_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own liability" ON public.liability_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own liability" ON public.liability_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_liability_profiles_updated_at
  BEFORE UPDATE ON public.liability_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Compliance tasks
CREATE TABLE public.compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  act_reference TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'filed', 'overdue')),
  due_date DATE,
  assigned_to TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON public.compliance_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.compliance_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.compliance_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.compliance_tasks FOR DELETE USING (auth.uid() = user_id);

-- User alerts
CREATE TABLE public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  alert_type TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  channels TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own alerts" ON public.user_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.user_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.user_alerts FOR DELETE USING (auth.uid() = user_id);

-- User watchlist
CREATE TABLE public.user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, document_id)
);

ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own watchlist" ON public.user_watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlist" ON public.user_watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist" ON public.user_watchlist FOR DELETE USING (auth.uid() = user_id);

-- Keyword watches
CREATE TABLE public.keyword_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.keyword_watches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own keywords" ON public.keyword_watches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own keywords" ON public.keyword_watches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own keywords" ON public.keyword_watches FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_state ON public.documents(state);
CREATE INDEX idx_documents_urgency ON public.documents(urgency);
CREATE INDEX idx_documents_published_at ON public.documents(published_at DESC);
CREATE INDEX idx_documents_document_type ON public.documents(document_type);
CREATE INDEX idx_compliance_tasks_status ON public.compliance_tasks(status);
CREATE INDEX idx_compliance_tasks_due_date ON public.compliance_tasks(due_date);
CREATE INDEX idx_user_alerts_is_read ON public.user_alerts(is_read);
