import React, { useState, useMemo } from 'react';
import { Modal, Button, Tag, Skeleton, Select, DatePicker, Popconfirm, message, Tooltip } from 'antd';
import { LuFileText, LuCalendar, LuCircleX, LuVideo, LuFilter } from 'react-icons/lu';
import dayjs from 'dayjs';
import type { IntakeRequest } from '../services/dataService';
import {
  useGetOrdersQuery,
  useGetProvidersQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation
} from '../store/apiSlice';
import { Table } from './common/Table';
import { RescheduleOrderModal } from './RescheduleOrderModal';

interface OrdersTabProps {
  onManageRequest: (order: IntakeRequest) => void;
}

const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' }
];

export const OrdersTab: React.FC<OrdersTabProps> = ({
  onManageRequest
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);

  // Reschedule Modal State
  const [rescheduleModalOrder, setRescheduleModalOrder] = useState<IntakeRequest | null>(null);

  // RTK Query hooks
  const queryArgs = useMemo(() => ({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    from: fromDate,
    to: toDate,
    search: searchQuery || undefined
  }), [statusFilter, fromDate, toDate, searchQuery]);

  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery(queryArgs);
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();

  const isDataLoading = ordersLoading || providersLoading;

  const handleStatusChange = (orderId: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return;
    Modal.confirm({
      title: 'Confirm Status Change',
      content: `Are you sure you want to change the order status from "${currentStatus}" to "${newStatus}"?`,
      okText: 'Update Status',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await updateOrderStatus({ id: orderId, status: newStatus }).unwrap();
          message.success(`Order status updated to ${newStatus}`);
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Failed to update status');
        }
      }
    });
  };

  const handleSoftCancel = async (orderId: string) => {
    try {
      await cancelOrder(orderId).unwrap();
      message.success('Booking cancelled successfully.');
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Failed to cancel booking');
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Booking & Timing',
      id: 'booking_timing',
      Cell: ({ row }: any) => {
        const record: IntakeRequest = row.original;
        const sessionDate = record.session_date ? dayjs(record.session_date).format('MMM DD, YYYY') : null;
        const createdDate = record.created_at ? dayjs(record.created_at).format('MMM DD, YYYY') : '';

        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold text-gold">
              #{record.id.slice(0, 8)}
            </span>
            <div className="text-[0.82rem] font-medium text-ink">
              {sessionDate ? `Session: ${sessionDate}` : `Booked: ${createdDate}`}
            </div>
            {(record.session_start_time || record.session_end_time) && (
              <div className="text-xs text-mute font-mono">
                {record.session_start_time || ''} {record.session_end_time ? `- ${record.session_end_time}` : ''}
              </div>
            )}
          </div>
        );
      }
    },
    {
      Header: 'Client Profile',
      id: 'client_profile',
      Cell: ({ row }: any) => {
        const record: IntakeRequest = row.original;
        const name = record.user_name || record.user?.full_name || 'Client';
        const email = record.user_email || record.user?.email || '—';
        const mobile = record.user?.mobile || '';

        return (
          <div className="flex flex-col gap-0.5">
            <strong className="text-[0.92rem] text-ink font-serif">{name}</strong>
            <span className="text-xs text-mute truncate max-w-[200px]" title={email}>{email}</span>
            {mobile && <span className="text-[0.78rem] text-mute">{mobile}</span>}
          </div>
        );
      }
    },
    {
      Header: 'Service & Partner',
      id: 'service_provider',
      Cell: ({ row }: any) => {
        const record: IntakeRequest = row.original;
        const providerName = record.provider?.full_name ||
          providers.find(p => p.id === record.assigned_stylist_id || p.id === record.provider_id)?.full_name ||
          'Unassigned';
        const rateCardTitle = record.rate_card?.name || record.occasion || 'Service Booking';
        const price = record.total_price || record.base_price || record.budget || record.rate_card?.price;

        return (
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div className="font-medium text-ink truncate max-w-[180px]" title={rateCardTitle}>
              {rateCardTitle}
            </div>
            <div className="text-xs text-mute flex items-center gap-2">
              <span>Partner: <strong className="text-ink">{providerName}</strong></span>
              {price && <span className="font-semibold text-gold">₹{price}</span>}
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Status & Session',
      id: 'status_session',
      Cell: ({ row }: any) => {
        const record: IntakeRequest = row.original;
        const rawStatus = (record.status || 'PENDING').toUpperCase();

        const statusTagConfig: Record<string, { color: string; label: string }> = {
          PENDING: { color: 'warning', label: 'PENDING' },
          CONFIRMED: { color: 'processing', label: 'CONFIRMED' },
          IN_PROGRESS: { color: 'purple', label: 'IN PROGRESS' },
          COMPLETED: { color: 'success', label: 'COMPLETED' },
          CANCELLED: { color: 'error', label: 'CANCELLED' },
          RESCHEDULED: { color: 'cyan', label: 'RESCHEDULED' },
          ASSIGNED: { color: 'processing', label: 'ASSIGNED' }
        };

        const config = statusTagConfig[rawStatus] || { color: 'default', label: rawStatus };

        return (
          <div className="flex flex-col gap-1.5 items-start">
            <Tag color={config.color} className="uppercase text-[0.65rem] tracking-[0.05em] font-semibold !m-0">
              {config.label}
            </Tag>
            {record.google_meet_event?.meet_link && (
              <a
                href={record.google_meet_event.meet_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <LuVideo size={13} /> Meet Link
              </a>
            )}
          </div>
        );
      }
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }: any) => {
        const record: IntakeRequest = row.original;
        const isCancelled = record.is_cancelled || (record.status || '').toUpperCase() === 'CANCELLED';

        return (
          <div className="flex flex-col gap-1.5 items-start">
            {/* Top Row: Action Buttons */}
            <div className="flex items-center gap-1.5">
              <Tooltip title="View Full Details">
                <Button
                  className="action-btn action-btn-view"
                  icon={<LuFileText size={15} />}
                  onClick={() => onManageRequest(record)}
                />
              </Tooltip>

              <Tooltip title="Reschedule Session">
                <Button
                  size="small"
                  icon={<LuCalendar size={14} />}
                  onClick={() => setRescheduleModalOrder(record)}
                  disabled={isCancelled}
                />
              </Tooltip>

              {!isCancelled && (
                <Popconfirm
                  title="Cancel Booking"
                  description="Are you sure you want to soft-cancel this booking?"
                  onConfirm={() => handleSoftCancel(record.id)}
                  okText="Yes, Cancel"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Soft Cancel Booking">
                    <Button
                      size="small"
                      danger
                      icon={<LuCircleX size={14} />}
                    />
                  </Tooltip>
                </Popconfirm>
              )}
            </div>

            {/* Bottom Row: Status Change Dropdown */}
            <Select
              size="small"
              value={(record.status || 'PENDING').toUpperCase()}
              onChange={(val) => handleStatusChange(record.id, (record.status || 'PENDING').toUpperCase(), val)}
              className="w-[125px]"
            >
              <Select.Option value="PENDING">PENDING</Select.Option>
              <Select.Option value="CONFIRMED">CONFIRMED</Select.Option>
              <Select.Option value="IN_PROGRESS">IN_PROGRESS</Select.Option>
              <Select.Option value="COMPLETED">COMPLETED</Select.Option>
              <Select.Option value="RESCHEDULED">RESCHEDULED</Select.Option>
              <Select.Option value="CANCELLED">CANCELLED</Select.Option>
            </Select>
          </div>
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
          <div className="flex justify-between mb-6">
            <Skeleton.Input active className="!w-[260px] !h-9" />
            <Skeleton.Input active className="!w-[180px] !h-9" />
          </div>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="label-overline">Queue Intake</p>
          <h2 className="text-2xl font-bold mt-0.5">Admin Bookings & Orders Queue</h2>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex items-center gap-3 flex-wrap bg-white p-2.5 rounded-xl border border-line shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-mute font-medium px-1">
            <LuFilter size={14} /> Filter:
          </div>

          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-[140px]"
            options={statusOptions}
          />

          <DatePicker
            placeholder="From Date"
            className="w-[130px]"
            onChange={(_d, dateString) => setFromDate(dateString ? String(dateString) : undefined)}
          />

          <DatePicker
            placeholder="To Date"
            className="w-[130px]"
            onChange={(_d, dateString) => setToDate(dateString ? String(dateString) : undefined)}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={orders}
        pageSize={20}
        onSearch={setSearchQuery}
      />

      {/* Reschedule Modal */}
      <RescheduleOrderModal
        visible={Boolean(rescheduleModalOrder)}
        order={rescheduleModalOrder}
        onCancel={() => setRescheduleModalOrder(null)}
      />
    </div>
  );
};
