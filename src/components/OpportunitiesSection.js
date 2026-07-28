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
import { getOpportunities, saveOpportunity, deleteOpportunity } from '../services/crmService';
import './EntitySection.scss';

const HEADERS = [
  { key: 'title', header: 'Title' },
  { key: 'value', header: 'Value' },
  { key: 'stage', header: 'Stage' },
  { key: 'expected_close_date', header: 'Expected Close' },
  { key: 'created_at', header: 'Created' },
  { key: 'actions', header: '' },
];

const STAGE_OPTIONS = ['prospect', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];

const EMPTY_FORM = { title: '', value: '', stage: 'prospect', expected_close_date: '', lead_id: '' };

function OpportunitiesSection() {
  const [opps, setOpps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [notification, setNotification] = React.useState(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  async function fetchOpps() {
    setLoading(true);
    const { data, error } = await getOpportunities();
    if (error) setNotification({ kind: 'error', message: error.message });
    else setOpps(data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { fetchOpps(); }, []);

  function openAdd() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(opp) {
    setSelected(opp);
    setForm({
      title: opp.title,
      value: opp.value ?? '',
      stage: opp.stage,
      expected_close_date: opp.expected_close_date ?? '',
      lead_id: opp.lead_id ?? '',
    });
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
    const payload = {
      ...form,
      value: form.value !== '' ? Number(form.value) : null,
      lead_id: form.lead_id || null,
      ...(selected ? { id: selected.id } : {}),
    };
    const { error } = await saveOpportunity(payload);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setFormOpen(false); await fetchOpps(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteOpportunity(deleteTarget.id);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setDeleteTarget(null); await fetchOpps(); }
    setDeleting(false);
  }

  function fmtCurrency(v) {
    if (v == null || v === '') return '—';
    return Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  const rows = opps.map((o) => ({
    id: o.id,
    title: o.title,
    value: fmtCurrency(o.value),
    stage: o.stage,
    expected_close_date: o.expected_close_date ?? '—',
    created_at: new Date(o.created_at).toLocaleDateString(),
    _raw: o,
  }));

  return (
    <section className="entity-section">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 className="entity-section__title">Opportunities</h2>
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
            <Loading description="Loading opportunities…" withOverlay={false} />
          ) : (
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
                        {headers.map((h) => (
                          <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableRows.map((row) => {
                        const raw = opps.find((o) => o.id === row.id);
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
        modalHeading={selected ? 'Edit Opportunity' : 'Add Opportunity'}
        primaryButtonText={saving ? 'Saving…' : 'Save'}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleSave}
        onRequestClose={() => setFormOpen(false)}
        primaryButtonDisabled={saving}
      >
        <div className="entity-form">
          <TextInput id="opp-title" labelText="Title *" value={form.title} invalid={!!errors.title} invalidText={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextInput id="opp-value" labelText="Value ($)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <Select id="opp-stage" labelText="Stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            {STAGE_OPTIONS.map((s) => <SelectItem key={s} value={s} text={s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} />)}
          </Select>
          <TextInput id="opp-close" labelText="Expected Close Date" type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
          <TextInput id="opp-lead" labelText="Lead ID (optional)" value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        danger
        modalHeading="Delete Opportunity"
        primaryButtonText={deleting ? 'Deleting…' : 'Delete'}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleDelete}
        onRequestClose={() => setDeleteTarget(null)}
        primaryButtonDisabled={deleting}
      >
        <p>Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.</p>
      </Modal>
    </section>
  );
}

export default OpportunitiesSection;
