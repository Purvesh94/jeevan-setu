"""
JeevanSetu Backend — Database connection
"""
from supabase import create_client, Client
from app.core.config import get_settings


def get_supabase_client() -> Client:
    """Get a Supabase client using the anon key (respects RLS)."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def get_supabase_admin_client() -> Client:
    """Get a Supabase client using the service role key (bypasses RLS).
    Only use server-side for admin operations."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_supabase_user_client(access_token: str) -> Client:
    """Get a Supabase client authenticated as a specific user.
    This ensures RLS policies are enforced for the user."""
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.auth.set_session(access_token, "")
    return client
