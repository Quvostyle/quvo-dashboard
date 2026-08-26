import React, { useState, useMemo } from 'react';
import { Button, Space, Tag, Modal, Form, message, Avatar, Skeleton } from 'antd';
import { LuPlus, LuPencil, LuTrash2, LuMail, LuPhone, LuHouse } from 'react-icons/lu';
import type { Provider } from '../services/dataService';
import {
  useGetProvidersQuery,
  useAddProviderMutation,
  useUpdateProviderMutation,
  useDeleteProviderMutation
} from '../store/apiSlice';
import { ProviderModal } from './ProviderModal';
import { Table } from './common/Table';

export const ProvidersTab: React.FC = () => {
  const { data: providers = [], isLoading: providersLoading } = useGetProvidersQuery();

  const [addProvider, { isLoading: isAddingProvider }] = useAddProviderMutation();
  const [updateProvider, { isLoading: isUpdatingProvider }] = useUpdateProviderMutation();
  const [deleteProvider] = useDeleteProviderMutation();

  const isSavingProvider = isAddingProvider || isUpdatingProvider;



  // Provider Modal State (Add/Edit)
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerForm] = Form.useForm();
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);

  const handleOpenAddProvider = () => {
    setEditingProviderId(null);
    providerForm.resetFields();
    setShowProviderModal(true);
  };

  const handleOpenEditProvider = (prov: Provider) => {
    setEditingProviderId(prov.id);
    providerForm.setFieldsValue({
      full_name: prov.full_name,
      email: prov.email,
      mobile: prov.mobile,
      gender: prov.gender,
      birth_date: prov.birth_date ? prov.birth_date.split('T')[0] : '',
      profilePic: prov.profilePic || '',
      address: prov.address,
      experience: prov.experience ? String(prov.experience) : '',
      specialties: Array.isArray(prov.specialties) ? prov.specialties : typeof prov.specialties === 'string' ? JSON.parse(prov.specialties || '[]') : [],
      subcategories: Array.isArray(prov.subcategories) ? prov.subcategories : typeof prov.subcategories === 'string' ? JSON.parse(prov.subcategories || '[]') : [],
      startingFrom: prov.startingFrom ? String(prov.startingFrom) : '',
      bioDetails: prov.bioDetails || '',
      portfolioUrls: Array.isArray(prov.ProtfolioImageUploads) ? prov.ProtfolioImageUploads : [],
      isActive: prov.isActive
    });
    setShowProviderModal(true);
  };

  const handleSaveProvider = async (formData: FormData, values?: any) => {
    const providerName = values?.full_name || (formData.get('full_name') as string) || 'Provider';
    try {
      if (editingProviderId) {
        await updateProvider({ id: editingProviderId, body: formData }).unwrap();
        message.success(`Provider '${providerName}' updated.`);
      } else {
        await addProvider(formData).unwrap();
        message.success(`Provider '${providerName}' created.`);
      }
      setShowProviderModal(false);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error saving provider');
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    try {
      await deleteProvider(id).unwrap();
      message.info(`Provider '${name}' deactivated.`);
    } catch (e: any) {
      message.error(e.data || e.message || 'Error deactivating provider');
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Partner Profile',
      id: 'partner_profile',
      Cell: ({ row }: any) => {
        const record = row.original;
        const birthDateStr = record.birth_date
          ? new Date(record.birth_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—';
        const genderColors: Record<string, string> = {
          Male: 'blue',
          male: 'blue',
          Female: 'magenta',
          female: 'magenta',
          Other: 'purple',
          other: 'purple'
        };
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={record.profilePic}
              className="!bg-ink !text-[#FFF8F0] !font-bold !text-[0.9rem]"
              size={44}
            >
              {!record.profilePic && (record.full_name ? record.full_name.charAt(0).toUpperCase() : 'P')}
            </Avatar>
            <div>
              <a
                href={`#provider-profile-${record.id}`}
                className="block text-[0.95rem] font-semibold text-gold no-underline"
              >
                {record.full_name}
              </a>
              <div className="text-[0.72rem] text-mute mt-0.5 flex items-center gap-2 flex-wrap">
                <span>ID: {record.id.slice(0, 8)}</span>
                <span>•</span>
                <Tag color={genderColors[record.gender] || 'default'} className="capitalize !rounded-[10px] !py-0 !px-1.5 text-[0.68rem] leading-[1.2] !m-0">
                  {record.gender}
                </Tag>
                {record.experience && (
                  <>
                    <span>•</span>
                    <span>{record.experience} yrs exp</span>
                  </>
                )}
                {birthDateStr !== '—' && (
                  <>
                    <span>•</span>
                    <span>🎂 {birthDateStr}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Details & Specialties',
      id: 'details_specialties',
      Cell: ({ row }: any) => {
        const record = row.original;
        let specs: string[] = [];
        if (Array.isArray(record.specialties)) {
          specs = record.specialties;
        } else if (typeof record.specialties === 'string') {
          try { specs = JSON.parse(record.specialties); } catch { specs = record.specialties ? [record.specialties] : []; }
        }

        return (
          <div className="flex flex-col gap-1 text-[0.82rem]">
            {record.startingFrom && (
              <div className="font-semibold text-green-700">
                Starting From: ₹{record.startingFrom}
              </div>
            )}
            {specs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {specs.slice(0, 3).map((s, idx) => (
                  <Tag key={idx} color="gold" className="!text-[0.68rem] !py-0 !px-1.5 !m-0">
                    {s}
                  </Tag>
                ))}
                {specs.length > 3 && <span className="text-[0.7rem] text-mute">+{specs.length - 3}</span>}
              </div>
            )}
            {record.bioDetails && (
              <div className="text-mute text-[0.75rem] line-clamp-1 italic max-w-[220px]" title={record.bioDetails}>
                "{record.bioDetails}"
              </div>
            )}
          </div>
        );
      }
    },
    {
      Header: 'Contact Info',
      id: 'contact_info',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <div className="flex flex-col gap-1 text-[0.85rem]">
            <div>
              <a href={`mailto:${record.email}`} className="text-gold inline-flex items-center gap-1.5 no-underline">
                <LuMail size={12} /> {record.email}
              </a>
            </div>
            <div>
              <a href={`tel:${record.mobile}`} className="text-gold inline-flex items-center gap-1.5 no-underline">
                <LuPhone size={12} /> {record.mobile}
              </a>
            </div>
            <div className="flex items-start gap-1 text-mute max-w-[200px]">
              <LuHouse size={12} className="mt-0.5 shrink-0" />
              <span className="text-[0.8rem] leading-[1.2]" title={record.address}>{record.address}</span>
            </div>
          </div>
        );
      }
    },
    {
      Header: 'Status',
      accessor: 'isActive',
      Cell: ({ value }: any) => (
        <Tag
          color={value ? 'success' : 'error'}
          className={`!rounded-[12px] !text-[0.72rem] !font-semibold !py-0.5 !px-2.5 !border ${value ? '!border-[#b7eb8f]' : '!border-[#ffa39e]'}`}
        >
          {value ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      )
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }: any) => {
        const record = row.original;
        return (
          <Space size="small">
            <Button
              className="action-btn action-btn-edit"
              icon={<LuPencil size={15} />}
              onClick={() => handleOpenEditProvider(record)}
              title="Edit Provider"
            />
            <Button
              className="action-btn action-btn-delete"
              icon={<LuTrash2 size={15} />}
              title="Deactivate Provider"
              onClick={() => {
                Modal.confirm({
                  title: 'Deactivate Provider',
                  content: `Are you sure you want to deactivate provider '${record.full_name}'?`,
                  okText: 'Yes, Deactivate',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk: () => handleDeleteProvider(record.id, record.full_name),
                });
              }}
            />
          </Space>
        );
      }
    }
  ], []);

  if (providersLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8 flex justify-between items-baseline">
          <div>
            <Skeleton.Button active className="!w-[120px] !h-3.5 !mb-2" />
            <br />
            <Skeleton.Input active className="!w-[380px] !h-10" />
          </div>
          <Skeleton.Button active className="!w-[150px] !h-10" />
        </div>

        {/* Table Page Skeleton */}
        <div className="bg-white p-6 rounded-lg border border-line shadow-sm">
          {/* Mock Search/Filter Bar */}
          <div className="flex justify-between mb-6">
            <Skeleton.Input active className="!w-[260px] !h-9" />
            <Skeleton.Input active className="!w-[180px] !h-9" />
          </div>
          {/* Mock Table Rows */}
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="label-overline">Providers Directory</p>
          <h2 className="text-3xl font-bold mt-1">Admin Service Providers</h2>
        </div>
        <Button
          type="primary"
          icon={<LuPlus size={16} />}
          onClick={handleOpenAddProvider}
          className="w-full sm:w-auto"
        >
          Add Provider
        </Button>
      </div>

      {/* Providers Table */}
      <Table
        columns={columns}
        data={providers}
        pageSize={20}
      />

      <ProviderModal
        open={showProviderModal}
        editingProviderId={editingProviderId}
        form={providerForm}
        loading={isSavingProvider}
        onCancel={() => setShowProviderModal(false)}
        onSave={handleSaveProvider}
      />
    </div>
  );
};
