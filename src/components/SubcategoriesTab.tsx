import React, { useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Form, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { Category } from '../services/dataService';
import {
  useGetCategoriesQuery,
  useAddSubcategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../store/apiSlice';
import { SubcategoryModal } from './SubcategoryModal';

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

  const handleToggleSubcategoryActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await updateCategory({ id, isActive: !currentStatus }).unwrap();
      message.success(`'${name}' is now ${!currentStatus ? 'Active' : 'Deactivated'}.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error modifying subcategory state');
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    try {
      await deleteCategory(id).unwrap();
      message.info(`Subcategory '${name}' deleted.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting subcategory');
    }
  };

  if (categoriesLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Spin size="large" />
        <span className="label-overline">Fetching Subcategories...</span>
      </div>
    );
  }

  const subcategories = categories.filter(c => c.parentId);

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <div>
          <p className="label-overline">Taxonomy System</p>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Subcategories</h2>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddSubcategory}>
          Add Subcategory
        </Button>
      </div>

      {/* Full-width Table of Subcategories */}
      <Table
        rowKey="id"
        dataSource={subcategories}
        pagination={{ pageSize: 8 }}
        size="middle"
        className="premium-table"
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
              <strong style={{ color: record.isActive ? 'inherit' : 'var(--color-mute)', textDecoration: record.isActive ? 'none' : 'line-through' }}>
                {text}
              </strong>
            )
          },
          {
            title: 'Parent Group',
            dataIndex: 'parentId',
            key: 'parent',
            render: (parentId) => {
              const parent = categories.find(c => c.id === parentId);
              return parent ? <Tag color="orange">{parent.name}</Tag> : <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>Orphaned</span>;
            }
          },
          {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text) => <Tag color="cyan">{text}</Tag>
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
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} size="small" onClick={() => handleSelectSubcategoryForEdit(record)}>Edit</Button>
                <Button
                  danger={record.isActive}
                  icon={record.isActive ? <DeleteOutlined /> : <CheckCircleOutlined />}
                  size="small"
                  onClick={() => handleToggleSubcategoryActive(record.id, record.isActive, record.name)}
                >
                  {record.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Popconfirm
                  title={`Are you sure you want to delete subcategory '${record.name}'?`}
                  onConfirm={() => handleDeleteSubcategory(record.id, record.name)}
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
