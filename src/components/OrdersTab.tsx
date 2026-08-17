import React, { useMemo } from 'react';
import { Button, Tag, Skeleton } from 'antd';
import { LuFileText } from 'react-icons/lu';
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
      Header: 'Client Profile & ID',
      id: 'client_profile',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <a
              href={`#client-details-${record.id}`}
              style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--color-gold)',
                textDecoration: 'none'
              }}
            >
              {record.user_name}
            </a>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-mute)' }}>
              <code>{record.id.slice(0, 8)}</code> • {record.user_email}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-mute)' }}>
              Gender: <span style={{ textTransform: 'capitalize', color: 'var(--color-ink)', fontWeight: 500 }}>{record.gender}</span> • Budget: <strong style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}>{record.budget}</strong>
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Occasion & Preference',
      id: 'occasion_preference',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem' }}>
            <div><span style={{ color: 'var(--color-mute)' }}>Occasion:</span> <strong style={{ color: 'var(--color-ink)' }}>{record.occasion}</strong></div>
            <div><span style={{ color: 'var(--color-mute)' }}>Location:</span> <span style={{ color: 'var(--color-ink)' }}>{record.location_preference}</span></div>
          </div>
        );
      }
    },
    {
      Header: 'Assignment & Status',
      id: 'assignment_status',
      Cell: ({ row }: any) => {
        const record = row.original;
        const provider = providers.find((p) => p.id === record.provider_id);
        let statusColor = 'default';
        if (record.status === 'pending') statusColor = 'warning';
        if (record.status === 'assigned') statusColor = 'processing';
        if (record.status === 'completed') statusColor = 'success';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--color-mute)' }}>Stylist:</span>{' '}
              {provider ? (
                <strong style={{ color: 'var(--color-ink)' }}>{provider.full_name}</strong>
              ) : (
                <span style={{ color: 'var(--color-mute)', fontStyle: 'italic' }}>Unassigned</span>
              )}
            </div>
            <div>
              <Tag
                color={statusColor}
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  margin: 0
                }}
              >
                {record.status}
              </Tag>
            </div>
          </div>
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
            className="action-btn action-btn-view"
            icon={<LuFileText size={15} />}
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
