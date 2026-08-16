import React from 'react';
import { Modal, Row, Col, Form, Select, Descriptions, Divider, Input, Button, Space, message } from 'antd';
import { LinkOutlined, DeleteOutlined } from '@ant-design/icons';
import type { IntakeRequest } from '../services/dataService';
import {
  useGetProvidersQuery,
  useGetLookbookQuery,
  useAssignStylistMutation,
  useUpdateOrderMutation,
  useSaveIntroNoteMutation,
  useAddLookbookItemMutation,
  useDeleteLookbookItemMutation
} from '../store/apiSlice';

interface OrderDetailsModalProps {
  visible: boolean;
  selectedOrder: IntakeRequest | null;
  onCancel: () => void;
  onOrderUpdated?: (updatedOrder: IntakeRequest) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  selectedOrder,
  onCancel,
  onOrderUpdated
}) => {
  const { data: providers = [] } = useGetProvidersQuery();
  const { data: activeOrderLookbook } = useGetLookbookQuery(selectedOrder?.id || '', {
    skip: !selectedOrder || !visible
  });

  const [assignStylist] = useAssignStylistMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const [saveIntroNote] = useSaveIntroNoteMutation();
  const [addLookbookItem] = useAddLookbookItemMutation();
  const [deleteLookbookItem] = useDeleteLookbookItemMutation();

  const [lookbookForm] = Form.useForm();

  if (!selectedOrder) return null;

  const handleAssignStylist = async (stylistId: string) => {
    try {
      const updated = await assignStylist({ orderId: selectedOrder.id, stylistId: stylistId || null }).unwrap();
      if (onOrderUpdated) onOrderUpdated(updated);
      message.success('Provider assignment updated.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error assigning partner');
    }
  };

  const handleUpdateOrderStatus = async (status: IntakeRequest['status']) => {
    try {
      const updated = await updateOrder({ id: selectedOrder.id, status }).unwrap();
      if (onOrderUpdated) onOrderUpdated(updated);
      message.success(`Status set to: ${status}`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error updating status');
    }
  };

  const handleSaveIntroNote = async (introNote: string) => {
    try {
      await saveIntroNote({ orderId: selectedOrder.id, introNote }).unwrap();
      message.success('Lookbook intro note saved.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving intro note');
    }
  };

  const handleAddLookbookItem = async (values: any) => {
    try {
      await addLookbookItem({
        orderId: selectedOrder.id,
        item: {
          title: values.title,
          description: values.description || '',
          image_url: values.image_url,
          price: values.price || '',
          product_link: values.product_link || '',
          category: values.category
        }
      }).unwrap();
      lookbookForm.resetFields();
      message.success('Curated item added to lookbook.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error adding lookbook item');
    }
  };

  const handleDeleteLookbookItem = async (itemId: string) => {
    try {
      await deleteLookbookItem({ orderId: selectedOrder.id, itemId }).unwrap();
      message.info('Lookbook item removed.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting item');
    }
  };

  return (
    <Modal
      title={`Intake Request: ${selectedOrder.occasion}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={850}
      destroyOnClose
      className="premium-modal"
    >
      <div>
        {/* Status & Stylist Panel */}
        <Row gutter={16} style={{ background: 'rgba(184, 148, 106, 0.04)', padding: '1.25rem', border: '1px solid var(--color-line)', marginBottom: '1.5rem' }}>
          <Col span={12}>
            <Form.Item label="Order Status" style={{ marginBottom: 0 }}>
              <Select
                value={selectedOrder.status}
                onChange={handleUpdateOrderStatus}
              >
                <Select.Option value="pending">Pending Review</Select.Option>
                <Select.Option value="assigned">Assigned (In Progress)</Select.Option>
                <Select.Option value="completed">Completed (Lookbook)</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Assign Partner Provider" style={{ marginBottom: 0 }}>
              <Select
                value={selectedOrder.assigned_stylist_id || ''}
                onChange={handleAssignStylist}
              >
                <Select.Option value="">[Unassigned] Move to Pending</Select.Option>
                {providers.map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.full_name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Profile descriptions */}
        <Descriptions title="Client Profiling Parameters" bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 2, xs: 1 }} style={{ marginBottom: '1.5rem' }}>
          <Descriptions.Item label="Client">{selectedOrder.user_name}</Descriptions.Item>
          <Descriptions.Item label="Email">{selectedOrder.user_email}</Descriptions.Item>
          <Descriptions.Item label="City Location">{selectedOrder.city}</Descriptions.Item>
          <Descriptions.Item label="Demographic">{selectedOrder.gender}</Descriptions.Item>
          <Descriptions.Item label="Style Aesthetic">{selectedOrder.style_preference}</Descriptions.Item>
          <Descriptions.Item label="Body Contour">{selectedOrder.body_type}</Descriptions.Item>
          <Descriptions.Item label="Tier Budget">{selectedOrder.budget || '—'}</Descriptions.Item>
          <Descriptions.Item label="Created">{new Date(selectedOrder.created_at).toLocaleDateString()}</Descriptions.Item>
        </Descriptions>

        {selectedOrder.notes && (
          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-mute)', letterSpacing: '0.08em' }}>Client Studio Notes</strong>
            <p className="client-notes" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{selectedOrder.notes}</p>
          </div>
        )}

        {selectedOrder.photo_ids && selectedOrder.photo_ids.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-mute)', letterSpacing: '0.08em' }}>Reference Inspiration Images</strong>
            <div className="intake-images" style={{ marginTop: '0.5rem' }}>
              {selectedOrder.photo_ids.map((url, i) => (
                <a href={url} target="_blank" rel="noreferrer" key={i}>
                  <img src={url} alt={`Reference ${i + 1}`} className="intake-image-preview" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* LOOKBOOK SECTION */}
        {selectedOrder.assigned_stylist_id ? (
          <div className="lookbook-section">
            <Divider style={{ margin: '1.5rem 0' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Compose Client Lookbook</h3>

            {activeOrderLookbook ? (
              <div>
                {/* Intro Note */}
                <Form.Item label="Stylist Note to Client" help="Note saves automatically when you click outside the textarea.">
                  <Input.TextArea
                    defaultValue={activeOrderLookbook.intro_note}
                    placeholder="Write a message explaining recommendations..."
                    rows={2}
                    onBlur={(e) => handleSaveIntroNote(e.target.value)}
                  />
                </Form.Item>

                {/* Add Item form */}
                <Form
                  form={lookbookForm}
                  layout="vertical"
                  onFinish={handleAddLookbookItem}
                  requiredMark={false}
                  initialValues={{ category: 'top', price: '', product_link: '', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=256' }}
                  style={{ background: 'rgba(127, 109, 94, 0.02)', padding: '1rem', border: '1px solid var(--color-line)', marginBottom: '1.5rem' }}
                >
                  <strong style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-mute)', marginBottom: '0.75rem' }}>Add Curated Clothing Piece</strong>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="title" label="Piece Title" rules={[{ required: true, message: 'Title is required' }]}>
                        <Input placeholder="e.g. Tweed Overcoat" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="category" label="Clothing Type" rules={[{ required: true }]}>
                        <Select>
                          <Select.Option value="top">Topwear</Select.Option>
                          <Select.Option value="bottom">Bottomwear</Select.Option>
                          <Select.Option value="outerwear">Outerwear</Select.Option>
                          <Select.Option value="shoes">Shoes</Select.Option>
                          <Select.Option value="accessory">Accessory</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="price" label="Formatted Price">
                        <Input placeholder="e.g. ₹5,600" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="image_url" label="Clothing Image URL" rules={[{ required: true, message: 'Image URL is required' }]}>
                        <Input placeholder="Image Unsplash URL" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="product_link" label="E-Commerce Buy Link">
                    <Input placeholder="Zara, HM, or designer shop link" />
                  </Form.Item>

                  <Form.Item name="description" label="Style Tip / Explanation">
                    <Input.TextArea placeholder="Describe style pairings..." rows={2} />
                  </Form.Item>

                  <div style={{ textAlign: 'right' }}>
                    <Button type="primary" htmlType="submit">
                      Curate Item
                    </Button>
                  </div>
                </Form>

                {/* Items list */}
                <strong style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-mute)', marginBottom: '0.75rem' }}>Curated Items ({activeOrderLookbook.items ? activeOrderLookbook.items.length : 0})</strong>
                {!activeOrderLookbook.items || activeOrderLookbook.items.length === 0 ? (
                  <div className="text-mute" style={{ textAlign: 'center', padding: '1.5rem 0', fontStyle: 'italic' }}>No recommendations added. Use form above to curate pieces.</div>
                ) : (
                  <div className="lookbook-item-list">
                    {activeOrderLookbook.items.map(item => (
                      <div key={item.id} className="lookbook-item-row">
                        <div className="lookbook-item-details">
                          <img src={item.image_url} alt={item.title} className="lookbook-item-img" />
                          <div>
                            <strong style={{ color: 'var(--color-ink)' }}>{item.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-mute)' }}>
                              Price: {item.price || 'Price on request'} | Type: <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{item.category}</span>
                            </div>
                            {item.description && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.15rem' }}>Tip: {item.description}</div>}
                          </div>
                        </div>
                        <Space>
                          {item.product_link && (
                            <a href={item.product_link} target="_blank" rel="noreferrer" title="Store link" style={{ color: 'var(--color-ink)' }}>
                              <LinkOutlined />
                            </a>
                          )}
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteLookbookItem(item.id)}
                          />
                        </Space>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-mute">Lookbook failed to load.</div>
            )}
          </div>
        ) : (
          <div>
            <Divider />
            <p className="text-mute" style={{ textAlign: 'center', fontStyle: 'italic' }}>
              Assign a provider partner to curate recommendations for this client request.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
