import React, { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Table,
  Spin,
  Progress,
  Tooltip,
  Modal,
  Input,
  Badge
} from 'antd';
import {
  LuChartBar,
  LuClock,
  LuUsers,
  LuGlobe,
  LuSmartphone,
  LuLaptop,
  LuTablet,
  LuRefreshCw,
  LuArrowUpRight,
  LuCode,
  LuActivity,
  LuCompass,
  LuSearch,
  LuCalendar,
  LuTrendingUp,
  LuFilter,
  LuChevronDown,
  LuChevronUp,
  LuEye
} from 'react-icons/lu';
import {
  useGetAnalyticsSummaryQuery,
  useGetAnalyticsDailyQuery,
  useGetAnalyticsTopPagesQuery,
  useGetAnalyticsDevicesQuery,
  useGetAnalyticsBrowsersQuery,
  useGetAnalyticsActiveSessionsQuery,
  useGetAnalyticsRecentVisitsQuery,
  useGetAnalyticsLogsQuery
} from '../store/apiSlice';
import type { ActiveSession, RecentVisit, ActivityLog, DailyVisit, TopPage, DeviceBreakdown, BrowserBreakdown } from '../services/dataService';
import { UserJourneyModal } from './UserJourneyModal';

const DAY_OPTIONS = [7, 14, 30, 60, 90];

// Hourly traffic distribution (00:00 - 23:00)
const HOURLY_TRAFFIC = [
  { hour: '00:00', count: 12 }, { hour: '02:00', count: 8 },
  { hour: '04:00', count: 5 },  { hour: '06:00', count: 14 },
  { hour: '08:00', count: 38 }, { hour: '10:00', count: 72 },
  { hour: '12:00', count: 89 }, { hour: '14:00', count: 115 },
  { hour: '16:00', count: 142 }, { hour: '18:00', count: 128 },
  { hour: '20:00', count: 96 }, { hour: '22:00', count: 45 }
];

// Conversion funnel data
const FUNNEL_STAGES = [
  { stage: '1. Total Visits', count: 1240, color: '#3b82f6', desc: 'All incoming page requests' },
  { stage: '2. Stylist Directory', count: 740, color: '#8b5cf6', desc: 'Browsed stylist profiles & lookbooks' },
  { stage: '3. Rate Card Views', count: 480, color: '#ec4899', desc: 'Inspected service packages & pricing' },
  { stage: '4. Slot Selection', count: 230, color: '#f59e0b', desc: 'Initiated session date/time picker' },
  { stage: '5. Confirmed Bookings', count: 95, color: '#10b981', desc: 'Successfully created styling booking' }
];

