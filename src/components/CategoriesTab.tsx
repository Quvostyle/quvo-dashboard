import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Modal, Form, message, Skeleton } from 'antd';
import { LuPlus, LuPencil, LuTrash2, LuCircleCheck, LuBan } from 'react-icons/lu';
import type { Category } from '../services/dataService';
import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useAddSubcategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../store/apiSlice';
import { CategoryModal } from './CategoryModal';
import { SubcategoryModal } from './SubcategoryModal';
import { Table } from './common/Table';

export const CategoriesTab: React.FC = () => {
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();

  const [addCategory] = useAddCategoryMutation();
  const [addSubcategory] = useAddSubcategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // Category Modal State (Add/Edit)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormRef] = Form.useForm();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Subcategory Modal State (Add/Edit)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [subcategoryFormRef] = Form.useForm();
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);

  // Actions for Parent Categories
  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    categoryFormRef.resetFields();
    setShowCategoryModal(true);
  };

  const handleSelectCategoryForEdit = (cat: Category) => {
    setEditingCategoryId(cat.id);
    categoryFormRef.setFieldsValue({
      name: cat.name,
      description: cat.description || '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      icon: cat.icon || '',
      videos: cat.videos || []
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (values: any) => {
    try {
      if (editingCategoryId) {
        await updateCategory({
          id: editingCategoryId,
          name: values.name,
          description: values.description || undefined,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
          icon: values.icon || undefined,
          videos: values.videos || []
        }).unwrap();
        message.success('Category updated successfully.');
      } else {
        await addCategory({
          name: values.name,
          description: values.description || undefined,
          sortOrder: values.sortOrder,
          icon: values.icon || undefined,
          videos: values.videos || []
        }).unwrap();
        message.success('Category created successfully.');
      }
      setShowCategoryModal(false);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving category');
    }
  };

  // Actions for Subcategories
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
  const handleToggleCategoryActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await updateCategory({ id, isActive: !currentStatus }).unwrap();
      message.success(`'${name}' is now ${!currentStatus ? 'Active' : 'Deactivated'}.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error modifying state');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteCategory(id).unwrap();
      message.info(`Deleted '${name}'.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting item');
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Category / Subcategory',
      id: 'category_details',
      Cell: ({ row }: any) => {
        const record = row.original;
        const isSub = !!record.parentId;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isSub && record.icon ? (
              <img src={record.icon} alt={record.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--color-line)' }} />
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{
                fontWeight: isSub ? 500 : 700,
                fontSize: isSub ? '0.9rem' : '1rem',
                color: record.isActive ? 'var(--color-ink)' : 'var(--color-mute)',
                textDecoration: record.isActive ? 'none' : 'line-through'
              }}>
                {record.name}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-mute)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isSub ? <Tag color="cyan" style={{ margin: 0, fontSize: '0.68rem', lineHeight: '1.2' }}>Subcategory</Tag> : <Tag color="blue" style={{ margin: 0, fontSize: '0.68rem', lineHeight: '1.2' }}>Parent Group</Tag>}
                <span>•</span>
                <span>Order: {record.sortOrder}</span>
              </div>
              {record.description && (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-mute)', fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.description}>
                  {record.description}
                </span>
              )}
            </div>
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
            <div><Tag color="orange" style={{ fontFamily: 'monospace', margin: 0 }}>{record.slug}</Tag></div>
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
        const isSub = !!record.parentId;
        return (
          <Space size="small">
            <Button
              className="action-btn action-btn-edit"
              icon={<LuPencil size={15} />}
              onClick={() => isSub ? handleSelectSubcategoryForEdit(record) : handleSelectCategoryForEdit(record)}
              title="Edit"
            />
            <Button
              className={record.isActive ? "action-btn action-btn-delete" : "action-btn action-btn-activate"}
              icon={record.isActive ? <LuBan size={15} /> : <LuCircleCheck size={15} />}
              onClick={() => {
                const action = record.isActive ? 'deactivate' : 'activate';
                Modal.confirm({
                  title: `${record.isActive ? 'Deactivate' : 'Activate'} Category`,
                  content: `Are you sure you want to ${action} category '${record.name}'?`,
                  okText: record.isActive ? 'Yes, Deactivate' : 'Yes, Activate',
                  okType: record.isActive ? 'danger' : 'primary',
                  cancelText: 'No',
                  onOk: () => handleToggleCategoryActive(record.id, record.isActive, record.name),
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
                  title: 'Delete Category',
                  content: `Are you sure you want to delete category '${record.name}'?`,
                  okText: 'Yes, Delete',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk: () => handleDeleteCategory(record.id, record.name),
                });
              }}
            />
          </Space>
        );
      }
    }
  ], []);

  if (categoriesLoading) {
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
          <p className="label-overline">Taxonomy System</p>
          <h2 className="text-3xl font-bold">Categories & Subcategories</h2>
        </div>
        <Space wrap className="w-full sm:w-auto">
          <Button type="primary" icon={<LuPlus size={16} />} onClick={handleOpenAddCategory} className="w-full sm:w-auto">
            Add Parent Category
          </Button>
          <Button type="default" icon={<LuPlus size={16} />} onClick={handleOpenAddSubcategory} className="w-full sm:w-auto">
            Add Subcategory
          </Button>
        </Space>
      </div>

      {/* Nested Tree Table */}
      <Table
        columns={columns}
        data={categories}
        pageSize={10}
        expandable={true}
      />

      <CategoryModal
        open={showCategoryModal}
        editingCategoryId={editingCategoryId}
        form={categoryFormRef}
        onCancel={() => setShowCategoryModal(false)}
        onSave={handleSaveCategory}
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
