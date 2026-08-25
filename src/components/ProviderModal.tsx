import React, { useEffect } from 'react';
import { Modal, Input, Row, Col, Radio, Switch, Button, Space, DatePicker } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { useGetProvidersQuery } from '../store/apiSlice';
import dayjs from 'dayjs';

interface ProviderModalProps {
  open: boolean;
  editingProviderId: string | null;
  form: any; // unused now, kept for backward compatibility
  onCancel: () => void;
  onSave: (values: any) => void;
}

interface ProviderFormValues {
  full_name: string;
  email: string;
  mobile: string;
  gender: 'male' | 'female' | 'other';
  birth_date: string;
  address: string;
  isActive: boolean;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  open,
  editingProviderId,
  onCancel,
  onSave
}) => {
  const { data: providers = [] } = useGetProvidersQuery();
  const editingProvider = providers.find(p => p.id === editingProviderId);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProviderFormValues>({
    defaultValues: {
      full_name: '',
      email: '',
      mobile: '',
      gender: 'male',
      birth_date: '',
      address: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (open) {
      if (editingProvider) {
        reset({
          full_name: editingProvider.full_name,
          email: editingProvider.email,
          mobile: editingProvider.mobile,
          gender: editingProvider.gender,
          birth_date: editingProvider.birth_date ? editingProvider.birth_date.split('T')[0] : '',
          address: editingProvider.address,
          isActive: editingProvider.isActive
        });
      } else {
        reset({
          full_name: '',
          email: '',
          mobile: '',
          gender: 'male',
          birth_date: '',
          address: '',
          isActive: true
        });
      }
    }
  }, [open, editingProvider, reset]);

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
      width={720}
      destroyOnClose
      className="premium-modal"
    >
      <form
        onSubmit={handleSubmit(onSave)}
        className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <Controller
            name="full_name"
            control={control}
            rules={{ required: 'Full name is required' }}
            render={({ field }) => (
              <Input {...field} placeholder="e.g. John Doe" size="large" />
            )}
          />
          {errors.full_name && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.full_name.message}
            </span>
          )}
        </div>

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
              <Input {...field} placeholder="e.g. john.provider@example.com" size="large" />
            )}
          />
          {errors.email && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number *
          </label>
          <Controller
            name="mobile"
            control={control}
            rules={{ required: 'Mobile number is required' }}
            render={({ field }) => (
              <Input {...field} placeholder="e.g. +919876543210" size="large" />
            )}
          />
          {errors.mobile && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.mobile.message}
            </span>
          )}
        </div>

        <Row gutter={16}>
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
                      <Radio value="male">Male</Radio>
                      <Radio value="female">Female</Radio>
                      <Radio value="other">Other</Radio>
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
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date *
              </label>
              <Controller
                name="birth_date"
                control={control}
                rules={{ required: 'Birth date is required' }}
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <DatePicker
                    {...fieldProps}
                    value={value ? dayjs(value) : null}
                    onChange={(val) => onChange(val ? val.format('YYYY-MM-DD') : '')}
                    size="large"
                    className="w-full"
                    format="YYYY-MM-DD"
                  />
                )}
              />
              {errors.birth_date && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.birth_date.message}
                </span>
              )}
            </div>
          </Col>
        </Row>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Address *
          </label>
          <Controller
            name="address"
            control={control}
            rules={{ required: 'Address is required' }}
            render={({ field }) => (
              <Input.TextArea {...field} placeholder="Enter provider base location..." rows={3} />
            )}
          />
          {errors.address && (
            <span className="text-red-500 text-sm block mt-1">
              {errors.address.message}
            </span>
          )}
        </div>

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

        {/* Action Form Footer */}
        <div className="flex justify-end space-x-2 mt-8">
          <Button size="large" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
          >
            Save Provider
          </Button>
        </div>
      </form>
    </Modal>
  );
};
