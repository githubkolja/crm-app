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
  InlineNotification,
  Loading,
  Grid,
  Column,
  Tag,
} from '@carbon/react';
import { TrashCan } from '@carbon/icons-react';
import { getDeals, getClients, deleteOpportunity } from '../services/crmService';
import './EntitySection.scss';

const HEADERS = [
  { key: 'title', header: 'Title' },
  { key: 'client_name', header: 'Client' },
  { key: 'value', header: 'Value' },
  { key: 'closed_at', header: 'Closed' },
  { key: 'actions', header: '' },
];

function DealsSection() {
  const [deals, setDeals] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [notification, setNotification] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  async function fetchAll() {
    setLoading(true);
    const [dealsResult, clientsResult] = await Promise.all([getDeals(), getClients()]);
    if (dealsResult.error) setNotification({ kind: 'error', message: dealsResult.error.message });
    else setDeals(dealsResult.data ?? []);
    if (clientsResult.error) setNotification({ kind: 'error', message: clientsResult.error.message });
    else setClients(clientsResult.data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function fmtCurrency(v) {
    if (v == null || v === '') return '—';
    return Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteOpportunity(deleteTarget.id);
    if (error) setNotification({ kind: 'error', message: error.message });
    else { setDeleteTarget(null); await fetchAll(); }
    setDeleting(false);
  }

  // Match deal → client via lead_source_id = deal.lead_id
  function clientForDeal(deal) {
    if (!deal.lead_id) return null;
    return clients.find((c) => c.lead_source_id === deal.lead_id) ?? null;
  }

  const rows = deals.map((d) => {
    const client = clientForDeal(d);
    return {
      id: d.id,
      title: d.title,
      client_name: client ? `${client.name}${client.company ? ` (${client.company})` : ''}` : '—',
      value: fmtCurrency(d.value),
      closed_at: d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '—',
    };
  });

  return (
    <section className="entity-section">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 className="entity-section__title">Deals</h2>
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
            <Loading description="Loading deals…" withOverlay={false} />
          ) : (
            <DataTable rows={rows} headers={HEADERS} isSortable>
              {({ rows: tableRows, headers, getTableProps, getHeaderProps, getRowProps, onInputChange }) => (
                <>
                  <TableToolbar>
                    <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
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
                      {tableRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={HEADERS.length}>
                            <span style={{ color: 'var(--cds-text-placeholder)' }}>
                              No deals yet — convert an opportunity to create one.
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableRows.map((row) => {
                          const raw = deals.find((d) => d.id === row.id);
                          return (
                            <TableRow key={row.id} {...getRowProps({ row })}>
                              {row.cells.map((cell) => {
                                if (cell.info.header === 'actions') {
                                  return (
                                    <TableCell key={cell.id} className="entity-section__actions">
                                      <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} hasIconOnly iconDescription="Delete" onClick={() => setDeleteTarget(raw)} />
                                    </TableCell>
                                  );
                                }
                                return (
                                  <TableCell key={cell.id}>
                                    {cell.info.header === 'closed_at'
                                      ? <Tag type="green" size="sm">{cell.value}</Tag>
                                      : cell.value}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </DataTable>
          )}
        </Column>
      </Grid>

      <Modal
        open={!!deleteTarget}
        danger
        modalHeading="Delete Deal"
        primaryButtonText={deleting ? 'Deleting…' : 'Delete'}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleDelete}
        onRequestClose={() => setDeleteTarget(null)}
        primaryButtonDisabled={deleting}
      >
        <p>Are you sure you want to delete deal <strong>{deleteTarget?.title}</strong>? This action cannot be undone.</p>
      </Modal>
    </section>
  );
}

export default DealsSection;
