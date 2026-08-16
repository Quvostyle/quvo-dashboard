import { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  ConfigProvider,
  message,
  Card,
  Form,
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

const { Sider, Content } = Layout;

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Shared Modal State
  const [selectedOrder, setSelectedOrder] = useState<IntakeRequest | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // RTK Query hook to get pending orders count
  const { data: orders = [] } = useGetOrdersQuery(undefined, { skip: !isAuthenticated });
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  // Login Form
  const [loginForm] = Form.useForm();

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
          colorPrimary: '#3A2E24',
          colorBgBase: '#FAF8F3',
          colorTextBase: '#3A2E24',
          borderRadius: 0,
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

              <Form
                name="login-form"
                form={loginForm}
                layout="vertical"
                onFinish={handleLogin}
                requiredMark={false}
              >
                <Form.Item
                  name="email"
                  label="Administrative Email"
                  rules={[{ required: true, message: 'Please input admin email.' }, { type: 'email', message: 'Input valid email.' }]}
                >
                  <Input prefix={<MailOutlined style={{ color: 'var(--color-mute)' }} />} placeholder="e.g. admin@quvo.in" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Administrative Password"
                  rules={[{ required: true, message: 'Please input admin password.' }]}
                  extra="Tip: Try admin@quvo.in / admin123"
                >
                  <Input.Password prefix={<LockOutlined style={{ color: 'var(--color-mute)' }} />} placeholder="Enter password" />
                </Form.Item>

                <Form.Item style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" block style={{ height: '42px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Enter Studio
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        ) : (

          /* AUTHENTICATED DASHBOARD LAYOUT */
          <Layout className="dashboard-layout">

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
                selectedKeys={[activeTab]}
                onClick={({ key }) => setActiveTab(key)}
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

            {/* CONTENT AREA */}
            <Content className="dashboard-content-area animate-fade-in">
              <>
                {activeTab === 'overview' && (
                  <OverviewTab
                    onViewAllQueue={() => setActiveTab('orders')}
                    onManageRequest={handleOpenOrderDetails}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrdersTab
                    onManageRequest={handleOpenOrderDetails}
                  />
                )}

                {activeTab === 'categories' && (
                  <CategoriesTab />
                )}

                {activeTab === 'providers' && (
                  <ProvidersTab />
                )}

                {activeTab === 'ratecards' && (
                  <RateCardsTab />
                )}
              </>
            </Content>
          </Layout>
        )}
      </div>

      {/* ================= SHARED DETAILS MODAL ================= */}
      <OrderDetailsModal
        visible={showOrderModal}
        selectedOrder={selectedOrder}
        onCancel={() => setShowOrderModal(false)}
        onOrderUpdated={(updated) => setSelectedOrder(updated)}
      />
    </ConfigProvider>
  );
}

export default App;
