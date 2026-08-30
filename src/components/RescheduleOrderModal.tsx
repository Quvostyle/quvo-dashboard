import React, { useEffect } from 'react';
import { Modal, Form, DatePicker, TimePicker, message } from 'antd';
import dayjs from 'dayjs';
import type { IntakeRequest } from '../services/dataService';
import { useRescheduleOrderMutation } from '../store/apiSlice';

interface RescheduleOrderModalProps {
  visible: boolean;
  order: IntakeRequest | null;
  onCancel: () => void;
  onSuccess?: (updated: IntakeRequest) => void;
}

export const RescheduleOrderModal: React.FC<RescheduleOrderModalProps> = ({
  visible,
  order,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [rescheduleOrder, { isLoading }] = useRescheduleOrderMutation();

  useEffect(() => {
    if (order && visible) {
      const initialDate = order.session_date ? dayjs(order.session_date) : dayjs();
      const startTime = order.session_start_time ? dayjs(order.session_start_time, ['HH:mm', 'h:mm A', 'HH:mm:ss']) : dayjs().hour(10).minute(0);
      const endTime = order.session_end_time ? dayjs(order.session_end_time, ['HH:mm', 'h:mm A', 'HH:mm:ss']) : dayjs().hour(11).minute(0);

      form.setFieldsValue({
        session_date: initialDate.isValid() ? initialDate : dayjs(),
        session_start_time: startTime.isValid() ? startTime : dayjs().hour(10).minute(0),
        session_end_time: endTime.isValid() ? endTime : dayjs().hour(11).minute(0)
      });
    }
  }, [order, visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!order) return;

      const dateStr = values.session_date.format('YYYY-MM-DD');
      const startTimeStr = values.session_start_time.format('HH:mm');
      const endTimeStr = values.session_end_time.format('HH:mm');

      const updated = await rescheduleOrder({
        id: order.id,
        session_date: dateStr,
        session_start_time: startTimeStr,
        session_end_time: endTimeStr
      }).unwrap();

      message.success('Booking rescheduled successfully.');
      if (onSuccess) onSuccess(updated);
      onCancel();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.data?.message || e?.message || 'Error rescheduling order');
    }
  };

  if (!order) return null;

  return (
    <Modal
      title="Reschedule Booking Session"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={isLoading}
      okText="Confirm Reschedule"
      cancelText="Cancel"
      centered
      destroyOnClose
      className="premium-modal"
    >
      <div className="py-2">
        <div className="bg-[#FAF8F5] border border-line rounded-xl p-4 mb-5">
          <div className="text-xs text-mute font-medium uppercase tracking-wider mb-1">Booking Info</div>
          <div className="font-semibold text-ink text-base">{order.occasion}</div>
          <div className="text-xs text-mute mt-1">
            Client: <strong className="text-ink">{order.user_name}</strong> • ID: <code>{order.id.slice(0, 8)}</code>
          </div>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="session_date"
            label="Session Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker className="w-full" size="large" format="YYYY-MM-DD" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="session_start_time"
              label="Start Time"
              rules={[{ required: true, message: 'Select start time' }]}
            >
              <TimePicker className="w-full" size="large" format="HH:mm" />
            </Form.Item>

            <Form.Item
              name="session_end_time"
              label="End Time"
              rules={[{ required: true, message: 'Select end time' }]}
            >
              <TimePicker className="w-full" size="large" format="HH:mm" />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
