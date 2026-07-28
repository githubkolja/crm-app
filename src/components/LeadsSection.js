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
  Select,
  SelectItem,
  InlineNotification,
  Loading,
  Grid,
  Column,
} from '@carbon/react';
import { Add, TrashCan, Edit } from '@carbon/icons-react';
import { getLeads, saveLead, deleteLead } from '../services/crmService';
import './EntitySection.scss';

const HEADERS = [
  { key: 'name', header: 'Name' },
  { key: 'company', header: 'Company' },
  { key: 'email', header: 'Email' },
  { key: 'status', header: 'Status' },
  { key: 'created_at', header: 'Created' },
  { key: 'actions', header: '' },
];

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'lost'];

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', status: 'new' };

function LeadsSection() {
  const [leads, setLeads] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [notification, setNotification] = React.useState(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await getLeads();
    if (error) setNotification({ kind: 'error', message: error.message });
    else setLeads(data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { fetchLeads(); }, []);

  function openAdd() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  }

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
    const payload = selected ? { ...form, id: selected.id } : form;
    const { error } = await saveLead(payload);
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

  const rows = leads.map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company ?? '—',
    email: l.email ?? '—',
    status: l.status,
    created_at: new Date(l.created_at).toLocaleDateString(),
    _raw: l,
  }));

  return (
    <section className="entity-section">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 className="entity-section__title">Leads</h2>
          {notification && (
            <InlineNotification
              kind={notification.kind}
              title={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
        </Column>
        <Column lg={16} md={8} sm={4}>
          {loading ? (
            <Loading description="Loading leads…" withOverlay={false} />
          ) : (
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
                        {headers.map((h) => (
                          <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableRows.map((row) => {
                        const raw = leads.find((l) => l.id === row.id);
                        return (
                          <TableRow key={row.id} {...getRowProps({ row })}>
                            {row.cells.map((cell) => {
                              if (cell.info.header === 'actions') {
                                return (
                                  <TableCell key={cell.id} className="entity-section__actions">
                                    <Button kind="ghost" size="sm" renderIcon={Edit} hasIconOnly iconDescription="Edit" onClick={() => openEdit(raw)} />
                                    <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} hasIconOnly iconDescription="Delete" onClick={() => setDeleteTarget(raw)} />
                                  </TableCell>
                                );
                              }
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

      {/* Form modal */}
      <Modal
        open={formOpen}
        modalHeading={selected ? 'Edit Lead' : 'Add Lead'}
        primaryButtonText={saving ? 'Saving…' : 'Save'}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleSave}
        onRequestClose={() => setFormOpen(false)}
        primaryButtonDisabled={saving}
      >
        <div className="entity-form">
          <TextInput id="lead-name" labelText="Name *" value={form.name} invalid={!!errors.name} invalidText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextInput id="lead-company" labelText="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <TextInput id="lead-email" labelText="Email *" value={form.email} invalid={!!errors.email} invalidText={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextInput id="lead-phone" labelText="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select id="lead-status" labelText="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} text={s.charAt(0).toUpperCase() + s.slice(1)} />)}
          </Select>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        danger
        modalHeading="Delete Lead"
        primaryButtonText={deleting ? 'Deleting…' : 'Delete'}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleDelete}
        onRequestClose={() => setDeleteTarget(null)}
        primaryButtonDisabled={deleting}
      >
        <p>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </section>
  );
}

export default LeadsSection;
