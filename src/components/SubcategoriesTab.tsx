import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Popconfirm, Form, message, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
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
      Header: 'Name',
      accessor: 'name',
      Cell: ({ value, row }: any) => (
        <strong style={{ color: row.original.isActive ? 'inherit' : 'var(--color-mute)', textDecoration: row.original.isActive ? 'none' : 'line-through' }}>
          {value}
        </strong>
      )
    },
    {
      Header: 'Parent Group',
      accessor: 'parentId',
      Cell: ({ value }: any) => {
        const parent = categories.find(c => c.id === value);
        return parent ? <Tag color="orange">{parent.name}</Tag> : <span style={{ fontStyle: 'italic', color: 'var(--color-mute)' }}>Orphaned</span>;
      }
    },
    {
      Header: 'Slug',
      accessor: 'slug',
      Cell: ({ value }: any) => <Tag color="cyan">{value}</Tag>
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
        return (
          <Space size="small">
            <Button
              className="action-btn bg-gold/8 text-gold hover:bg-gold/15"
              icon={<EditOutlined style={{ fontSize: '15px' }} />}
              onClick={() => handleSelectSubcategoryForEdit(record)}
              title="Edit"
            />
            <Button
              className={record.isActive ? "action-btn bg-wine/8 text-wine hover:bg-wine/15" : "action-btn bg-gold/8 text-gold hover:bg-gold/15"}
              icon={record.isActive ? <StopOutlined style={{ fontSize: '15px' }} /> : <CheckCircleOutlined style={{ fontSize: '15px' }} />}
              onClick={() => handleToggleSubcategoryActive(record.id, record.isActive, record.name)}
              title={record.isActive ? "Deactivate" : "Activate"}
            />
            <Popconfirm
              title={`Are you sure you want to delete subcategory '${record.name}'?`}
              onConfirm={() => handleDeleteSubcategory(record.id, record.name)}
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
