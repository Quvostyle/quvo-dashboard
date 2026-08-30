import React, { useState } from 'react';
import { Modal, Row, Col, Select, Radio, Descriptions, Divider, Input, Button, Space, message, Upload, Tag, Popconfirm, Tooltip } from 'antd';
import { LuExternalLink, LuTrash2, LuUpload, LuVideo, LuCalendar, LuCircleX } from 'react-icons/lu';
import { useForm, Controller } from 'react-hook-form';
import type { IntakeRequest } from '../services/dataService';
import {
  useGetProvidersQuery,
  useGetLookbookQuery,
  useGetOrderByIdQuery,
  useAssignStylistMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useSaveIntroNoteMutation,
  useAddLookbookItemMutation,
  useDeleteLookbookItemMutation
} from '../store/apiSlice';
import { RescheduleOrderModal } from './RescheduleOrderModal';

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

  const [showReschedule, setShowReschedule] = useState(false);

  // Fetch full detailed order by ID
  const { data: fullOrder } = useGetOrderByIdQuery(selectedOrder.id, {
    skip: !selectedOrder || !visible
  });

  const activeOrder = fullOrder || selectedOrder;

  const { data: providers = [] } = useGetProvidersQuery();
  const { data: activeOrderLookbook } = useGetLookbookQuery(activeOrder.id || '', {
    skip: !activeOrder || !visible
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [assignStylist] = useAssignStylistMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();
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
      const updated = await assignStylist({ orderId: activeOrder.id, stylistId: stylistId || null }).unwrap();
      if (onOrderUpdated) onOrderUpdated(updated);
      message.success('Provider assignment updated.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error assigning partner');
    }
  };

  const handleUpdateOrderStatus = async (status: string) => {
    try {
      const updated = await updateOrderStatus({ id: activeOrder.id, status }).unwrap();
      if (onOrderUpdated) onOrderUpdated(updated);
      message.success(`Order status updated to: ${status}`);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Error updating status');
    }
  };

  const handleCancelOrder = async () => {
    try {
      const cancelled = await cancelOrder(activeOrder.id).unwrap();
      if (onOrderUpdated) onOrderUpdated(cancelled);
      message.success('Order soft-cancelled.');
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Error cancelling order');
    }
  };

  const handleSaveIntroNote = async (introNote: string) => {
    try {
      await saveIntroNote({ orderId: activeOrder.id, introNote }).unwrap();
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
        orderId: activeOrder.id,
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
      await deleteLookbookItem({ orderId: activeOrder.id, itemId }).unwrap();
      message.info('Lookbook item removed.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting item');
    }
  };

  const isCancelled = activeOrder.is_cancelled || (activeOrder.status || '').toUpperCase() === 'CANCELLED';

  return (
    <>
      <Modal
        title={`Admin Order #${activeOrder.id.slice(0, 8)} - ${activeOrder.occasion || 'Booking Details'}`}
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
          <Row gutter={16} className="bg-[rgba(184,148,106,0.04)] p-5 border border-line mb-6 items-center">
            <Col span={10}>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Order Status
                </label>
                <Select
                  value={(activeOrder.status || 'PENDING').toUpperCase()}
                  onChange={handleUpdateOrderStatus}
                  className="w-full"
                  size="large"
                >
                  <Select.Option value="PENDING">PENDING</Select.Option>
                  <Select.Option value="CONFIRMED">CONFIRMED</Select.Option>
                  <Select.Option value="IN_PROGRESS">IN_PROGRESS</Select.Option>
                  <Select.Option value="COMPLETED">COMPLETED</Select.Option>
                  <Select.Option value="RESCHEDULED">RESCHEDULED</Select.Option>
                  <Select.Option value="CANCELLED">CANCELLED</Select.Option>
                </Select>
              </div>
            </Col>

            <Col span={10}>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Assign Partner Provider
                </label>
                <Select
                  value={activeOrder.provider?.id || activeOrder.assigned_stylist_id || ''}
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

            <Col span={4} className="flex justify-end gap-2">
              <Tooltip title="Reschedule Session">
                <Button
                  size="large"
                  icon={<LuCalendar size={18} />}
                  onClick={() => setShowReschedule(true)}
                  disabled={isCancelled}
                />
              </Tooltip>

              {!isCancelled && (
                <Popconfirm
                  title="Soft Cancel Order"
                  description="Set status to CANCELLED and soft-delete?"
                  onConfirm={handleCancelOrder}
                  okText="Cancel Order"
                  cancelText="Close"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Cancel Booking">
                    <Button size="large" danger icon={<LuCircleX size={18} />} />
                  </Tooltip>
                </Popconfirm>
              )}
            </Col>
          </Row>

          {/* Detailed Descriptions */}
          <Descriptions title="Client & Booking Summary" bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 2, xs: 1 }} className="mb-6">
            <Descriptions.Item label="Client Name">{activeOrder.user_name || activeOrder.user?.full_name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Client Email">{activeOrder.user_email || activeOrder.user?.email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Client Mobile">{activeOrder.user?.mobile || '—'}</Descriptions.Item>
            <Descriptions.Item label="Provider">{activeOrder.provider?.full_name || 'Unassigned'}</Descriptions.Item>
            <Descriptions.Item label="Rate Card">{activeOrder.rate_card?.name || activeOrder.occasion || 'Standard'}</Descriptions.Item>
            <Descriptions.Item label="Total Price">{activeOrder.total_price ? `₹${activeOrder.total_price}` : activeOrder.budget || '—'}</Descriptions.Item>
            <Descriptions.Item label="Session Date">{activeOrder.session_date ? new Date(activeOrder.session_date).toLocaleDateString() : '—'}</Descriptions.Item>
            <Descriptions.Item label="Session Slot">{activeOrder.session_start_time ? `${activeOrder.session_start_time} - ${activeOrder.session_end_time || ''}` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag color={activeOrder.payment?.status === 'CAPTURED' ? 'success' : 'warning'}>
                {activeOrder.payment?.status || 'PENDING'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">{new Date(activeOrder.created_at).toLocaleDateString()}</Descriptions.Item>
          </Descriptions>

          {/* Google Meet Link */}
          {activeOrder.google_meet_event?.meet_link && (
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuVideo className="text-blue-600" size={20} />
                <div>
                  <div className="text-xs font-semibold text-blue-900 uppercase">Google Meet Session</div>
                  <div className="text-sm font-mono text-blue-700">{activeOrder.google_meet_event.meet_link}</div>
                </div>
              </div>
              <a
                href={activeOrder.google_meet_event.meet_link}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-xs no-underline hover:bg-blue-700"
              >
                Join Meeting
              </a>
            </div>
          )}

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
      <RescheduleOrderModal
        visible={showReschedule}
        order={activeOrder}
        onCancel={() => setShowReschedule(false)}
        onSuccess={(updated) => {
          if (onOrderUpdated) onOrderUpdated(updated);
        }}
      />
    </Modal>
    </>
  );
};
