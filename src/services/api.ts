import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const apiUrl = import.meta.env.VITE_BACKEND_URL;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl || 'http://localhost:8000',
  }),
  tagTypes: ['Category', 'Provider', 'RateCard', 'Order', 'Lookbook'],
  endpoints: () => ({}),
});
