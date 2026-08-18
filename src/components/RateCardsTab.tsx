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
          <div className="flex items-center gap-3">
            {mainImage ? (
              <img src={mainImage} alt={record.name} className="w-20 h-20 object-cover rounded-md border border-line" />
            ) : (
              <div className="w-12 h-12 bg-[#fafafa] rounded-md flex items-center justify-center border border-line">
                <LuImage size={20} className="text-[#ccc]" />
              </div>
            )}
            <div>
              <div className="font-semibold text-[0.95rem] text-ink">{record.name}</div>
              <div className="text-[0.8rem] text-mute mt-0.5">
                Type: <span className="font-semibold uppercase">{record.serviceType}</span>
              </div>
              <div className="mt-1 flex gap-1 flex-wrap items-center">
                {record.recommended && <Tag color="gold" className="text-[0.7rem] !m-0 py-0 px-1.5 leading-[1.4]">Recommended</Tag>}
                {record.bestDeal && <Tag color="purple" className="text-[0.7rem] !m-0 py-0 px-1.5 leading-[1.4]">Best Deal</Tag>}
                {record.images?.length > 0 && <span className="text-[0.7rem] text-mute">📷 {record.images.length}</span>}
                {record.videos?.length > 0 && <span className="text-[0.7rem] text-mute">🎥 {record.videos.length}</span>}
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
        return (
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div><span className="text-mute">Category:</span> {record.category?.name ? <Tag color="blue" className="!m-0">{record.category.name}</Tag> : '—'}</div>
            <div><span className="text-mute">Subcategory:</span> {record.subcategory?.name ? <Tag color="cyan" className="!m-0">{record.subcategory.name}</Tag> : '—'}</div>
            <div>
              <span className="text-mute">Partner:</span>{' '}
              {record.provider?.full_name ? (
                <span className="font-medium">{record.provider.full_name}</span>
              ) : (
                <span className="italic text-mute">Unassigned</span>
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
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div><span className="text-mute">Price:</span> <strong className="text-ink">₹{record.price.toLocaleString()}</strong></div>
            {record.strikePrice ? (
              <div><span className="text-mute">Strike Price:</span> <span className="line-through text-mute">₹{record.strikePrice.toLocaleString()}</span></div>
            ) : null}
            <div>
              <span className="text-mute">Status:</span>{' '}
              {record.active ? <Tag color="success" className="!m-0">Active</Tag> : <Tag color="error" className="!m-0">Inactive</Tag>}
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
          <p className="label-overline">Rate Cards</p>
          <h2 className="text-3xl font-bold mt-1">Service Rate Management</h2>
        </div>
        <Button type="primary" icon={<LuPlus size={16} />} onClick={handleOpenAddRateCard} className="w-full sm:w-auto">
          Create Rate Card
        </Button>
      </div>

      {/* Rate Cards Table */}
      <Table
        columns={columns}
        data={rateCards}
        pageSize={20}
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
