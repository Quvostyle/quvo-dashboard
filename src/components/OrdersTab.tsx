import React, { useMemo } from 'react';
import { Button, Tag, Skeleton } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type { IntakeRequest } from '../services/dataService';
import { useGetOrdersQuery, useGetProvidersQuery } from '../store/apiSlice';
import { Table } from './common/Table';

interface OrdersTabProps {
  onManageRequest: (order: IntakeRequest) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  onManageRequest
}) => {
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery();
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  const isDataLoading = ordersLoading || providersLoading;


  const columns = useMemo(() => [
    {
      Header: 'ID',
      accessor: 'id',
      Cell: ({ value }: any) => <code>{value.slice(0, 8)}</code>
    },
    {
      Header: 'Client Profiling',
      accessor: 'user_name',
      Cell: ({ value, row }: any) => {
        const record = row.original;
        return (
          <div>
            <a
              href={`#client-details-${record.id}`}
              style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-gold)',
                textDecoration: 'none'
              }}
            >
              {value}
            </a>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-mute)' }}>
              {record.user_email}
            </span>
          </div>
        );
      }
    },
    {
      Header: 'Occasion Context',
      accessor: 'occasion',
      Cell: ({ value, row }: any) => {
        const record = row.original;
        return (
          <div>
            <span style={{ display: 'block', fontWeight: 500 }}>{value}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-mute)' }}>
              {record.location_preference}
            </span>
          </div>
        );
      }
    },
    {
      Header: 'Tier Budget',
      accessor: 'budget',
      Cell: ({ value }: any) => <strong style={{ fontFamily: 'var(--font-serif)' }}>{value}</strong>
    },
    {
      Header: 'Demo',
      accessor: 'gender',
      Cell: ({ value }: any) => <span style={{ textTransform: 'capitalize' }}>{value}</span>
    },
    {
      Header: 'Stylist Partner',
      accessor: 'provider_id',
      Cell: ({ value }: any) => {
        const provider = providers.find((p) => p.id === value);
        return provider ? (
          <strong>{provider.full_name}</strong>
        ) : (
          <span style={{ color: 'var(--color-mute)', fontStyle: 'italic' }}>Unassigned</span>
        );
      }
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }: any) => {
        let color = 'default';
        if (value === 'pending') color = 'warning';
        if (value === 'assigned') color = 'processing';
        if (value === 'completed') color = 'success';
        return (
          <Tag
            color={color}
            style={{
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              fontWeight: 600
            }}
          >
            {value}
          </Tag>
        );
      }
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <Button
            className="action-btn bg-cocoa/8 text-cocoa hover:bg-cocoa/15"
            icon={<FileTextOutlined style={{ fontSize: '15px' }} />}
            onClick={() => onManageRequest(record)}
            title="View Details"
          />
        );
      }
    }
  ], [providers, onManageRequest]);

  if (isDataLoading) {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <Skeleton.Button active style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
          <br />
          <Skeleton.Input active style={{ width: '300px', height: '40px' }} />
        </div>

        {/* Table Page Skeleton */}
        <div className="bg-white p-6 rounded-lg border border-line shadow-sm">
          {/* Mock Search/Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <Skeleton.Input active style={{ width: '260px', height: '36px' }} />
            <Skeleton.Input active style={{ width: '180px', height: '36px' }} />
          </div>
          {/* Mock Table Rows */}
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '2rem' }}>
        <p className="label-overline">Queue Intake</p>
        <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Styling Requests Queue</h2>
      </div>

      <Table
        columns={columns}
        data={orders}
        pageSize={10}
      />
    </div>
  );
};
