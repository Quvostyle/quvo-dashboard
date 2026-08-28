import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { dataService } from './dataService';

const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
});

const customBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // If HTTP request succeeded, return it directly
  if (!result.error) {
    return result;
  }

  // If request failed (e.g. server offline or route 404), execute local dataService fallback
  const url = typeof args === 'string' ? args : args.url;
  const method = typeof args === 'string' ? 'GET' : (args.method || 'GET');
  const body = typeof args === 'string' ? undefined : args.body;

  try {
    // 1. Weekly Schedule: /admin/providers/{provider_id}/availability/schedule
    const scheduleMatch = url.match(/\/admin\/providers\/([^/]+)\/availability\/schedule/);
    if (scheduleMatch) {
      const providerId = scheduleMatch[1];
      if (method === 'GET') {
        return { data: { schedules: dataService.getWeeklySchedule(providerId) } };
      }
      if (method === 'POST') {
        const rawSchedules = (body as any)?.schedules || body;
        const cleanSchedules = (Array.isArray(rawSchedules) ? rawSchedules : []).map((s: any) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_duration_mins: Number(s.slot_duration_mins),
          buffer_time_mins: Number(s.buffer_time_mins),
          is_active: Boolean(s.is_active)
        }));
        const saved = dataService.saveWeeklySchedule(providerId, cleanSchedules);
        return { data: { schedules: saved } };
      }
    }

    // 2. Unavailability: /admin/providers/{provider_id}/availability/unavailability
    const unavailMatch = url.match(/\/admin\/providers\/([^/]+)\/availability\/unavailability(?:\/([^/?]+))?/);
    if (unavailMatch) {
      const providerId = unavailMatch[1];
      const recordId = unavailMatch[2];
      if (method === 'GET') {
        const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
        const from = urlParams.get('from') || undefined;
        const to = urlParams.get('to') || undefined;
        return { data: { unavailabilities: dataService.getUnavailabilities(providerId, from, to) } };
      }
      if (method === 'POST') {
        const added = dataService.addUnavailability(providerId, body as any);
        return { data: added };
      }
      if (method === 'DELETE' && recordId) {
        dataService.deleteUnavailability(providerId, recordId);
        return { data: { success: true } };
      }
    }

    // 3. Slot Overrides: /admin/providers/{provider_id}/availability/slot-overrides
    const overrideMatch = url.match(/\/admin\/providers\/([^/]+)\/availability\/slot-overrides(?:\/([^/?]+))?/);
    if (overrideMatch) {
      const providerId = overrideMatch[1];
      const recordId = overrideMatch[2];
      if (method === 'GET') {
        const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
        const from = urlParams.get('from') || undefined;
        const to = urlParams.get('to') || undefined;
        return { data: { slot_overrides: dataService.getSlotOverrides(providerId, from, to) } };
      }
      if (method === 'POST') {
        const added = dataService.addSlotOverride(providerId, body as any);
        return { data: added };
      }
      if (method === 'DELETE' && recordId) {
        dataService.deleteSlotOverride(providerId, recordId);
        return { data: { success: true } };
      }
    }

    // 4. Customer Available Dates: /providers/{provider_id}/available-dates?month=...
    const datesMatch = url.match(/\/providers\/([^/]+)\/available-dates/);
    if (datesMatch && method === 'GET') {
      const providerId = datesMatch[1];
      const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const month = urlParams.get('month') || new Date().toISOString().slice(0, 7);
      return { data: { available_dates: dataService.getAvailableDates(providerId, month) } };
    }

    // 5. Customer Available Slots: /providers/{provider_id}/slots?date=...
    const slotsMatch = url.match(/\/providers\/([^/]+)\/slots/);
    if (slotsMatch && method === 'GET') {
      const providerId = slotsMatch[1];
      const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const date = urlParams.get('date') || new Date().toISOString().slice(0, 10);
      const rateCardId = urlParams.get('rateCardId') || undefined;
      return { data: { slots: dataService.getAvailableSlots(providerId, date, rateCardId) } };
    }
  } catch (e: any) {
    console.error('Fallback dataService error:', e);
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: customBaseQuery,
  tagTypes: ['Category', 'Provider', 'RateCard', 'Order', 'Lookbook', 'SlotAvailability'],
  endpoints: () => ({}),
});
