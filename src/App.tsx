import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  ConfigProvider,
  message,
  Card,
  Input,
  Button
} from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FolderOutlined,
  UserOutlined,
  LogoutOutlined,
  CreditCardOutlined,
  MailOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { useGetOrdersQuery } from './store/apiSlice';

// Modular components
import { OverviewTab } from './components/OverviewTab';
import { OrdersTab } from './components/OrdersTab';
import { CategoriesTab } from './components/CategoriesTab';
import { ProvidersTab } from './components/ProvidersTab';
import { RateCardsTab } from './components/RateCardsTab';

// Shared details modal
import { OrderDetailsModal } from './components/OrderDetailsModal';
import type { IntakeRequest } from './services/dataService';

const { Sider, Content, Header } = Layout;

const tabTitles: Record<string, string> = {
  overview: 'Studio Overview',
  orders: 'Intake Queue',
  categories: 'Taxonomy System',
  providers: 'Stylist Partners',
  ratecards: 'Service Rates'
};

const DashboardRoutes: React.FC<{
  pendingOrdersCount: number;
  handleLogout: () => void;
  handleOpenOrderDetails: (order: IntakeRequest) => void;
  showOrderModal: boolean;
  selectedOrder: IntakeRequest | null;
  setShowOrderModal: (show: boolean) => void;
  setSelectedOrder: (order: IntakeRequest | null) => void;
}> = ({
  pendingOrdersCount,
  handleLogout,
  handleOpenOrderDetails,
  showOrderModal,
  selectedOrder,
  setShowOrderModal,
  setSelectedOrder
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentKey = location.pathname.replace('/', '') || 'overview';

  return (
    <Layout className="dashboard-layout min-h-screen">
      {/* LEFT SIDEBAR NAVIGATION */}
      <Sider
        width={260}
        breakpoint="lg"
        collapsedWidth="0"
        className="dashboard-sidebar"
      >
        <div className="sidebar-logo">
          <h2>Quvo</h2>
          <span>Studio</span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          onClick={({ key }) => navigate(`/${key}`)}
          className="sidebar-menu"
          items={[
            { key: 'overview', icon: <DashboardOutlined />, label: 'Overview' },
            { key: 'orders', icon: <ShoppingOutlined />, label: `Orders (${pendingOrdersCount} pend)` },
            { key: 'categories', icon: <FolderOutlined />, label: 'Categories' },
            { key: 'providers', icon: <UserOutlined />, label: 'Providers' },
            { key: 'ratecards', icon: <CreditCardOutlined />, label: 'Rate Cards' }
          ]}
        />

        <div className="sidebar-user">
          <div className="user-info">
            <span className="name">Admin User</span>
            <span className="role">Senior Producer</span>
          </div>
          <div className="logout-btn" title="Log Out" onClick={handleLogout}>
            <LogoutOutlined style={{ fontSize: '16px' }} />
          </div>
        </div>
      </Sider>

      {/* RIGHT SIDE: HEADER + CONTENT */}
      <Layout style={{ background: 'transparent' }}>
        <Header
          style={{
            background: 'var(--color-bone)',
            borderBottom: '1px solid var(--color-line)',
            padding: '0 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-ink)', textTransform: 'capitalize' }}>
              {tabTitles[currentKey] || 'Workspace'}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="label-overline" style={{ fontSize: '0.65rem', border: '1px solid var(--color-line)', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--color-paper)' }}>
              Production Env
            </span>
          </div>
        </Header>

        {/* CONTENT AREA */}
        <Content className="dashboard-content-area animate-fade-in">
          <Routes>
            <Route
              path="/overview"
              element={
                <OverviewTab
                  onViewAllQueue={() => navigate('/orders')}
                  onManageRequest={handleOpenOrderDetails}
                />
              }
            />
            <Route
              path="/orders"
              element={
                <OrdersTab
                  onManageRequest={handleOpenOrderDetails}
                />
              }
            />
            <Route path="/categories" element={<CategoriesTab />} />
            <Route path="/providers" element={<ProvidersTab />} />
            <Route path="/ratecards" element={<RateCardsTab />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </Content>
      </Layout>

      {/* ================= SHARED DETAILS MODAL ================= */}
      <OrderDetailsModal
        visible={showOrderModal}
        selectedOrder={selectedOrder}
        onCancel={() => setShowOrderModal(false)}
        onOrderUpdated={(updated) => setSelectedOrder(updated)}
      />
    </Layout>
  );
};

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Shared Modal State
  const [selectedOrder, setSelectedOrder] = useState<IntakeRequest | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // RTK Query hook to get pending orders count
  const { data: orders = [] } = useGetOrdersQuery(undefined, { skip: !isAuthenticated });
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  // Login Form using react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    const authSession = localStorage.getItem('quvo_admin_auth');
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }
    setAuthLoading(false);
  }, []);

  const handleLogin = (values: any) => {
    const { email, password } = values;
    if (email === 'admin@quvo.in' && password === 'admin123') {
      localStorage.setItem('quvo_admin_auth', 'true');
      setIsAuthenticated(true);
      message.success('Welcome back, Admin.');
    } else {
      message.error('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quvo_admin_auth');
    setIsAuthenticated(false);
    message.info('Logged out successfully.');
  };

  const handleOpenOrderDetails = (order: IntakeRequest) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F3' }}>Loading Studio Configuration...</div>;
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#B8946A',
          colorBgBase: '#ffffff',
          colorTextBase: '#1f2937',
          borderRadius: 6,
          fontFamily: "'Outfit', sans-serif",
        },
      }}
    >
      <div className="app-container grain">
        {/* LOGIN SCREEN */}
        {!isAuthenticated ? (
          <div className="login-container">
            <Card className="login-card animate-fade-up">
              <div className="login-logo">
                <h1>Quvo</h1>
                <p>Studio Admin Access</p>
              </div>

              <form
                onSubmit={handleSubmit(handleLogin)}
                className="space-y-4"
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administrative Email
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: 'Please input admin email.',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Input valid email.'
                      }
                    }}
                    render={({ field }) => (
                      <Input {...field} prefix={<MailOutlined style={{ color: 'var(--color-mute)' }} />} placeholder="e.g. admin@quvo.in" />
                    )}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-sm block mt-1">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administrative Password
                  </label>
                  <Controller
                    name="password"
                    control={control}
                    rules={{ required: 'Please input admin password.' }}
                    render={({ field }) => (
                      <Input.Password {...field} prefix={<LockOutlined style={{ color: 'var(--color-mute)' }} />} placeholder="Enter password" />
                    )}
                  />
                  {errors.password && (
                    <span className="text-red-500 text-sm block mt-1">
                      {errors.password.message}
                    </span>
                  )}
                  <span className="text-gray-500 text-xs block mt-1">
                    Tip: Try admin@quvo.in / admin123
                  </span>
                </div>

                <div className="pt-2">
                  <Button type="primary" htmlType="submit" block style={{ height: '42px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Enter Studio
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          <HashRouter>
            <DashboardRoutes
              pendingOrdersCount={pendingOrdersCount}
              handleLogout={handleLogout}
              handleOpenOrderDetails={handleOpenOrderDetails}
              showOrderModal={showOrderModal}
              selectedOrder={selectedOrder}
              setShowOrderModal={setShowOrderModal}
              setSelectedOrder={setSelectedOrder}
            />
          </HashRouter>
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
