import React, { useEffect, useState } from 'react';
import { Modal, Input, Row, Col, InputNumber, Switch, Button, Upload, Space, Divider } from 'antd';
import { LuUpload, LuCirclePlay, LuTrash2 } from 'react-icons/lu';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useGetCategoriesQuery } from '../store/apiSlice';

interface CategoryModalProps {
  open: boolean;
  editingCategoryId: string | null;
  form: any; // unused now, kept for backward compatibility
  loading?: boolean;
  onCancel: () => void;
  onSave: (formData: FormData, values: any) => void;
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
  loading,
  onCancel,
  onSave
}) => {
  const { data: categories = [] } = useGetCategoriesQuery();
  const editingCategory = categories.find((c) => c.id === editingCategoryId);

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<Record<number, File>>({});

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
      setIconFile(null);
      setVideoFiles({});
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

  const handleFormSubmit = (values: CategoryFormValues) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('sortOrder', String(values.sortOrder));
    formData.append('isActive', String(!!values.isActive));

    if (iconFile) {
      formData.append('icon', iconFile, iconFile.name);
    } else if (values.icon) {
      formData.append('icon', values.icon);
    }

    (values.videos || []).forEach((v, index) => {
      if (videoFiles[index]) {
        formData.append('videos', videoFiles[index], videoFiles[index].name);
      } else if (v) {
        formData.append('videos', v);
      }
    });

    onSave(formData, values);
  };

  return (
    <Modal
      title={
        <div className="text-center w-full text-[1.2rem] font-semibold">
          {editingCategoryId ? 'Modify Root Category' : 'Create Root Category'}
        </div>
      }
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
      width={580}
      destroyOnClose
      className="premium-modal"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1"
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
                  <InputNumber {...field} className="w-full" min={0} size="large" />
                )}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active State
              </label>
              <div className="h-[40px] flex items-center">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Switch checked={value} onChange={onChange} checkedChildren="Active" unCheckedChildren="Inactive" />
                  )}
                />
              </div>
            </div>
          </Col>
        </Row>

        <Divider className="!my-6">Media Assets</Divider>

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
                  setIconFile(file);
                  const reader = new FileReader();
                  reader.onload = () => {
                    setValue('icon', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                  return false;
                }}
                showUploadList={false}
              >
                <Button icon={<LuUpload size={16} />} className="w-full" size="large">Upload</Button>
              </Upload>
            </Col>
          </Row>
          {iconValue && (
            <div className="mt-3 bg-[rgba(0,0,0,0.02)] p-2 rounded text-center border border-dashed border-line">
              <span className="block text-xs text-mute mb-1">Icon Preview</span>
              <img src={iconValue} alt="Icon Preview" className="max-h-[60px] object-contain mx-auto" />
            </div>
          )}
        </div>

        {/* Category Videos */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aesthetic / Instruction Videos
          </label>
          <div className="flex flex-col gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 border border-line rounded bg-[rgba(0,0,0,0.01)]">
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
                          setVideoFiles(prev => ({ ...prev, [index]: file }));
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
                  <div className="mt-2 bg-black rounded overflow-hidden">
                    <video
                      src={videosValue[index]}
                      controls
                      className="w-full max-h-[120px]"
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
            loading={loading}
          >
            {editingCategoryId ? 'Save Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
