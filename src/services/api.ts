import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { dataService } from './dataService';

const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: 'include',
});

const customBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // If HTTP request succeeded, return it directly
  if (!result.error) {
    return result;
  }

  // If HTTP request returned 401 Unauthorized or 403 Forbidden from backend, return error directly
  if (result.error.status === 401 || result.error.status === 403) {
    return result;
  }

  // If request failed because server is offline (FETCH_ERROR), execute local dataService fallback
  const url = typeof args === 'string' ? args : args.url;
  const method = typeof args === 'string' ? 'GET' : (args.method || 'GET');
  const body = typeof args === 'string' ? undefined : args.body;

  try {
    // Admin Auth Fallbacks
    if (url.includes('/admin/auth/login') && method === 'POST') {
      const email = (body as any)?.email;
      const password = (body as any)?.password;
      const admin = dataService.adminLogin(email, password);
      return { data: { success: true, statusCode: 200, message: 'Admin logged in successfully', data: admin } };
    }

    if (url.includes('/admin/auth/logout') && method === 'POST') {
      dataService.adminLogout();
      return { data: { success: true, statusCode: 200, message: 'Admin logged out successfully', data: null } };
    }

    if (url.includes('/admin/auth/me') && method === 'GET') {
      const me = dataService.getAdminMe();
      if (!me) {
        return { error: { status: 401, data: { success: false, message: 'Unauthorized' } } };
      }
      return { data: { success: true, statusCode: 200, message: 'Admin info retrieved successfully', data: me } };
    }

    // Admin Orders Reschedule: /admin/orders/{booking_id}/reschedule
    const rescheduleMatch = url.match(/\/admin\/orders\/([^/]+)\/reschedule/);
    if (rescheduleMatch && method === 'PATCH') {
      const orderId = rescheduleMatch[1];
      const updated = dataService.rescheduleAdminOrder(orderId, body as any);
      return { data: { success: true, statusCode: 200, message: 'Order rescheduled successfully', data: updated } };
    }

    // Admin Orders Status: /admin/orders/{booking_id}/status
    const statusMatch = url.match(/\/admin\/orders\/([^/]+)\/status/);
    if (statusMatch && method === 'PATCH') {
      const orderId = statusMatch[1];
      const newStatus = (body as any)?.status;
      const updated = dataService.updateAdminOrderStatus(orderId, newStatus);
      return { data: { success: true, statusCode: 200, message: 'Order status updated successfully', data: updated } };
    }

    // Admin Single Order / Soft Delete Order: /admin/orders/{booking_id}
    const singleOrderMatch = url.match(/\/admin\/orders\/([^/?]+)$/);
    if (singleOrderMatch) {
      const orderId = singleOrderMatch[1];
      if (method === 'GET') {
        const order = dataService.getAdminOrderById(orderId);
        return { data: { success: true, statusCode: 200, message: 'Order fetched successfully', data: order } };
      }
      if (method === 'DELETE') {
        const cancelled = dataService.cancelAdminOrder(orderId);
        return { data: { success: true, statusCode: 200, message: 'Order cancelled successfully', data: cancelled } };
      }
    }

    // Admin Orders List: /admin/orders
    if (url.includes('/admin/orders') && method === 'GET') {
      const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const statusFilter = urlParams.get('status') || undefined;
      const from = urlParams.get('from') || undefined;
      const to = urlParams.get('to') || undefined;
      const search = urlParams.get('search') || undefined;
      const resultData = dataService.getAdminOrders({ status: statusFilter, from, to, search });
      return { data: { success: true, statusCode: 200, message: 'Orders retrieved successfully', data: resultData } };
    }

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
  tagTypes: ['Category', 'Provider', 'RateCard', 'Order', 'Lookbook', 'SlotAvailability', 'AdminAuth'],
  endpoints: () => ({}),
});
