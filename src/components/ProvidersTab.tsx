import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Modal, Form, message, Avatar, Skeleton } from 'antd';
import { LuPlus, LuPencil, LuTrash2, LuMail, LuPhone, LuHouse } from 'react-icons/lu';
import type { Provider } from '../services/dataService';
import {
  useGetProvidersQuery,
  useAddProviderMutation,
  useUpdateProviderMutation,
  useDeleteProviderMutation
} from '../store/apiSlice';
import { ProviderModal } from './ProviderModal';
import { Table } from './common/Table';

export const ProvidersTab: React.FC = () => {
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  const [addProvider] = useAddProviderMutation();
  const [updateProvider] = useUpdateProviderMutation();
  const [deleteProvider] = useDeleteProviderMutation();



  // Provider Modal State (Add/Edit)
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerForm] = Form.useForm();
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);

  const handleOpenAddProvider = () => {
    setEditingProviderId(null);
    providerForm.resetFields();
    setShowProviderModal(true);
  };

  const handleOpenEditProvider = (prov: Provider) => {
    setEditingProviderId(prov.id);
    providerForm.setFieldsValue({
      full_name: prov.full_name,
      email: prov.email,
      mobile: prov.mobile,
      gender: prov.gender,
      birth_date: prov.birth_date ? prov.birth_date.split('T')[0] : '',
      address: prov.address,
      isActive: prov.isActive
    });
    setShowProviderModal(true);
  };

  const handleSaveProvider = async (values: any) => {
    const provData = {
      full_name: values.full_name,
      email: values.email,
      mobile: values.mobile,
      gender: values.gender,
      birth_date: values.birth_date ? new Date(values.birth_date).toISOString() : new Date().toISOString(),
      address: values.address,
      isActive: !!values.isActive
    };

    try {
      if (editingProviderId) {
        await updateProvider({ id: editingProviderId, ...provData }).unwrap();
        message.success(`Provider '${values.full_name}' updated.`);
      } else {
        await addProvider(provData).unwrap();
        message.success(`Provider '${values.full_name}' created.`);
      }
      setShowProviderModal(false);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving provider');
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    try {
      await deleteProvider(id).unwrap();
      message.info(`Provider '${name}' deactivated.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deactivating provider');
    }
  };



  const columns = useMemo(() => [
    {
      Header: 'Partner Profile',
      id: 'partner_profile',
      Cell: ({ row }: any) => {
        const record = row.original;
        const birthDateStr = record.birth_date
          ? new Date(record.birth_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—';
        const genderColors: Record<string, string> = {
          male: 'blue',
          female: 'magenta',
          other: 'purple'
        };
        return (
          <div className="flex items-center gap-3">
            <Avatar
              className="!bg-ink !text-[#FFF8F0] !font-bold !text-[0.9rem]"
              size={40}
            >
              {record.full_name ? record.full_name.charAt(0).toUpperCase() : 'P'}
            </Avatar>
            <div>
              <a
                href={`#provider-profile-${record.id}`}
                className="block text-[0.95rem] font-semibold text-gold no-underline"
              >
                {record.full_name}
              </a>
              <div className="text-[0.72rem] text-mute mt-0.5 flex items-center gap-2 flex-wrap">
                <span>ID: {record.id.slice(0, 8)}</span>
                <span>•</span>
                <Tag color={genderColors[record.gender] || 'default'} className="capitalize !rounded-[10px] !py-0 !px-1.5 text-[0.68rem] leading-[1.2] !m-0">
                  {record.gender}
                </Tag>
                <span>•</span>
                <span>🎂 {birthDateStr}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Contact Info',
      id: 'contact_info',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div>
              <a href={`mailto:${record.email}`} className="text-gold inline-flex items-center gap-1.5 no-underline">
                <LuMail size={12} /> {record.email}
              </a>
            </div>
            <div>
              <a href={`tel:${record.mobile}`} className="text-gold inline-flex items-center gap-1.5 no-underline">
                <LuPhone size={12} /> {record.mobile}
              </a>
            </div>
            <div className="flex items-start gap-1 text-mute max-w-[240px]">
              <LuHouse size={12} className="mt-0.5 shrink-0" />
              <span className="text-[0.8rem] leading-[1.2]" title={record.address}>{record.address}</span>
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Status',
      accessor: 'isActive',
      Cell: ({ value }: any) => (
        <Tag
          color={value ? 'success' : 'error'}
          className={`!rounded-[12px] !text-[0.72rem] !font-semibold !py-0.5 !px-2.5 !border ${value ? '!border-[#b7eb8f]' : '!border-[#ffa39e]'}`}
        >
          {value ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      )
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <Space size="small">
            <Button
              className="action-btn action-btn-edit"
              icon={<LuPencil size={15} />}
              onClick={() => handleOpenEditProvider(record)}
              title="Edit Provider"
            />
            <Button
              className="action-btn action-btn-delete"
              icon={<LuTrash2 size={15} />}
              title="Deactivate Provider"
              onClick={() => {
                Modal.confirm({
                  title: 'Deactivate Provider',
                  content: `Are you sure you want to deactivate provider '${record.full_name}'?`,
                  okText: 'Yes, Deactivate',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk: () => handleDeleteProvider(record.id, record.full_name),
                });
              }}
            />
          </Space>
        );
      }
    }
  ], []);

  if (providersLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8 flex justify-between items-baseline">
          <div>
            <Skeleton.Button active className="!w-[120px] !h-3.5 !mb-2" />
            <br />
            <Skeleton.Input active className="!w-[380px] !h-10" />
          </div>
          <Skeleton.Button active className="!w-[150px] !h-10" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="label-overline">Providers Directory</p>
          <h2 className="text-3xl font-bold mt-1">Admin Service Providers</h2>
        </div>
        <Button
          type="primary"
          icon={<LuPlus size={16} />}
          onClick={handleOpenAddProvider}
          className="w-full sm:w-auto"
        >
          Add Provider
        </Button>
      </div>

      {/* Providers Table */}
      <Table
        columns={columns}
        data={providers}
        pageSize={20}
      />

      <ProviderModal
        open={showProviderModal}
        editingProviderId={editingProviderId}
        form={providerForm}
        onCancel={() => setShowProviderModal(false)}
        onSave={handleSaveProvider}
      />
    </div>
  );
};
