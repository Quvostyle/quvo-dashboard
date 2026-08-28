import React, { useEffect, useState } from "react";
import {
  Modal,
  Input,
  Row,
  Col,
  Select,
  InputNumber,
  Switch,
  Button,
  Upload,
  Space,
  Divider,
} from "antd";
import {
  LuUpload,
  LuCirclePlay,
  LuTrash2,
  LuImage,
} from "react-icons/lu";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useGetRateCardsQuery } from "../store/apiSlice";
import type { Category, Provider } from "../services/dataService";

interface RateCardModalProps {
  open: boolean;
  editingRateCardId: string | null;
  rateCardSelectedCategory: string;
  setRateCardSelectedCategory: (val: string) => void;
  categories: Category[];
  providers: Provider[];
  form: any; // unused now, kept for backward compatibility
  loading?: boolean;
  onCancel: () => void;
  onSave: (formData: FormData, values: any) => void;
}

interface RateCardFormValues {
  name?: string;
  description?: string;
  categoryId: string;
  subcategoryId: string;
  providerId: string;
  price?: number;
  strikePrice?: number;
  weight: number;
  serviceType: "b2c" | "b2b";
  recommended: boolean;
  bestDeal: boolean;
  active: boolean;
  images: string[];
  videos: string[];
}

export const RateCardModal: React.FC<RateCardModalProps> = ({
  open,
  editingRateCardId,
  rateCardSelectedCategory,
  setRateCardSelectedCategory,
  categories,
  providers,
  loading,
  onCancel,
  onSave,
}) => {
  const rootCategories = categories.filter((c) => !c.parentId);

  const { data: rateCards = [] } = useGetRateCardsQuery();
  const editingRateCard = rateCards.find((rc) => rc.id === editingRateCardId);

  const [imageFiles, setImageFiles] = useState<Record<number, File>>({});
  const [videoFiles, setVideoFiles] = useState<Record<number, File>>({});

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RateCardFormValues>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      providerId: "",
      price: undefined,
      strikePrice: undefined,
      weight: 1,
      serviceType: "b2c",
      recommended: false,
      bestDeal: false,
      active: true,
      images: [],
      videos: [],
    },
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: "images" as never,
  });

  const {
    fields: videoFields,
    append: appendVideo,
    remove: removeVideo,
  } = useFieldArray({
    control,
    name: "videos" as never,
  });

  const imagesValue = watch("images");
  const videosValue = watch("videos");

  useEffect(() => {
    if (open) {
      setImageFiles({});
      setVideoFiles({});
      if (editingRateCard) {
        reset({
          name: editingRateCard.name || "",
          description: editingRateCard.description || "",
          categoryId: editingRateCard.categoryId,
          subcategoryId: editingRateCard.subcategoryId,
          providerId: editingRateCard.providerId || "",
          price: editingRateCard.price,
          strikePrice: editingRateCard.strikePrice,
          weight: editingRateCard.weight,
          serviceType: editingRateCard.serviceType as any,
          recommended: editingRateCard.recommended,
          bestDeal: editingRateCard.bestDeal,
          active: editingRateCard.active,
          images: editingRateCard.images || [],
          videos: editingRateCard.videos || [],
        });
      } else {
        reset({
          name: "",
          description: "",
          categoryId: "",
          subcategoryId: "",
          providerId: "",
          price: undefined,
          strikePrice: undefined,
          weight: 1,
          serviceType: "b2c",
          recommended: false,
          bestDeal: false,
          active: true,
          images: [],
          videos: [],
        });
      }
    }
  }, [open, editingRateCard, reset]);

  const handleFormSubmit = (values: RateCardFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name || "");
    formData.append("description", values.description || "");
    formData.append("categoryId", values.categoryId);
    formData.append("subcategoryId", values.subcategoryId);
    formData.append("providerId", values.providerId);
    if (values.price !== undefined && values.price !== null) formData.append("price", String(values.price));
    if (values.strikePrice !== undefined && values.strikePrice !== null) formData.append("strikePrice", String(values.strikePrice));
    formData.append("weight", String(values.weight));
    formData.append("serviceType", values.serviceType);
    formData.append("recommended", String(!!values.recommended));
    formData.append("bestDeal", String(!!values.bestDeal));
    formData.append("active", String(!!values.active));

    (values.images || []).forEach((img, index) => {
      if (imageFiles[index]) {
        formData.append("images", imageFiles[index], imageFiles[index].name);
      } else if (img) {
        formData.append("images", img);
      }
    });

    (values.videos || []).forEach((v, index) => {
      if (videoFiles[index]) {
        formData.append("videos", videoFiles[index], videoFiles[index].name);
      } else if (v) {
        formData.append("videos", v);
      }
    });

    onSave(formData, values);
  };

  return (
    <Modal
      title={
        <div className="text-center w-full text-[1.2rem] font-semibold">
          {editingRateCardId ? "Edit Rate Card" : "Create New Rate Card"}
        </div>
      }
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
      width={720}
      destroyOnClose
      className="premium-modal"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g. Standard Split AC Service (optional)" size="large" />
            )}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="Enter service description (optional)"
                rows={3}
              />
            )}
          />
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Root Category Group *
              </label>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: "Select parent category" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("subcategoryId", "");
                      setRateCardSelectedCategory(val);
                    }}
                    className="w-full"
                    size="large"
                  >
                    {rootCategories.map((r) => (
                      <Select.Option key={r.id} value={r.id}>
                        {r.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
              {errors.categoryId && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.categoryId.message}
                </span>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory Mapping *
              </label>
              <Controller
                name="subcategoryId"
                control={control}
                rules={{ required: "Select subcategory" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    disabled={!rateCardSelectedCategory}
                    className="w-full"
                    size="large"
                  >
                    {categories?.length &&
                      categories
                        ?.filter((c) => c.id === rateCardSelectedCategory)?.[0]
                        ?.children?.map((sub) => (
                          <Select.Option key={sub.id} value={sub.id}>
                            {sub.name}
                          </Select.Option>
                        ))}
                  </Select>
                )}
              />
              {errors.subcategoryId && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.subcategoryId.message}
                </span>
              )}
            </div>
          </Col>
        </Row>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Partner Provider
          </label>
          <Controller
            name="providerId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select partner provider (optional)"
                allowClear
                className="w-full"
                size="large"
              >
                {providers.map((p) => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.full_name} ({p.mobile})
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </div>

        {providers.length === 0 && (
          <div
            className="-mt-2 mb-5 py-2 px-3 bg-[#FFF7E6] border border-[#FFE58F] rounded text-[0.85rem] text-[#D46B08]"
          >
            ⚠️ <strong>No providers onboarded:</strong> To link a service
            partner, please onboard a provider in the <strong>Providers</strong>{" "}
            tab first.
          </div>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price (INR) *
              </label>
              <Controller
                name="price"
                control={control}
                rules={{ required: "Price is required" }}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    className="w-full"
                    min={0}
                    prefix="₹"
                    placeholder="499"
                    size="large"
                  />
                )}
              />
              {errors.price && (
                <span className="text-red-500 text-sm block mt-1">
                  {errors.price.message}
                </span>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strike Price (INR)
              </label>
              <Controller
                name="strikePrice"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    className="w-full"
                    min={0}
                    prefix="₹"
                    placeholder="699 (optional)"
                    size="large"
                  />
                )}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Weight
              </label>
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} className="w-full" min={0} size="large" />
                )}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <Controller
                name="serviceType"
                control={control}
                render={({ field }) => (
                  <Select {...field} className="w-full" size="large">
                    <Select.Option value="b2c">B2C (Consumer)</Select.Option>
                    <Select.Option value="b2b">B2B (Business)</Select.Option>
                  </Select>
                )}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={8} className="mt-2">
          <Col span={8}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommended
              </label>
              <div className="h-[40px] flex items-center">
                <Controller
                  name="recommended"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Switch checked={value} onChange={onChange} />
                  )}
                />
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Best Deal
              </label>
              <div className="h-[40px] flex items-center">
                <Controller
                  name="bestDeal"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Switch checked={value} onChange={onChange} />
                  )}
                />
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Card
              </label>
              <div className="h-[40px] flex items-center">
                <Controller
                  name="active"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Switch checked={value} onChange={onChange} />
                  )}
                />
              </div>
            </div>
          </Col>
        </Row>

        <Divider className="!my-4">Media Assets</Divider>

        {/* Rate Card Images */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate Card Images
          </label>
          <div className="flex flex-col gap-4">
            {imageFields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 border border-line rounded bg-[rgba(0,0,0,0.01)]"
              >
                <Row gutter={8} align="middle">
                  <Col span={16}>
                    <Controller
                      name={`images.${index}`}
                      control={control}
                      render={({ field: imageField }) => (
                        <Input {...imageField} placeholder="Image URL or upload a file" size="large" />
                      )}
                    />
                  </Col>
                  <Col span={8}>
                    <Space>
                      <Upload
                        accept="image/*"
                        beforeUpload={(file) => {
                          setImageFiles((prev) => ({ ...prev, [index]: file }));
                          const reader = new FileReader();
                          reader.onload = () => {
                            setValue(`images.${index}`, reader.result as string);
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                        showUploadList={false}
                      >
                        <Button icon={<LuUpload size={14} />} size="small">
                          Upload
                        </Button>
                      </Upload>
                      <Button
                        danger
                        icon={<LuTrash2 size={14} />}
                        size="small"
                        onClick={() => removeImage(index)}
                      />
                    </Space>
                  </Col>
                </Row>
                {imagesValue?.[index] && (
                  <div
                    className="mt-2 text-center bg-[#fafafa] p-1 rounded border border-dashed border-[#e8e8e8]"
                  >
                    <img
                      src={imagesValue[index]}
                      alt={`Preview ${index + 1}`}
                      className="max-h-[100px] object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => appendImage("")}
              block
              icon={<LuImage size={16} />}
              size="large"
            >
              Add Image URL or File
            </Button>
          </div>
        </div>

        {/* Rate Card Videos */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate Card Videos
          </label>
          <div className="flex flex-col gap-4">
            {videoFields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 border border-line rounded bg-[rgba(0,0,0,0.01)]"
              >
                <Row gutter={8} align="middle">
                  <Col span={16}>
                    <Controller
                      name={`videos.${index}`}
                      control={control}
                      render={({ field: videoField }) => (
                        <Input {...videoField} placeholder="Video URL or upload a file" size="large" />
                      )}
                    />
                  </Col>
                  <Col span={8}>
                    <Space>
                      <Upload
                        accept="video/*"
                        beforeUpload={(file) => {
                          setVideoFiles((prev) => ({ ...prev, [index]: file }));
                          const reader = new FileReader();
                          reader.onload = () => {
                            setValue(`videos.${index}`, reader.result as string);
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                        showUploadList={false}
                      >
                        <Button icon={<LuUpload size={14} />} size="small">
                          Upload
                        </Button>
                      </Upload>
                      <Button
                        danger
                        icon={<LuTrash2 size={14} />}
                        size="small"
                        onClick={() => removeVideo(index)}
                      />
                    </Space>
                  </Col>
                </Row>
                {videosValue?.[index] && (
                  <div
                    className="mt-2 bg-black rounded overflow-hidden"
                  >
                    <video
                      src={videosValue[index]}
                      controls
                      className="w-full max-h-[120px]"
                    />
                  </div>
                )}
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => appendVideo("")}
              block
              icon={<LuCirclePlay size={16} />}
              size="large"
            >
              Add Video URL or File
            </Button>
          </div>
        </div>

        {/* Action Form Footer */}
        <div className="flex justify-end space-x-2 mt-8">
          <Button size="large" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
          >
            Save Rate Card
          </Button>
        </div>
      </form>
    </Modal>
  );
};
