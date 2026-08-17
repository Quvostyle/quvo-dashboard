import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Modal, Form, message, Skeleton } from 'antd';
import { LuPlus, LuPencil, LuTrash2, LuImage } from 'react-icons/lu';
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
      Header: 'Rate Card Details',
      id: 'rate_card_details',
      Cell: ({ row }: any) => {
        const record = row.original;
        const mainImage = record.images?.[0];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {mainImage ? (
              <img src={mainImage} alt={record.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-line)' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', background: '#fafafa', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-line)' }}>
                <LuImage size={20} style={{ color: '#ccc' }} />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-ink)' }}>{record.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-mute)', marginTop: '0.15rem' }}>
                Type: <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{record.serviceType}</span>
              </div>
              <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {record.recommended && <Tag color="gold" style={{ fontSize: '0.7rem', margin: 0, padding: '0 6px', lineHeight: '1.4' }}>Recommended</Tag>}
                {record.bestDeal && <Tag color="purple" style={{ fontSize: '0.7rem', margin: 0, padding: '0 6px', lineHeight: '1.4' }}>Best Deal</Tag>}
                {record.images?.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--color-mute)' }}>📷 {record.images.length}</span>}
                {record.videos?.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--color-mute)' }}>🎥 {record.videos.length}</span>}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Category & Partner',
      id: 'category_partner',
      Cell: ({ row }: any) => {
        const record = row.original;
        const parent = categories.find(c => c.id === record.categoryId);
        const sub = categories.find(c => c.id === record.subcategoryId);
        const prov = providers.find(p => p.id === record.providerId);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
            <div><span style={{ color: 'var(--color-mute)' }}>Category:</span> {parent ? <Tag color="blue" style={{ margin: 0 }}>{parent.name}</Tag> : '—'}</div>
            <div><span style={{ color: 'var(--color-mute)' }}>Subcategory:</span> {sub ? <Tag color="cyan" style={{ margin: 0 }}>{sub.name}</Tag> : '—'}</div>
            <div>
              <span style={{ color: 'var(--color-mute)' }}>Partner:</span>{' '}
              {prov ? (
                <span style={{ fontWeight: 500 }}>{prov.full_name}</span>
              ) : (
                <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>Unassigned</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Pricing & Status',
      id: 'pricing_status',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
            <div><span style={{ color: 'var(--color-mute)' }}>Price:</span> <strong style={{ color: 'var(--color-ink)' }}>₹{record.price.toLocaleString()}</strong></div>
            {record.strikePrice ? (
              <div><span style={{ color: 'var(--color-mute)' }}>Strike Price:</span> <span style={{ textDecoration: 'line-through', color: 'var(--color-mute)' }}>₹{record.strikePrice.toLocaleString()}</span></div>
            ) : null}
            <div>
              <span style={{ color: 'var(--color-mute)' }}>Status:</span>{' '}
              {record.active ? <Tag color="success" style={{ margin: 0 }}>Active</Tag> : <Tag color="error" style={{ margin: 0 }}>Inactive</Tag>}
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
          <Space size="small">
            <Button
              className="action-btn action-btn-edit"
              icon={<LuPencil size={15} />}
              onClick={() => handleOpenEditRateCard(record)}
              title="Edit Rate Card"
            />
            <Button
              className="action-btn action-btn-delete"
              icon={<LuTrash2 size={15} />}
              title="Delete Rate Card"
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Rate Card',
                  content: `Are you sure you want to delete rate card '${record.name}'?`,
                  okText: 'Yes, Delete',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk: () => handleDeleteRateCard(record.id, record.name),
                });
              }}
            />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="label-overline">Rate Cards</p>
          <h2 className="text-3xl font-bold" style={{ marginTop: '0.25rem' }}>Service Rate Management</h2>
        </div>
        <Button type="primary" icon={<LuPlus size={16} />} onClick={handleOpenAddRateCard} className="w-full sm:w-auto">
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
