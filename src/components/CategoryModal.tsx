import React from 'react';
import { Modal, Form, Input, Row, Col, InputNumber, Switch, Button, Upload, Space, Divider } from 'antd';
import { UploadOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';

interface CategoryModalProps {
  open: boolean;
  editingCategoryId: string | null;
  form: any;
  onCancel: () => void;
  onSave: (values: any) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  editingCategoryId,
  form,
  onCancel,
  onSave
}) => {
  const iconValue = Form.useWatch('icon', form);
  const videosValue = Form.useWatch('videos', form);

  return (
    <Modal
      title={editingCategoryId ? 'Modify Root Category' : 'Create Root Category'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editingCategoryId ? 'Save Category' : 'Create Category'}
      destroyOnClose
      width={600}
      className="premium-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        requiredMark={false}
        initialValues={{ sortOrder: 1, isActive: true, videos: [] }}
      >
        <Form.Item name="name" label="Category Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="e.g. Occasion, Style, For" />
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

        {/* Category Icon */}
        <Form.Item label="Category Icon (URL or upload file)">
          <Row gutter={8} align="middle">
            <Col span={18}>
              <Form.Item name="icon" noStyle>
                <Input placeholder="Icon URL or upload an image file" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Upload
                accept="image/*"
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    form.setFieldsValue({ icon: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                  return false;
                }}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} style={{ width: '100%' }}>Upload</Button>
              </Upload>
            </Col>
          </Row>
          {iconValue && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px dashed var(--color-line)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-mute)', marginBottom: '0.25rem' }}>Icon Preview</span>
              <img src={iconValue} alt="Icon Preview" style={{ maxHeight: '60px', objectFit: 'contain' }} />
            </div>
          )}
        </Form.Item>

        {/* Category Videos */}
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
