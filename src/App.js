import React from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Content,
  Theme,
} from '@carbon/react';
import { Logout, UserAvatar } from '@carbon/icons-react';
import { getSession, onAuthStateChange, signOut } from './services/authService';
import LoginPage from './components/LoginPage';
import DashboardSection from './components/DashboardSection';
import LeadsSection from './components/LeadsSection';
import OpportunitiesSection from './components/OpportunitiesSection';
import DealsSection from './components/DealsSection';
import ClientsSection from './components/ClientsSection';
import './App.scss';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'leads', label: 'Leads' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'deals', label: 'Deals' },
  { key: 'clients', label: 'Clients' },
];

function App() {
  const [session, setSession] = React.useState(undefined); // undefined = loading
  const [activeSection, setActiveSection] = React.useState('dashboard');

  React.useEffect(() => {
    getSession().then(setSession);
    const subscription = onAuthStateChange(setSession);
    return () => subscription.unsubscribe();
  }, []);

  // Still determining auth state
  if (session === undefined) return null;

  // Not logged in
  if (!session) return <LoginPage />;

  function renderSection() {
    switch (activeSection) {
      case 'leads': return <LeadsSection />;
      case 'opportunities': return <OpportunitiesSection />;
      case 'deals': return <DealsSection />;
      case 'clients': return <ClientsSection />;
      default: return <DashboardSection setActiveSection={setActiveSection} />;
    }
  }

  return (
    <Theme theme="white">
      <div className="app-container">
        <Header aria-label="Lead Force">
          <SkipToContent />
          <HeaderName href="/" prefix="Newgroupe">Lead Force</HeaderName>
          <HeaderNavigation aria-label="Main navigation">
            {NAV_ITEMS.map(({ key, label }) => (
              <HeaderMenuItem
                key={key}
                href="#"
                isCurrentPage={activeSection === key}
                onClick={(e) => { e.preventDefault(); setActiveSection(key); }}
              >
                {label}
              </HeaderMenuItem>
            ))}
          </HeaderNavigation>
          <HeaderGlobalBar>
            <HeaderGlobalAction aria-label={session.user.email} tooltipAlignment="end">
              <UserAvatar size={20} />
            </HeaderGlobalAction>
            <HeaderGlobalAction aria-label="Sign out" tooltipAlignment="end" onClick={signOut}>
              <Logout size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </Header>
        <Content className="main-content">
          {renderSection()}
        </Content>
      </div>
    </Theme>
  );
}

export default App;
