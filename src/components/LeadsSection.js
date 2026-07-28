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
import { Add, TrashCan, Edit } from '@carbon/icons-react';
import {
  getLeads,
  saveLead,
  deleteLead,
  getProspectionActions,
  saveProspectionAction,
  deleteProspectionAction,
} from '../services/crmService';
import './EntitySection.scss';

const HEADERS = [
  { key: 'name', header: 'Name' },
  { key: 'company', header: 'Company' },
  { key: 'email', header: 'Email' },
  { key: 'status', header: 'Status' },
  { key: 'actions_count', header: 'Actions' },
  { key: 'updated_at', header: 'Last Updated' },
  { key: 'actions', header: '' },
];

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'lost'];
const PACTION_TYPES = ['call', 'email', 'meeting', 'linkedin', 'other'];

const EMPTY_LEAD_FORM = { name: '', company: '', email: '', phone: '', status: 'new' };
const EMPTY_ACTION_FORM = { type: 'call', notes: '', actioned_at: new Date().toISOString().slice(0, 10) };

function ActionsList({ leadId, onError }) {
  const [actions, setActions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState(EMPTY_ACTION_FORM);
  const [editingId, setEditingId] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await getProspectionActions(leadId);
    if (error) onError(error.message);
    else setActions(data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, [leadId]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(a) { setEditingId(a.id); setForm({ type: a.type, notes: a.notes ?? '', actioned_at: a.actioned_at }); }
  function cancelEdit() { setEditingId(null); setForm(EMPTY_ACTION_FORM); }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, lead_id: leadId, ...(editingId ? { id: editingId } : {}) };
    const { error } = await saveProspectionAction(payload);
    if (error) onError(error.message);
    else { setEditingId(null); setForm(EMPTY_ACTION_FORM); await load(); }
    setSaving(false);
  }

  async function handleDelete(id) {
    const { error } = await deleteProspectionAction(id);
    if (error) onError(error.message);
    else await load();
  }

  return (
    <div className="actions-sublist">
      <h5 className="actions-sublist__heading">Prospection Actions</h5>
      {loading ? <Loading small description="Loading…" withOverlay={false} /> : (
        <>
          {actions.length === 0 && <p className="actions-sublist__empty">No actions yet.</p>}
          {actions.map((a) => editingId === a.id ? (
            <div key={a.id} className="actions-sublist__row actions-sublist__row--editing">
              <Select id={`type-${a.id}`} labelText="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {PACTION_TYPES.map((t) => <SelectItem key={t} value={t} text={t.charAt(0).toUpperCase() + t.slice(1)} />)}
              </Select>
              <TextInput id={`date-${a.id}`} labelText="Date" type="date" value={form.actioned_at} onChange={(e) => setForm({ ...form, actioned_at: e.target.value })} />
              <TextArea id={`notes-${a.id}`} labelText="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              <div className="actions-sublist__btns">
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                <Button size="sm" kind="ghost" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div key={a.id} className="actions-sublist__row">
              <Tag type="blue" size="sm">{a.type}</Tag>
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
              <Select id="new-pact-type" labelText="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {PACTION_TYPES.map((t) => <SelectItem key={t} value={t} text={t.charAt(0).toUpperCase() + t.slice(1)} />)}
              </Select>
              <TextInput id="new-pact-date" labelText="Date" type="date" value={form.actioned_at} onChange={(e) => setForm({ ...form, actioned_at: e.target.value })} />
              <TextArea id="new-pact-notes" labelText="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
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

function LeadsSection() {
  const [leads, setLeads] = React.useState([]);
  const [actionCounts, setActionCounts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [notification, setNotification] = React.useState(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_LEAD_FORM);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await getLeads();
    if (error) { setNotification({ kind: 'error', message: error.message }); setLoading(false); return; }
    const list = data ?? [];
    setLeads(list);
    const counts = await Promise.all(list.map(async (l) => {
      const { data: acts } = await getProspectionActions(l.id);
      return [l.id, (acts ?? []).length];
    }));
    setActionCounts(Object.fromEntries(counts));
    setLoading(false);
  }

  React.useEffect(() => { fetchLeads(); }, []);

  function openAdd() { setSelected(null); setForm(EMPTY_LEAD_FORM); setErrors({}); setFormOpen(true); }
  function openEdit(lead) {
    setSelected(lead);
    setForm({ name: lead.name, company: lead.company ?? '', email: lead.email ?? '', phone: lead.phone ?? '', status: lead.status });
    setErrors({});
    setFormOpen(true);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const { error } = await saveLead(selected ? { ...form, id: selected.id } : form);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setFormOpen(false); await fetchLeads(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteLead(deleteTarget.id);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setDeleteTarget(null); await fetchLeads(); }
    setDeleting(false);
  }

  function fmtDate(v) { return v ? new Date(v).toLocaleDateString() : '—'; }

  const rows = leads.map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company ?? '—',
    email: l.email ?? '—',
    status: l.status,
    actions_count: actionCounts[l.id] ?? 0,
    updated_at: fmtDate(l.updated_at),
    _raw: l,
  }));

  return (
    <section className="entity-section">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 className="entity-section__title">Leads</h2>
          {notification && <InlineNotification kind={notification.kind} title={notification.message} onClose={() => setNotification(null)} />}
        </Column>
        <Column lg={16} md={8} sm={4}>
          {loading ? <Loading description="Loading leads…" withOverlay={false} /> : (
            <DataTable rows={rows} headers={HEADERS} isSortable>
              {({ rows: tableRows, headers, getTableProps, getHeaderProps, getRowProps, onInputChange }) => (
                <>
                  <TableToolbar>
                    <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
                      <Button renderIcon={Add} onClick={openAdd}>Add Lead</Button>
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
                        const raw = leads.find((l) => l.id === row.id);
                        return (
                          <TableRow key={row.id} {...getRowProps({ row })}>
                            {row.cells.map((cell) => {
                              if (cell.info.header === 'actions') return (
                                <TableCell key={cell.id} className="entity-section__actions">
                                  <Button kind="ghost" size="sm" renderIcon={Edit} hasIconOnly iconDescription="Edit" onClick={() => openEdit(raw)} />
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

      <Modal open={formOpen} modalHeading={selected ? 'Edit Lead' : 'Add Lead'}
        primaryButtonText={saving ? 'Saving…' : 'Save'} secondaryButtonText="Cancel"
        onRequestSubmit={handleSave} onRequestClose={() => setFormOpen(false)}
        primaryButtonDisabled={saving} size="lg">
        <div className="entity-form">
          <TextInput id="lead-name" labelText="Name *" value={form.name} invalid={!!errors.name} invalidText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextInput id="lead-company" labelText="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <TextInput id="lead-email" labelText="Email *" value={form.email} invalid={!!errors.email} invalidText={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextInput id="lead-phone" labelText="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select id="lead-status" labelText="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} text={s.charAt(0).toUpperCase() + s.slice(1)} />)}
          </Select>
          {selected && <ActionsList leadId={selected.id} onError={(msg) => setNotification({ kind: 'error', message: msg })} />}
        </div>
      </Modal>

      <Modal open={!!deleteTarget} danger modalHeading="Delete Lead"
        primaryButtonText={deleting ? 'Deleting…' : 'Delete'} secondaryButtonText="Cancel"
        onRequestSubmit={handleDelete} onRequestClose={() => setDeleteTarget(null)} primaryButtonDisabled={deleting}>
        <p>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </section>
  );
}

export default LeadsSection;
