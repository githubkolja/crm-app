import React from 'react';
import {
  Button,
  Tile,
  Grid,
  Column,
  Loading,
  Select,
  SelectItem,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  InlineNotification,
} from '@carbon/react';
import { UserFollow, Partnership, Catalog, User, Download } from '@carbon/icons-react';
import { getLeads, getOpportunities, getDeals, getClients, getTransformedLeads } from '../services/crmService';
import './DashboardSection.scss';

const PERIOD_OPTIONS = [
  { value: 'week',  label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all',   label: 'All time' },
];

const REPORT_HEADERS = [
  { key: 'lead_name',    header: 'Lead Name' },
  { key: 'company',      header: 'Company' },
  { key: 'opp_title',    header: 'Opportunity' },
  { key: 'opp_value',    header: 'Value' },
  { key: 'client_name',  header: 'Client' },
  { key: 'transformed',  header: 'Transformed On' },
];

function periodStart(period) {
  const d = new Date();
  if (period === 'week') { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  if (period === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  return null;
}

function toCSV(rows) {
  const headers = REPORT_HEADERS.map((h) => h.header);
  const lines = rows.map((r) =>
    [r.lead_name, r.company, r.opp_title, r.opp_value, r.client_name, r.transformed]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtCurrency(v) {
  if (v == null || v === '') return '—';
  return Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function DashboardSection({ setActiveSection }) {
  const [counts, setCounts] = React.useState({ leads: 0, opportunities: 0, deals: 0, clients: 0 });
  const [countsLoading, setCountsLoading] = React.useState(true);

  const [period, setPeriod] = React.useState('week');
  const [reportRows, setReportRows] = React.useState([]);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportError, setReportError] = React.useState(null);

  // Load summary counts
  React.useEffect(() => {
    Promise.all([getLeads(), getOpportunities(), getDeals(), getClients()]).then(([l, o, d, c]) => {
      setCounts({
        leads: l.data?.length ?? 0,
        opportunities: o.data?.length ?? 0,
        deals: d.data?.length ?? 0,
        clients: c.data?.length ?? 0,
      });
      setCountsLoading(false);
    });
  }, []);

  // Load report whenever period changes
  React.useEffect(() => {
    async function loadReport() {
      setReportLoading(true);
      setReportError(null);
      const since = periodStart(period);
      const { data, error } = await getTransformedLeads(since);
      if (error) { setReportError(error.message); setReportLoading(false); return; }
      const rows = (data ?? []).flatMap((lead) => {
        const opps = lead.opportunities ?? [];
        if (opps.length === 0) {
          return [{
            id: lead.id,
            lead_name: lead.name,
            company: lead.company ?? '—',
            opp_title: '—',
            opp_value: '—',
            client_name: '—',
            transformed: lead.transformed_at ? new Date(lead.transformed_at).toLocaleDateString() : '—',
          }];
        }
        return opps.map((opp, i) => ({
          id: `${lead.id}-${i}`,
          lead_name: lead.name,
          company: lead.company ?? '—',
          opp_title: opp.title,
          opp_value: fmtCurrency(opp.value),
          client_name: opp.clients ? `${opp.clients.name}${opp.clients.company ? ` (${opp.clients.company})` : ''}` : '—',
          transformed: opp.transformed_at ? new Date(opp.transformed_at).toLocaleDateString() : (lead.transformed_at ? new Date(lead.transformed_at).toLocaleDateString() : '—'),
        }));
      });
      setReportRows(rows);
      setReportLoading(false);
    }
    loadReport();
  }, [period]);

  function handleDownload() {
    const label = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
    downloadCSV(toCSV(reportRows), `transformed-leads-${period}-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const tiles = [
    { key: 'leads',         label: 'Leads',        icon: UserFollow,  count: counts.leads,         section: 'leads',         color: 'blue' },
    { key: 'opportunities', label: 'Opportunities', icon: Partnership, count: counts.opportunities, section: 'opportunities', color: 'teal' },
    { key: 'deals',         label: 'Deals',         icon: Catalog,     count: counts.deals,         section: 'deals',         color: 'green' },
    { key: 'clients',       label: 'Clients',       icon: User,        count: counts.clients,       section: 'clients',       color: 'purple' },
  ];

  return (
    <section className="dashboard-section">
      <Grid>
        {/* ── title ── */}
        <Column lg={16} md={8} sm={4}>
          <h1 className="dashboard-title">CRM Dashboard</h1>
          <p className="dashboard-subtitle">Manage your leads, opportunities, deals and clients.</p>
        </Column>

        {/* ── count tiles ── */}
        {countsLoading ? (
          <Column lg={16} md={8} sm={4}>
            <Loading description="Loading counts…" withOverlay={false} />
          </Column>
        ) : (
          tiles.map(({ key, label, icon: Icon, count, section, color }) => (
            <Column key={key} lg={4} md={4} sm={4}>
              <Tile className={`dashboard-tile dashboard-tile--${color}`}>
                <div className="dashboard-tile__icon"><Icon size={32} /></div>
                <p className="dashboard-tile__count">{count}</p>
                <p className="dashboard-tile__label">{label}</p>
                <Button kind="primary" size="sm" onClick={() => setActiveSection(section)}>View {label}</Button>
              </Tile>
            </Column>
          ))
        )}

        {/* ── transformed leads report ── */}
        <Column lg={16} md={8} sm={4}>
          <div className="report-header">
            <h2 className="report-title">Transformed Leads Report</h2>
            <div className="report-controls">
              <Select id="period-select" labelText="Period" value={period} onChange={(e) => setPeriod(e.target.value)} hideLabel>
                {PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} text={o.label} />)}
              </Select>
              <Button kind="tertiary" size="sm" renderIcon={Download} onClick={handleDownload} disabled={reportRows.length === 0}>
                Download CSV
              </Button>
            </div>
          </div>

          {reportError && <InlineNotification kind="error" title={reportError} onClose={() => setReportError(null)} />}

          {reportLoading ? <Loading description="Loading report…" withOverlay={false} /> : (
            <DataTable rows={reportRows} headers={REPORT_HEADERS} isSortable>
              {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <Table {...getTableProps()} size="sm">
                  <TableHead>
                    <TableRow>
                      {headers.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={REPORT_HEADERS.length}>
                          <span style={{ color: 'var(--cds-text-placeholder)' }}>No transformed leads in this period.</span>
                        </TableCell>
                      </TableRow>
                    ) : rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          )}
        </Column>
      </Grid>
    </section>
  );
}

export default DashboardSection;
