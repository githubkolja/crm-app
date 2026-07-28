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

// ── Prospection Actions ──────────────────────────────────
export async function getProspectionActions(leadId) {
  return supabase
    .from('prospection_actions')
    .select('*')
    .eq('lead_id', leadId)
    .order('actioned_at', { ascending: false });
}

export async function saveProspectionAction(action) {
  const { id, ...fields } = action;
  if (id) {
    return supabase
      .from('prospection_actions')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
  }
  const user_id = await getCurrentUserId();
  return supabase
    .from('prospection_actions')
    .insert({ ...fields, user_id })
    .select()
    .single();
}

export async function deleteProspectionAction(id) {
  return supabase.from('prospection_actions').delete().eq('id', id);
}

// ── Opportunities ────────────────────────────────────────
export async function getOpportunities() {
  return supabase
    .from('opportunities')
    .select('*, leads(name, company)')
    .neq('stage', 'deal')
    .order('created_at', { ascending: false });
}

export async function getDeals() {
  return supabase
    .from('opportunities')
    .select('*, clients(id, name, company)')
    .eq('stage', 'deal')
    .order('updated_at', { ascending: false });
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

// ── Commercial Actions ───────────────────────────────────
export async function getCommercialActions(opportunityId) {
  return supabase
    .from('commercial_actions')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('actioned_at', { ascending: false });
}

export async function saveCommercialAction(action) {
  const { id, ...fields } = action;
  if (id) {
    return supabase
      .from('commercial_actions')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
  }
  const user_id = await getCurrentUserId();
  return supabase
    .from('commercial_actions')
    .insert({ ...fields, user_id })
    .select()
    .single();
}

export async function deleteCommercialAction(id) {
  return supabase.from('commercial_actions').delete().eq('id', id);
}

// ── Convert Opportunity → Deal (and lead → client, then delete lead) ─
export async function convertToDeal(opportunityId) {
  const user_id = await getCurrentUserId();

  // 1. Fetch the opportunity (with its linked lead)
  const { data: opp, error: oppErr } = await supabase
    .from('opportunities')
    .select('*, leads(*)')
    .eq('id', opportunityId)
    .single();
  if (oppErr) return { error: oppErr };

  let clientId = null;

  // 2. If there's a linked lead, migrate it to a client first
  if (opp.lead_id && opp.leads) {
    const lead = opp.leads;
    const { data: newClient, error: clientErr } = await supabase
      .from('clients')
      .insert({
        user_id,
        name: lead.name,
        company: lead.company ?? '',
        email: lead.email ?? null,
        phone: lead.phone ?? null,
        lead_source_id: lead.id,
      })
      .select('id')
      .single();
    if (clientErr) return { error: clientErr };
    clientId = newClient.id;

    // Delete the lead (prospection_actions cascade-delete automatically)
    const { error: deleteErr } = await supabase
      .from('leads')
      .delete()
      .eq('id', lead.id);
    if (deleteErr) return { error: deleteErr };
  }

  // 3. Mark opportunity as "deal" and store the client reference
  const { error: stageErr } = await supabase
    .from('opportunities')
    .update({
      stage: 'deal',
      client_id: clientId,       // survives the lead_id → NULL cascade
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunityId);
  if (stageErr) return { error: stageErr };

  return { error: null };
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