export const AnalyticsTab: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [chartViewMode, setChartViewMode] = useState<'spline' | 'bar'>('spline');
  const [showDailyTable, setShowDailyTable] = useState<boolean>(false);
  const [recentVisitSearch, setRecentVisitSearch] = useState<string>('');

  // Journey Modal State
  const [activeJourneySession, setActiveJourneySession] = useState<{
    id: string;
    email?: string | null;
    device?: string;
    browser?: string;
  } | null>(null);

  // Payload Viewer Modal State
  const [selectedLogPayload, setSelectedLogPayload] = useState<{ action: string; payload: any } | null>(null);

  // RTK Query Hooks
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useGetAnalyticsSummaryQuery(selectedDays);
  const { data: dailyData = [], isLoading: loadingDaily, refetch: refetchDaily } = useGetAnalyticsDailyQuery(selectedDays);
  const { data: topPages = [], isLoading: loadingTopPages, refetch: refetchTopPages } = useGetAnalyticsTopPagesQuery(selectedDays);
  const { data: devices = [], isLoading: loadingDevices, refetch: refetchDevices } = useGetAnalyticsDevicesQuery(selectedDays);
  const { data: browsers = [], isLoading: loadingBrowsers, refetch: refetchBrowsers } = useGetAnalyticsBrowsersQuery(selectedDays);
  const { data: activeSessions = [], isLoading: loadingSessions, refetch: refetchSessions } = useGetAnalyticsActiveSessionsQuery();
  const { data: recentVisits = [], isLoading: loadingVisits, refetch: refetchVisits } = useGetAnalyticsRecentVisitsQuery(50);
  const { data: activityLogs = [], isLoading: loadingLogs, refetch: refetchLogs } = useGetAnalyticsLogsQuery(100);

  const handleRefreshAll = () => {
    refetchSummary();
    refetchDaily();
    refetchTopPages();
    refetchDevices();
    refetchBrowsers();
    refetchSessions();
    refetchVisits();
    refetchLogs();
  };

  // Math & Helpers
  const maxDailyCount = Math.max(...dailyData.map((d) => d.count), 1);
  const totalDailyVisitsSum = dailyData.reduce((acc, d) => acc + d.count, 0) || 1;
  const totalDeviceVisits = devices.reduce((acc, d) => acc + d.count, 0) || 1;
  const totalBrowserVisits = browsers.reduce((acc, b) => acc + b.count, 0) || 1;
  const maxHourlyCount = Math.max(...HOURLY_TRAFFIC.map((h) => h.count), 1);

  const getDeviceIcon = (deviceStr: string) => {
    const dev = (deviceStr || '').toLowerCase();
    if (dev.includes('mobile')) return <LuSmartphone size={16} className="text-amber-600" />;
    if (dev.includes('tablet')) return <LuTablet size={16} className="text-purple-600" />;
    return <LuLaptop size={16} className="text-blue-600" />;
  };

  const formatSeconds = (sec?: number) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const filteredRecentVisits = recentVisits.filter((v: RecentVisit) => {
    if (!recentVisitSearch.trim()) return true;
    const q = recentVisitSearch.toLowerCase();
    return (
      v.url.toLowerCase().includes(q) ||
      (v.user_email && v.user_email.toLowerCase().includes(q)) ||
      v.browser.toLowerCase().includes(q) ||
      v.device_type.toLowerCase().includes(q)
    );
  });

  // SVG Spline Curve Generator
  const renderSplineChart = (data: DailyVisit[], svgWidth = 800, svgHeight = 220) => {
    if (!data || data.length === 0) return null;
    const paddingX = 35;
    const paddingY = 30;
    const availableWidth = svgWidth - paddingX * 2;
    const availableHeight = svgHeight - paddingY * 2;
    const maxVal = Math.max(...data.map((d) => d.count), 1);

    const pts = data.map((d, i) => {
      const x = paddingX + (i / Math.max(data.length - 1, 1)) * availableWidth;
      const y = svgHeight - paddingY - (d.count / maxVal) * availableHeight;
      return { x, y, count: d.count, date: d.date };
    });

    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${svgHeight - paddingY} L ${pts[0].x} ${svgHeight - paddingY} Z`;
    const peakPt = [...pts].sort((a, b) => b.count - a.count)[0];

    return { pts, pathD, areaD, peakPt };
  };

  const splineResult = renderSplineChart(dailyData);

  // SVG Donut Generator
  const renderDonutChart = (items: { name: string; count: number; color: string }[], total: number) => {
    let accumulatedAngle = 0;
    const radius = 38;
    const circumference = 2 * Math.PI * radius;

    return items.map((item) => {
      const percentage = total > 0 ? item.count / total : 0;
      const strokeDasharray = `${percentage * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += percentage;

      return {
        ...item,
        percentage: Math.round(percentage * 100),
        strokeDasharray,
        strokeDashoffset
      };
    });
  };

  const deviceColors: Record<string, string> = {
    mobile: '#f59e0b',
    desktop: '#3b82f6',
    tablet: '#8b5cf6'
  };

  const browserColors: Record<string, string> = {
    Chrome: '#10b981',
    Safari: '#3b82f6',
    Firefox: '#f97316',
    Edge: '#6366f1'
  };

  const deviceDonutData = renderDonutChart(
    devices.map((d) => ({ name: d.device, count: d.count, color: deviceColors[d.device] || '#B8946A' })),
    totalDeviceVisits
  );

  const browserDonutData = renderDonutChart(
    browsers.map((b) => ({ name: b.browser, count: b.count, color: browserColors[b.browser] || '#64748b' })),
    totalBrowserVisits
  );

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* ─── HEADER & CONTROLS ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-paper p-4 rounded-xl border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif text-ink !m-0">Studio Master Analytics & Telemetry</h1>
            <Badge status="processing" color="#10b981" text={<span className="text-xs font-semibold text-emerald-700">Live Backend Stream</span>} />
          </div>
          <p className="text-sm text-mute !m-0 mt-0.5">
            Unified executive dashboard displaying visual graphs and detailed tabular telemetry side-by-side.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Days Scope Selector */}
          <div className="inline-flex items-center bg-bone p-1 rounded-lg border border-line">
            <span className="text-xs text-mute font-medium px-2 flex items-center gap-1">
              <LuCalendar size={13} /> Scope:
            </span>
            {DAY_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedDays === days
                    ? 'bg-gold text-white shadow-xs'
                    : 'text-ink hover:text-gold hover:bg-white/50'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          <Button
            icon={<LuRefreshCw size={15} />}
            onClick={handleRefreshAll}
            className="flex items-center gap-1 text-xs font-medium border-line text-ink hover:border-gold hover:text-gold"
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* ─── 1. TOP EXECUTIVE KPI SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Page Visits */}
        <Card className="border-line shadow-xs relative overflow-hidden" styles={{ body: { padding: '18px' } }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-mute">Total Page Visits</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <LuChartBar size={18} />
            </div>
          </div>
          {loadingSummary ? (
            <Spin className="mt-3 block" />
          ) : (
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-ink">
                {(summary?.totalVisits ?? 0).toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Tag color="gold" className="m-0 text-[11px]">
                  {selectedDays} Days Period
                </Tag>
                <span className="text-mute">{summary?.totalSessions ?? 0} total sessions</span>
              </div>
            </div>
          )}
        </Card>

        {/* Real-Time Active Sessions */}
        <Card className="border-line shadow-xs relative overflow-hidden" styles={{ body: { padding: '18px' } }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-mute">Active Sessions (15m)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <LuActivity size={18} />
            </div>
          </div>
          {loadingSessions ? (
            <Spin className="mt-3 block" />
          ) : (
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-emerald-600 flex items-center gap-2">
                {activeSessions.length}
                <span className="text-xs font-normal text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                  Active Now
                </span>
              </div>
              <p className="text-xs text-mute mt-2 !m-0">
                Tracked across mobile & desktop devices
              </p>
            </div>
          )}
        </Card>

        {/* Audience Ratio */}
        <Card className="border-line shadow-xs relative overflow-hidden" styles={{ body: { padding: '18px' } }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-mute">Guest vs Member Ratio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <LuUsers size={18} />
            </div>
          </div>
          {loadingSummary ? (
            <Spin className="mt-3 block" />
          ) : (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Guest: {summary?.guestPercent ?? 0}%</span>
                <span className="font-semibold text-gold">Member: {summary?.loggedInPercent ?? 0}%</span>
              </div>
              <Progress
                percent={summary?.guestPercent ?? 70}
                strokeColor="#94a3b8"
                trailColor="#B8946A"
                showInfo={false}
                size="small"
              />
              <div className="flex items-center justify-between text-[11px] text-mute">
                <span>{summary?.guestVisits ?? 0} Guests</span>
                <span>{summary?.loggedInVisits ?? 0} Members</span>
              </div>
            </div>
          )}
        </Card>

        {/* Avg Engagement Time */}
        <Card className="border-line shadow-xs relative overflow-hidden" styles={{ body: { padding: '18px' } }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-mute">Avg Time / Visit</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <LuClock size={18} />
            </div>
          </div>
          {loadingSummary ? (
            <Spin className="mt-3 block" />
          ) : (
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-ink">
                {formatSeconds(summary?.avgTimeSpentSeconds)}
              </div>
              <p className="text-xs text-mute mt-2 !m-0">
                Average engagement per page request
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ─── 2. DAILY TRAFFIC VELOCITY (GRAPH + EXPANDABLE BREAKDOWN TABLE) ─── */}
      <Card
        title={
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2 font-serif text-ink">
              <LuTrendingUp className="text-gold" size={18} />
              <span>Daily Traffic Trend ({selectedDays} Days Timeline)</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="small"
                icon={showDailyTable ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                onClick={() => setShowDailyTable(!showDailyTable)}
                className="text-xs text-slate-700 border-line hover:border-gold hover:text-gold"
              >
                {showDailyTable ? 'Hide Daily Table' : 'Show Daily Data Table'}
              </Button>

              <div className="inline-flex bg-bone p-0.5 rounded-lg border border-line text-xs">
                <button
                  onClick={() => setChartViewMode('spline')}
                  className={`px-3 py-1 rounded font-medium transition-all ${
                    chartViewMode === 'spline' ? 'bg-gold text-white shadow-xs' : 'text-mute hover:text-ink'
                  }`}
                >
                  Area Curve
                </button>
                <button
                  onClick={() => setChartViewMode('bar')}
                  className={`px-3 py-1 rounded font-medium transition-all ${
                    chartViewMode === 'bar' ? 'bg-gold text-white shadow-xs' : 'text-mute hover:text-ink'
                  }`}
                >
                  Bar Columns
                </button>
              </div>
            </div>
          </div>
        }
        className="border-line shadow-xs"
      >
        {loadingDaily ? (
          <div className="py-20 text-center">
            <Spin size="large" />
          </div>
        ) : dailyData.length === 0 ? (
          <div className="py-12 text-center text-mute text-sm">No daily traffic recorded yet.</div>
        ) : (
          <div className="space-y-4">
            {/* Visual Graph View */}
            {chartViewMode === 'spline' && splineResult ? (
              <div className="pt-2">
                <div className="w-full overflow-hidden">
                  <svg viewBox="0 0 800 220" className="w-full h-56">
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#B8946A" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#B8946A" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0.25, 0.5, 0.75].map((pct, i) => (
                      <line
                        key={i}
                        x1="35"
                        y1={220 - 30 - pct * 160}
                        x2="765"
                        y2={220 - 30 - pct * 160}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                    ))}

                    <path d={splineResult.areaD} fill="url(#goldGradient)" />
                    <path d={splineResult.pathD} fill="none" stroke="#B8946A" strokeWidth="3" strokeLinecap="round" />

                    {splineResult.pts.map((pt, idx) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          className="fill-white stroke-amber-800 stroke-[2.5] group-hover:r-6 transition-all"
                        />
                        <title>{`${pt.date}: ${pt.count} visits`}</title>
                      </g>
                    ))}

                    {splineResult.peakPt && (
                      <g transform={`translate(${splineResult.peakPt.x - 35}, ${splineResult.peakPt.y - 25})`}>
                        <rect width="70" height="20" rx="4" fill="#1e293b" opacity="0.9" />
                        <text x="35" y="13" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                          Peak: {splineResult.peakPt.count}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-mute px-4 mt-1 border-t border-line pt-2">
                  <span>{dailyData[0]?.date}</span>
                  <span>{dailyData[Math.floor(dailyData.length / 2)]?.date}</span>
                  <span>{dailyData[dailyData.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-2">
                <div className="h-48 flex items-end gap-1.5 px-2 border-b border-line pb-1 overflow-x-auto">
                  {dailyData.map((item, idx) => {
                    const heightPercent = Math.max(Math.round((item.count / maxDailyCount) * 100), 6);
                    const isPeak = item.count === maxDailyCount;

                    return (
                      <Tooltip
                        key={item.date || idx}
                        title={
                          <div className="text-xs text-center">
                            <div className="font-semibold">{item.date}</div>
                            <div>{item.count} visits</div>
                          </div>
                        }
                      >
                        <div className="flex-1 min-w-[12px] flex flex-col items-center group cursor-pointer h-full justify-end">
                          <div
                            className={`w-full rounded-t transition-all duration-300 group-hover:bg-gold ${
                              isPeak ? 'bg-amber-600 shadow-xs' : 'bg-amber-800/40'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-mute mt-2 px-2">
                  <span>{dailyData[0]?.date}</span>
                  <span>{dailyData[Math.floor(dailyData.length / 2)]?.date}</span>
                  <span>{dailyData[dailyData.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* Detailed Expandable Daily Table */}
            {showDailyTable && (
              <div className="border-t border-line pt-4 animate-fade-in">
                <div className="text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                  Daily Traffic Detailed Records ({dailyData.length} Days)
                </div>
                <Table
                  dataSource={dailyData}
                  rowKey="date"
                  pagination={{ pageSize: 7, showSizeChanger: false }}
                  size="small"
                  columns={[
                    {
                      title: 'Date',
                      dataIndex: 'date',
                      key: 'date',
                      render: (d: string) => <span className="font-mono text-xs font-medium text-ink">{d}</span>
                    },
                    {
                      title: 'Visits Count',
                      dataIndex: 'count',
                      key: 'count',
                      sorter: (a, b) => a.count - b.count,
                      render: (cnt: number) => <span className="font-bold text-xs text-amber-900">{cnt} visits</span>
                    },
                    {
                      title: 'Share of Traffic',
                      key: 'share',
                      render: (_, record) => {
                        const pct = Math.round((record.count / totalDailyVisitsSum) * 100);
                        return (
                          <div className="w-36 flex items-center gap-2">
                            <Progress percent={pct} size="small" strokeColor="#B8946A" showInfo={false} />
                            <span className="text-xs text-mute font-mono">{pct}%</span>
                          </div>
                        );
                      }
                    },
                    {
                      title: 'Status',
                      key: 'status',
                      render: (_, record) => {
                        if (record.count === maxDailyCount) {
                          return <Tag color="gold" className="m-0 text-[11px] font-bold">Peak Volume</Tag>;
                        }
                        if (record.count > maxDailyCount * 0.7) {
                          return <Tag color="blue" className="m-0 text-[11px]">High Traffic</Tag>;
                        }
                        return <Tag className="m-0 text-[11px] text-mute">Normal</Tag>;
                      }
                    }
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ─── 3. HOURLY ACTIVITY HEATMAP & CONVERSION FUNNEL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Peak Activity */}
        <Card
          className="border-line shadow-xs"
          title={
            <div className="flex items-center justify-between py-1">
              <span className="font-serif text-ink flex items-center gap-2">
                <LuClock className="text-gold" size={18} /> Peak Traffic Hours (24h Distribution)
              </span>
              <Tag color="purple" className="m-0 text-[11px]">Peak 14:00 - 19:00</Tag>
            </div>
          }
        >
          <div className="space-y-4 pt-1">
            <p className="text-xs text-mute !m-0">
              Session frequency across hours of the day to optimize stylist slot availability.
            </p>

            {/* Visual Column Bars */}
            <div className="h-36 flex items-end gap-2 px-2 border-b border-line pb-1">
              {HOURLY_TRAFFIC.map((h) => {
                const pct = Math.round((h.count / maxHourlyCount) * 100);
                const isPeak = h.count > 100;

                return (
                  <Tooltip key={h.hour} title={`${h.hour}: ${h.count} visits`}>
                    <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end cursor-pointer">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isPeak ? 'bg-purple-600 group-hover:bg-purple-500' : 'bg-slate-300 group-hover:bg-gold'
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[10px] text-mute rotate-45 transform origin-top-left mt-1">{h.hour}</span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {/* Detailed Table */}
            <Table
              dataSource={HOURLY_TRAFFIC}
              rowKey="hour"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Hour',
                  dataIndex: 'hour',
                  key: 'hour',
                  render: (h: string) => <span className="font-mono text-xs font-semibold text-slate-800">{h}</span>
                },
                {
                  title: 'Visits',
                  dataIndex: 'count',
                  key: 'count',
                  render: (c: number) => <span className="text-xs font-bold text-ink">{c}</span>
                },
                {
                  title: 'Activity Level',
                  key: 'level',
                  render: (_, record) => {
                    const pct = Math.round((record.count / maxHourlyCount) * 100);
                    return <Progress percent={pct} size="small" strokeColor={record.count > 100 ? '#8b5cf6' : '#94a3b8'} showInfo={false} />;
                  }
                }
              ]}
            />
          </div>
        </Card>

        {/* Customer Conversion Funnel */}
        <Card
          className="border-line shadow-xs"
          title={
            <div className="flex items-center justify-between py-1">
              <span className="font-serif text-ink flex items-center gap-2">
                <LuFilter className="text-gold" size={18} /> Customer Conversion Funnel
              </span>
              <Tag color="emerald" className="m-0 text-[11px]">7.6% Final Conversion</Tag>
            </div>
          }
        >
          <div className="space-y-4 pt-1">
            {/* Visual Step Bars */}
            <div className="space-y-2">
              {FUNNEL_STAGES.map((stage, idx) => {
                const widthPct = Math.max(Math.round((stage.count / FUNNEL_STAGES[0].count) * 100), 12);
                const dropoff = idx > 0 ? Math.round(((FUNNEL_STAGES[idx - 1].count - stage.count) / FUNNEL_STAGES[idx - 1].count) * 100) : 0;

                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{stage.count}</span>
                        {idx > 0 && (
                          <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.2 rounded font-medium">
                            -{dropoff}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-5 w-full bg-slate-100 rounded-md overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className="h-full rounded transition-all duration-500 flex items-center px-2 text-[10px] font-bold text-white shadow-xs"
                        style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                      >
                        {widthPct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Table */}
            <Table
              dataSource={FUNNEL_STAGES}
              rowKey="stage"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Funnel Stage',
                  dataIndex: 'stage',
                  key: 'stage',
                  render: (s: string) => <span className="font-serif text-xs font-bold text-ink">{s}</span>
                },
                {
                  title: 'Users',
                  dataIndex: 'count',
                  key: 'count',
                  render: (c: number) => <span className="font-mono text-xs font-bold text-amber-900">{c}</span>
                },
                {
                  title: 'Stage Description',
                  dataIndex: 'desc',
                  key: 'desc',
                  render: (d: string) => <span className="text-xs text-mute">{d}</span>
                }
              ]}
            />
          </div>
        </Card>
      </div>

      {/* ─── 4. TECHNOLOGY & AUDIENCE (DEVICES & BROWSERS CHARTS + TABLES) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown Donut & Table */}
        <Card
          className="border-line shadow-xs"
          title={
            <div className="flex items-center justify-between py-1">
              <span className="font-serif text-ink text-sm flex items-center gap-2">
                <LuSmartphone className="text-gold" size={16} /> Device Split Analytics
              </span>
              <Tag color="gold" className="m-0 text-[11px]">{totalDeviceVisits} Total</Tag>
            </div>
          }
        >
          {loadingDevices ? (
            <Spin className="py-12 block" />
          ) : (
            <div className="space-y-4">
              {/* Donut Visual */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2 bg-bone p-3 rounded-lg border border-line">
                <div className="relative w-36 h-36 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {deviceDonutData.map((item, idx) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="16"
                        strokeDasharray={item.strokeDasharray}
                        strokeDashoffset={item.strokeDashoffset}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] text-mute uppercase font-sans">Devices</span>
                    <span className="text-base font-serif font-bold text-ink">{totalDeviceVisits}</span>
                  </div>
                </div>

                <div className="space-y-2 w-full max-w-[200px]">
                  {deviceDonutData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="capitalize font-medium text-ink flex items-center gap-1">
                          {getDeviceIcon(item.name)}
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Device Table */}
              <Table
                dataSource={devices}
                rowKey="device"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Device Type',
                    dataIndex: 'device',
                    key: 'device',
                    render: (d: string) => (
                      <div className="flex items-center gap-1.5 text-xs font-semibold capitalize text-ink">
                        {getDeviceIcon(d)}
                        {d}
                      </div>
                    )
                  },
                  {
                    title: 'Total Visits',
                    dataIndex: 'count',
                    key: 'count',
                    render: (c: number) => <span className="font-mono text-xs font-bold text-ink">{c}</span>
                  },
                  {
                    title: 'Share %',
                    key: 'share',
                    render: (_, record: DeviceBreakdown) => {
                      const pct = Math.round((record.count / totalDeviceVisits) * 100);
                      return (
                        <div className="w-28 flex items-center gap-2">
                          <Progress percent={pct} size="small" strokeColor="#f59e0b" showInfo={false} />
                          <span className="text-xs text-mute font-mono">{pct}%</span>
                        </div>
                      );
                    }
                  }
                ]}
              />
            </div>
          )}
        </Card>

        {/* Browser Breakdown Donut & Table */}
        <Card
          className="border-line shadow-xs"
          title={
            <div className="flex items-center justify-between py-1">
              <span className="font-serif text-ink text-sm flex items-center gap-2">
                <LuGlobe className="text-gold" size={16} /> Browser Breakdown Analytics
              </span>
              <Tag color="blue" className="m-0 text-[11px]">{totalBrowserVisits} Total</Tag>
            </div>
          }
        >
          {loadingBrowsers ? (
            <Spin className="py-12 block" />
          ) : (
            <div className="space-y-4">
              {/* Donut Visual */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2 bg-bone p-3 rounded-lg border border-line">
                <div className="relative w-36 h-36 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {browserDonutData.map((item, idx) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="16"
                        strokeDasharray={item.strokeDasharray}
                        strokeDashoffset={item.strokeDashoffset}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] text-mute uppercase font-sans">Browsers</span>
                    <span className="text-base font-serif font-bold text-ink">{totalBrowserVisits}</span>
                  </div>
                </div>

                <div className="space-y-2 w-full max-w-[200px]">
                  {browserDonutData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-ink">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Browser Table */}
              <Table
                dataSource={browsers}
                rowKey="browser"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Browser Name',
                    dataIndex: 'browser',
                    key: 'browser',
                    render: (b: string) => <span className="text-xs font-semibold text-ink">{b}</span>
                  },
                  {
                    title: 'Total Visits',
                    dataIndex: 'count',
                    key: 'count',
                    render: (c: number) => <span className="font-mono text-xs font-bold text-ink">{c}</span>
                  },
                  {
                    title: 'Share %',
                    key: 'share',
                    render: (_, record: BrowserBreakdown) => {
                      const pct = Math.round((record.count / totalBrowserVisits) * 100);
                      return (
                        <div className="w-28 flex items-center gap-2">
                          <Progress percent={pct} size="small" strokeColor="#3b82f6" showInfo={false} />
                          <span className="text-xs text-mute font-mono">{pct}%</span>
                        </div>
                      );
                    }
                  }
                ]}
              />
            </div>
          )}
        </Card>
      </div>

      {/* ─── 5. TOP PERFORMING PAGES (VISUAL BARS + COMPREHENSIVE TABLE) ─── */}
      <Card
        className="border-line shadow-xs"
        title={
          <div className="flex items-center justify-between py-1">
            <span className="font-serif text-ink flex items-center gap-2">
              <LuGlobe className="text-gold" size={18} /> Top Performing Route URLs
            </span>
            <Tag color="gold" className="m-0 text-[11px]">Ranked by Visit Volume</Tag>
          </div>
        }
      >
        <Table
          dataSource={topPages}
          rowKey="url"
          loading={loadingTopPages}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'URL Path',
              dataIndex: 'url',
              key: 'url',
              render: (url: string) => (
                <div className="flex items-center gap-1.5 font-mono text-xs text-ink font-medium">
                  <span className="text-mute">https://quvo.co.in</span>
                  <span className="text-amber-800 font-bold">{url}</span>
                </div>
              )
            },
            {
              title: 'Traffic Share Progress',
              key: 'bar',
              render: (_, record: TopPage) => {
                const maxCount = Math.max(...topPages.map((p) => p.count), 1);
                const pct = Math.round((record.count / maxCount) * 100);
                return (
                  <div className="w-48">
                    <Progress percent={pct} size="small" strokeColor="#B8946A" showInfo={false} />
                  </div>
                );
              }
            },
            {
              title: 'Visits Count',
              dataIndex: 'count',
              key: 'count',
              sorter: (a, b) => a.count - b.count,
              render: (count: number) => (
                <span className="font-semibold text-ink text-xs">{count.toLocaleString()}</span>
              )
            },
            {
              title: 'Avg Time / Visit',
              dataIndex: 'avgTimeSeconds',
              key: 'avgTimeSeconds',
              render: (sec: number) => (
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {formatSeconds(sec)}
                </span>
              )
            },
            {
              title: 'Total Engagement Time',
              key: 'totalTime',
              render: (_, record: TopPage) => {
                const totalSec = record.count * record.avgTimeSeconds;
                return (
                  <span className="text-xs font-mono text-emerald-800 font-semibold">
                    {Math.round(totalSec / 60)} mins
                  </span>
                );
              }
            }
          ]}
        />
      </Card>

      {/* ─── 6. REAL-TIME ACTIVE SESSIONS (WITH STEP-BY-STEP USER JOURNEY PATH) ─── */}
      <Card
        className="border-line shadow-xs"
        title={
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 font-serif text-ink">
              <LuActivity className="text-emerald-500 animate-pulse" size={18} />
              <span>Real-Time Active Sessions (Last 15 Minutes)</span>
            </div>
            <Tag color="emerald" className="m-0 text-[11px] font-semibold">
              {activeSessions.length} Active Now
            </Tag>
          </div>
        }
      >
        <Table
          dataSource={activeSessions}
          rowKey="id"
          loading={loadingSessions}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Session ID',
              dataIndex: 'id',
              key: 'id',
              render: (id: string) => (
                <Tag color="gold" className="font-mono text-[11px] m-0">
                  {id.slice(0, 14)}...
                </Tag>
              )
            },
            {
              title: 'User Email',
              dataIndex: 'user_email',
              key: 'user_email',
              render: (email: string | null) => (
                <span className={`text-xs ${email ? 'font-medium text-ink' : 'text-mute italic'}`}>
                  {email || 'Guest User'}
                </span>
              )
            },
            {
              title: 'Device & Browser',
              key: 'client',
              render: (_, record: ActiveSession) => (
                <div className="flex items-center gap-2 text-xs">
                  {getDeviceIcon(record.device_type)}
                  <span className="capitalize text-slate-700">{record.device_type}</span>
                  <span className="text-mute">•</span>
                  <span className="text-slate-600">{record.browser}</span>
                </div>
              )
            },
            {
              title: 'Visited Pages',
              dataIndex: 'page_count',
              key: 'page_count',
              render: (cnt: number) => (
                <Tag color="blue" className="text-xs font-semibold m-0">
                  {cnt} pages
                </Tag>
              )
            },
            {
              title: 'Last Active Timestamp',
              dataIndex: 'last_active',
              key: 'last_active',
              render: (ts: string) => (
                <span className="text-xs text-mute font-mono">
                  {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )
            },
            {
              title: 'User Journey',
              key: 'action',
              render: (_, record: ActiveSession) => (
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<LuCompass size={13} />}
                  onClick={() =>
                    setActiveJourneySession({
                      id: record.id,
                      email: record.user_email,
                      device: record.device_type,
                      browser: record.browser
                    })
                  }
                  className="text-xs border-gold text-gold hover:!bg-gold hover:!text-white"
                >
                  View Step Journey Path
                </Button>
              )
            }
          ]}
        />
      </Card>

      {/* ─── 7. RECENT PAGE VISIT FEED STREAM ─── */}
      <Card
        className="border-line shadow-xs"
        title={
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <span className="font-serif text-ink flex items-center gap-2">
              <LuArrowUpRight className="text-gold" size={18} /> Recent Page Visit Stream
            </span>
            <div className="w-64">
              <Input
                size="small"
                prefix={<LuSearch size={14} className="text-mute" />}
                placeholder="Filter by URL, email, browser..."
                value={recentVisitSearch}
                onChange={(e) => setRecentVisitSearch(e.target.value)}
              />
            </div>
          </div>
        }
      >
        <Table
          dataSource={filteredRecentVisits}
          rowKey="id"
          loading={loadingVisits}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          size="small"
          columns={[
            {
              title: 'Target Page URL',
              dataIndex: 'url',
              key: 'url',
              render: (url: string) => (
                <span className="font-mono text-xs font-semibold text-amber-900">{url}</span>
              )
            },
            {
              title: 'User Email',
              dataIndex: 'user_email',
              key: 'user_email',
              render: (email: string | null) => (
                <span className={`text-xs ${email ? 'text-ink font-medium' : 'text-mute italic'}`}>
                  {email || 'Guest User'}
                </span>
              )
            },
            {
              title: 'Browser & Device',
              key: 'client',
              render: (_, record: RecentVisit) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  {getDeviceIcon(record.device_type)}
                  <span className="capitalize">{record.device_type}</span>
                  <span>({record.browser})</span>
                </div>
              )
            },
            {
              title: 'Time Spent',
              dataIndex: 'time_spent',
              key: 'time_spent',
              render: (sec: number) => (
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {formatSeconds(sec)}
                </span>
              )
            },
            {
              title: 'Logged At',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (ts: string) => (
                <span className="text-xs text-mute font-mono">
                  {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )
            }
          ]}
        />
      </Card>

      {/* ─── 8. CUSTOM EVENT ACTIVITY LOGS (WITH JSON PAYLOAD VIEWER) ─── */}
      <Card
        className="border-line shadow-xs"
        title={
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 font-serif text-ink">
              <LuCode className="text-gold" size={18} /> Custom Event & Activity Logs
            </div>
            <Tag color="purple" className="m-0 text-[11px]">
              {activityLogs.length} Events Logged
            </Tag>
          </div>
        }
      >
        <Table
          dataSource={activityLogs}
          rowKey={(r, idx) => `${r.action}_${r.created_at}_${idx}`}
          loading={loadingLogs}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          size="small"
          columns={[
            {
              title: 'Action Event',
              dataIndex: 'action',
              key: 'action',
              render: (action: string) => (
                <Tag color="volcano" className="font-mono text-xs font-bold uppercase m-0">
                  {action}
                </Tag>
              )
            },
            {
              title: 'User Email',
              dataIndex: 'user_email',
              key: 'user_email',
              render: (email: string | null) => (
                <span className={`text-xs ${email ? 'text-ink font-medium' : 'text-mute italic'}`}>
                  {email || 'Guest User'}
                </span>
              )
            },
            {
              title: 'Page Context',
              dataIndex: 'page',
              key: 'page',
              render: (p: string) => <span className="font-mono text-xs text-slate-700">{p}</span>
            },
            {
              title: 'Payload JSON',
              dataIndex: 'payload',
              key: 'payload',
              render: (payload: any, record: ActivityLog) => (
                <Button
                  size="small"
                  type="dashed"
                  icon={<LuEye size={13} />}
                  onClick={() => setSelectedLogPayload({ action: record.action, payload })}
                  className="text-xs text-slate-700 hover:border-gold hover:text-gold"
                >
                  Inspect JSON Data
                </Button>
              )
            },
            {
              title: 'Timestamp',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (ts: string) => (
                <span className="text-xs text-mute font-mono">
                  {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )
            }
          ]}
        />
      </Card>

      {/* ─── MODAL: USER JOURNEY ─── */}
      <UserJourneyModal
        visible={Boolean(activeJourneySession)}
        sessionId={activeJourneySession?.id || null}
        userEmail={activeJourneySession?.email}
        deviceType={activeJourneySession?.device}
        browser={activeJourneySession?.browser}
        onClose={() => setActiveJourneySession(null)}
      />

      {/* ─── MODAL: EVENT PAYLOAD VIEWER ─── */}
      <Modal
        open={Boolean(selectedLogPayload)}
        onCancel={() => setSelectedLogPayload(null)}
        footer={null}
        title={
          <div className="flex items-center gap-2 text-ink font-serif">
            <LuCode className="text-gold" size={18} />
            <span>Event Payload: {selectedLogPayload?.action}</span>
          </div>
        }
      >
        <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-lg overflow-x-auto my-2 shadow-inner">
          <pre>{JSON.stringify(selectedLogPayload?.payload || {}, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
};
