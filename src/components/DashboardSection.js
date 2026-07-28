import React from 'react';
import {
  Button,
  Tile,
  Grid,
  Column,
  Loading,
  TextInput,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  InlineNotification,
  Tag,
} from '@carbon/react';
import { UserFollow, Partnership, Catalog, User, Download } from '@carbon/icons-react';
import {
  getLeads, getOpportunities, getDeals, getClients,
  getTransformedLeads, getProspectionActionsInRange, getCommercialActionsInRange,
} from '../services/crmService';
import './DashboardSection.scss';

// ── helpers ────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

function fmtCurrency(v) {
  if (v == null || v === '') return '—';
  return Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function toISO(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  return endOfDay ? `${dateStr}T23:59:59.999Z` : `${dateStr}T00:00:00.000Z`;
}

function downloadCSV(rows, headers, filename) {
  const headerRow = headers.map((h) => h.header).join(',');
  const lines = rows.map((r) =>
    headers.map((h) => `"${String(r[h.key] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const blob = new Blob([[headerRow, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── report table configs ───────────────────────────────────────────
const TRANSFORMED_HEADERS = [
  { key: 'lead_name',   header: 'Lead Name' },
  { key: 'company',     header: 'Company' },
  { key: 'opp_title',   header: 'Opportunity' },
  { key: 'opp_value',   header: 'Value' },
  { key: 'client_name', header: 'Client' },
  { key: 'transformed', header: 'Transformed On' },
];

const PACTION_HEADERS = [
  { key: 'lead_name',   header: 'Lead' },
  { key: 'company',     header: 'Company' },
  { key: 'type',        header: 'Type' },
  { key: 'notes',       header: 'Notes' },
  { key: 'actioned_at', header: 'Date' },
];

const CACTION_HEADERS = [
  { key: 'opp_title',   header: 'Opportunity' },
  { key: 'lead_name',   header: 'Lead' },
  { key: 'type',        header: 'Type' },
  { key: 'notes',       header: 'Notes' },
  { key: 'actioned_at', header: 'Date' },
];

// ── reusable report section ────────────────────────────────────────
function ReportSection({ title, headers, rows, loading, csvFilename, emptyText }) {
  return (
    <Column lg={16} md={8} sm={4}>
      <div className="report-header">
        <h2 className="report-title">{title}</h2>
        <Button kind="tertiary" size="sm" renderIcon={Download}
          onClick={() => downloadCSV(rows, headers, csvFilename)}
          disabled={rows.length === 0}>
          Download CSV
        </Button>
      </div>
      {loading ? <Loading description={`Loading ${title}…`} withOverlay={false} /> : (
        <DataTable rows={rows} headers={headers} isSortable>
          {({ rows: tRows, headers: tHeaders, getTableProps, getHeaderProps, getRowProps }) => (
            <Table {...getTableProps()} size="sm">
              <TableHead>
                <TableRow>
                  {tHeaders.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {tRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length}>
                      <span style={{ color: 'var(--cds-text-placeholder)' }}>{emptyText}</span>
                    </TableCell>
                  </TableRow>
                ) : tRows.map((row) => (
                  <TableRow key={row.id} {...getRowProps({ row })}>
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.info.header === 'type'
                          ? <Tag type="blue" size="sm">{cell.value}</Tag>
                          : cell.value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DataTable>
      )}
    </Column>
  );
}

// ── main dashboard ────────────────────────────────────────────────
function DashboardSection({ setActiveSection }) {
  const [counts, setCounts] = React.useState({ leads: 0, opportunities: 0, deals: 0, clients: 0 });
  const [countsLoading, setCountsLoading] = React.useState(true);

  const [dateFrom, setDateFrom] = React.useState(firstOfMonth());
  const [dateTo, setDateTo] = React.useState(today());

  const [transformedRows, setTransformedRows] = React.useState([]);
  const [transformedLoading, setTransformedLoading] = React.useState(false);

  const [pactionRows, setPactionRows] = React.useState([]);
  const [pactionLoading, setPactionLoading] = React.useState(false);

  const [cactionRows, setCactionRows] = React.useState([]);
  const [cactionLoading, setCactionLoading] = React.useState(false);

  const [reportError, setReportError] = React.useState(null);

  // summary counts
  React.useEffect(() => {
    Promise.all([getLeads(), getOpportunities(), getDeals(), getClients()]).then(([l, o, d, c]) => {
      setCounts({ leads: l.data?.length ?? 0, opportunities: o.data?.length ?? 0, deals: d.data?.length ?? 0, clients: c.data?.length ?? 0 });
      setCountsLoading(false);
    });
  }, []);

  // reports — reload whenever date range changes
  React.useEffect(() => {
    const from = toISO(dateFrom, false);
    const to   = toISO(dateTo, true);

    async function loadAll() {
      setReportError(null);
      setTransformedLoading(true);
      setPactionLoading(true);
      setCactionLoading(true);

      // ── transformed leads ──
      const { data: tData, error: tErr } = await getTransformedLeads(from, to);
      if (tErr) { setReportError(tErr.message); }
      else {
        setTransformedRows(
          (tData ?? []).flatMap((lead) => {
            const opps = lead.opportunities ?? [];
            if (opps.length === 0) return [{ id: lead.id, lead_name: lead.name, company: lead.company ?? '—', opp_title: '—', opp_value: '—', client_name: '—', transformed: lead.transformed_at ? new Date(lead.transformed_at).toLocaleDateString() : '—' }];
            return opps.map((opp, i) => ({
              id: `${lead.id}-${i}`,
              lead_name: lead.name,
              company: lead.company ?? '—',
              opp_title: opp.title,
              opp_value: fmtCurrency(opp.value),
              client_name: opp.clients ? `${opp.clients.name}${opp.clients.company ? ` (${opp.clients.company})` : ''}` : '—',
              transformed: opp.transformed_at ? new Date(opp.transformed_at).toLocaleDateString() : (lead.transformed_at ? new Date(lead.transformed_at).toLocaleDateString() : '—'),
            }));
          })
        );
      }
      setTransformedLoading(false);

      // ── prospection actions ──
      const { data: pData, error: pErr } = await getProspectionActionsInRange(from, to);
      if (pErr) { setReportError(pErr.message); }
      else {
        setPactionRows(
          (pData ?? []).map((a, i) => ({
            id: a.id ?? `p-${i}`,
            lead_name: a.leads?.name ?? '—',
            company: a.leads?.company ?? '—',
            type: a.type,
            notes: a.notes ?? '—',
            actioned_at: a.actioned_at,
          }))
        );
      }
      setPactionLoading(false);

      // ── commercial actions ──
      const { data: cData, error: cErr } = await getCommercialActionsInRange(from, to);
      if (cErr) { setReportError(cErr.message); }
      else {
        setCactionRows(
          (cData ?? []).map((a, i) => ({
            id: a.id ?? `c-${i}`,
            opp_title: a.opportunities?.title ?? '—',
            lead_name: a.opportunities?.leads?.name ?? '—',
            type: a.type.replace('_', ' '),
            notes: a.notes ?? '—',
            actioned_at: a.actioned_at,
          }))
        );
      }
      setCactionLoading(false);
    }

    loadAll();
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const tiles = [
    { key: 'leads',         label: 'Leads',        icon: UserFollow,  count: counts.leads,         section: 'leads',         color: 'blue' },
    { key: 'opportunities', label: 'Opportunities', icon: Partnership, count: counts.opportunities, section: 'opportunities', color: 'teal' },
    { key: 'deals',         label: 'Deals',         icon: Catalog,     count: counts.deals,         section: 'deals',         color: 'green' },
    { key: 'clients',       label: 'Clients',       icon: User,        count: counts.clients,       section: 'clients',       color: 'purple' },
  ];

  const dateLabel = `${dateFrom}_${dateTo}`;

  return (
    <section className="dashboard-section">
      <Grid>
        {/* title */}
        <Column lg={16} md={8} sm={4}>
          <h1 className="dashboard-title">CRM Dashboard</h1>
          <p className="dashboard-subtitle">Manage your leads, opportunities, deals and clients.</p>
        </Column>

        {/* count tiles */}
        {countsLoading ? (
          <Column lg={16} md={8} sm={4}>
            <Loading description="Loading counts…" withOverlay={false} />
          </Column>
        ) : tiles.map(({ key, label, icon: Icon, count, section, color }) => (
          <Column key={key} lg={4} md={4} sm={4}>
            <Tile className={`dashboard-tile dashboard-tile--${color}`}>
              <div className="dashboard-tile__icon"><Icon size={32} /></div>
              <p className="dashboard-tile__count">{count}</p>
              <p className="dashboard-tile__label">{label}</p>
              <Button kind="primary" size="sm" onClick={() => setActiveSection(section)}>View {label}</Button>
            </Tile>
          </Column>
        ))}

        {/* date range picker */}
        <Column lg={16} md={8} sm={4}>
          <div className="report-header">
            <h2 className="report-title">Activity Reports</h2>
            <div className="report-controls">
              <TextInput
                id="date-from"
                labelText="From"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                size="sm"
              />
              <TextInput
                id="date-to"
                labelText="To"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                size="sm"
              />
            </div>
          </div>
          {reportError && <InlineNotification kind="error" title={reportError} onClose={() => setReportError(null)} />}
        </Column>

        {/* transformed leads report */}
        <ReportSection
          title="Transformed Leads"
          headers={TRANSFORMED_HEADERS}
          rows={transformedRows}
          loading={transformedLoading}
          csvFilename={`transformed-leads-${dateLabel}.csv`}
          emptyText="No transformed leads in this period."
        />

        {/* prospection actions report */}
        <ReportSection
          title="Lead Prospection Actions"
          headers={PACTION_HEADERS}
          rows={pactionRows}
          loading={pactionLoading}
          csvFilename={`prospection-actions-${dateLabel}.csv`}
          emptyText="No prospection actions in this period."
        />

        {/* commercial actions report */}
        <ReportSection
          title="Opportunity Commercial Actions"
          headers={CACTION_HEADERS}
          rows={cactionRows}
          loading={cactionLoading}
          csvFilename={`commercial-actions-${dateLabel}.csv`}
          emptyText="No commercial actions in this period."
        />
      </Grid>
    </section>
  );
}

export default DashboardSection;
