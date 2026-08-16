import React, { useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Popconfirm, Form, message, Spin, Avatar, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import type { Provider } from '../services/dataService';
import {
  useGetProvidersQuery,
  useAddProviderMutation,
  useUpdateProviderMutation,
  useDeleteProviderMutation
} from '../store/apiSlice';
import { ProviderModal } from './ProviderModal';

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

  if (providersLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Spin size="large" />
        <span className="label-overline">Fetching Providers...</span>
      </div>
    );
  }

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(providerSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(providerSearch.toLowerCase()) ||
      p.mobile.includes(providerSearch);

    const matchesGender = providerGenderFilter === 'all' || p.gender === providerGenderFilter;

    return matchesSearch && matchesGender;
  });

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <div>
          <p className="label-overline">Providers Directory</p>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Admin Service Providers</h2>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddProvider}>
          Add Provider
        </Button>
      </div>

      {/* Filter panel */}
      <div className="management-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Input
          placeholder="Search provider by name, email, mobile..."
          prefix={<SearchOutlined />}
          value={providerSearch}
          onChange={(e) => setProviderSearch(e.target.value)}
          style={{ maxWidth: '350px', height: '38px' }}
        />
        <Select
          defaultValue="all"
          style={{ width: '160px', height: '38px' }}
          onChange={value => setProviderGenderFilter(value)}
        >
          <Select.Option value="all">All Genders</Select.Option>
          <Select.Option value="male">Male</Select.Option>
          <Select.Option value="female">Female</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </div>

      {/* Providers Table */}
      <Table
        rowKey="id"
        dataSource={filteredProviders}
        pagination={{ pageSize: 8 }}
        className="premium-table"
        columns={[
          {
            title: 'Name',
            key: 'name',
            render: (_, record) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Avatar
                  style={{
                    backgroundColor: 'var(--color-primary, #3A2E24)',
                    color: '#FFF8F0',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                  size={40}
                >
                  {record.full_name ? record.full_name.charAt(0).toUpperCase() : 'P'}
                </Avatar>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--color-ink)' }}>{record.full_name}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-mute)', fontFamily: 'monospace' }}>ID: {record.id.slice(0, 8)}</span>
                </div>
              </div>
            )
          },
          {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text) => (
              <a href={`mailto:${text}`} style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                <MailOutlined style={{ fontSize: '12px' }} /> {text}
              </a>
            )
          },
          {
            title: 'Mobile',
            dataIndex: 'mobile',
            key: 'mobile',
            render: (text) => (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <PhoneOutlined style={{ fontSize: '12px', color: 'var(--color-mute)' }} /> {text}
              </span>
            )
          },
          {
            title: 'Gender',
            dataIndex: 'gender',
            key: 'gender',
            render: (gender) => {
              const colors: Record<string, string> = {
                male: 'blue',
                female: 'magenta',
                other: 'purple'
              };
              return <Tag color={colors[gender] || 'default'} style={{ textTransform: 'capitalize', borderRadius: '12px', padding: '0 8px' }}>{gender}</Tag>;
            }
          },
          {
            title: 'Birth Date',
            dataIndex: 'birth_date',
            key: 'birth_date',
            render: (date) => {
              if (!date) return '—';
              const d = new Date(date);
              return <span style={{ fontSize: '0.85rem' }}>{d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>;
            }
          },
          {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (text) => (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', maxWidth: '180px' }}>
                <HomeOutlined style={{ fontSize: '12px', color: 'var(--color-mute)', marginTop: '3px' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-mute)', lineHeight: '1.2' }} title={text}>{text}</span>
              </div>
            )
          },
          {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'status',
            render: (isActive) => (
              <Badge
                status={isActive ? 'success' : 'error'}
                text={
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isActive ? '#389e0d' : '#cf1322',
                    background: isActive ? '#f6ffed' : '#fff1f0',
                    border: `1px solid ${isActive ? '#b7eb8f' : '#ffa39e'}`,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                }
              />
            )
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
              <Space size="small">
                <Button
                  type="text"
                  icon={<EditOutlined style={{ color: 'var(--color-primary)' }} />}
                  onClick={() => handleOpenEditProvider(record)}
                  style={{ border: '1px solid var(--color-line)', borderRadius: '4px' }}
                >
                  Edit
                </Button>
                <Popconfirm
                  title={`Are you sure you want to deactivate provider '${record.full_name}'?`}
                  onConfirm={() => handleDeleteProvider(record.id, record.full_name)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    style={{ border: '1px solid #ffa39e', borderRadius: '4px' }}
                  >
                    Deactivate
                  </Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
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
