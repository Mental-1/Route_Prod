
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteHandler } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const supabase = await getSupabaseRouteHandler(cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const conversationId = params.conversationId;

  try {
    const { data, error } = await supabase
      .from('encrypted_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error fetching messages:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
