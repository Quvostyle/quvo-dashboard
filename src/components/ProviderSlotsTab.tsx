import React, { useState, useEffect } from 'react';
import {
  Select,
  Button,
  Tag,
  Switch,
  Input,
  Modal,
  Form,
  DatePicker,
  Card,
  Row,
  Col,
  Tabs,
  message,
  Skeleton,
  Empty
} from 'antd';
import {
  LuClock,
  LuPlus,
  LuTrash2,
  LuBan,
  LuCircleAlert,
  LuCalendarDays,
  LuSave,
  LuChevronDown,
  LuChevronUp
} from 'react-icons/lu';
import dayjs from 'dayjs';
import {
  useGetProvidersQuery,
  useGetWeeklyScheduleQuery,
  useUpdateWeeklyScheduleMutation,
  useGetUnavailabilitiesQuery,
  useAddUnavailabilityMutation,
  useDeleteUnavailabilityMutation,
  useGetSlotOverridesQuery,
  useAddSlotOverrideMutation,
  useDeleteSlotOverrideMutation,
  useGetAvailableDatesQuery,
  useGetAvailableSlotsQuery
} from '../store/apiSlice';
import type { WeeklyScheduleDay, DayOfWeek } from '../services/dataService';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

interface ProviderSlotManagerProps {
  providerId: string;
}

