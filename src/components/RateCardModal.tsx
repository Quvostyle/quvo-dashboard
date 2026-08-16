import React from 'react';
import { Modal, Form, Input, Row, Col, Select, InputNumber, Switch, Button, Upload, Space, Divider } from 'antd';
import { UploadOutlined, PlayCircleOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import type { Category, Provider } from '../services/dataService';

interface RateCardModalProps {
  open: boolean;
  editingRateCardId: string | null;
  rateCardSelectedCategory: string;
  setRateCardSelectedCategory: (val: string) => void;
  categories: Category[];
  providers: Provider[];
  form: any;
  onCancel: () => void;
  onSave: (values: any) => void;
}

export const RateCardModal: React.FC<RateCardModalProps> = ({
  open,
  editingRateCardId,
  rateCardSelectedCategory,
  setRateCardSelectedCategory,
  categories,
  providers,
  form,
  onCancel,
  onSave
}) => {
  const rootCategories = categories.filter(c => !c.parentId);

  const imagesValue = Form.useWatch('images', form);
  const videosValue = Form.useWatch('videos', form);

  return (
    <Modal
      title={editingRateCardId ? 'Edit Rate Card' : 'Create Service Rate Card'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Save Rate Card"
      destroyOnClose
      width={700}
      className="premium-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        requiredMark={false}
        initialValues={{ weight: 1, recommended: false, bestDeal: false, active: true, serviceType: 'b2c', images: [], videos: [] }}
      >
        <Form.Item name="name" label="Service Name" rules={[{ required: true, message: 'Service name is required' }]}>
          <Input placeholder="e.g. Standard Split AC Service" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="categoryId" label="Root Category Group" rules={[{ required: true, message: 'Select parent category' }]}>
              <Select onChange={(val) => setRateCardSelectedCategory(val)}>
                {rootCategories.map(r => (
                  <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="subcategoryId" label="Subcategory Mapping" rules={[{ required: true, message: 'Select subcategory' }]}>
              <Select disabled={!rateCardSelectedCategory}>
                {categories.filter(c => c.id === rateCardSelectedCategory)[0]?.children.map(sub => (
                  <Select.Option key={sub.id} value={sub.id}>{sub.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="providerId" label="Partner Provider" rules={[{ required: false }]}>
          <Select placeholder="Select partner provider (optional)" allowClear>
            {providers.map(p => (
              <Select.Option key={p.id} value={p.id}>{p.full_name} ({p.mobile})</Select.Option>
            ))}
          </Select>
        </Form.Item>

        {providers.length === 0 && (
          <div style={{ margin: '-0.5rem 0 1.25rem 0', padding: '8px 12px', background: '#FFF7E6', border: '1px solid #FFE58F', borderRadius: '4px', fontSize: '0.85rem', color: '#D46B08' }}>
            ⚠️ <strong>No providers onboarded:</strong> To link a service partner, please onboard a provider in the <strong>Providers</strong> tab first.
          </div>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="price" label="Base Price (INR)" rules={[{ required: true, message: 'Price is required' }]}>
              <InputNumber style={{ width: '100%' }} min={0} prefix="₹" placeholder="499" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="strikePrice" label="Strike Price (INR)" rules={[{ required: true, message: 'Strike price is required' }]}>
              <InputNumber style={{ width: '100%' }} min={0} prefix="₹" placeholder="699" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="weight" label="Sort Weight">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="serviceType" label="Service Type">
              <Select>
                <Select.Option value="b2c">B2C (Consumer)</Select.Option>
                <Select.Option value="b2b">B2B (Business)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={8} style={{ marginTop: '0.5rem' }}>
          <Col span={8}>
            <Form.Item name="recommended" label="Recommended" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="bestDeal" label="Best Deal" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="active" label="Active Card" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '1rem 0' }}>Media Assets</Divider>

        {/* Rate Card Images */}
        <Form.Item label="Rate Card Images">
          <Form.List name="images">
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
                          <Input placeholder="Image URL or upload a file" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Space>
                          <Upload
                            accept="image/*"
                            beforeUpload={(file) => {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const list = form.getFieldValue('images') || [];
                                list[name] = reader.result as string;
                                form.setFieldsValue({ images: [...list] });
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
                    {imagesValue?.[name] && (
                      <div style={{ marginTop: '0.5rem', textAlign: 'center', background: '#fafafa', padding: '4px', borderRadius: '4px', border: '1px dashed #e8e8e8' }}>
                        <img
                          src={imagesValue[name]}
                          alt={`Preview ${name + 1}`}
                          style={{ maxHeight: '100px', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Form.Item style={{ marginBottom: '0.5rem' }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PictureOutlined />}>
                    Add Image URL or File
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        {/* Rate Card Videos */}
        <Form.Item label="Rate Card Videos">
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
                          <Input placeholder="Video URL or upload a file" />
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
                    Add Video URL or File
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
