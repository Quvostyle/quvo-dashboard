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

  const subcategories = useMemo(() => {
    return categories.reduce<Category[]>((acc, cat) => {
      if (cat.children && cat.children.length > 0) {
        acc.push(...cat.children);
      }
      return acc;
    }, []);
  }, [categories]);

  const columns = useMemo(() => [
    {
      Header: 'Subcategory Details',
      id: 'subcategory_details',
      Cell: ({ row }: any) => {
        const record = row.original;
        const parent = categories.find(c => c.id === record.parentId);
        return (
          <div className="flex flex-col gap-0.5">
            <strong className={`text-[0.95rem] ${record.isActive ? 'text-ink no-underline' : 'text-mute line-through'}`}>
              {record.name}
            </strong>
            <div className="text-xs text-mute flex items-center gap-2">
              <span>Parent:</span>
              {parent ? <Tag color="orange" className="!m-0 text-[0.68rem] leading-[1.2]">{parent.name}</Tag> : <span className="italic text-mute">Orphaned</span>}
              <span>•</span>
              <span>Order: {record.sortOrder}</span>
            </div>
            {record.description && (
              <span className="text-[0.8rem] text-mute italic max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap" title={record.description}>
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
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div><Tag color="cyan" className="font-mono !m-0">{record.slug}</Tag></div>
            {record.videos?.length > 0 ? (
              <div className="text-[0.72rem] text-mute">🎥 {record.videos.length} Videos</div>
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
        <div className="mb-8 flex justify-between items-baseline">
          <div>
            <Skeleton.Button active className="!w-[120px] !h-3.5 !mb-2" />
            <br />
            <Skeleton.Input active className="!w-[300px] !h-10" />
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
          <p className="label-overline">Taxonomy System</p>
          <h2 className="text-3xl font-bold mt-1">Subcategories</h2>
        </div>
        <Button type="primary" icon={<LuPlus size={16} />} onClick={handleOpenAddSubcategory} className="w-full sm:w-auto">
          Add Subcategory
        </Button>
      </div>

      {/* Full-width Table of Subcategories */}
      <Table
        columns={columns}
        data={subcategories}
        pageSize={20}
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
