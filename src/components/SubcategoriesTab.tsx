import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Modal, Form, message, Skeleton } from 'antd';
import { LuPlus, LuPencil, LuTrash2, LuCircleCheck, LuBan } from 'react-icons/lu';
import type { Category } from '../services/dataService';
import {
  useGetCategoriesQuery,
  useAddSubcategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../store/apiSlice';
import { SubcategoryModal } from './SubcategoryModal';
import { Table } from './common/Table';

export const SubcategoriesTab: React.FC = () => {
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();

  const [addSubcategory] = useAddSubcategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // Subcategory Modal State (Add/Edit)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [subcategoryFormRef] = Form.useForm();
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);

  const handleOpenAddSubcategory = () => {
    setEditingSubcategoryId(null);
    subcategoryFormRef.resetFields();
    setShowSubcategoryModal(true);
  };

  const handleSelectSubcategoryForEdit = (sub: Category) => {
    setEditingSubcategoryId(sub.id);
    subcategoryFormRef.setFieldsValue({
      name: sub.name,
      description: sub.description || '',
      sortOrder: sub.sortOrder,
      parentId: sub.parentId || '',
      isActive: sub.isActive,
      videos: sub.videos || []
    });
    setShowSubcategoryModal(true);
  };

  const handleSaveSubcategory = async (values: any) => {
    try {
      if (editingSubcategoryId) {
        await updateCategory({
          id: editingSubcategoryId,
          name: values.name,
          description: values.description || undefined,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
          parentId: values.parentId || null,
          videos: values.videos || []
        }).unwrap();
        message.success('Subcategory updated successfully.');
      } else {
        await addSubcategory({
          parentId: values.parentId,
          name: values.name,
          description: values.description || undefined,
          sortOrder: values.sortOrder,
          videos: values.videos || []
        }).unwrap();
        message.success('Subcategory created successfully.');
      }
      setShowSubcategoryModal(false);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving subcategory');
    }
  };

  // General Toggle / Delete
  const handleToggleSubcategoryActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await updateCategory({ id, isActive: !currentStatus }).unwrap();
      message.success(`Subcategory '${name}' is now ${!currentStatus ? 'Active' : 'Deactivated'}.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error updating status');
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    try {
      await deleteCategory(id).unwrap();
      message.info(`Deleted subcategory '${name}'.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting subcategory');
    }
  };

  const subcategories = useMemo(() => categories.filter(c => c.parentId), [categories]);

  const columns = useMemo(() => [
    {
      Header: 'Subcategory Details',
      id: 'subcategory_details',
      Cell: ({ row }: any) => {
        const record = row.original;
        const parent = categories.find(c => c.id === record.parentId);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <strong style={{
              fontSize: '0.95rem',
              color: record.isActive ? 'var(--color-ink)' : 'var(--color-mute)',
              textDecoration: record.isActive ? 'none' : 'line-through'
            }}>
              {record.name}
            </strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-mute)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Parent:</span>
              {parent ? <Tag color="orange" style={{ margin: 0, fontSize: '0.68rem', lineHeight: '1.2' }}>{parent.name}</Tag> : <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>Orphaned</span>}
              <span>•</span>
              <span>Order: {record.sortOrder}</span>
            </div>
            {record.description && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-mute)', fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.description}>
                {record.description}
              </span>
            )}
          </div>
        );
      }
    },
    {
      Header: 'Slug & Media',
      id: 'slug_media',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
            <div><Tag color="cyan" style={{ fontFamily: 'monospace', margin: 0 }}>{record.slug}</Tag></div>
            {record.videos?.length > 0 ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--color-mute)' }}>🎥 {record.videos.length} Videos</div>
            ) : null}
          </div>
        );
      }
    },
    {
      Header: 'Status',
      accessor: 'isActive',
      Cell: ({ value }: any) => value ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>
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
              onClick={() => handleSelectSubcategoryForEdit(record)}
              title="Edit"
            />
            <Button
              className={record.isActive ? "action-btn action-btn-delete" : "action-btn action-btn-activate"}
              icon={record.isActive ? <LuBan size={15} /> : <LuCircleCheck size={15} />}
              onClick={() => {
                const action = record.isActive ? 'deactivate' : 'activate';
                Modal.confirm({
                  title: `${record.isActive ? 'Deactivate' : 'Activate'} Subcategory`,
                  content: `Are you sure you want to ${action} subcategory '${record.name}'?`,
                  okText: record.isActive ? 'Yes, Deactivate' : 'Yes, Activate',
                  okType: record.isActive ? 'danger' : 'primary',
                  cancelText: 'No',
                  onOk: () => handleToggleSubcategoryActive(record.id, record.isActive, record.name),
                });
              }}
              title={record.isActive ? "Deactivate" : "Activate"}
            />
            <Button
              className="action-btn action-btn-delete"
              icon={<LuTrash2 size={15} />}
              title="Delete"
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Subcategory',
                  content: `Are you sure you want to delete subcategory '${record.name}'?`,
                  okText: 'Yes, Delete',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk: () => handleDeleteSubcategory(record.id, record.name),
                });
              }}
            />
          </Space>
        );
      }
    }
  ], [categories]);

  if (categoriesLoading) {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <Skeleton.Button active style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <br />
            <Skeleton.Input active style={{ width: '300px', height: '40px' }} />
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
          <p className="label-overline">Taxonomy System</p>
          <h2 className="text-3xl font-bold" style={{ marginTop: '0.25rem' }}>Subcategories</h2>
        </div>
        <Button type="primary" icon={<LuPlus size={16} />} onClick={handleOpenAddSubcategory} className="w-full sm:w-auto">
          Add Subcategory
        </Button>
      </div>

      {/* Full-width Table of Subcategories */}
      <Table
        columns={columns}
        data={subcategories}
        pageSize={8}
      />

      <SubcategoryModal
        open={showSubcategoryModal}
        editingSubcategoryId={editingSubcategoryId}
        categories={categories}
        form={subcategoryFormRef}
        onCancel={() => setShowSubcategoryModal(false)}
        onSave={handleSaveSubcategory}
      />
    </div>
  );
};
