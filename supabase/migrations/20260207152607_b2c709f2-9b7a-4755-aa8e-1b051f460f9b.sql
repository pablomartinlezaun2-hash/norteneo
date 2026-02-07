-- Create supplement reminders configuration table
CREATE TABLE public.supplement_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplement_id UUID REFERENCES public.user_supplements(id) ON DELETE CASCADE,
  reminder_times TEXT[] NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'daily',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplement_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own reminders" 
ON public.supplement_reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" 
ON public.supplement_reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" 
ON public.supplement_reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" 
ON public.supplement_reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_supplement_reminders_updated_at
BEFORE UPDATE ON public.supplement_reminders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create notification history table
CREATE TABLE public.supplement_notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplement_id UUID REFERENCES public.user_supplements(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.supplement_reminders(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action_taken TEXT,
  action_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.supplement_notification_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own notification history" 
ON public.supplement_notification_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification history" 
ON public.supplement_notification_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification history" 
ON public.supplement_notification_history 
FOR UPDATE 
USING (auth.uid() = user_id);