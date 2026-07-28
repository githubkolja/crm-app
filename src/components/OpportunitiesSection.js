import React from 'react';
import {
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineNotification,
  Loading,
  Grid,
  Column,
  Tag,
} from '@carbon/react';
import { Add, TrashCan, Edit, Checkmark } from '@carbon/icons-react';
import {
  getLeads,
  getOpportunities,
  saveOpportunity,
  deleteOpportunity,
  convertToDeal,
  getCommercialActions,
  saveCommercialAction,
  deleteCommercialAction,
} from '../services/crmService';
import './EntitySection.scss';

const HEADERS = [
  { key: 'title', header: 'Title' },
  { key: 'lead_name', header: 'Lead' },
  { key: 'value', header: 'Value' },
  { key: 'stage', header: 'Stage' },
  { key: 'expected_close_date', header: 'Expected Close' },
  { key: 'updated_at', header: 'Last Updated' },
  { key: 'actions', header: '' },
];

const STAGE_OPTIONS = ['prospect', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
const CACTION_TYPES = ['demo', 'proposal', 'negotiation', 'follow_up', 'other'];

const EMPTY_OPP_FORM = { title: '', value: '', stage: 'prospect', expected_close_date: '', lead_id: '' };
const EMPTY_ACTION_FORM = { type: 'demo', notes: '', actioned_at: new Date().toISOString().slice(0, 10) };

function CommercialActionsList({ opportunityId, onError }) {
  const [actions, setActions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState(EMPTY_ACTION_FORM);
  const [editingId, setEditingId] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await getCommercialActions(opportunityId);
    if (error) onError(error.message);
    else setActions(data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, [opportunityId]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(a) { setEditingId(a.id); setForm({ type: a.type, notes: a.notes ?? '', actioned_at: a.actioned_at }); }
  function cancelEdit() { setEditingId(null); setForm(EMPTY_ACTION_FORM); }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, opportunity_id: opportunityId, ...(editingId ? { id: editingId } : {}) };
    const { error } = await saveCommercialAction(payload);
    if (error) onError(error.message);
    else { setEditingId(null); setForm(EMPTY_ACTION_FORM); await load(); }
    setSaving(false);
  }

  async function handleDelete(id) {
    const { error } = await deleteCommercialAction(id);
    if (error) onError(error.message);
    else await load();
  }

  return (
    <div className="actions-sublist">
      <h5 className="actions-sublist__heading">Commercial Actions</h5>
      {loading ? <Loading small description="Loading…" withOverlay={false} /> : (
        <>
          {actions.length === 0 && <p className="actions-sublist__empty">No actions yet.</p>}
          {actions.map((a) => editingId === a.id ? (
            <div key={a.id} className="actions-sublist__row actions-sublist__row--editing">
              <Select id={`ctype-${a.id}`} labelText="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {CACTION_TYPES.map((t) => <SelectItem key={t} value={t} text={t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />)}
              </Select>
              <TextInput id={`cdate-${a.id}`} labelText="Date" type="date" value={form.actioned_at} onChange={(e) => setForm({ ...form, actioned_at: e.target.value })} />
              <TextArea id={`cnotes-${a.id}`} labelText="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              <div className="actions-sublist__btns">
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                <Button size="sm" kind="ghost" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div key={a.id} className="actions-sublist__row">
              <Tag type="purple" size="sm">{a.type.replace('_', ' ')}</Tag>
              <span className="actions-sublist__date">{a.actioned_at}</span>
              {a.notes && <span className="actions-sublist__notes">{a.notes}</span>}
              <div className="actions-sublist__btns">
                <Button kind="ghost" size="sm" renderIcon={Edit} hasIconOnly iconDescription="Edit" onClick={() => startEdit(a)} />
                <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} hasIconOnly iconDescription="Delete" onClick={() => handleDelete(a.id)} />
              </div>
            </div>
          ))}
          {editingId === null && (
            <div className="actions-sublist__row actions-sublist__row--new">
              <Select id="new-cact-type" labelText="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {CACTION_TYPES.map((t) => <SelectItem key={t} value={t} text={t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />)}
              </Select>
              <TextInput id="new-cact-date" labelText="Date" type="date" value={form.actioned_at} onChange={(e) => setForm({ ...form, actioned_at: e.target.value })} />
              <TextArea id="new-cact-notes" labelText="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              <div className="actions-sublist__btns">
                <Button size="sm" renderIcon={Add} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add Action'}</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OpportunitiesSection() {
  const [opps, setOpps] = React.useState([]);
  const [leads, setLeads] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [notification, setNotification] = React.useState(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_OPP_FORM);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  const [dealTarget, setDealTarget] = React.useState(null);
  const [converting, setConverting] = React.useState(false);

  async function fetchAll() {
    setLoading(true);
    const [oppsResult, leadsResult] = await Promise.all([getOpportunities(), getLeads()]);
    if (oppsResult.error) setNotification({ kind: 'error', message: oppsResult.error.message });
    else setOpps(oppsResult.data ?? []);
    if (leadsResult.error) setNotification({ kind: 'error', message: leadsResult.error.message });
    else setLeads(leadsResult.data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { fetchAll(); }, []);

  function openAdd() { setSelected(null); setForm(EMPTY_OPP_FORM); setErrors({}); setFormOpen(true); }
  function openEdit(opp) {
    setSelected(opp);
    setForm({ title: opp.title, value: opp.value ?? '', stage: opp.stage, expected_close_date: opp.expected_close_date ?? '', lead_id: opp.lead_id ?? '' });
    setErrors({});
    setFormOpen(true);
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = { ...form, value: form.value !== '' ? Number(form.value) : null, lead_id: form.lead_id || null, ...(selected ? { id: selected.id } : {}) };
    const { error } = await saveOpportunity(payload);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setFormOpen(false); await fetchAll(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteOpportunity(deleteTarget.id);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setDeleteTarget(null); await fetchAll(); }
    setDeleting(false);
  }

  async function handleConvertToDeal() {
    setConverting(true);
    const { error } = await convertToDeal(dealTarget.id);
    if (error) setNotification({ kind: 'error', message: error.message });
    else {
      setDealTarget(null);
      setNotification({ kind: 'success', message: `"${dealTarget.title}" converted to a deal. The linked lead has been migrated to Clients.` });
      await fetchAll();
    }
    setConverting(false);
  }

  function fmtCurrency(v) {
    if (v == null || v === '') return '—';
    return Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  function fmtDate(v) { return v ? new Date(v).toLocaleDateString() : '—'; }

  function getLeadLabel(opp) {
    if (opp.leads) return `${opp.leads.name}${opp.leads.company ? ` (${opp.leads.company})` : ''}`;
    return '—';
  }

  const rows = opps.map((o) => ({
    id: o.id,
    title: o.title,
    lead_name: getLeadLabel(o),
    value: fmtCurrency(o.value),
    stage: o.stage,
    expected_close_date: o.expected_close_date ?? '—',
    updated_at: fmtDate(o.updated_at),
    _raw: o,
  }));

  return (
    <section className="entity-section">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 className="entity-section__title">Opportunities</h2>
          {notification && <InlineNotification kind={notification.kind} title={notification.message} onClose={() => setNotification(null)} />}
        </Column>
        <Column lg={16} md={8} sm={4}>
          {loading ? <Loading description="Loading opportunities…" withOverlay={false} /> : (
            <DataTable rows={rows} headers={HEADERS} isSortable>
              {({ rows: tableRows, headers, getTableProps, getHeaderProps, getRowProps, onInputChange }) => (
                <>
                  <TableToolbar>
                    <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
                      <Button renderIcon={Add} onClick={openAdd}>Add Opportunity</Button>
                    </TableToolbarContent>
                  </TableToolbar>
                  <Table {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headers.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableRows.map((row) => {
                        const raw = opps.find((o) => o.id === row.id);
                        return (
                          <TableRow key={row.id} {...getRowProps({ row })}>
                            {row.cells.map((cell) => {
                              if (cell.info.header === 'actions') return (
                                <TableCell key={cell.id} className="entity-section__actions">
                                  <Button kind="ghost" size="sm" renderIcon={Edit} hasIconOnly iconDescription="Edit" onClick={() => openEdit(raw)} />
                                  {raw.stage !== 'deal' && (
                                    <Button kind="ghost" size="sm" renderIcon={Checkmark} hasIconOnly iconDescription="Convert to Deal" onClick={() => setDealTarget(raw)} />
                                  )}
                                  <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} hasIconOnly iconDescription="Delete" onClick={() => setDeleteTarget(raw)} />
                                </TableCell>
                              );
                              return <TableCell key={cell.id}>{cell.value}</TableCell>;
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </DataTable>
          )}
        </Column>
      </Grid>

      <Modal open={formOpen} modalHeading={selected ? 'Edit Opportunity' : 'Add Opportunity'}
        primaryButtonText={saving ? 'Saving…' : 'Save'} secondaryButtonText="Cancel"
        onRequestSubmit={handleSave} onRequestClose={() => setFormOpen(false)}
        primaryButtonDisabled={saving} size="lg">
        <div className="entity-form">
          <TextInput id="opp-title" labelText="Title *" value={form.title} invalid={!!errors.title} invalidText={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextInput id="opp-value" labelText="Value ($)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <Select id="opp-stage" labelText="Stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            {STAGE_OPTIONS.map((s) => <SelectItem key={s} value={s} text={s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} />)}
          </Select>
          <TextInput id="opp-close" labelText="Expected Close Date" type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
          <Select id="opp-lead" labelText="Linked Lead" value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>
            <SelectItem value="" text="— None —" />
            {leads.map((l) => <SelectItem key={l.id} value={l.id} text={`${l.name}${l.company ? ` (${l.company})` : ''}`} />)}
          </Select>
          {selected && <CommercialActionsList opportunityId={selected.id} onError={(msg) => setNotification({ kind: 'error', message: msg })} />}
        </div>
      </Modal>

      <Modal open={!!dealTarget} modalHeading="Convert to Deal"
        primaryButtonText={converting ? 'Converting…' : 'Convert to Deal'} secondaryButtonText="Cancel"
        onRequestSubmit={handleConvertToDeal} onRequestClose={() => setDealTarget(null)} primaryButtonDisabled={converting}>
        <p>
          Convert <strong>{dealTarget?.title}</strong> to a deal?
          {dealTarget?.lead_id && <> The linked lead will be <strong>migrated to Clients</strong> and marked as transformed.</>}
        </p>
      </Modal>

      <Modal open={!!deleteTarget} danger modalHeading="Delete Opportunity"
        primaryButtonText={deleting ? 'Deleting…' : 'Delete'} secondaryButtonText="Cancel"
        onRequestSubmit={handleDelete} onRequestClose={() => setDeleteTarget(null)} primaryButtonDisabled={deleting}>
        <p>Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.</p>
      </Modal>
    </section>
  );
}

export default OpportunitiesSection;
