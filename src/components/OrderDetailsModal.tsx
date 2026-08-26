import React, { useState } from 'react';
import { Modal, Row, Col, Select, Radio, Descriptions, Divider, Input, Button, Space, message, Upload } from 'antd';
import { LuExternalLink, LuTrash2, LuUpload } from 'react-icons/lu';
import { useForm, Controller } from 'react-hook-form';
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

interface LookbookFormValues {
  title: string;
  category: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory';
  price: string;
  image_url: string;
  product_link: string;
  description: string;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  selectedOrder,
  onCancel,
  onOrderUpdated
}) => {
  if (!selectedOrder) return null;

  const { data: providers = [] } = useGetProvidersQuery();
  const { data: activeOrderLookbook } = useGetLookbookQuery(selectedOrder?.id || '', {
    skip: !selectedOrder || !visible
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [assignStylist] = useAssignStylistMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const [saveIntroNote] = useSaveIntroNoteMutation();
  const [addLookbookItem, { isLoading: isAddingItem }] = useAddLookbookItemMutation();
  const [deleteLookbookItem] = useDeleteLookbookItemMutation();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<LookbookFormValues>({
    defaultValues: {
      title: '',
      category: 'top',
      price: '',
      image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=256',
      product_link: '',
      description: ''
    }
  });

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

  const handleAddLookbookItem = async (values: LookbookFormValues) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('category', values.category);
    formData.append('price', values.price || '');
    formData.append('product_link', values.product_link || '');
    formData.append('description', values.description || '');

    if (imageFile) {
      formData.append('image_url', imageFile, imageFile.name);
    } else if (values.image_url) {
      formData.append('image_url', values.image_url);
    }

    try {
      await addLookbookItem({
        orderId: selectedOrder.id,
        item: formData as any
      }).unwrap();
      setImageFile(null);
      reset({
        title: '',
        category: 'top',
        price: '',
        image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=256',
        product_link: '',
        description: ''
      });
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
      centered
      onCancel={onCancel}
      footer={null}
      width={850}
      destroyOnClose
      className="premium-modal"
    >
      <div>
        {/* Status & Stylist Panel */}
        <Row gutter={16} className="bg-[rgba(184,148,106,0.04)] p-5 border border-line mb-6">
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Status
              </label>
              <Select
                value={selectedOrder.status}
                onChange={handleUpdateOrderStatus}
                className="w-full"
                size="large"
              >
                <Select.Option value="pending">Pending Review</Select.Option>
                <Select.Option value="assigned">Assigned (In Progress)</Select.Option>
                <Select.Option value="completed">Completed (Lookbook)</Select.Option>
              </Select>
            </div>
          </Col>

          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Partner Provider
              </label>
              <Select
                value={selectedOrder.assigned_stylist_id || ''}
                onChange={handleAssignStylist}
                className="w-full"
                size="large"
              >
                <Select.Option value="">[Unassigned] Move to Pending</Select.Option>
                {providers.map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.full_name}</Select.Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        {/* Profile descriptions */}
        <Descriptions title="Client Profiling Parameters" bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 2, xs: 1 }} className="mb-6">
          <Descriptions.Item label="Client">{selectedOrder.user_name}</Descriptions.Item>
          <Descriptions.Item label="Email">{selectedOrder.user_email}</Descriptions.Item>
          <Descriptions.Item label="City Location">{selectedOrder.city}</Descriptions.Item>
          <Descriptions.Item label="Demographic">{selectedOrder.gender}</Descriptions.Item>
          <Descriptions.Item label="Style Aesthetic">{selectedOrder.style_preference}</Descriptions.Item>
          <Descriptions.Item label="Body Contour">{selectedOrder.body_type}</Descriptions.Item>
          <Descriptions.Item label="Tier Budget">{selectedOrder.budget || '—'}</Descriptions.Item>
          <Descriptions.Item label="Created">{new Date(selectedOrder.created_at).toLocaleDateString()}</Descriptions.Item>
        </Descriptions>

        {/* Dynamic Questionnaire Responses */}
        {selectedOrder.form_responses && Object.keys(selectedOrder.form_responses).length > 0 && (
          <div className="mb-6 mt-6">
            <strong className="text-[0.72rem] uppercase text-mute tracking-[0.08em] block mb-2">Intake Questionnaire Responses</strong>
            <div className="bg-[#FAF8F5] border border-line rounded-2xl p-6">
              <Row gutter={[16, 16]}>
                {Object.entries(selectedOrder.form_responses).map(([key, val]) => {
                  const displayValue = Array.isArray(val)
                    ? val.join(', ')
                    : typeof val === 'object'
                    ? JSON.stringify(val)
                    : String(val);

                  const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase());

                  return (
                    <Col xs={24} sm={12} md={8} key={key}>
                      <div className="text-[10px] text-mute font-bold uppercase tracking-wider">{label}</div>
                      <div className="text-sm font-medium mt-1 text-ink">{displayValue || '—'}</div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        )}

        {selectedOrder.notes && (
          <div className="mb-6">
            <strong className="text-[0.72rem] uppercase text-mute tracking-[0.08em]">Client Studio Notes</strong>
            <p className="client-notes mt-2 whitespace-pre-wrap">{selectedOrder.notes}</p>
          </div>
        )}

        {selectedOrder.photo_ids && selectedOrder.photo_ids.length > 0 && (
          <div className="mb-6">
            <strong className="text-[0.72rem] uppercase text-mute tracking-[0.08em]">Reference Inspiration Images</strong>
            <div className="intake-images mt-2">
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
            <Divider className="!my-6" />
            <h3 className="text-[1.3rem] mb-4">Compose Client Lookbook</h3>

            {activeOrderLookbook ? (
              <div>
                {/* Intro Note */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stylist Note to Client
                  </label>
                  <Input.TextArea
                    defaultValue={activeOrderLookbook.intro_note}
                    placeholder="Write a message explaining recommendations..."
                    rows={2}
                    onBlur={(e) => handleSaveIntroNote(e.target.value)}
                  />
                  <span className="text-gray-500 text-xs block mt-1">
                    Note saves automatically when you click outside the textarea.
                  </span>
                </div>

                {/* Add Item form */}
                <form
                  onSubmit={handleSubmit(handleAddLookbookItem)}
                  className="bg-[rgba(127,109,94,0.02)] p-5 border border-line mb-6 space-y-4"
                >
                  <strong className="block text-[0.72rem] uppercase tracking-[0.05em] text-mute mb-4">Add Curated Clothing Piece</strong>
                  <Row gutter={16}>
                    <Col span={24}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Piece Title *
                        </label>
                        <Controller
                          name="title"
                          control={control}
                          rules={{ required: 'Title is required' }}
                          render={({ field }) => (
                            <Input {...field} placeholder="e.g. Tweed Overcoat" size="large" className="!rounded-none" />
                          )}
                        />
                        {errors.title && (
                          <span className="text-red-500 text-sm block mt-1">
                            {errors.title.message}
                          </span>
                        )}
                      </div>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clothing Type *
                        </label>
                        <Controller
                          name="category"
                          control={control}
                          rules={{ required: true }}
                          render={({ field }) => (
                            <Radio.Group {...field} className="mt-1">
                              <Space wrap>
                                <Radio value="top">Topwear</Radio>
                                <Radio value="bottom">Bottomwear</Radio>
                                <Radio value="outerwear">Outerwear</Radio>
                                <Radio value="shoes">Shoes</Radio>
                                <Radio value="accessory">Accessory</Radio>
                              </Space>
                            </Radio.Group>
                          )}
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Formatted Price
                        </label>
                        <Controller
                          name="price"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder="e.g. ₹5,600" size="large" className="!rounded-none" />
                          )}
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clothing Image URL or File *
                        </label>
                        <Row gutter={8} align="middle">
                          <Col span={16}>
                            <Controller
                              name="image_url"
                              control={control}
                              rules={{ required: 'Image URL or file is required' }}
                              render={({ field }) => (
                                <Input {...field} placeholder="Image Unsplash URL or upload file" size="large" className="!rounded-none" />
                              )}
                            />
                          </Col>
                          <Col span={8}>
                            <Upload
                              accept="image/*"
                              beforeUpload={(file) => {
                                setImageFile(file);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setValue('image_url', reader.result as string, { shouldValidate: true });
                                };
                                reader.readAsDataURL(file);
                                return false;
                              }}
                              showUploadList={false}
                            >
                              <Button icon={<LuUpload size={14} />} size="large" className="w-full !rounded-none">
                                Upload
                              </Button>
                            </Upload>
                          </Col>
                        </Row>
                        {errors.image_url && (
                          <span className="text-red-500 text-sm block mt-1">
                            {errors.image_url.message}
                          </span>
                        )}
                      </div>
                    </Col>
                  </Row>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-Commerce Buy Link
                    </label>
                    <Controller
                      name="product_link"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Zara, HM, or designer shop link" size="large" className="!rounded-none" />
                      )}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style Tip / Explanation
                    </label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Input.TextArea {...field} placeholder="Describe style pairings..." rows={3} className="!rounded-none" />
                      )}
                    />
                  </div>

                  <div className="text-right mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={isAddingItem}
                    >
                      Curate Item
                    </Button>
                  </div>
                </form>

                {/* Items list */}
                <strong className="block text-[0.72rem] uppercase tracking-[0.05em] text-mute mb-3">Curated Items ({activeOrderLookbook.items ? activeOrderLookbook.items.length : 0})</strong>
                {!activeOrderLookbook.items || activeOrderLookbook.items.length === 0 ? (
                  <div className="text-center py-6 italic text-mute">No recommendations added. Use form above to curate pieces.</div>
                ) : (
                  <div className="lookbook-item-list">
                    {activeOrderLookbook.items.map(item => (
                      <div key={item.id} className="lookbook-item-row">
                        <div className="lookbook-item-details">
                          <img src={item.image_url} alt={item.title} className="lookbook-item-img" />
                          <div>
                            <strong className="text-ink">{item.title}</strong>
                            <div className="text-xs text-mute">
                              Price: {item.price || 'Price on request'} | Type: <span className="uppercase font-semibold">{item.category}</span>
                            </div>
                            {item.description && <div className="text-[0.8rem] italic mt-0.5">Tip: {item.description}</div>}
                          </div>
                        </div>
                        <Space>
                          {item.product_link && (
                            <a href={item.product_link} target="_blank" rel="noreferrer" title="Store link" className="text-ink">
                              <LuExternalLink size={15} />
                            </a>
                          )}
                          <Button
                            danger
                            size="small"
                            icon={<LuTrash2 size={14} />}
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
            <p className="text-center italic text-mute">
              Assign a provider partner to curate recommendations for this client request.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
