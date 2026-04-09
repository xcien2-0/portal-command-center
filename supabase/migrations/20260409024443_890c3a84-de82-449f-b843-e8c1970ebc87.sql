
-- Enums
CREATE TYPE public.conversation_channel AS ENUM ('whatsapp', 'call', 'ticket');
CREATE TYPE public.conversation_status AS ENUM ('bot_active', 'escalated', 'in_progress', 'resolved');
CREATE TYPE public.message_sender_type AS ENUM ('bot', 'client', 'agent');

-- Companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Agents
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update agents" ON public.agents FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Contacts
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  odoo_client_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Conversations
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel public.conversation_channel NOT NULL DEFAULT 'whatsapp',
  status public.conversation_status NOT NULL DEFAULT 'bot_active',
  assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update conversations" ON public.conversations FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type public.message_sender_type NOT NULL DEFAULT 'client',
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-update updated_at on conversations
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
