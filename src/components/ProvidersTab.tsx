import React, { useState, useMemo } from 'react';
import { Button, Input, Select, Space, Tag, Popconfirm, Form, message, Avatar, Skeleton } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
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
      Header: 'Name',
      accessor: 'full_name',
      Cell: ({ value, row }: any) => {
        const record = row.original;
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
              {value ? value.charAt(0).toUpperCase() : 'P'}
            </Avatar>
            <div>
              <a
                href={`#provider-profile-${record.id}`}
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
              <span style={{ fontSize: '0.7rem', color: 'var(--color-mute)', fontFamily: 'monospace' }}>ID: {record.id.slice(0, 8)}</span>
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Email',
      accessor: 'email',
      Cell: ({ value }: any) => (
        <a href={`mailto:${value}`} style={{ color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', textDecoration: 'none' }}>
          <MailOutlined style={{ fontSize: '12px' }} /> {value}
        </a>
      )
    },
    {
      Header: 'Mobile',
      accessor: 'mobile',
      Cell: ({ value }: any) => (
        <a href={`tel:${value}`} style={{ fontSize: '0.85rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
          <PhoneOutlined style={{ fontSize: '12px' }} /> {value}
        </a>
      )
    },
    {
      Header: 'Gender',
      accessor: 'gender',
      Cell: ({ value }: any) => {
        const colors: Record<string, string> = {
          male: 'blue',
          female: 'magenta',
          other: 'purple'
        };
        return <Tag color={colors[value] || 'default'} style={{ textTransform: 'capitalize', borderRadius: '12px', padding: '0 8px' }}>{value}</Tag>;
      }
    },
    {
      Header: 'Birth Date',
      accessor: 'birth_date',
      Cell: ({ value }: any) => {
        if (!value) return '—';
        const d = new Date(value);
        return <span style={{ fontSize: '0.85rem' }}>{d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>;
      }
    },
    {
      Header: 'Address',
      accessor: 'address',
      Cell: ({ value }: any) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', maxWidth: '180px' }}>
          <HomeOutlined style={{ fontSize: '12px', color: 'var(--color-mute)', marginTop: '3px' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-mute)', lineHeight: '1.2' }} title={value}>{value}</span>
        </div>
      )
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
              className="action-btn bg-gold/8 text-gold hover:bg-gold/15"
              icon={<EditOutlined style={{ fontSize: '15px' }} />}
              onClick={() => handleOpenEditProvider(record)}
              title="Edit Provider"
            />
            <Popconfirm
              title={`Are you sure you want to deactivate provider '${record.full_name}'?`}
              onConfirm={() => handleDeleteProvider(record.id, record.full_name)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                className="action-btn bg-wine/8 text-wine hover:bg-wine/15"
                icon={<DeleteOutlined style={{ fontSize: '15px' }} />}
                title="Deactivate Provider"
              />
            </Popconfirm>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <div>
          <p className="label-overline">Providers Directory</p>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Admin Service Providers</h2>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAddProvider}
        >
          Add Provider
        </Button>
      </div>

      {/* Filter panel designed like Screenshot 1 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFF',
          padding: '1rem 1.5rem',
          border: '1px solid var(--color-line)',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <strong style={{ fontSize: '1rem', color: 'var(--color-ink)' }}>Search:</strong>
          <Input
            placeholder="Search provider..."
            prefix={<SearchOutlined style={{ color: 'var(--color-mute)' }} />}
            value={providerSearch}
            onChange={(e) => {
              setProviderSearch(e.target.value);
            }}
            style={{ width: '220px', height: '38px', borderRadius: '4px' }}
          />
          <Select
            defaultValue="all"
            style={{ width: '130px', height: '38px' }}
            onChange={value => {
              setProviderGenderFilter(value);
            }}
          >
            <Select.Option value="all">All Genders</Select.Option>
            <Select.Option value="male">Male</Select.Option>
            <Select.Option value="female">Female</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </div>
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
