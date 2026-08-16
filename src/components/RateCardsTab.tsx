import React, { useState } from 'react';
import { Table, Button, Input, Space, Tag, Popconfirm, Form, message, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RateCard } from '../services/dataService';
import {
  useGetRateCardsQuery,
  useGetCategoriesQuery,
  useGetProvidersQuery,
  useAddRateCardMutation,
  useUpdateRateCardMutation,
  useDeleteRateCardMutation
} from '../store/apiSlice';
import { RateCardModal } from './RateCardModal';

export const RateCardsTab: React.FC = () => {
  const { data: rateCards = [], isLoading: rateCardsLoading } = useGetRateCardsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  const [addRateCard] = useAddRateCardMutation();
  const [updateRateCard] = useUpdateRateCardMutation();
  const [deleteRateCard] = useDeleteRateCardMutation();

  const [rateCardSearch, setRateCardSearch] = useState('');

  // Rate Card Modal State (Add/Edit)
  const [showRateCardModal, setShowRateCardModal] = useState(false);
  const [rateCardForm] = Form.useForm();
  const [editingRateCardId, setEditingRateCardId] = useState<string | null>(null);
  const [rateCardSelectedCategory, setRateCardSelectedCategory] = useState<string>('');

  const handleOpenAddRateCard = () => {
    setEditingRateCardId(null);
    setRateCardSelectedCategory('');
    rateCardForm.resetFields();
    setShowRateCardModal(true);
  };

  const handleOpenEditRateCard = (rc: RateCard) => {
    setEditingRateCardId(rc.id);
    setRateCardSelectedCategory(rc.categoryId);
    rateCardForm.setFieldsValue({
      name: rc.name,
      categoryId: rc.categoryId,
      subcategoryId: rc.subcategoryId,
      providerId: rc.providerId,
      price: rc.price,
      strikePrice: rc.strikePrice,
      weight: rc.weight,
      recommended: rc.recommended,
      bestDeal: rc.bestDeal,
      active: rc.active,
      serviceType: rc.serviceType,
      images: rc.images || [],
      videos: rc.videos || []
    });
    setShowRateCardModal(true);
  };

  const handleSaveRateCard = async (values: any) => {
    const cardData = {
      name: values.name,
      categoryId: values.categoryId,
      subcategoryId: values.subcategoryId,
      providerId: values.providerId,
      price: values.price,
      strikePrice: values.strikePrice,
      weight: values.weight,
      recommended: !!values.recommended,
      bestDeal: !!values.bestDeal,
      active: !!values.active,
      serviceType: values.serviceType,
      images: values.images || [],
      videos: values.videos || []
    };

    try {
      if (editingRateCardId) {
        await updateRateCard({ id: editingRateCardId, ...cardData }).unwrap();
        message.success(`Rate Card '${values.name}' updated.`);
      } else {
        await addRateCard(cardData).unwrap();
        message.success(`Rate Card '${values.name}' created.`);
      }
      setShowRateCardModal(false);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving rate card');
    }
  };

  const handleDeleteRateCard = async (id: string, name: string) => {
    try {
      await deleteRateCard(id).unwrap();
      message.info(`Rate card '${name}' deleted.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting rate card');
    }
  };

  if (rateCardsLoading || categoriesLoading || providersLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Spin size="large" />
        <span className="label-overline">Fetching Rate Cards...</span>
      </div>
    );
  }

  const filteredRateCards = rateCards.filter((rc) => {
    return rc.name.toLowerCase().includes(rateCardSearch.toLowerCase());
  });

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <div>
          <p className="label-overline">Rate Cards</p>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Service Rate Management</h2>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddRateCard}>
          Create Rate Card
        </Button>
      </div>

      {/* Filter panel */}
      <div className="management-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Input
          placeholder="Search rate cards by name..."
          prefix={<SearchOutlined />}
          value={rateCardSearch}
          onChange={(e) => setRateCardSearch(e.target.value)}
          style={{ maxWidth: '350px', height: '38px' }}
        />
      </div>

      {/* Rate Cards Table */}
      <Table
        rowKey="id"
        dataSource={filteredRateCards}
        pagination={{ pageSize: 8 }}
        className="premium-table"
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <strong>{text}</strong>
          },
          {
            title: 'Category',
            dataIndex: 'categoryId',
            key: 'category',
            render: (catId) => {
              const parent = categories.find(c => c.id === catId);
              return parent ? <Tag color="blue">{parent.name}</Tag> : <span style={{ color: 'var(--color-mute)' }}>—</span>;
            }
          },
          {
            title: 'Subcategory',
            dataIndex: 'subcategoryId',
            key: 'subcategory',
            render: (subId) => {
              const sub = categories.find(c => c.id === subId);
              return sub ? <Tag color="cyan">{sub.name}</Tag> : <span style={{ color: 'var(--color-mute)' }}>—</span>;
            }
          },
          {
            title: 'Provider Partner',
            dataIndex: 'providerId',
            key: 'provider',
            render: (provId) => {
              const prov = providers.find(p => p.id === provId);
              return prov ? <span>{prov.full_name}</span> : <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>Unassigned</span>;
            }
          },
          {
            title: 'Price (INR)',
            dataIndex: 'price',
            key: 'price',
            render: (price) => <strong>₹{price.toLocaleString()}</strong>
          },
          {
            title: 'Strike Price',
            dataIndex: 'strikePrice',
            key: 'strikePrice',
            render: (price) => <span style={{ textDecoration: 'line-through', color: 'var(--color-mute)' }}>₹{price.toLocaleString()}</span>
          },
          {
            title: 'Badges',
            key: 'badges',
            render: (_, record) => (
              <Space size="small">
                {record.recommended && <Tag color="gold">Recommended</Tag>}
                {record.bestDeal && <Tag color="purple">Best Deal</Tag>}
              </Space>
            )
          },
          {
            title: 'Type',
            dataIndex: 'serviceType',
            key: 'type',
            render: (val) => <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>{val}</span>
          },
          {
            title: 'Active',
            dataIndex: 'active',
            key: 'active',
            render: (val) => val ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenEditRateCard(record)}>Edit</Button>
                <Popconfirm
                  title={`Are you sure you want to delete rate card '${record.name}'?`}
                  onConfirm={() => handleDeleteRateCard(record.id, record.name)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />} size="small">Delete</Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      <RateCardModal
        open={showRateCardModal}
        editingRateCardId={editingRateCardId}
        rateCardSelectedCategory={rateCardSelectedCategory}
        setRateCardSelectedCategory={setRateCardSelectedCategory}
        categories={categories}
        providers={providers}
        form={rateCardForm}
        onCancel={() => setShowRateCardModal(false)}
        onSave={handleSaveRateCard}
      />
    </div>
  );
};
