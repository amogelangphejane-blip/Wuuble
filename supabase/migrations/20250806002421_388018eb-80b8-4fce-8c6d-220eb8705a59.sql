-- Fix security warnings by setting search_path on functions
DROP FUNCTION IF EXISTS public.user_can_view_community(uuid, uuid);
DROP FUNCTION IF EXISTS public.community_is_public(uuid);
DROP FUNCTION IF EXISTS public.user_created_community(uuid, uuid);

CREATE OR REPLACE FUNCTION public.user_can_view_community(community_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_members.community_id = $1 
    AND community_members.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.community_is_public(community_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT NOT is_private FROM public.communities WHERE id = $1;
$$;

CREATE OR REPLACE FUNCTION public.user_created_community(community_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT creator_id = $2 FROM public.communities WHERE id = $1;
$$;