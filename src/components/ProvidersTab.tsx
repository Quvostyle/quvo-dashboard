import React, { useState, useMemo } from 'react';
import { Button, Input, Select, Space, Tag, Modal, Form, message, Avatar, Skeleton } from 'antd';
import { LuPlus, LuSearch, LuPencil, LuTrash2, LuMail, LuPhone, LuHouse } from 'react-icons/lu';
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

  const [providerSearch, setProviderSearch] = useState('');
  const [providerGenderFilter, setProviderGenderFilter] = useState('all');

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

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        p.full_name.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.mobile.includes(providerSearch);

      const matchesGender = providerGenderFilter === 'all' || p.gender === providerGenderFilter;

      return matchesSearch && matchesGender;
    });
  }, [providers, providerSearch, providerGenderFilter]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar
              style={{
                backgroundColor: 'var(--color-ink)',
                color: '#FFF8F0',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
              size={40}
            >
              {record.full_name ? record.full_name.charAt(0).toUpperCase() : 'P'}
            </Avatar>
            <div>
              <a
                href={`#provider-profile-${record.id}`}
                style={{
                  display: 'block',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-gold)',
                  textDecoration: 'none'
                }}
              >
                {record.full_name}
              </a>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-mute)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>ID: {record.id.slice(0, 8)}</span>
                <span>•</span>
                <Tag color={genderColors[record.gender] || 'default'} style={{ textTransform: 'capitalize', borderRadius: '10px', padding: '0 6px', fontSize: '0.68rem', lineHeight: '1.2', margin: 0 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
            <div>
              <a href={`mailto:${record.email}`} style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                <LuMail size={12} /> {record.email}
              </a>
            </div>
            <div>
              <a href={`tel:${record.mobile}`} style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                <LuPhone size={12} /> {record.mobile}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', color: 'var(--color-mute)', maxWidth: '240px' }}>
              <LuHouse size={12} style={{ marginTop: '3px', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', lineHeight: '1.2' }} title={record.address}>{record.address}</span>
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
          style={{
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '2px 10px',
            border: `1px solid ${value ? '#b7eb8f' : '#ffa39e'}`
          }}
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
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <Skeleton.Button active style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <br />
            <Skeleton.Input active style={{ width: '380px', height: '40px' }} />
          </div>
          <Skeleton.Button active style={{ width: '150px', height: '40px' }} />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="label-overline">Providers Directory</p>
          <h2 className="text-3xl font-bold" style={{ marginTop: '0.25rem' }}>Admin Service Providers</h2>
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
        data={filteredProviders}
        pageSize={10}
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
