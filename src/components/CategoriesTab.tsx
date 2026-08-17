import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Popconfirm, Form, message, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
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
      Header: 'Name',
      accessor: 'name',
      Cell: ({ value, row }: any) => {
        const record = row.original;
        const isSub = !!record.parentId;
        return (
          <span style={{
            fontWeight: isSub ? 500 : 700,
            color: record.isActive ? 'inherit' : 'var(--color-mute)',
            textDecoration: record.isActive ? 'none' : 'line-through'
          }}>
            {value}
          </span>
        );
      }
    },
    {
      Header: 'Type',
      id: 'type',
      Cell: ({ row }: any) => {
        const record = row.original;
        const isSub = !!record.parentId;
        return isSub ? <Tag color="cyan">Subcategory</Tag> : <Tag color="blue">Parent Group</Tag>;
      }
    },
    {
      Header: 'Slug',
      accessor: 'slug',
      Cell: ({ value }: any) => <Tag color="orange" style={{ fontFamily: 'monospace' }}>{value}</Tag>
    },
    {
      Header: 'Description',
      accessor: 'description',
      Cell: ({ value }: any) => value || <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>None</span>
    },
    {
      Header: 'Sort Order',
      accessor: 'sortOrder'
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
              className="action-btn bg-gold/8 text-gold hover:bg-gold/15"
              icon={<EditOutlined style={{ fontSize: '15px' }} />}
              onClick={() => isSub ? handleSelectSubcategoryForEdit(record) : handleSelectCategoryForEdit(record)}
              title="Edit"
            />
            <Button
              className={record.isActive ? "action-btn bg-wine/8 text-wine hover:bg-wine/15" : "action-btn bg-gold/8 text-gold hover:bg-gold/15"}
              icon={record.isActive ? <StopOutlined style={{ fontSize: '15px' }} /> : <CheckCircleOutlined style={{ fontSize: '15px' }} />}
              onClick={() => handleToggleCategoryActive(record.id, record.isActive, record.name)}
              title={record.isActive ? "Deactivate" : "Activate"}
            />
            <Popconfirm
              title={`Are you sure you want to delete '${record.name}'?`}
              onConfirm={() => handleDeleteCategory(record.id, record.name)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                className="action-btn bg-wine/8 text-wine hover:bg-wine/15"
                icon={<DeleteOutlined style={{ fontSize: '15px' }} />}
                title="Delete"
              />
            </Popconfirm>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <div>
          <p className="label-overline">Taxonomy System</p>
          <h2 className="text-3xl font-bold">Categories & Subcategories</h2>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddCategory}>
            Add Parent Category
          </Button>
          <Button type="default" icon={<PlusOutlined />} onClick={handleOpenAddSubcategory}>
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
