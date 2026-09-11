import React from 'react';
import { Modal, Spin, Empty, Tag, Card } from 'antd';
import { LuCompass, LuClock, LuGlobe, LuSmartphone, LuLaptop, LuUser, LuArrowRight } from 'react-icons/lu';
import { useGetAnalyticsJourneyQuery } from '../store/apiSlice';

interface UserJourneyModalProps {
  visible: boolean;
  sessionId: string | null;
  userEmail?: string | null;
  deviceType?: string;
  browser?: string;
  onClose: () => void;
}

export const UserJourneyModal: React.FC<UserJourneyModalProps> = ({
  visible,
  sessionId,
  userEmail,
  deviceType,
  browser,
  onClose
}) => {
  const { data: journey = [], isLoading, isFetching } = useGetAnalyticsJourneyQuery(sessionId || '', {
    skip: !sessionId || !visible
  });

  const getDeviceIcon = (device?: string) => {
    if ((device || '').toLowerCase().includes('mobile')) return <LuSmartphone className="text-amber-600" size={16} />;
    return <LuLaptop className="text-blue-600" size={16} />;
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-ink font-serif">
          <LuCompass className="text-gold" size={20} />
          <span>User Session Journey Path</span>
        </div>
      }
      width={650}
      className="journey-modal"
    >
      <div className="py-2">
        {/* Session Metadata Banner */}
        <div className="bg-[rgba(184,148,106,0.06)] border border-line rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Tag color="gold" className="font-mono text-xs">
              ID: {sessionId?.slice(0, 12)}...
            </Tag>
            <div className="flex items-center gap-1 text-mute text-xs">
              {getDeviceIcon(deviceType)}
              <span className="capitalize">{deviceType || 'Device'}</span>
              <span>•</span>
              <LuGlobe size={14} />
              <span>{browser || 'Browser'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink">
            <LuUser size={14} className="text-mute" />
            <span className="font-medium">{userEmail || 'Guest User'}</span>
          </div>
        </div>

        {/* Journey Content */}
        {isLoading || isFetching ? (
          <div className="py-12 text-center">
            <Spin size="large" />
            <p className="mt-3 text-mute text-sm">Tracing navigation sequence...</p>
          </div>
        ) : journey.length === 0 ? (
          <Empty description="No page visit logs found for this session." className="py-8" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-mute uppercase tracking-wider px-1">
              <span>Steps ({journey.length} visited pages)</span>
              <span>Page / Duration</span>
            </div>

            <div className="relative border-l-2 border-gold/30 ml-4 pl-6 space-y-4 py-1">
              {journey.map((step, idx) => {
                const isLast = idx === journey.length - 1;
                return (
                  <div key={step.id || idx} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${
                        isLast ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' : 'bg-gold text-white'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <Card
                      size="small"
                      className="border-line hover:border-gold transition-colors shadow-xs"
                      styles={{ body: { padding: '10px 14px' } }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-sm font-semibold text-ink truncate">
                            {step.url}
                          </span>
                          {step.url === '/' && (
                            <Tag color="blue" className="text-[10px] m-0">Home</Tag>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <LuClock size={12} />
                            {step.time_spent}s
                          </span>
                          <span className="text-mute text-[11px]">
                            {new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {!isLast && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-mute">
                          <span>Navigated to next page</span>
                          <LuArrowRight size={12} />
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
