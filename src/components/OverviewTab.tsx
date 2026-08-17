import React from 'react';
import { Card, Row, Col, Statistic, List, Button, Space, Skeleton } from 'antd';
import {
  ShoppingOutlined,
  InfoCircleOutlined,
  FolderOutlined,
  UserOutlined
} from '@ant-design/icons';
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
        <div style={{ marginBottom: '2rem' }}>
          <Skeleton.Button active style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
          <br />
          <Skeleton.Input active style={{ width: '380px', height: '40px' }} />
        </div>

        {/* KPI Cards Skeleton */}
        <Row gutter={[24, 24]} className="kpi-row" style={{ marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card className="premium-kpi-card" styles={{ body: { padding: '1.25rem' } }}>
                <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
              </Card>
            </Col>
          ))}
        </Row>

        {/* List & Chart Skeleton */}
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={15}>
            <Card title="Recent Orders Queue">
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card title="Order Status Breakdown">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
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
    <div className="animate-fade-up">
      <div style={{ marginBottom: '2rem' }}>
        <p className="label-overline">Dashboard Overview</p>
        <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Welcome to QUVO Studio.</h2>
      </div>

      {/* KPI Cards Grid */}
      <Row gutter={[24, 24]} className="kpi-row">
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable styles={{ body: { padding: '1.25rem' } }} className="premium-kpi-card">
            <div className="kpi-card-inner">
              <Statistic title={<span className="label-overline">Total Orders</span>} value={totalOrders} valueStyle={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }} />
              <div className="kpi-icon cocoa"><ShoppingOutlined style={{ fontSize: '20px' }} /></div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable styles={{ body: { padding: '1.25rem' } }} className="premium-kpi-card">
            <div className="kpi-card-inner">
              <Statistic title={<span className="label-overline">Pending Review</span>} value={pendingOrders} valueStyle={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: pendingOrders > 0 ? 'var(--color-wine)' : 'inherit' }} />
              <div className="kpi-icon wine"><InfoCircleOutlined style={{ fontSize: '20px' }} /></div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable styles={{ body: { padding: '1.25rem' } }} className="premium-kpi-card">
            <div className="kpi-card-inner">
              <Statistic title={<span className="label-overline">Stylist Partner Directory</span>} value={totalProviders} valueStyle={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }} />
              <div className="kpi-icon gold"><UserOutlined style={{ fontSize: '20px' }} /></div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable styles={{ body: { padding: '1.25rem' } }} className="premium-kpi-card">
            <div className="kpi-card-inner">
              <Statistic title={<span className="label-overline">Active Categories</span>} value={activeCategoriesCount} suffix={`/ ${categories.length}`} valueStyle={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }} />
              <div className="kpi-icon moss"><FolderOutlined style={{ fontSize: '20px' }} /></div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Activity and Charts Row */}
      <Row gutter={[32, 32]}>
        {/* Recent Orders List */}
        <Col xs={24} lg={15}>
          <Card title="Recent Orders Queue" extra={<Button type="link" onClick={onViewAllQueue} style={{ color: 'var(--color-gold)' }}>View All Queue</Button>} className="premium-list-card">
            <List
              itemLayout="horizontal"
              dataSource={orders.slice(0, 5)}
              renderItem={(order) => (
                <List.Item
                  actions={[
                    <Button size="small" type="primary" onClick={() => onManageRequest(order)}>Details</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={<strong style={{ fontSize: '0.95rem' }}>{order.occasion}</strong>}
                    description={
                      <Space split={<span style={{ color: 'var(--color-line)' }}>|</span>} style={{ fontSize: '0.8rem', color: 'var(--color-mute)' }}>
                        <span>Client: {order.user_name}</span>
                        <span>Demo: {order.gender}</span>
                        <span>Status: <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{order.status}</span></span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Donut breakdown chart */}
        <Col xs={24} lg={9}>
          <Card title="Order Status Breakdown" className="overview-breakdown-panel premium-chart-card">
            <div className="overview-svg-donut-container">
              <svg width="130" height="130" className="svg-donut">
                <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-line)" strokeWidth="12" />

                {/* Pending segment */}
                {statusPercentages[0] > 0 && (
                  <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-mute)" strokeWidth="13" strokeDasharray={`${(statusPercentages[0] / 100) * circ} ${circ}`} strokeDashoffset={-runningStroke} />
                )}
                {(() => { runningStroke += (statusPercentages[0] / 100) * circ; return null; })()}

                {/* Assigned segment */}
                {statusPercentages[1] > 0 && (
                  <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-gold)" strokeWidth="13" strokeDasharray={`${(statusPercentages[1] / 100) * circ} ${circ}`} strokeDashoffset={-runningStroke} />
                )}
                {(() => { runningStroke += (statusPercentages[1] / 100) * circ; return null; })()}

                {/* Completed segment */}
                {statusPercentages[2] > 0 && (
                  <circle cx="65" cy="65" r="45" fill="transparent" stroke="var(--color-ink)" strokeWidth="13" strokeDasharray={`${(statusPercentages[2] / 100) * circ} ${circ}`} strokeDashoffset={-runningStroke} />
                )}
              </svg>

              <div className="chart-legend" style={{ gridTemplateColumns: '1fr', marginTop: '1.25rem' }}>
                <div className="legend-item"><div className="legend-color" style={{ background: 'var(--color-mute)' }} /> Pending Review: <strong>{pendingOrders}</strong> ({Math.round(statusPercentages[0])}%)</div>
                <div className="legend-item"><div className="legend-color" style={{ background: 'var(--color-gold)' }} /> In Progress: <strong>{assignedOrders}</strong> ({Math.round(statusPercentages[1])}%)</div>
                <div className="legend-item"><div className="legend-color" style={{ background: 'var(--color-ink)' }} /> Completed (Lookbook): <strong>{completedOrders}</strong> ({Math.round(statusPercentages[2])}%)</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
