import React, { useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Form, message, Spin } from 'antd';
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

  if (categoriesLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Spin size="large" />
        <span className="label-overline">Fetching Categories...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <div>
          <p className="label-overline">Taxonomy System</p>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Categories & Subcategories</h2>
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
        rowKey="id"
        dataSource={categories}
        pagination={{ pageSize: 10 }}
        size="middle"
        className="premium-table"
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => {
              const isSub = !!record.parentId;
              return (
                <span style={{ 
                  fontWeight: isSub ? 500 : 700, 
                  color: record.isActive ? 'inherit' : 'var(--color-mute)',
                  textDecoration: record.isActive ? 'none' : 'line-through' 
                }}>
                  {text}
                </span>
              );
            }
          },
          {
            title: 'Type',
            key: 'type',
            render: (_, record) => {
              const isSub = !!record.parentId;
              return isSub ? <Tag color="cyan">Subcategory</Tag> : <Tag color="blue">Parent Group</Tag>;
            }
          },
          {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text) => <Tag color="orange" style={{ fontFamily: 'monospace' }}>{text}</Tag>
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => text || <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>None</span>
          },
          {
            title: 'Sort Order',
            dataIndex: 'sortOrder',
            key: 'sortOrder',
            sorter: (a, b) => a.sortOrder - b.sortOrder
          },
          {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'status',
            render: (isActive) => isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
              const isSub = !!record.parentId;
              return (
                <Space size="small">
                  <Button
                    type="text"
                    icon={<EditOutlined style={{ color: 'var(--color-primary)' }} />}
                    size="small"
                    onClick={() => isSub ? handleSelectSubcategoryForEdit(record) : handleSelectCategoryForEdit(record)}
                    style={{ border: '1px solid var(--color-line)', borderRadius: '4px' }}
                  >
                    Edit
                  </Button>
                  <Button
                    danger={record.isActive}
                    type="text"
                    icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    size="small"
                    onClick={() => handleToggleCategoryActive(record.id, record.isActive, record.name)}
                    style={{ 
                      border: `1px solid ${record.isActive ? '#ffa39e' : '#b7eb8f'}`, 
                      borderRadius: '4px',
                      color: record.isActive ? undefined : '#52c41a'
                    }}
                  >
                    {record.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Popconfirm
                    title={`Are you sure you want to delete '${record.name}'?`}
                    onConfirm={() => handleDeleteCategory(record.id, record.name)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      size="small"
                      style={{ border: '1px solid #ffa39e', borderRadius: '4px' }}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              );
            }
          }
        ]}
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
