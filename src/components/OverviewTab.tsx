import React from 'react';
import { Card, Row, Col, List, Button, Tag, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import {
  LuShoppingBag,
  LuInfo,
  LuFolder,
  LuUser
} from 'react-icons/lu';
import type { IntakeRequest } from '../services/dataService';
import { useGetCategoriesQuery, useGetProvidersQuery, useGetOrdersQuery } from '../store/apiSlice';

interface OverviewTabProps {
  onViewAllQueue: () => void;
  onManageRequest: (order: IntakeRequest) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onViewAllQueue,
  onManageRequest
}) => {
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery();
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();

  const isDataLoading = ordersLoading || providersLoading || categoriesLoading;

  if (isDataLoading) {
    return (
      <div className="animate-fade-in">
        {/* Banner Skeleton */}
        <div className="h-[180px] bg-[#FFFDF9] border border-line rounded-2xl mb-8 p-8 flex flex-col justify-between">
          <div>
            <Skeleton.Button active className="!w-[150px] !h-4 !mb-2" />
            <br />
            <Skeleton.Input active className="!w-[280px] !h-8" />
          </div>
          <Skeleton.Input active className="!w-[450px] !h-4" />
        </div>

        {/* KPI Cards Skeleton */}
        <Row gutter={[24, 24]} className="mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <div className="bg-[#FFFDF9] border border-line p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <Skeleton.Button active className="!w-[80px] !h-3 !mb-2" />
                  <Skeleton.Input active className="!w-[60px] !h-8" />
                </div>
                <Skeleton.Avatar active size={40} shape="square" className="!rounded-xl" />
              </div>
            </Col>
          ))}
        </Row>

        {/* List & Chart Skeleton */}
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={15}>
            <Card title="Recent Orders Queue" className="rounded-2xl border border-line bg-[#FFFDF9]">
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card title="Order Status Breakdown" className="rounded-2xl border border-line bg-[#FFFDF9]">
              <div className="flex flex-col items-center gap-6 py-4">
                <Skeleton.Avatar active size={100} shape="circle" />
                <Skeleton active paragraph={{ rows: 3 }} title={false} />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const assignedOrders = orders.filter(o => o.status === 'assigned').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalProviders = providers.length;
  const activeCategoriesCount = categories.filter(c => c.isActive).length;

  const statusPercentages = [
    totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0,
    totalOrders > 0 ? (assignedOrders / totalOrders) * 100 : 0,
    totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
  ];

  const circ = 314;
  let runningStroke = 0;

  return (
    <div className="animate-fade-up pb-8">
      {/* KPI Cards Grid */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-[#FFFDF9] border border-[#B8946A]/20 p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(58,46,36,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] text-mute uppercase tracking-widest font-semibold mb-0.5">Total Orders</p>
              <h3 className="text-2xl font-serif text-ink font-normal !m-0">{totalOrders}</h3>
              <p className="text-[0.65rem] text-emerald-600 mt-0.5 font-medium">Updated just now</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <LuShoppingBag size={18} />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-[#FFFDF9] border border-[#B8946A]/20 p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(58,46,36,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] text-mute uppercase tracking-widest font-semibold mb-0.5">Pending Review</p>
              <h3 className={`text-2xl font-serif font-normal !m-0 ${pendingOrders > 0 ? 'text-wine' : 'text-ink'}`}>{pendingOrders}</h3>
              <p className={`text-[0.65rem] mt-0.5 font-medium ${pendingOrders > 0 ? 'text-wine animate-pulse' : 'text-mute'}`}>
                {pendingOrders > 0 ? 'Requires attention' : 'All clear'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${pendingOrders > 0 ? 'bg-wine/10 text-wine' : 'bg-gold/10 text-gold'}`}>
              <LuInfo size={18} />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-[#FFFDF9] border border-[#B8946A]/20 p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(58,46,36,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] text-mute uppercase tracking-widest font-semibold mb-0.5">Stylist Partners</p>
              <h3 className="text-2xl font-serif text-ink font-normal !m-0">{totalProviders}</h3>
              <p className="text-[0.65rem] text-[#4A5D3F] mt-0.5 font-medium">On duty active</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <LuUser size={18} />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-[#FFFDF9] border border-[#B8946A]/20 p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(58,46,36,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] text-mute uppercase tracking-widest font-semibold mb-0.5">Active Categories</p>
              <h3 className="text-2xl font-serif text-ink font-normal !m-0">{activeCategoriesCount} <span className="text-base text-mute">/ {categories.length}</span></h3>
              <p className="text-[0.65rem] text-mute mt-0.5 font-medium">Service catalog layers</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <LuFolder size={18} />
            </div>
          </div>
        </Col>
      </Row>

      {/* Activity and Charts Row */}
      <Row gutter={[16, 16]}>
        {/* Recent Orders List */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                <span className="font-serif text-lg text-ink font-normal">Recent Orders Queue</span>
              </div>
            }
            extra={
              <Button type="link" onClick={onViewAllQueue} className="!text-gold hover:!text-ink !p-0 font-medium text-sm flex items-center gap-1">
                View Queue
              </Button>
            }
            className="premium-list-card rounded-2xl border border-line bg-[#FFFDF9] shadow-[0_4px_20px_-4px_rgba(58,46,36,0.03)]"
          >
            <List
              itemLayout="horizontal"
              dataSource={orders.slice(0, 5)}
              locale={{ emptyText: <div className="py-8 text-center text-mute italic">No active requests in queue</div> }}
              renderItem={(order) => {
                const clientInitials = order.user_name ? order.user_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
                const statusColors: Record<string, string> = {
                  pending: 'gold',
                  assigned: 'blue',
                  completed: 'success'
                };
                return (
                  <List.Item
                    className="hover:bg-[rgba(184,148,106,0.02)] transition-colors duration-200 rounded-lg px-3 py-2.5 !border-b !border-[#B8946A]/10 last:!border-none"
                    actions={[
                      <Button size="small" type="primary" className="!bg-ink hover:!bg-gold !border-none !rounded-[6px]" onClick={() => onManageRequest(order)}>
                        Review Details
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="w-10 h-10 rounded-full bg-ink text-gold flex items-center justify-center font-bold text-xs">
                          {clientInitials}
                        </div>
                      }
                      title={
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-[0.95rem] font-serif text-ink">{order.occasion}</strong>
                          <Tag className="capitalize !rounded-[10px] text-[0.65rem] !m-0 !px-2 py-0 border-none" color={statusColors[order.status] || 'default'}>
                            {order.status}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="text-[0.78rem] text-mute flex items-center gap-3 mt-1 flex-wrap">
                          <span>Client: <span className="font-medium text-ink">{order.user_name}</span></span>
                          <span>•</span>
                          <span>Demographic: <span className="font-medium text-ink capitalize">{order.gender}</span></span>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        {/* Donut breakdown chart */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                <span className="font-serif text-lg text-ink font-normal">Order Status Breakdown</span>
              </div>
            }
            className="premium-chart-card rounded-2xl border border-line bg-[#FFFDF9] shadow-[0_4px_20px_-4px_rgba(58,46,36,0.03)]"
          >
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center w-[130px] h-[130px]">
                <svg width="130" height="130" className="svg-donut transform -rotate-90">
                  <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-line)" strokeWidth="10" />

                  {/* Pending segment */}
                  {statusPercentages[0] > 0 && (
                    <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-mute)" strokeWidth="11" strokeDasharray={`${(statusPercentages[0] / 100) * circ} ${circ}`} strokeDashoffset={-runningStroke} strokeLinecap="round" />
                  )}
                  {(() => { runningStroke += (statusPercentages[0] / 100) * circ; return null; })()}

                  {/* Assigned segment */}
                  {statusPercentages[1] > 0 && (
                    <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-gold)" strokeWidth="11" strokeDasharray={`${(statusPercentages[1] / 100) * circ} ${circ}`} strokeDashoffset={-runningStroke} strokeLinecap="round" />
                  )}
                  {(() => { runningStroke += (statusPercentages[1] / 100) * circ; return null; })()}

                  {/* Completed segment */}
                  {statusPercentages[2] > 0 && (
                    <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-ink)" strokeWidth="11" strokeDasharray={`${(statusPercentages[2] / 100) * circ} ${circ}`} strokeDashoffset={-runningStroke} strokeLinecap="round" />
                  )}
                </svg>

                {/* Stats in the center */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-serif font-normal text-ink leading-none">{totalOrders}</span>
                  <span className="text-[0.62rem] text-mute uppercase tracking-wider font-semibold mt-1">Total</span>
                </div>
              </div>

              <div className="chart-legend grid-cols-1 mt-6 w-full px-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-ink">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-mute" />
                    <span>Pending Review</span>
                  </div>
                  <strong>{pendingOrders} ({Math.round(statusPercentages[0])}%)</strong>
                </div>

                <div className="flex items-center justify-between text-xs text-ink">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                    <span>In Progress</span>
                  </div>
                  <strong>{assignedOrders} ({Math.round(statusPercentages[1])}%)</strong>
                </div>

                <div className="flex items-center justify-between text-xs text-ink">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-ink" />
                    <span>Completed</span>
                  </div>
                  <strong>{completedOrders} ({Math.round(statusPercentages[2])}%)</strong>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Studio Quick Actions */}
      <div className="mt-8">
        <h4 className="font-serif text-lg text-ink font-normal mb-4">Quick Studio Actions</h4>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <button
              onClick={onViewAllQueue}
              className="w-full bg-[#FFFDF9] border border-[#B8946A]/20 hover:border-gold p-4 rounded-xl text-center transition-all duration-200 hover:shadow-sm cursor-pointer group flex flex-col items-center gap-2"
            >
              <span className="text-gold text-lg group-hover:scale-110 transition-transform duration-200">📋</span>
              <span className="text-xs font-semibold text-ink">Manage Queue</span>
            </button>
          </Col>
          <Col xs={12} sm={6}>
            <Link
              to="/providers"
              className="w-full bg-[#FFFDF9] border border-[#B8946A]/20 hover:border-gold p-4 rounded-xl text-center transition-all duration-200 hover:shadow-sm cursor-pointer group flex flex-col items-center gap-2 no-underline block"
            >
              <span className="text-gold text-lg group-hover:scale-110 transition-transform duration-200">🤝</span>
              <span className="text-xs font-semibold text-ink">Onboard Stylist</span>
            </Link>
          </Col>
          <Col xs={12} sm={6}>
            <Link
              to="/categories"
              className="w-full bg-[#FFFDF9] border border-[#B8946A]/20 hover:border-gold p-4 rounded-xl text-center transition-all duration-200 hover:shadow-sm cursor-pointer group flex flex-col items-center gap-2 no-underline block"
            >
              <span className="text-gold text-lg group-hover:scale-110 transition-transform duration-200">📁</span>
              <span className="text-xs font-semibold text-ink">Service Categories</span>
            </Link>
          </Col>
          <Col xs={12} sm={6}>
            <Link
              to="/rate-cards"
              className="w-full bg-[#FFFDF9] border border-[#B8946A]/20 hover:border-gold p-4 rounded-xl text-center transition-all duration-200 hover:shadow-sm cursor-pointer group flex flex-col items-center gap-2 no-underline block"
            >
              <span className="text-gold text-lg group-hover:scale-110 transition-transform duration-200">💳</span>
              <span className="text-xs font-semibold text-ink">Configure Pricing</span>
            </Link>
          </Col>
        </Row>
      </div>
    </div>
  );
};
