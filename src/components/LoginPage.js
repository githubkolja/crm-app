import React from 'react';
import { Button, TextInput, Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react';
import { Login } from '@carbon/icons-react';
import { supabase } from '../lib/supabaseClient';
import { signInWithGoogle } from '../services/authService';
import './LoginPage.scss';

function LoginPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [info, setInfo] = React.useState(null);

  // email/password fields
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function handleEmailSignIn(e) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    else setInfo('Account created! Check your email to confirm (or sign in if confirmation is disabled).');
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true); setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err.message); setLoading(false); }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-card__eyebrow">IBM CRM</p>
        <h1 className="login-card__title">Sign in to continue</h1>
        <p className="login-card__body">Access your leads, opportunities, and clients.</p>

        {error && <p className="login-card__error">{error}</p>}
        {info  && <p className="login-card__info">{info}</p>}

        <Tabs>
          <TabList aria-label="Login options">
            <Tab>Email / Password</Tab>
            <Tab>Google</Tab>
          </TabList>
          <TabPanels>
            {/* ── Email tab ── */}
            <TabPanel>
              <form className="login-form" onSubmit={handleEmailSignIn}>
                <TextInput
                  id="login-email"
                  labelText="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <TextInput
                  id="login-password"
                  labelText="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="login-form__actions">
                  <Button kind="primary" type="submit" disabled={loading} renderIcon={Login}>
                    {loading ? 'Signing in…' : 'Sign in'}
                  </Button>
                  <Button kind="ghost" type="button" disabled={loading} onClick={handleEmailSignUp}>
                    Create account
                  </Button>
                </div>
              </form>
            </TabPanel>

            {/* ── Google tab ── */}
            <TabPanel>
              <div className="login-form">
                <p className="login-card__body" style={{ marginBottom: 0 }}>
                  Sign in with your Google account. Requires Google OAuth to be configured in Supabase.
                </p>
                <Button kind="primary" disabled={loading} renderIcon={Login} onClick={handleGoogleSignIn}>
                  {loading ? 'Redirecting…' : 'Continue with Google'}
                </Button>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}

export default LoginPage;
