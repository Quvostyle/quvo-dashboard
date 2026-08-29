import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Input, Row, Col, Radio, Switch, Button, Space, DatePicker, Upload, Select, Divider } from 'antd';
import { LuUpload, LuTrash2, LuImage } from 'react-icons/lu';
import { useForm, Controller } from 'react-hook-form';
import { useGetProvidersQuery, useGetCategoriesQuery } from '../store/apiSlice';
import dayjs from 'dayjs';

interface ProviderModalProps {
  open: boolean;
  editingProviderId: string | null;
  form?: any; // kept for backward compatibility
  loading?: boolean;
  onCancel: () => void;
  onSave: (formData: FormData, values: any) => void;
}

interface ProviderFormValues {
  full_name: string;
  email: string;
  mobile: string;
  gender: string;
  birth_date?: string;
  address: string;
  experience?: string;
  specialties?: string[];
  subcategories?: string[];
  startingFrom?: string;
  bioDetails?: string;
  profilePic: string;
  portfolioUrls?: string[];
  isActive: boolean;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  open,
  editingProviderId,
  loading,
  onCancel,
  onSave
}) => {
  const { data: providers = [] } = useGetProvidersQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const editingProvider = providers.find(p => p.id === editingProviderId);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);

  // Subcategories options built from categories store
  const subcategoryOptions = useMemo(() => {
    const subs: { label: string; value: string }[] = [];
    const added = new Set<string>();

    categories.forEach(c => {
      if (c.parentId && !added.has(c.name)) {
        added.add(c.name);
        subs.push({ label: c.name, value: c.name });
      }
      if (c.children) {
        c.children.forEach(child => {
          if (!added.has(child.name)) {
            added.add(child.name);
            subs.push({ label: child.name, value: child.name });
          }
        });
      }
    });

    if (subs.length === 0) {
      ['Hair Care', 'Skin Care', 'Styling', 'Beard & Grooming', 'Bridal & Makeup'].forEach(s => {
        subs.push({ label: s, value: s });
      });
    }

    return subs;
  }, [categories]);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProviderFormValues>({
    defaultValues: {
      full_name: '',
      email: '',
      mobile: '',
      gender: 'Male',
      birth_date: '',
      address: '',
      experience: '',
      specialties: [],
      subcategories: [],
      startingFrom: '',
      bioDetails: '',
      profilePic: '',
      portfolioUrls: [],
      isActive: true
    }
  });

  const profilePicValue = watch('profilePic');
  const portfolioUrlsValue = watch('portfolioUrls') || [];

  useEffect(() => {
    if (open) {
      setAttachedFile(null);
      setPortfolioFiles([]);
      if (editingProvider) {
        let specs: string[] = [];
        if (Array.isArray(editingProvider.specialties)) {
          specs = editingProvider.specialties;
        } else if (typeof editingProvider.specialties === 'string') {
          try {
            specs = JSON.parse(editingProvider.specialties);
          } catch {
            specs = editingProvider.specialties ? [editingProvider.specialties] : [];
          }
        }

        let subcats: string[] = [];
        if (Array.isArray(editingProvider.subcategories)) {
          subcats = editingProvider.subcategories;
        } else if (typeof editingProvider.subcategories === 'string') {
          try {
            subcats = JSON.parse(editingProvider.subcategories);
          } catch {
            subcats = editingProvider.subcategories ? [editingProvider.subcategories] : [];
          }
        }

        let portUrls: string[] = [];
        if (Array.isArray(editingProvider.ProtfolioImageUploads)) {
          portUrls = editingProvider.ProtfolioImageUploads.map((item: any) =>
            typeof item === 'string' ? item : item?.url || item?.src || String(item || '')
          ).filter(Boolean);
        } else if (typeof editingProvider.ProtfolioImageUploads === 'string') {
          try {
            const parsed = JSON.parse(editingProvider.ProtfolioImageUploads);
            if (Array.isArray(parsed)) {
              portUrls = parsed.map((item: any) =>
                typeof item === 'string' ? item : item?.url || item?.src || String(item || '')
              ).filter(Boolean);
            } else {
              portUrls = [editingProvider.ProtfolioImageUploads];
            }
          } catch {
            portUrls = editingProvider.ProtfolioImageUploads ? [editingProvider.ProtfolioImageUploads] : [];
          }
        }

        reset({
          full_name: editingProvider.full_name,
          email: editingProvider.email,
          mobile: editingProvider.mobile,
          gender: editingProvider.gender || 'Male',
          birth_date: editingProvider.birth_date ? editingProvider.birth_date.split('T')[0] : '',
          address: editingProvider.address,
          experience: editingProvider.experience ? String(editingProvider.experience) : '',
          specialties: specs,
          subcategories: subcats,
          startingFrom: editingProvider.startingFrom ? String(editingProvider.startingFrom) : '',
          bioDetails: editingProvider.bioDetails || '',
          profilePic: editingProvider.profilePic || '',
          portfolioUrls: portUrls,
          isActive: editingProvider.isActive
        });
      } else {
        reset({
          full_name: '',
          email: '',
          mobile: '',
          gender: 'Male',
          birth_date: '',
          address: '',
          experience: '',
          specialties: ['Haircut', 'Coloring', 'Beard Trim'],
          subcategories: ['Hair Care'],
          startingFrom: '',
          bioDetails: '',
          profilePic: '',
          portfolioUrls: [],
          isActive: true
        });
      }
    }
  }, [open, editingProvider, reset]);

  const handleFormSubmit = (values: ProviderFormValues) => {
    const formData = new FormData();
    formData.append('full_name', values.full_name);
    formData.append('email', values.email);
    formData.append('mobile', values.mobile);
    formData.append('gender', values.gender || 'Male');
    if (values.birth_date) {
      formData.append('birth_date', values.birth_date);
    }
    formData.append('address', values.address);
    if (values.experience) {
      formData.append('experience', String(values.experience));
    }
    if (values.specialties && values.specialties.length > 0) {
      formData.append('specialties', JSON.stringify(values.specialties));
    }
    if (values.subcategories && values.subcategories.length > 0) {
      formData.append('subcategories', JSON.stringify(values.subcategories));
    }
    formData.append('isActive', String(!!values.isActive));
    if (values.startingFrom) {
      formData.append('startingFrom', String(values.startingFrom));
    }
    if (values.bioDetails) {
      formData.append('bioDetails', values.bioDetails);
    }

    // Profile Pic
    if (attachedFile) {
      formData.append('profilePic', attachedFile, attachedFile.name);
    } else if (values.profilePic) {
      formData.append('profilePic', values.profilePic);
    }

    // Portfolio Images (ProtfolioImageUploads key as in backend curl spec)
    portfolioFiles.forEach(file => {
      formData.append('ProtfolioImageUploads', file, file.name);
    });

    (values.portfolioUrls || []).forEach((item: any) => {
      const urlStr = typeof item === 'string' ? item : item?.url || item?.src || (typeof item === 'object' ? JSON.stringify(item) : String(item || ''));
      if (urlStr && typeof urlStr === 'string' && !urlStr.startsWith('data:')) {
        formData.append('ProtfolioImageUploads', urlStr);
      }
    });

    onSave(formData, values);
  };

  return (
    <Modal
      title={
        <div className="text-center w-full text-[1.2rem] font-semibold">
          {editingProviderId ? 'Edit Provider Profile' : 'Onboard New Provider'}
        </div>
      }
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
      width={760}
      destroyOnClose
      className="premium-modal"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 mt-4 max-h-[75vh] overflow-y-auto pr-1"
      >
        {/* Profile Picture */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Picture *
          </label>
          <Row gutter={8} align="middle">
            <Col span={17}>
              <Controller
                name="profilePic"
                control={control}
                rules={{ required: 'Profile picture is required' }}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter image URL or attach image file" size="middle" />
                )}
              />
            </Col>
            <Col span={7}>
              <Upload
                accept="image/*"
                beforeUpload={(file) => {
                  setAttachedFile(file);
                  const reader = new FileReader();
                  reader.onload = () => {
                    setValue('profilePic', reader.result as string, { shouldValidate: true });
                  };
                  reader.readAsDataURL(file);
                  return false;
                }}
                showUploadList={false}
              >
                <Button icon={<LuUpload size={16} />} className="w-full" size="middle">
                  Attach Image
                </Button>
              </Upload>
            </Col>
          </Row>
          {errors.profilePic && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.profilePic.message}
            </span>
          )}
          {profilePicValue && (
            <div className="mt-3 flex items-center gap-3 bg-[rgba(0,0,0,0.02)] p-2.5 rounded border border-dashed border-line">
              <img
                src={profilePicValue}
                alt="Profile Preview"
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <span className="text-xs text-mute">Profile Picture Preview</span>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <Controller
                name="full_name"
                control={control}
                rules={{ required: 'Full name is required' }}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. Ahmed Khan" size="middle" />
                )}
              />
              {errors.full_name && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.full_name.message}
                </span>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                }}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. ahmed.khan@example.com" size="middle" />
                )}
              />
              {errors.email && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <Controller
                name="mobile"
                control={control}
                rules={{ required: 'Mobile number is required' }}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. +923001234567" size="middle" />
                )}
              />
              {errors.mobile && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.mobile.message}
                </span>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <Controller
                name="gender"
                control={control}
                rules={{ required: 'Gender is required' }}
                render={({ field: { value, onChange } }) => (
                  <Radio.Group value={value} onChange={onChange} className="mt-1">
                    <Space>
                      <Radio value="Male">Male</Radio>
                      <Radio value="Female">Female</Radio>
                      <Radio value="Other">Other</Radio>
                    </Space>
                  </Radio.Group>
                )}
              />
              {errors.gender && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.gender.message}
                </span>
              )}
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date (Optional)
              </label>
              <Controller
                name="birth_date"
                control={control}
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <DatePicker
                    {...fieldProps}
                    value={value ? dayjs(value) : null}
                    onChange={(val) => onChange(val ? val.format('YYYY-MM-DD') : '')}
                    size="middle"
                    className="w-full"
                    format="YYYY-MM-DD"
                  />
                )}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years)
              </label>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. 5" size="middle" />
                )}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Rate (₹)
              </label>
              <Controller
                name="startingFrom"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. 500" size="middle" />
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

        {/* Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Address *
          </label>
          <Controller
            name="address"
            control={control}
            rules={{ required: 'Address is required' }}
            render={({ field }) => (
              <Input.TextArea {...field} placeholder="e.g. 123 Main Street, Karachi" rows={2} />
            )}
          />
          {errors.address && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.address.message}
            </span>
          )}
        </div>

        {/* Specialties & Subcategories */}
        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialties
              </label>
              <Controller
                name="specialties"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    mode="tags"
                    placeholder="e.g. Haircut, Coloring, Beard Trim"
                    size="middle"
                    className="w-full"
                    maxTagCount="responsive"
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                    options={[
                      { label: 'Haircut', value: 'Haircut' },
                      { label: 'Coloring', value: 'Coloring' },
                      { label: 'Beard Trim', value: 'Beard Trim' },
                      { label: 'Styling', value: 'Styling' },
                      { label: 'Facial', value: 'Facial' }
                    ]}
                  />
                )}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategories
              </label>
              <Controller
                name="subcategories"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    mode="multiple"
                    placeholder="e.g. Hair Care"
                    size="middle"
                    className="w-full"
                    maxTagCount="responsive"
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                    options={subcategoryOptions}
                  />
                )}
              />
            </div>
          </Col>
        </Row>

        {/* Bio Details */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio / Professional Details
          </label>
          <Controller
            name="bioDetails"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="e.g. Professional barber with 5 years of experience in modern hair styling."
                rows={3}
              />
            )}
          />
        </div>

        <Divider className="!my-6">Portfolio Image Uploads</Divider>

        {/* Portfolio Image Uploads (ProtfolioImageUploads) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Portfolio Images (`ProtfolioImageUploads`)
            </label>
            <Upload
              accept="image/*"
              multiple
              beforeUpload={(file) => {
                setPortfolioFiles(prev => [...prev, file]);
                const reader = new FileReader();
                reader.onload = () => {
                  const current = watch('portfolioUrls') || [];
                  setValue('portfolioUrls', [...current, reader.result as string]);
                };
                reader.readAsDataURL(file);
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<LuUpload size={14} />} size="small">
                Attach Portfolio Images
              </Button>
            </Upload>
          </div>

          {portfolioUrlsValue.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {portfolioUrlsValue.map((item: any, index: number) => {
                const imgUrl = typeof item === 'string' ? item : item?.url || item?.src || String(item || '');
                if (!imgUrl) return null;
                return (
                  <div key={index} className="relative group border border-line rounded overflow-hidden p-1 bg-[rgba(0,0,0,0.02)]">
                    <img src={imgUrl} alt={`Portfolio ${index + 1}`} className="w-full h-20 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedUrls = portfolioUrlsValue.filter((_, i) => i !== index);
                        setValue('portfolioUrls', updatedUrls);
                        setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Image"
                    >
                      <LuTrash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 border border-dashed border-line rounded text-mute text-xs">
              <LuImage size={20} className="mx-auto mb-1 opacity-50" />
              No portfolio images attached. Click "Attach Portfolio Images" to add work samples.
            </div>
          )}
        </div>

        {/* Action Form Footer */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button size="middle" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="middle"
            loading={loading}
          >
            Save Provider Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
