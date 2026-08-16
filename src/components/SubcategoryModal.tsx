import React from 'react';
import { Modal, Form, Select, Input, Row, Col, InputNumber, Switch, Upload, Button, Space, Divider } from 'antd';
import { UploadOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Category } from '../services/dataService';

interface SubcategoryModalProps {
  open: boolean;
  editingSubcategoryId: string | null;
  categories: Category[];
  form: any;
  onCancel: () => void;
  onSave: (values: any) => void;
}

export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  open,
  editingSubcategoryId,
  categories,
  form,
  onCancel,
  onSave
}) => {
  const rootCategories = categories.filter(c => !c.parentId);
  const videosValue = Form.useWatch('videos', form);

  return (
    <Modal
      title={editingSubcategoryId ? 'Modify Subcategory' : 'Create Subcategory'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editingSubcategoryId ? 'Save Subcategory' : 'Create Subcategory'}
      destroyOnClose
      width={600}
      className="premium-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        requiredMark={false}
        initialValues={{ sortOrder: 1, isActive: true, parentId: '', videos: [] }}
      >
        <Form.Item name="parentId" label="Parent Category Group" rules={[{ required: true, message: 'Please select parent category group' }]}>
          <Select>
            <Select.Option value="" disabled>Select parent category group...</Select.Option>
            {rootCategories.map(r => (
              <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="name" label="Subcategory Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="e.g. Quiet Luxury, Vacation, Sustainable" />
        </Form.Item>

        <Form.Item name="description" label="Detailed Description">
          <Input.TextArea placeholder="Enter instructions or aesthetic guidelines..." rows={2} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sortOrder" label="Sort Order Index">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="isActive" label="Active State" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '1rem 0' }}>Media Assets</Divider>

        {/* Subcategory Videos */}
        <Form.Item label="Aesthetic / Instruction Videos">
          <Form.List name="videos">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid var(--color-line)', borderRadius: '4px', background: 'rgba(0,0,0,0.01)' }}>
                    <Row gutter={8} align="middle">
                      <Col span={16}>
                        <Form.Item
                          {...restField}
                          name={[name]}
                          noStyle
                        >
                          <Input placeholder="Video URL or upload a video file" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Space>
                          <Upload
                            accept="video/*"
                            beforeUpload={(file) => {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const list = form.getFieldValue('videos') || [];
                                list[name] = reader.result as string;
                                form.setFieldsValue({ videos: [...list] });
                              };
                              reader.readAsDataURL(file);
                              return false;
                            }}
                            showUploadList={false}
                          >
                            <Button icon={<UploadOutlined />} size="small">Upload</Button>
                          </Upload>
                          <Button danger icon={<DeleteOutlined />} size="small" onClick={() => remove(name)} />
                        </Space>
                      </Col>
                    </Row>
                    {videosValue?.[name] && (
                      <div style={{ marginTop: '0.5rem', background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
                        <video
                          src={videosValue[name]}
                          controls
                          style={{ width: '100%', maxHeight: '120px' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlayCircleOutlined />}>
                    Add Video Clip
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>
      </Form>
    </Modal>
  );
};
