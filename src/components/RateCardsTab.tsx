import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Popconfirm, Form, message, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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
import { Table } from './common/Table';

export const RateCardsTab: React.FC = () => {
  const { data: rateCards = [], isLoading: rateCardsLoading } = useGetRateCardsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  const [addRateCard] = useAddRateCardMutation();
  const [updateRateCard] = useUpdateRateCardMutation();
  const [deleteRateCard] = useDeleteRateCardMutation();

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
    try {
      if (editingRateCardId) {
        await updateRateCard({
          id: editingRateCardId,
          ...values
        }).unwrap();
        message.success('Rate card updated successfully.');
      } else {
        await addRateCard(values).unwrap();
        message.success('Rate card created successfully.');
      }
      setShowRateCardModal(false);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving rate card');
    }
  };

  const handleDeleteRateCard = async (id: string, name: string) => {
    try {
      await deleteRateCard(id).unwrap();
      message.info(`Deleted rate card '${name}'.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting item');
    }
  };



  const columns = useMemo(() => [
    {
      Header: 'Name',
      accessor: 'name',
      Cell: ({ value }: any) => <strong>{value}</strong>
    },
    {
      Header: 'Category',
      accessor: 'categoryId',
      Cell: ({ value }: any) => {
        const parent = categories.find(c => c.id === value);
        return parent ? <Tag color="blue">{parent.name}</Tag> : <span style={{ color: 'var(--color-mute)' }}>—</span>;
      }
    },
    {
      Header: 'Subcategory',
      accessor: 'subcategoryId',
      Cell: ({ value }: any) => {
        const sub = categories.find(c => c.id === value);
        return sub ? <Tag color="cyan">{sub.name}</Tag> : <span style={{ color: 'var(--color-mute)' }}>—</span>;
      }
    },
    {
      Header: 'Provider Partner',
      accessor: 'providerId',
      Cell: ({ value }: any) => {
        const prov = providers.find(p => p.id === value);
        return prov ? <span>{prov.full_name}</span> : <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>Unassigned</span>;
      }
    },
    {
      Header: 'Price (INR)',
      accessor: 'price',
      Cell: ({ value }: any) => <strong>₹{value.toLocaleString()}</strong>
    },
    {
      Header: 'Strike Price',
      accessor: 'strikePrice',
      Cell: ({ value }: any) => <span style={{ textDecoration: 'line-through', color: 'var(--color-mute)' }}>₹{value.toLocaleString()}</span>
    },
    {
      Header: 'Badges',
      id: 'badges',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <Space size="small">
            {record.recommended && <Tag color="gold">Recommended</Tag>}
            {record.bestDeal && <Tag color="purple">Best Deal</Tag>}
          </Space>
        );
      }
    },
    {
      Header: 'Type',
      accessor: 'serviceType',
      Cell: ({ value }: any) => <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>{value}</span>
    },
    {
      Header: 'Active',
      accessor: 'active',
      Cell: ({ value }: any) => value ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>
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
              onClick={() => handleOpenEditRateCard(record)}
              title="Edit Rate Card"
            />
            <Popconfirm
              title={`Are you sure you want to delete rate card '${record.name}'?`}
              onConfirm={() => handleDeleteRateCard(record.id, record.name)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                className="action-btn bg-wine/8 text-wine hover:bg-wine/15"
                icon={<DeleteOutlined style={{ fontSize: '15px' }} />}
                title="Delete Rate Card"
              />
            </Popconfirm>
          </Space>
        );
      }
    }
  ], [categories, providers]);

  if (rateCardsLoading || categoriesLoading || providersLoading) {
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
          <p className="label-overline">Rate Cards</p>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Service Rate Management</h2>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddRateCard}>
          Create Rate Card
        </Button>
      </div>

      {/* Rate Cards Table */}
      <Table
        columns={columns}
        data={rateCards}
        pageSize={8}
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
