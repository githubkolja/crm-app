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
  InlineNotification,
  Loading,
  Grid,
  Column,
} from '@carbon/react';
import { Add, TrashCan, Edit } from '@carbon/icons-react';
import { getClients, saveClient, deleteClient } from '../services/crmService';
import './EntitySection.scss';

const HEADERS = [
  { key: 'name', header: 'Name' },
  { key: 'company', header: 'Company' },
  { key: 'industry', header: 'Industry' },
  { key: 'contract_value', header: 'Contract Value' },
  { key: 'created_at', header: 'Created' },
  { key: 'actions', header: '' },
];

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', industry: '', contract_value: '' };

function ClientsSection() {
  const [clients, setClients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [notification, setNotification] = React.useState(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await getClients();
    if (error) setNotification({ kind: 'error', message: error.message });
    else setClients(data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { fetchClients(); }, []);

  function openAdd() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(client) {
    setSelected(client);
    setForm({
      name: client.name,
      company: client.company ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      industry: client.industry ?? '',
      contract_value: client.contract_value ?? '',
    });
    setErrors({});
    setFormOpen(true);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.company.trim()) e.company = 'Company is required';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      ...form,
      contract_value: form.contract_value !== '' ? Number(form.contract_value) : null,
      ...(selected ? { id: selected.id } : {}),
    };
    const { error } = await saveClient(payload);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setFormOpen(false); await fetchClients(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteClient(deleteTarget.id);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setDeleteTarget(null); await fetchClients(); }
    setDeleting(false);
  }

  function fmtCurrency(v) {
    if (v == null || v === '') return '—';
    return Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  const rows = clients.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    industry: c.industry ?? '—',
    contract_value: fmtCurrency(c.contract_value),
    created_at: new Date(c.created_at).toLocaleDateString(),
    _raw: c,
  }));

  return (
    <section className="entity-section">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 className="entity-section__title">Clients</h2>
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
            <Loading description="Loading clients…" withOverlay={false} />
          ) : (
            <DataTable rows={rows} headers={HEADERS} isSortable>
              {({ rows: tableRows, headers, getTableProps, getHeaderProps, getRowProps, onInputChange }) => (
                <>
                  <TableToolbar>
                    <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
                      <Button renderIcon={Add} onClick={openAdd}>Add Client</Button>
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
                        const raw = clients.find((c) => c.id === row.id);
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

      <Modal
        open={formOpen}
        modalHeading={selected ? 'Edit Client' : 'Add Client'}
        primaryButtonText={saving ? 'Saving…' : 'Save'}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleSave}
        onRequestClose={() => setFormOpen(false)}
        primaryButtonDisabled={saving}
      >
        <div className="entity-form">
          <TextInput id="cl-name" labelText="Name *" value={form.name} invalid={!!errors.name} invalidText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextInput id="cl-company" labelText="Company *" value={form.company} invalid={!!errors.company} invalidText={errors.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <TextInput id="cl-email" labelText="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextInput id="cl-phone" labelText="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextInput id="cl-industry" labelText="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <TextInput id="cl-value" labelText="Contract Value ($)" type="number" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        danger
        modalHeading="Delete Client"
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

export default ClientsSection;
