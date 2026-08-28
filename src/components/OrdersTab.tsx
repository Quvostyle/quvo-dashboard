import React, { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery(searchQuery);
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  const isDataLoading = ordersLoading || providersLoading;


  const columns = useMemo(() => [
    {
      Header: 'Client Profile & ID',
      id: 'client_profile',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <div className="flex flex-col gap-1">
            <a
              href={`#client-details-${record.id}`}
              className="block text-[0.95rem] font-semibold text-gold no-underline"
            >
              {record.user_name}
            </a>
            <div className="text-xs text-mute">
              <code>{record.id.slice(0, 8)}</code> • {record.user_email}
            </div>
            <div className="text-[0.8rem] text-mute">
              Gender: <span className="capitalize text-ink font-medium">{record.gender}</span> • Budget: <strong className="text-ink font-serif">{record.budget}</strong>
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
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div><span className="text-mute">Occasion:</span> <strong className="text-ink">{record.occasion}</strong></div>
            <div><span className="text-mute">Location:</span> <span className="text-ink">{record.location_preference}</span></div>
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
          <div className="flex flex-col gap-1.5 text-[0.85rem]">
            <div>
              <span className="text-mute">Stylist:</span>{' '}
              {provider ? (
                <strong className="text-ink">{provider.full_name}</strong>
              ) : (
                <span className="text-mute italic">Unassigned</span>
              )}
            </div>
            <div>
              <Tag
                color={statusColor}
                className="uppercase text-[0.65rem] tracking-[0.05em] font-semibold !m-0"
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
        <div className="mb-8">
          <Skeleton.Button active className="!w-[120px] !h-3.5 !mb-2" />
          <br />
          <Skeleton.Input active className="!w-[300px] !h-10" />
        </div>

        {/* Table Page Skeleton */}
        <div className="bg-white p-6 rounded-lg border border-line shadow-sm">
          {/* Mock Search/Filter Bar */}
          <div className="flex justify-between mb-6">
            <Skeleton.Input active className="!w-[260px] !h-9" />
            <Skeleton.Input active className="!w-[180px] !h-9" />
          </div>
          {/* Mock Table Rows */}
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-3.5">
        <p className="label-overline">Queue Intake</p>
        <h2 className="text-2xl font-bold mt-0.5">Styling Requests Queue</h2>
      </div>

      <Table
        columns={columns}
        data={orders}
        pageSize={20}
        onSearch={setSearchQuery}
      />
    </div>
  );
};
