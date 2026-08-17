import React, { useEffect } from 'react';
import { Modal, Input, Row, Col, InputNumber, Switch, Button, Upload, Space, Divider } from 'antd';
import { UploadOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useGetCategoriesQuery } from '../store/apiSlice';

interface CategoryModalProps {
  open: boolean;
  editingCategoryId: string | null;
  form: any; // unused now, kept for backward compatibility
  onCancel: () => void;
  onSave: (values: any) => void;
}

interface CategoryFormValues {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  icon: string;
  videos: string[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  editingCategoryId,
  onCancel,
  onSave
}) => {
  const { data: categories = [] } = useGetCategoriesQuery();
  const editingCategory = categories.find((c) => c.id === editingCategoryId);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormValues>({
    defaultValues: {
      name: '',
      description: '',
      sortOrder: 1,
      isActive: true,
      icon: '',
      videos: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'videos' as never
  });

  const iconValue = watch('icon');
  const videosValue = watch('videos');

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        reset({
          name: editingCategory.name,
          description: editingCategory.description || '',
          sortOrder: editingCategory.sortOrder,
          isActive: editingCategory.isActive,
          icon: editingCategory.icon || '',
          videos: editingCategory.videos || []
        });
      } else {
        reset({
          name: '',
          description: '',
          sortOrder: 1,
          isActive: true,
          icon: '',
          videos: []
        });
      }
    }
  }, [open, editingCategory, reset]);

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', width: '100%', fontSize: '1.2rem', fontWeight: 600 }}>
          {editingCategoryId ? 'Modify Root Category' : 'Create Root Category'}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      className="premium-modal"
    >
      <form
        onSubmit={handleSubmit(onSave)}
        className="space-y-4 mt-4"
        style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Category name is required' }}
            render={({ field }) => (
              <Input {...field} placeholder="e.g. Occasion, Style, For" size="large" />
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

        {/* Category Icon */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Icon (URL or upload file)
          </label>
          <Row gutter={8} align="middle">
            <Col span={18}>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Icon URL or upload an image file" size="large" />}
              />
            </Col>
            <Col span={6}>
              <Upload
                accept="image/*"
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setValue('icon', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                  return false;
                }}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} style={{ width: '100%' }} size="large">Upload</Button>
              </Upload>
            </Col>
          </Row>
          {iconValue && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px dashed var(--color-line)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-mute)', marginBottom: '0.25rem' }}>Icon Preview</span>
              <img src={iconValue} alt="Icon Preview" style={{ maxHeight: '60px', objectFit: 'contain' }} />
            </div>
          )}
        </div>

        {/* Category Videos */}
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
                        <Button icon={<UploadOutlined />} size="small">Upload</Button>
                      </Upload>
                      <Button danger icon={<DeleteOutlined />} size="small" onClick={() => remove(index)} />
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
            <Button type="dashed" onClick={() => append('')} block icon={<PlayCircleOutlined />} size="large">
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
            {editingCategoryId ? 'Save Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
