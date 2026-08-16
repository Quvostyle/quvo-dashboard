import React from 'react';
import { Modal, Form, Input, Row, Col, Select, Switch } from 'antd';

interface ProviderModalProps {
  open: boolean;
  editingProviderId: string | null;
  form: any;
  onCancel: () => void;
  onSave: (values: any) => void;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  open,
  editingProviderId,
  form,
  onCancel,
  onSave
}) => {
  return (
    <Modal
      title={editingProviderId ? 'Edit Provider Profile' : 'Onboard New Provider'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Save Provider"
      destroyOnClose
      className="premium-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        requiredMark={false}
        initialValues={{ isActive: true }}
      >
        <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: 'Full name is required' }]}>
          <Input placeholder="e.g. John Doe" />
        </Form.Item>

        <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
          <Input placeholder="e.g. john.provider@example.com" />
        </Form.Item>

        <Form.Item name="mobile" label="Mobile Number" rules={[{ required: true, message: 'Mobile is required' }]}>
          <Input placeholder="e.g. +919876543210" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Select gender' }]}>
              <Select>
                <Select.Option value="male">Male</Select.Option>
                <Select.Option value="female">Female</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="birth_date" label="Birth Date" rules={[{ required: true, message: 'Birth date is required' }]}>
              <Input type="date" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="Full Address" rules={[{ required: true, message: 'Address is required' }]}>
          <Input.TextArea placeholder="Enter provider base location..." rows={3} />
        </Form.Item>

        <Form.Item name="isActive" label="Active State" valuePropName="checked">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
