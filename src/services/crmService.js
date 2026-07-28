import { supabase } from '../lib/supabaseClient';

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id;
}

// ── Leads ───────────────────────────────────────────────
export async function getLeads() {
  return supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function saveLead(lead) {
  const { id, ...fields } = lead;
  if (id) {
    return supabase
      .from('leads')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }
  const user_id = await getCurrentUserId();
  return supabase
    .from('leads')
    .insert({ ...fields, user_id })
    .select()
    .single();
}

export async function deleteLead(id) {
  return supabase.from('leads').delete().eq('id', id);
}

// ── Opportunities ────────────────────────────────────────
export async function getOpportunities() {
  return supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function saveOpportunity(opp) {
  const { id, ...fields } = opp;
  if (id) {
    return supabase
      .from('opportunities')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }
  const user_id = await getCurrentUserId();
  return supabase
    .from('opportunities')
    .insert({ ...fields, user_id })
    .select()
    .single();
}

export async function deleteOpportunity(id) {
  return supabase.from('opportunities').delete().eq('id', id);
}

// ── Clients ──────────────────────────────────────────────
export async function getClients() {
  return supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function saveClient(client) {
  const { id, ...fields } = client;
  if (id) {
    return supabase
      .from('clients')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }
  const user_id = await getCurrentUserId();
  return supabase
    .from('clients')
    .insert({ ...fields, user_id })
    .select()
    .single();
}

export async function deleteClient(id) {
  return supabase.from('clients').delete().eq('id', id);
}
