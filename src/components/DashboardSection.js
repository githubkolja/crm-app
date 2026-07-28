import React from 'react';
import {
  Button,
  Tile,
  Grid,
  Column,
  Loading,
} from '@carbon/react';
import { UserFollow, Partnership, User } from '@carbon/icons-react';
import { getLeads, getOpportunities, getClients } from '../services/crmService';
import './DashboardSection.scss';

function DashboardSection({ setActiveSection }) {
  const [counts, setCounts] = React.useState({ leads: 0, opportunities: 0, clients: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([getLeads(), getOpportunities(), getClients()]).then(
      ([l, o, c]) => {
        setCounts({
          leads: l.data?.length ?? 0,
          opportunities: o.data?.length ?? 0,
          clients: c.data?.length ?? 0,
        });
        setLoading(false);
      }
    );
  }, []);

  const tiles = [
    { key: 'leads', label: 'Leads', icon: UserFollow, count: counts.leads, section: 'leads' },
    { key: 'opportunities', label: 'Opportunities', icon: Partnership, count: counts.opportunities, section: 'opportunities' },
    { key: 'clients', label: 'Clients', icon: User, count: counts.clients, section: 'clients' },
  ];

  return (
    <section className="dashboard-section">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h1 className="dashboard-title">CRM Dashboard</h1>
          <p className="dashboard-subtitle">Manage your leads, opportunities, and clients.</p>
        </Column>
        {loading ? (
          <Column lg={16} md={8} sm={4}>
            <Loading description="Loading counts…" withOverlay={false} />
          </Column>
        ) : (
          tiles.map(({ key, label, icon: Icon, count, section }) => (
            <Column key={key} lg={5} md={4} sm={4}>
              <Tile className="dashboard-tile">
                <div className="dashboard-tile__icon">
                  <Icon size={32} />
                </div>
                <p className="dashboard-tile__count">{count}</p>
                <p className="dashboard-tile__label">{label}</p>
                <Button
                  kind="primary"
                  size="sm"
                  onClick={() => setActiveSection(section)}
                >
                  View {label}
                </Button>
              </Tile>
            </Column>
          ))
        )}
      </Grid>
    </section>
  );
}

export default DashboardSection;
