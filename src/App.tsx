import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  ConfigProvider,
  message,
  Card,
  Input,
  Button,
  Drawer
} from 'antd';
import {
  LuLayoutDashboard,
  LuShoppingBag,
  LuFolder,
  LuUser,
  LuLogOut,
  LuCreditCard,
  LuMail,
  LuLock,
  LuMenu,
  LuClock
} from 'react-icons/lu';
import { useForm, Controller } from 'react-hook-form';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { useGetOrdersQuery } from './store/apiSlice';

// Modular components
import { OverviewTab } from './components/OverviewTab';
import { OrdersTab } from './components/OrdersTab';
import { CategoriesTab } from './components/CategoriesTab';
import { ProvidersTab } from './components/ProvidersTab';
import { RateCardsTab } from './components/RateCardsTab';
import { ProviderSlotsTab } from './components/ProviderSlotsTab';

// Shared details modal
import { OrderDetailsModal } from './components/OrderDetailsModal';
import type { IntakeRequest } from './services/dataService';

const { Sider, Content, Header } = Layout;

const tabTitles: Record<string, string> = {
  overview: 'Studio Overview',
  orders: 'Intake Queue',
  categories: 'Taxonomy System',
  providers: 'Stylist Partners',
  ratecards: 'Service Rates',
  slots: 'Provider Availability & Slots'
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

    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

    useEffect(() => {
      const handleResize = () => {
        const mobile = window.innerWidth < 992;
        setIsMobile(mobile);
        if (mobile) {
          setCollapsed(true); // Close drawer by default on mobile
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // run initially
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sidebarContent = (
      <div className="flex flex-col h-full">
        <div className={`sidebar-logo h-[54px] flex items-center border-b border-line box-border ${collapsed && !isMobile ? 'justify-center p-0' : 'justify-between px-4'}`}>
          {(collapsed && !isMobile) ? (
            <Button
              type="text"
              icon={<LuMenu size={22} />}
              onClick={() => setCollapsed(!collapsed)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-ink hover:bg-[rgba(127,109,94,0.08)] !border-none"
            />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif !m-0">Quvo</h2>
                <span className="text-[0.6rem] border border-gold text-gold px-1 font-medium uppercase tracking-wider">Studio</span>
              </div>
              {!isMobile && (
                <Button
                  type="text"
                  icon={<LuMenu size={18} />}
                  onClick={() => setCollapsed(!collapsed)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-ink hover:bg-[rgba(127,109,94,0.08)] !border-none"
                />
              )}
            </>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          onClick={({ key }) => {
            navigate(`/${key}`);
            if (isMobile) {
              setCollapsed(true);
            }
          }}
          className="sidebar-menu"
          items={[
            { key: 'overview', icon: <LuLayoutDashboard size={18} />, label: 'Overview' },
            { key: 'orders', icon: <LuShoppingBag size={18} />, label: `Orders (${pendingOrdersCount} pend)` },
            { key: 'categories', icon: <LuFolder size={18} />, label: 'Categories' },
            { key: 'providers', icon: <LuUser size={18} />, label: 'Providers' },
            { key: 'ratecards', icon: <LuCreditCard size={18} />, label: 'Rate Cards' },
            { key: 'slots', icon: <LuClock size={18} />, label: 'Provider Slots' }
          ]}
        />

        <div className={`sidebar-user border-t border-line mt-auto bg-[rgba(127,109,94,0.02)] flex ${collapsed && !isMobile ? 'py-4 px-0 flex-col gap-4 justify-center' : 'p-5 flex-row gap-0 justify-between'}`}>
          {!(collapsed && !isMobile) ? (
            <div className="user-info">
              <span className="name">Admin User</span>
              <span className="role">Senior Producer</span>
            </div>
          ) : null}
          <div className={`logout-btn ${collapsed && !isMobile ? 'mx-auto' : 'm-0'}`} title="Log Out" onClick={handleLogout}>
            <LuLogOut size={16} />
          </div>
        </div>
      </div>
    );

    return (
      <Layout className="dashboard-layout min-h-screen">
        {/* LEFT SIDEBAR NAVIGATION (Desktop: Sider, Mobile: Drawer overlay) */}
        {isMobile ? (
          <Drawer
            placement="left"
            closable={false}
            onClose={() => setCollapsed(true)}
            open={!collapsed}
            styles={{ body: { padding: 0, background: 'var(--color-paper)' } }}
            width={260}
          >
            {sidebarContent}
          </Drawer>
        ) : (
          <Sider
            width={230}
            collapsed={collapsed}
            onCollapse={(val) => setCollapsed(val)}
            collapsedWidth={70}
            trigger={null}
            className="dashboard-sidebar"
          >
            {sidebarContent}
          </Sider>
        )}

        {/* RIGHT SIDE: HEADER + CONTENT */}
        <Layout className="bg-transparent">
          <Header
            className={`!bg-bone !border-b !border-line flex items-center justify-between !h-[54px] !shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${isMobile ? '!px-3' : '!px-6'}`}
          >
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  type="text"
                  icon={<LuMenu size={20} />}
                  onClick={() => setCollapsed(!collapsed)}
                  className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-ink bg-[rgba(127,109,94,0.05)] mr-1"
                />
              )}
              <h3 className="!m-0 font-serif text-[1.25rem] text-ink capitalize">
                {tabTitles[currentKey] || 'Workspace'}
              </h3>
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
              <Route path="/slots" element={<ProviderSlotsTab />} />
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
    return <div className="min-h-screen flex items-center justify-center bg-paper">Loading Studio Configuration...</div>;
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
                      <Input {...field} prefix={<LuMail size={16} className="text-mute" />} placeholder="e.g. admin@quvo.in" />
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
                      <Input.Password {...field} prefix={<LuLock size={16} className="text-mute" />} placeholder="Enter password" />
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
                  <Button type="primary" htmlType="submit" block className="h-[42px] tracking-[0.08em] uppercase">
                    Enter Studio
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          <BrowserRouter>
            <DashboardRoutes
              pendingOrdersCount={pendingOrdersCount}
              handleLogout={handleLogout}
              handleOpenOrderDetails={handleOpenOrderDetails}
              showOrderModal={showOrderModal}
              selectedOrder={selectedOrder}
              setShowOrderModal={setShowOrderModal}
              setSelectedOrder={setSelectedOrder}
            />
          </BrowserRouter>
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
