import React, { useState } from 'react';
import { Table, Input, Select, Badge, Button, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { IntakeRequest } from '../services/dataService';
import { useGetOrdersQuery, useGetProvidersQuery } from '../store/apiSlice';

interface OrdersTabProps {
  onManageRequest: (order: IntakeRequest) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  onManageRequest
}) => {
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery();
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderGenderFilter, setOrderGenderFilter] = useState('all');

  const isDataLoading = ordersLoading || providersLoading;

  if (isDataLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Spin size="large" />
        <span className="label-overline">Fetching Orders Queue...</span>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.user_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.occasion.toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesGender = orderGenderFilter === 'all' || o.gender === orderGenderFilter;

    return matchesSearch && matchesStatus && matchesGender;
  });

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '2rem' }}>
        <p className="label-overline">Queue Intake</p>
        <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Styling Requests Queue</h2>
      </div>

      {/* Filter row */}
      <div className="management-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Input
          placeholder="Search client, occasion, styling preference..."
          prefix={<SearchOutlined />}
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
          style={{ maxWidth: '350px', height: '38px' }}
        />
        <Select
          defaultValue="all"
          style={{ width: '160px', height: '38px' }}
          onChange={value => setOrderStatusFilter(value)}
        >
          <Select.Option value="all">All Statuses</Select.Option>
          <Select.Option value="pending">Pending Review</Select.Option>
          <Select.Option value="assigned">Assigned</Select.Option>
          <Select.Option value="completed">Completed</Select.Option>
        </Select>
        <Select
          defaultValue="all"
          style={{ width: '160px', height: '38px' }}
          onChange={value => setOrderGenderFilter(value)}
        >
          <Select.Option value="all">All Demographics</Select.Option>
          <Select.Option value="Women">Women</Select.Option>
          <Select.Option value="Men">Men</Select.Option>
        </Select>
      </div>

      {/* Antd Table */}
      <Table
        rowKey="id"
        dataSource={filteredOrders}
        pagination={{ pageSize: 8 }}
        className="animate-fade-in premium-table"
        columns={[
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <code>{text}</code>
          },
          {
            title: 'Client Profiling',
            key: 'client',
            render: (_, record) => (
              <div>
                <div style={{ fontWeight: 600 }}>{record.user_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-mute)' }}>{record.user_email}</div>
              </div>
            )
          },
          {
            title: 'Occasion Context',
            dataIndex: 'occasion',
            key: 'occasion'
          },
          {
            title: 'Tier Budget',
            dataIndex: 'budget',
            key: 'budget',
            render: (text) => text || '—'
          },
          {
            title: 'Demo',
            dataIndex: 'gender',
            key: 'gender'
          },
          {
            title: 'Stylist Partner',
            key: 'stylist',
            render: (_, record) => {
              const prov = providers.find(p => p.id === record.assigned_stylist_id);
              return prov ? (
                <span>{prov.full_name}</span>
              ) : (
                <span style={{ fontStyle: 'italic', color: 'var(--color-mute)', fontSize: '0.85rem' }}>Unassigned</span>
              );
            }
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
              const colors: Record<string, string> = {
                pending: 'default',
                assigned: 'warning',
                completed: 'success'
              };
              return <Badge status={colors[status] as any} text={<span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink)' }}>{status}</span>} />;
            }
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
              <Button type="primary" size="small" onClick={() => onManageRequest(record)}>
                Manage Request
              </Button>
            )
          }
        ]}
      />
    </div>
  );
};