const ProviderSlotManager: React.FC<ProviderSlotManagerProps> = ({ providerId }) => {
  // Active Tab within Provider Slots Section
  const [activeSubTab, setActiveSubTab] = useState<string>('schedule');

  // ─── 1. WEEKLY SCHEDULE STATE ───
  const { data: scheduleData = [], isLoading: scheduleLoading } = useGetWeeklyScheduleQuery(
    providerId,
    { skip: !providerId }
  );
  const [updateWeeklySchedule, { isLoading: isUpdatingSchedule }] = useUpdateWeeklyScheduleMutation();

  const [weeklySchedules, setWeeklySchedules] = useState<WeeklyScheduleDay[]>([]);

  useEffect(() => {
    if (scheduleData && scheduleData.length > 0) {
      setWeeklySchedules(scheduleData);
    } else {
      setWeeklySchedules(
        DAYS_OF_WEEK.map((day) => ({
          day_of_week: day,
          start_time: '09:00',
          end_time: '18:00',
          slot_duration_mins: 60,
          buffer_time_mins: 15,
          is_active: day !== 'SUNDAY'
        }))
      );
    }
  }, [scheduleData]);

  const handleScheduleChange = (index: number, key: keyof WeeklyScheduleDay, value: any) => {
    setWeeklySchedules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleSaveWeeklySchedule = async () => {
    if (!providerId) return;
    try {
      const cleanSchedules = weeklySchedules.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_mins: Number(s.slot_duration_mins),
        buffer_time_mins: Number(s.buffer_time_mins),
        is_active: Boolean(s.is_active)
      }));
      await updateWeeklySchedule({
        providerId,
        schedules: cleanSchedules
      }).unwrap();
      message.success('Weekly working schedule saved successfully!');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving weekly schedule');
    }
  };

  // ─── 2. LEAVES & UNAVAILABILITY STATE ───
  const { data: unavailabilities = [], isLoading: unavailLoading } = useGetUnavailabilitiesQuery(
    { providerId },
    { skip: !providerId }
  );
  const [addUnavailability, { isLoading: isAddingUnavail }] = useAddUnavailabilityMutation();
  const [deleteUnavailability] = useDeleteUnavailabilityMutation();

  const [showUnavailModal, setShowUnavailModal] = useState(false);
  const [unavailForm] = Form.useForm();
  const isFullDayWatch = Form.useWatch('is_full_day', unavailForm);

  const handleAddUnavailability = async (values: any) => {
    try {
      const dateStr = values.date.format('YYYY-MM-DD');
      await addUnavailability({
        providerId,
        body: {
          date: dateStr,
          is_full_day: !!values.is_full_day,
          start_time: values.is_full_day ? undefined : values.start_time,
          end_time: values.is_full_day ? undefined : values.end_time,
          reason: values.reason || ''
        }
      }).unwrap();
      message.success('Leave/Unavailability record added successfully.');
      setShowUnavailModal(false);
      unavailForm.resetFields();
    } catch (e: any) {
      message.error(e.data || e.message || 'Error adding leave record');
    }
  };

  const handleDeleteUnavailability = async (id: string) => {
    try {
      await deleteUnavailability({ providerId, id }).unwrap();
      message.info('Leave record deleted.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deleting leave record');
    }
  };

  // ─── 3. SLOT OVERRIDES STATE ───
  const { data: slotOverrides = [], isLoading: overridesLoading } = useGetSlotOverridesQuery(
    { providerId },
    { skip: !providerId }
  );
  const [addSlotOverride, { isLoading: isAddingOverride }] = useAddSlotOverrideMutation();
  const [deleteSlotOverride] = useDeleteSlotOverrideMutation();

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideForm] = Form.useForm();

  const handleAddOverride = async (values: any) => {
    try {
      const dateStr = values.date.format('YYYY-MM-DD');
      await addSlotOverride({
        providerId,
        body: {
          date: dateStr,
          start_time: values.start_time,
          end_time: values.end_time,
          type: values.type,
          note: values.note || ''
        }
      }).unwrap();
      message.success('Slot override created successfully.');
      setShowOverrideModal(false);
      overrideForm.resetFields();
    } catch (e: any) {
      message.error(e.data || e.message || 'Error adding slot override');
    }
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      await deleteSlotOverride({ providerId, id }).unwrap();
      message.info('Slot override removed.');
    } catch (e: any) {
      message.error(e.data || e.message || 'Error removing slot override');
    }
  };

  // ─── 4. LIVE SLOT INSPECTOR STATE ───
  const [inspectorMonth, setInspectorMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [inspectorDate, setInspectorDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  const { data: availableDates = [] } = useGetAvailableDatesQuery(
    { providerId, month: inspectorMonth },
    { skip: !providerId }
  );

  const { data: computedSlots = [], isLoading: slotsLoading } = useGetAvailableSlotsQuery(
    { providerId, date: inspectorDate },
    { skip: !providerId || !inspectorDate }
  );

  return (
    <div className="space-y-4">
      <Tabs
        activeKey={activeSubTab}
        onChange={(key) => setActiveSubTab(key)}
        type="card"
        className="custom-slots-tabs"
        items={[
          {
            key: 'schedule',
            label: (
              <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-medium">
                <LuClock size={14} /> 1. Weekly Schedule
              </span>
            ),
            children: (
              <div className="bg-white p-4 rounded-lg border border-line space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink">Recurring Weekly Working Hours</h3>
                    <p className="text-[0.75rem] text-mute">
                      Set working hours, slot durations, and buffer times for each day of the week.
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<LuSave size={14} />}
                    loading={isUpdatingSchedule}
                    onClick={handleSaveWeeklySchedule}
                    size="middle"
                  >
                    Save Schedule
                  </Button>
                </div>

                {scheduleLoading ? (
                  <Skeleton active paragraph={{ rows: 7 }} />
                ) : (
                  <div className="space-y-2">
                    {weeklySchedules.map((dayItem, index) => (
                      <div
                        key={dayItem.day_of_week}
                        className={`py-2 px-3 rounded-md border transition-all ${
                          dayItem.is_active
                            ? 'bg-white border-line shadow-xs'
                            : 'bg-gray-50/70 border-dashed border-gray-300 opacity-70'
                        }`}
                      >
                        <Row gutter={[12, 12]} align="middle">
                          <Col xs={24} sm={6} md={5}>
                            <div className="flex items-center gap-2.5">
                              <Switch
                                size="small"
                                checked={dayItem.is_active}
                                onChange={(val) => handleScheduleChange(index, 'is_active', val)}
                              />
                              <span className="font-semibold text-xs text-ink w-20">
                                {dayItem.day_of_week}
                              </span>
                            </div>
                          </Col>

                          <Col xs={24} sm={10} md={9}>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Input
                                type="time"
                                size="small"
                                value={dayItem.start_time}
                                disabled={!dayItem.is_active}
                                onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                                className="w-[95px]"
                              />
                              <span className="text-mute text-[0.75rem]">to</span>
                              <Input
                                type="time"
                                size="small"
                                value={dayItem.end_time}
                                disabled={!dayItem.is_active}
                                onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                                className="w-[95px]"
                              />
                            </div>
                          </Col>

                          <Col xs={24} sm={8} md={10}>
                            <div className="flex flex-wrap items-center gap-2.5 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-[0.75rem] text-mute">Slot:</span>
                                <Select
                                  size="small"
                                  value={dayItem.slot_duration_mins}
                                  disabled={!dayItem.is_active}
                                  onChange={(val) => handleScheduleChange(index, 'slot_duration_mins', val)}
                                  className="w-[85px]"
                                >
                                  <Select.Option value={30}>30 mins</Select.Option>
                                  <Select.Option value={45}>45 mins</Select.Option>
                                  <Select.Option value={60}>60 mins</Select.Option>
                                  <Select.Option value={90}>90 mins</Select.Option>
                                  <Select.Option value={120}>120 mins</Select.Option>
                                </Select>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[0.75rem] text-mute">Buffer:</span>
                                <Select
                                  size="small"
                                  value={dayItem.buffer_time_mins}
                                  disabled={!dayItem.is_active}
                                  onChange={(val) => handleScheduleChange(index, 'buffer_time_mins', val)}
                                  className="w-[80px]"
                                >
                                  <Select.Option value={0}>0 min</Select.Option>
                                  <Select.Option value={10}>10 mins</Select.Option>
                                  <Select.Option value={15}>15 mins</Select.Option>
                                  <Select.Option value={30}>30 mins</Select.Option>
                                </Select>
                              </div>

                              {!dayItem.is_active && (
                                <Tag color="default" className="text-[0.68rem] !m-0 py-0 px-1.5">
                                  Day Off
                                </Tag>
                              )}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="primary"
                    icon={<LuSave size={14} />}
                    loading={isUpdatingSchedule}
                    onClick={handleSaveWeeklySchedule}
                    size="middle"
                  >
                    Save Schedule
                  </Button>
                </div>
              </div>
            )
          },
          {
            key: 'unavailability',
            label: (
              <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-medium">
                <LuBan size={14} /> 2. Leaves & Unavailability
              </span>
            ),
            children: (
              <div className="bg-white p-4 rounded-lg border border-line space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink">Leaves & Hourly Breaks</h3>
                    <p className="text-[0.75rem] text-mute">
                      Record full-day leaves or partial-day breaks when the provider is unavailable.
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<LuPlus size={14} />}
                    onClick={() => setShowUnavailModal(true)}
                    size="middle"
                  >
                    Record Leave / Break
                  </Button>
                </div>

                {unavailLoading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : unavailabilities.length === 0 ? (
                  <Empty description="No leave or unavailability records found for this provider." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unavailabilities.map((record) => (
                      <Card
                        key={record.id}
                        className="!border-line hover:border-gold transition-colors !p-3"
                        bodyStyle={{ padding: 0 }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-ink text-sm">
                                📅 {record.date}
                              </span>
                              {record.is_full_day ? (
                                <Tag color="error" className="text-[0.7rem] !m-0">Full Day Leave</Tag>
                              ) : (
                                <Tag color="warning" className="text-[0.7rem] !m-0">
                                  Hourly Break ({record.start_time} - {record.end_time})
                                </Tag>
                              )}
                            </div>
                            {record.reason && (
                              <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                                📝 {record.reason}
                              </p>
                            )}
                          </div>
                          <Button
                            danger
                            type="text"
                            size="small"
                            icon={<LuTrash2 size={14} />}
                            onClick={() => handleDeleteUnavailability(record.id)}
                            title="Delete Record"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'overrides',
            label: (
              <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-medium">
                <LuCircleAlert size={14} /> 3. One-Off Overrides
              </span>
            ),
            children: (
              <div className="bg-white p-4 rounded-lg border border-line space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink">One-Off Slot Overrides</h3>
                    <p className="text-[0.75rem] text-mute">
                      Block specific time slots or force open extra slots outside working hours.
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<LuPlus size={14} />}
                    onClick={() => setShowOverrideModal(true)}
                    size="middle"
                  >
                    Add Slot Override
                  </Button>
                </div>

                {overridesLoading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : slotOverrides.length === 0 ? (
                  <Empty description="No slot override records found for this provider." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slotOverrides.map((override) => (
                      <Card
                        key={override.id}
                        className="!border-line hover:border-gold transition-colors !p-3"
                        bodyStyle={{ padding: 0 }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-ink text-sm">
                                🗓️ {override.date}
                              </span>
                              {override.type === 'BLOCKED' ? (
                                <Tag color="volcano" className="text-[0.7rem] !m-0">BLOCKED ({override.start_time} - {override.end_time})</Tag>
                              ) : (
                                <Tag color="green" className="text-[0.7rem] !m-0">FORCE AVAILABLE ({override.start_time} - {override.end_time})</Tag>
                              )}
                            </div>
                            {override.note && (
                              <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                                📌 {override.note}
                              </p>
                            )}
                          </div>
                          <Button
                            danger
                            type="text"
                            size="small"
                            icon={<LuTrash2 size={14} />}
                            onClick={() => handleDeleteOverride(override.id)}
                            title="Remove Override"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'inspector',
            label: (
              <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-medium">
                <LuCalendarDays size={14} /> 4. Live Slot Inspector
              </span>
            ),
            children: (
              <div className="bg-white p-4 rounded-lg border border-line space-y-4">
                <div className="pb-2 border-b border-line">
                  <h3 className="text-base font-bold text-ink">Real-Time Booking Slot Inspector</h3>
                  <p className="text-[0.75rem] text-mute">
                    Test customer slot computation live for any date and month.
                  </p>
                </div>

                <Row gutter={[12, 12]} align="middle">
                  <Col xs={24} sm={12} md={8}>
                    <label className="block text-[0.7rem] font-semibold text-gray-700 mb-0.5">
                      Filter Month (YYYY-MM):
                    </label>
                    <Input
                      type="month"
                      value={inspectorMonth}
                      onChange={(e) => setInspectorMonth(e.target.value)}
                      size="middle"
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <label className="block text-[0.7rem] font-semibold text-gray-700 mb-0.5">
                      Inspect Date (YYYY-MM-DD):
                    </label>
                    <Input
                      type="date"
                      value={inspectorDate}
                      onChange={(e) => setInspectorDate(e.target.value)}
                      size="middle"
                    />
                  </Col>
                </Row>

                <div className="p-3 bg-gray-50 rounded-lg border border-line">
                  <h4 className="text-xs font-bold text-ink mb-1.5">
                    📅 Available Dates in {inspectorMonth} ({availableDates.length} days with open slots):
                  </h4>
                  {availableDates.length === 0 ? (
                    <span className="text-[0.75rem] text-mute italic">
                      No available dates found for month {inspectorMonth}.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {availableDates.map((d) => (
                        <Tag
                          key={d}
                          color={d === inspectorDate ? 'gold' : 'blue'}
                          className="cursor-pointer font-medium py-0 px-1.5 text-[0.75rem] hover:scale-105 transition-transform"
                          onClick={() => setInspectorDate(d)}
                        >
                          {d}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-ink">
                      Computed Slots for <span className="text-gold">{inspectorDate}</span>
                    </h4>
                    <div className="flex items-center gap-2.5 text-[0.7rem]">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Available
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Booked
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> Blocked
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span> Unavailable
                      </span>
                    </div>
                  </div>

                  {slotsLoading ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                  ) : computedSlots.length === 0 ? (
                    <Empty description="No slots generated for this date." />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {computedSlots.map((slot, i) => {
                        let badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                        let tagColor = 'success';
                        if (slot.status === 'BOOKED') {
                          badgeBg = 'bg-blue-50 border-blue-200 text-blue-800';
                          tagColor = 'processing';
                        } else if (slot.status === 'BLOCKED') {
                          badgeBg = 'bg-orange-50 border-orange-200 text-orange-800';
                          tagColor = 'warning';
                        } else if (slot.status === 'UNAVAILABLE') {
                          badgeBg = 'bg-gray-100 border-gray-200 text-gray-500';
                          tagColor = 'default';
                        }

                        return (
                          <div
                            key={i}
                            className={`p-2 rounded border text-center transition-all ${badgeBg}`}
                          >
                            <div className="font-bold text-xs">
                              {slot.start_time} - {slot.end_time}
                            </div>
                            <div className="mt-0.5">
                              <Tag color={tagColor} className="!m-0 text-[0.6rem] uppercase py-0 px-1">
                                {slot.status}
                              </Tag>
                            </div>
                            {slot.note && (
                              <div className="text-[0.65rem] opacity-80 mt-0.5 line-clamp-1" title={slot.note}>
                                {slot.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          }
        ]}
      />

      {/* MODAL 1: ADD LEAVE / UNAVAILABILITY */}
      <Modal
        title="Record Leave / Unavailability"
        open={showUnavailModal}
        onCancel={() => setShowUnavailModal(false)}
        footer={null}
        destroyOnClose
        centered
        width={460}
      >
        <Form form={unavailForm} layout="vertical" onFinish={handleAddUnavailability}>
          <Form.Item
            name="date"
            label="Leave Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker className="w-full" size="middle" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="is_full_day" valuePropName="checked" initialValue={true}>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-line">
              <span className="font-medium text-xs text-gray-700">Full Day Leave</span>
              <Switch defaultChecked size="small" />
            </div>
          </Form.Item>

          {!isFullDayWatch && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="start_time"
                  label="Start Time"
                  rules={[{ required: !isFullDayWatch, message: 'Select start time' }]}
                >
                  <Input type="time" size="middle" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="end_time"
                  label="End Time"
                  rules={[{ required: !isFullDayWatch, message: 'Select end time' }]}
                >
                  <Input type="time" size="middle" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item name="reason" label="Reason / Notes">
            <Input.TextArea placeholder="e.g. Doctor Appointment, Personal Holiday" rows={2} />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-3">
            <Button size="middle" onClick={() => setShowUnavailModal(false)}>Cancel</Button>
            <Button size="middle" type="primary" htmlType="submit" loading={isAddingUnavail}>
              Save Record
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL 2: ADD SLOT OVERRIDE */}
      <Modal
        title="Add One-Off Slot Override"
        open={showOverrideModal}
        onCancel={() => setShowOverrideModal(false)}
        footer={null}
        destroyOnClose
        centered
        width={460}
      >
        <Form form={overrideForm} layout="vertical" onFinish={handleAddOverride}>
          <Form.Item
            name="date"
            label="Override Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker className="w-full" size="middle" format="YYYY-MM-DD" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="Start Time"
                rules={[{ required: true, message: 'Select start time' }]}
              >
                <Input type="time" size="middle" placeholder="11:15" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="End Time"
                rules={[{ required: true, message: 'Select end time' }]}
              >
                <Input type="time" size="middle" placeholder="12:15" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="type"
            label="Override Type"
            initialValue="BLOCKED"
            rules={[{ required: true, message: 'Select override type' }]}
          >
            <Select size="middle">
              <Select.Option value="BLOCKED">🛑 BLOCKED (Lock Time Slot)</Select.Option>
              <Select.Option value="FORCE_AVAILABLE">
                🟢 FORCE AVAILABLE (Open Slot Outside Hours)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Note / Administrative Reason">
            <Input.TextArea placeholder="e.g. VIP Special Session, Admin locked slot" rows={2} />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-3">
            <Button size="middle" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
            <Button size="middle" type="primary" htmlType="submit" loading={isAddingOverride}>
              Save Override
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export const ProviderSlotsTab: React.FC = () => {
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  // All accordions closed by default
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  if (providersLoading) {
    return (
      <div className="animate-fade-in p-4 bg-white rounded-lg border border-line">
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-line text-center animate-fade-up">
        <LuCircleAlert size={40} className="mx-auto text-gold mb-2" />
        <h3 className="text-lg font-semibold text-ink">No Providers Onboarded</h3>
        <p className="text-mute max-w-md mx-auto mt-1 text-xs">
          To manage availability schedules and slot booking rules, please onboard at least one provider in the <strong>Providers</strong> section first.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-3">
      {/* COMPACT SECTION HEADER */}
      <div className="bg-white p-4 py-3 rounded-lg border border-line shadow-xs">
        <p className="label-overline text-[0.68rem]">Slot Management</p>
        <h2 className="text-xl font-bold mt-0.5">Provider Availability & Slots</h2>
        <p className="text-mute text-xs mt-0.5">
          Click on any provider below to open/hide their availability schedule, leaves, slot overrides, and live booking inspector.
        </p>
      </div>

      {/* COMPACT PROVIDERS ACCORDION */}
      <div className="space-y-2.5">
        {providers.map((p) => {
          const isExpanded = selectedProviderId === p.id;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-lg border transition-all overflow-hidden ${
                isExpanded
                  ? 'border-gold shadow-sm ring-1 ring-gold/20'
                  : 'border-line hover:border-gold/50 shadow-xs'
              }`}
            >
              {/* CLICKABLE COMPACT HEADER ROW */}
              <div
                onClick={() => setSelectedProviderId(isExpanded ? '' : p.id)}
                className="py-3 px-4 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[rgba(184,148,106,0.03)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {p.profilePic ? (
                    <img
                      src={p.profilePic}
                      alt={p.full_name}
                      className="w-9 h-9 rounded-full object-cover border border-gold"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm">
                      {p.full_name ? p.full_name.charAt(0) : 'P'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-[0.95rem] font-bold text-ink leading-tight">{p.full_name}</h4>
                    <p className="text-[0.75rem] text-mute flex items-center gap-1.5 mt-0.5">
                      {p.mobile && <span>📱 {p.mobile}</span>}
                      {p.mobile && p.email && <span>|</span>}
                      {p.email && <span>✉️ {p.email}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Tag color={p.isActive ? 'success' : 'error'} className="px-2 py-0.5 text-[0.7rem] !m-0">
                    {p.isActive ? 'Active Provider' : 'Inactive'}
                  </Tag>

                  <Button
                    type="text"
                    size="small"
                    icon={isExpanded ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                    className="text-gray-500 hover:text-ink"
                  />
                </div>
              </div>

              {/* COMPACT EXPANDED SLOTS WORKSPACE */}
              {isExpanded && (
                <div className="p-4 border-t border-line bg-gray-50/50 animate-fade-in">
                  <ProviderSlotManager providerId={p.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
