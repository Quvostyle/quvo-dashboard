import { api } from '../services/api';
import type { Category, Provider, RateCard, IntakeRequest, Lookbook, LookbookItem, WeeklyScheduleDay, UnavailabilityRecord, SlotOverrideRecord, ComputedSlot } from '../services/dataService';

const unwrapResponse = (response: any) => response?.data ?? response;
const unwrapArray = (response: any, key: string) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const apiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // Categories
    getCategories: builder.query<Category[], string | void>({
      query: (search) => search ? `/admin/categories?search=${encodeURIComponent(search)}` : '/admin/categories',
      transformResponse: (res) => unwrapArray(res, 'categories'),
      providesTags: ['Category']
    }),
    addCategory: builder.mutation<Category, FormData | Partial<Category>>({
      query: (cat) => ({
        url: '/admin/categories',
        method: 'POST',
        body: cat
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Category']
    }),
    addSubcategory: builder.mutation<Category, { parentId: string; body: FormData } | ({ parentId: string } & Partial<Category>)>({
      query: (args) => {
        if ('body' in args && args.body instanceof FormData) {
          return {
            url: `/admin/categories/${args.parentId}/subcategories`,
            method: 'POST',
            body: args.body
          };
        }
        const { parentId, ...body } = args as any;
        return {
          url: `/admin/categories/${parentId}/subcategories`,
          method: 'POST',
          body
        };
      },
      transformResponse: unwrapResponse,
      invalidatesTags: ['Category']
    }),
    updateCategory: builder.mutation<Category, { id: string; body: FormData | Partial<Category> }>({
      query: ({ id, body }) => ({
        url: `/admin/categories/${id}`,
        method: 'PATCH',
        body
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Category']
    }),
    deleteCategory: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: 'DELETE'
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Category']
    }),

    // Form Steps / Questionnaire Builder
    getFormSteps: builder.query<any[], string>({
      query: (subCategoryId) => `/admin/form-steps?subCategoryId=${subCategoryId}`,
      transformResponse: (res) => unwrapArray(res, 'formSteps'),
      providesTags: ['Category']
    }),
    bulkSyncFormSteps: builder.mutation<any, { subCategoryId: string; steps: any[] }>({
      query: ({ subCategoryId, steps }) => ({
        url: `/admin/form-steps/bulk-sync/${subCategoryId}`,
        method: 'POST',
        body: { steps }
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Category']
    }),

    // Providers
    getProviders: builder.query<Provider[], string | void>({
      query: (search) => search ? `/admin/providers?search=${encodeURIComponent(search)}` : '/admin/providers',
      transformResponse: (res) => unwrapArray(res, 'providers'),
      providesTags: ['Provider']
    }),
    addProvider: builder.mutation<Provider, FormData | Omit<Provider, 'id'>>({
      query: (body) => ({
        url: '/admin/providers',
        method: 'POST',
        body
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Provider']
    }),
    updateProvider: builder.mutation<Provider, { id: string; body: FormData | Partial<Provider> }>({
      query: ({ id, body }) => ({
        url: `/admin/providers/${id}`,
        method: 'PATCH',
        body
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Provider']
    }),
    deleteProvider: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/providers/${id}`,
        method: 'DELETE'
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Provider']
    }),

    // Rate Cards
    getRateCards: builder.query<RateCard[], { providerId?: string; search?: string } | string | void>({
      query: (args) => {
        if (typeof args === 'string') return args ? `/rate-cards?search=${encodeURIComponent(args)}` : '/rate-cards';
        if (args?.providerId || args?.search) {
          const params = new URLSearchParams();
          if (args.providerId) params.append('providerId', args.providerId);
          if (args.search) params.append('search', args.search);
          return `/rate-cards?${params.toString()}`;
        }
        return '/rate-cards';
      },
      transformResponse: (res) => unwrapArray(res, 'rateCards'),
      providesTags: ['RateCard']
    }),
    addRateCard: builder.mutation<RateCard, FormData | Omit<RateCard, 'id'>>({
      query: (rc) => ({
        url: '/rate-cards',
        method: 'POST',
        body: rc
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['RateCard']
    }),
    updateRateCard: builder.mutation<RateCard, { id: string; body: FormData | Partial<RateCard> }>({
      query: ({ id, body }) => ({
        url: `/rate-cards/${id}`,
        method: 'PATCH',
        body
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['RateCard']
    }),
    deleteRateCard: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/rate-cards/${id}`,
        method: 'DELETE'
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['RateCard']
    }),

    // Orders & Intakes
    getOrders: builder.query<IntakeRequest[], string | void>({
      query: (search) => search ? `/orders?search=${encodeURIComponent(search)}` : '/orders',
      transformResponse: (res) => unwrapArray(res, 'orders'),
      providesTags: ['Order']
    }),
    updateOrder: builder.mutation<IntakeRequest, { id: string } & Partial<IntakeRequest>>({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}`,
        method: 'PATCH',
        body
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Order']
    }),
    assignStylist: builder.mutation<IntakeRequest, { orderId: string, stylistId: string | null }>({
      query: ({ orderId, stylistId }) => ({
        url: `/orders/${orderId}/assign`,
        method: 'POST',
        body: { stylistId }
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['Order', 'Lookbook']
    }),

    // Lookbooks
    getLookbook: builder.query<Lookbook | null, string>({
      query: (intakeId) => `/lookbooks/${intakeId}`,
      transformResponse: unwrapResponse,
      providesTags: (_result, _error, intakeId) => [{ type: 'Lookbook', id: intakeId }]
    }),
    saveIntroNote: builder.mutation<Lookbook, { orderId: string, introNote: string }>({
      query: ({ orderId, introNote }) => ({
        url: `/lookbooks/${orderId}/intro`,
        method: 'PATCH',
        body: { introNote }
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Lookbook', id: orderId }]
    }),
    addLookbookItem: builder.mutation<Lookbook, { orderId: string, item: FormData | Omit<LookbookItem, 'id'> }>({
      query: ({ orderId, item }) => ({
        url: `/lookbooks/${orderId}/items`,
        method: 'POST',
        body: item
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Lookbook', id: orderId }]
    }),
    deleteLookbookItem: builder.mutation<Lookbook, { orderId: string, itemId: string }>({
      query: ({ orderId, itemId }) => ({
        url: `/lookbooks/${orderId}/items/${itemId}`,
        method: 'DELETE'
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Lookbook', id: orderId }]
    }),

    // Provider Availability & Slot System
    getWeeklySchedule: builder.query<WeeklyScheduleDay[], string>({
      query: (providerId) => `/admin/providers/${providerId}/availability/schedule`,
      transformResponse: (res: any) => res?.schedules || res?.data?.schedules || (Array.isArray(res) ? res : []),
      providesTags: ['SlotAvailability']
    }),
    updateWeeklySchedule: builder.mutation<WeeklyScheduleDay[], { providerId: string; schedules: WeeklyScheduleDay[] }>({
      query: ({ providerId, schedules }) => {
        const cleanSchedules = (schedules || []).map((s: any) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_duration_mins: Number(s.slot_duration_mins),
          buffer_time_mins: Number(s.buffer_time_mins),
          is_active: Boolean(s.is_active)
        }));
        return {
          url: `/admin/providers/${providerId}/availability/schedule`,
          method: 'POST',
          body: { schedules: cleanSchedules }
        };
      },
      transformResponse: (res: any) => res?.schedules || res?.data?.schedules || res,
      invalidatesTags: ['SlotAvailability']
    }),

    getUnavailabilities: builder.query<UnavailabilityRecord[], { providerId: string; from?: string; to?: string }>({
      query: ({ providerId, from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        const q = params.toString();
        return `/admin/providers/${providerId}/availability/unavailability${q ? `?${q}` : ''}`;
      },
      transformResponse: (res: any) => res?.unavailabilities || res?.data?.unavailabilities || (Array.isArray(res) ? res : []),
      providesTags: ['SlotAvailability']
    }),
    addUnavailability: builder.mutation<UnavailabilityRecord, { providerId: string; body: Omit<UnavailabilityRecord, 'id' | 'provider_id' | 'created_at'> }>({
      query: ({ providerId, body }) => ({
        url: `/admin/providers/${providerId}/availability/unavailability`,
        method: 'POST',
        body
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['SlotAvailability']
    }),
    deleteUnavailability: builder.mutation<{ success: boolean }, { providerId: string; id: string }>({
      query: ({ providerId, id }) => ({
        url: `/admin/providers/${providerId}/availability/unavailability/${id}`,
        method: 'DELETE'
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['SlotAvailability']
    }),

    getSlotOverrides: builder.query<SlotOverrideRecord[], { providerId: string; from?: string; to?: string }>({
      query: ({ providerId, from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        const q = params.toString();
        return `/admin/providers/${providerId}/availability/slot-overrides${q ? `?${q}` : ''}`;
      },
      transformResponse: (res: any) => res?.slot_overrides || res?.data?.slot_overrides || (Array.isArray(res) ? res : []),
      providesTags: ['SlotAvailability']
    }),
    addSlotOverride: builder.mutation<SlotOverrideRecord, { providerId: string; body: Omit<SlotOverrideRecord, 'id' | 'provider_id' | 'created_at'> }>({
      query: ({ providerId, body }) => ({
        url: `/admin/providers/${providerId}/availability/slot-overrides`,
        method: 'POST',
        body
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['SlotAvailability']
    }),
    deleteSlotOverride: builder.mutation<{ success: boolean }, { providerId: string; id: string }>({
      query: ({ providerId, id }) => ({
        url: `/admin/providers/${providerId}/availability/slot-overrides/${id}`,
        method: 'DELETE'
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: ['SlotAvailability']
    }),

    getAvailableDates: builder.query<string[], { providerId: string; month: string }>({
      query: ({ providerId, month }) => `/providers/${providerId}/available-dates?month=${encodeURIComponent(month)}`,
      transformResponse: (res: any) => res?.available_dates || res?.data?.available_dates || (Array.isArray(res) ? res : []),
      providesTags: ['SlotAvailability']
    }),
    getAvailableSlots: builder.query<ComputedSlot[], { providerId: string; date: string; rateCardId?: string }>({
      query: ({ providerId, date, rateCardId }) => {
        const params = new URLSearchParams({ date });
        if (rateCardId) params.append('rateCardId', rateCardId);
        return `/providers/${providerId}/slots?${params.toString()}`;
      },
      transformResponse: (res: any) => res?.slots || res?.data?.slots || (Array.isArray(res) ? res : []),
      providesTags: ['SlotAvailability']
    })
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useAddSubcategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProvidersQuery,
  useAddProviderMutation,
  useUpdateProviderMutation,
  useDeleteProviderMutation,
  useGetRateCardsQuery,
  useAddRateCardMutation,
  useUpdateRateCardMutation,
  useDeleteRateCardMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useAssignStylistMutation,
  useGetLookbookQuery,
  useSaveIntroNoteMutation,
  useAddLookbookItemMutation,
  useDeleteLookbookItemMutation,
  useGetFormStepsQuery,
  useBulkSyncFormStepsMutation,
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
} = apiSlice;
