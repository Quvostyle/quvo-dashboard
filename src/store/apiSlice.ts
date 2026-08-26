import { api } from '../services/api';
import type { Category, Provider, RateCard, IntakeRequest, Lookbook, LookbookItem } from '../services/dataService';

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
    getCategories: builder.query<Category[], void>({
      query: () => '/admin/categories',
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
    getProviders: builder.query<Provider[], void>({
      query: () => '/admin/providers',
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
    getRateCards: builder.query<RateCard[], string | void>({
      query: (providerId) => providerId ? `/rate-cards?providerId=${providerId}` : '/rate-cards',
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
    getOrders: builder.query<IntakeRequest[], void>({
      query: () => '/orders',
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
  useBulkSyncFormStepsMutation
} = apiSlice;
