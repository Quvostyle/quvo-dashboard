import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Modal, Form, message, Skeleton } from 'antd';
import { LuPlus, LuPencil, LuTrash2, LuCircleCheck, LuBan, LuClipboardCheck } from 'react-icons/lu';
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
import { FormStepBuilderModal } from './FormStepBuilderModal';
import { Table } from './common/Table';

export const CategoriesTab: React.FC = () => {
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();

  const [addCategory, { isLoading: isAddingCategory }] = useAddCategoryMutation();
  const [addSubcategory, { isLoading: isAddingSubcategory }] = useAddSubcategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const isSavingCategory = isAddingCategory || isUpdatingCategory;
  const isSavingSubcategory = isAddingSubcategory || isUpdatingCategory;

  // Category Modal State (Add/Edit)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormRef] = Form.useForm();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Subcategory Modal State (Add/Edit)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [subcategoryFormRef] = Form.useForm();
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);

  // Questionnaire Builder Modal State
  const [showFormBuilderModal, setShowFormBuilderModal] = useState(false);
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | null>(null);
  const [selectedSubcatName, setSelectedSubcatName] = useState<string>('');

  const handleOpenFormBuilder = (subcatId: string, subcatName: string) => {
    setSelectedSubcatId(subcatId);
    setSelectedSubcatName(subcatName);
    setShowFormBuilderModal(true);
  };

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

  const handleSaveCategory = async (formData: FormData, values?: any) => {
    try {
      if (editingCategoryId) {
        await updateCategory({
          id: editingCategoryId,
          body: formData
        }).unwrap();
        message.success('Category updated successfully.');
      } else {
        await addCategory(formData).unwrap();
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

  const handleSaveSubcategory = async (formData: FormData, values?: any) => {
    const parentId = values?.parentId || (formData.get('parentId') as string);
    try {
      if (editingSubcategoryId) {
        await updateCategory({
          id: editingSubcategoryId,
          body: formData
        }).unwrap();
        message.success('Subcategory updated successfully.');
      } else {
        await addSubcategory({
          parentId,
          body: formData
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
          <div className="flex items-center gap-3">
            {!isSub && record.icon ? (
              <img src={record.icon} alt={record.name} className="w-9 h-9 object-contain rounded border border-line" />
            ) : null}
            <div className="flex flex-col gap-0.5">
              <span className={`${isSub ? 'font-medium text-[0.9rem]' : 'font-bold text-[1rem]'} ${record.isActive ? 'text-ink no-underline' : 'text-mute line-through'}`}>
                {record.name}
              </span>
              <div className="text-xs text-mute flex items-center gap-2">
                {isSub ? <Tag color="cyan" className="!m-0 text-[0.68rem] leading-[1.2]">Subcategory</Tag> : <Tag color="blue" className="!m-0 text-[0.68rem] leading-[1.2]">Parent Group</Tag>}
                <span>•</span>
                <span>Order: {record.sortOrder}</span>
              </div>
              {record.description && (
                <span className="text-[0.8rem] text-mute italic max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap" title={record.description}>
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
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div><Tag color="orange" className="font-mono !m-0">{record.slug}</Tag></div>
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
        const isSub = !!record.parentId;
        return (
          <Space size="small">
            {isSub && (
              <Button
                className="action-btn action-btn-edit !text-amber-600 hover:!border-amber-600 hover:!text-amber-700"
                icon={<LuClipboardCheck size={15} />}
                onClick={() => handleOpenFormBuilder(record.id, record.name)}
                title="Questionnaire Builder"
              />
            )}
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
        pageSize={20}
        expandable={true}
      />

      <CategoryModal
        open={showCategoryModal}
        editingCategoryId={editingCategoryId}
        form={categoryFormRef}
        loading={isSavingCategory}
        onCancel={() => setShowCategoryModal(false)}
        onSave={handleSaveCategory}
      />

      <SubcategoryModal
        open={showSubcategoryModal}
        editingSubcategoryId={editingSubcategoryId}
        categories={categories}
        form={subcategoryFormRef}
        loading={isSavingSubcategory}
        onCancel={() => setShowSubcategoryModal(false)}
        onSave={handleSaveSubcategory}
      />

      <FormStepBuilderModal
        open={showFormBuilderModal}
        subCategoryId={selectedSubcatId}
        subCategoryName={selectedSubcatName}
        onCancel={() => setShowFormBuilderModal(false)}
      />
    </div>
  );
};
