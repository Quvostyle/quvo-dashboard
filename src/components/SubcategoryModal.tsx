import React, { useEffect } from 'react';
import { Modal, Select, Input, Row, Col, InputNumber, Switch, Upload, Button, Space, Divider } from 'antd';
import { LuUpload, LuCirclePlay, LuTrash2 } from 'react-icons/lu';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import type { Category } from '../services/dataService';

interface SubcategoryModalProps {
  open: boolean;
  editingSubcategoryId: string | null;
  categories: Category[];
  form: any; // unused now, kept for backward compatibility
  onCancel: () => void;
  onSave: (values: any) => void;
}

interface SubcategoryFormValues {
  parentId: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  videos: string[];
}

export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  open,
  editingSubcategoryId,
  categories,
  onCancel,
  onSave
}) => {
  const rootCategories = categories.filter(c => !c.parentId);
  const editingSubcategory = categories.find(c => c.id === editingSubcategoryId);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SubcategoryFormValues>({
    defaultValues: {
      parentId: '',
      name: '',
      description: '',
      sortOrder: 1,
      isActive: true,
      videos: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'videos' as never
  });

  const videosValue = watch('videos');

  useEffect(() => {
    if (open) {
      if (editingSubcategory) {
        reset({
          parentId: editingSubcategory.parentId || '',
          name: editingSubcategory.name,
          description: editingSubcategory.description || '',
          sortOrder: editingSubcategory.sortOrder,
          isActive: editingSubcategory.isActive,
          videos: editingSubcategory.videos || []
        });
      } else {
        reset({
          parentId: '',
          name: '',
          description: '',
          sortOrder: 1,
          isActive: true,
          videos: []
        });
      }
    }
  }, [open, editingSubcategory, reset]);

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', width: '100%', fontSize: '1.2rem', fontWeight: 600 }}>
          {editingSubcategoryId ? 'Modify Subcategory' : 'Create Subcategory'}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <form
        onSubmit={handleSubmit(onSave)}
        className="space-y-4 mt-4"
        style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Category Group *
          </label>
          <Controller
            name="parentId"
            control={control}
            rules={{ required: 'Please select parent category group' }}
            render={({ field }) => (
              <Select {...field} placeholder="Select parent category group..." size="large" style={{ width: '100%' }}>
                {rootCategories.map(r => (
                  <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                ))}
              </Select>
            )}
          />
          {errors.parentId && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.parentId.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory Name *
          </label>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <Input {...field} placeholder="e.g. Quiet Luxury, Vacation, Sustainable" size="large" />
            )}
          />
          {errors.name && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Detailed Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} placeholder="Enter instructions or aesthetic guidelines..." rows={3} />
            )}
          />
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order Index
              </label>
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} style={{ width: '100%' }} min={0} size="large" />
                )}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active State
              </label>
              <Controller
                name="isActive"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Switch checked={value} onChange={onChange} checkedChildren="Active" unCheckedChildren="Inactive" style={{ display: 'block' }} />
                )}
              />
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '1.5rem 0' }}>Media Assets</Divider>

        {/* Subcategory Videos */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aesthetic / Instruction Videos
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {fields.map((field, index) => (
              <div key={field.id} style={{ padding: '0.75rem', border: '1px solid var(--color-line)', borderRadius: '4px', background: 'rgba(0,0,0,0.01)' }}>
                <Row gutter={8} align="middle">
                  <Col span={16}>
                    <Controller
                      name={`videos.${index}`}
                      control={control}
                      render={({ field: videoField }) => (
                        <Input {...videoField} placeholder="Video URL or upload a video file" size="large" />
                      )}
                    />
                  </Col>
                  <Col span={8}>
                    <Space>
                      <Upload
                        accept="video/*"
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setValue(`videos.${index}`, reader.result as string);
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                        showUploadList={false}
                      >
                        <Button icon={<LuUpload size={14} />} size="small">Upload</Button>
                      </Upload>
                      <Button danger icon={<LuTrash2 size={14} />} size="small" onClick={() => remove(index)} />
                    </Space>
                  </Col>
                </Row>
                {videosValue?.[index] && (
                  <div style={{ marginTop: '0.5rem', background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
                    <video
                      src={videosValue[index]}
                      controls
                      style={{ width: '100%', maxHeight: '120px' }}
                    />
                  </div>
                )}
              </div>
            ))}
            <Button type="dashed" onClick={() => append('')} block icon={<LuCirclePlay size={16} />} size="large">
              Add Video Clip
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-8">
          <Button size="large" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
          >
            {editingSubcategoryId ? 'Save Subcategory' : 'Create Subcategory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
