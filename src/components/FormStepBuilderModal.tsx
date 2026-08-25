import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Select,
  Switch,
  Space,
  Card,
  Empty,
  Spin,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  LuPlus,
  LuTrash2,
  LuArrowUp,
  LuArrowDown,
  LuSave,
  LuLayoutGrid,
  LuCircleHelp
} from 'react-icons/lu';
import { useGetFormStepsQuery, useBulkSyncFormStepsMutation } from '../store/apiSlice';

interface FormStepBuilderModalProps {
  open: boolean;
  subCategoryId: string | null;
  subCategoryName: string;
  onCancel: () => void;
}

// Local State Interfaces matching DTOs
interface LocalOption {
  id?: string;
  label: string;
  value: string;
  orderIndex: number;
}

interface LocalQuestion {
  id?: string;
  fieldKey: string;
  label: string | null;
  inputType: string;
  isRequired: boolean;
  orderIndex: number;
  options: LocalOption[];
}

interface LocalStep {
  id?: string;
  stepNumber: number;
  title: string;
  subtitle: string | null;
  orderIndex: number;
  questions: LocalQuestion[];
}

export const FormStepBuilderModal: React.FC<FormStepBuilderModalProps> = ({
  open,
  subCategoryId,
  subCategoryName,
  onCancel
}) => {
  const { data: dbSteps = [], isLoading, refetch } = useGetFormStepsQuery(subCategoryId || '', {
    skip: !subCategoryId || !open
  });
  const [bulkSyncFormSteps, { isLoading: isSaving }] = useBulkSyncFormStepsMutation();

  const [steps, setSteps] = useState<LocalStep[]>([]);
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);

  // Sync with database steps when opened/loaded
  useEffect(() => {
    if (open && dbSteps) {
      // Map and sort the steps from DB to our local state structure
      const sortedSteps = [...dbSteps]
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((s) => ({
          id: s.id || s.step_id,
          stepNumber: s.stepNumber || s.step_number || 1,
          title: s.title || '',
          subtitle: s.subtitle || '',
          orderIndex: s.orderIndex ?? 0,
          questions: s.questions
            ? [...s.questions]
                .sort((qa, qb) => (qa.orderIndex ?? 0) - (qb.orderIndex ?? 0))
                .map((q) => ({
                  id: q.id || q.question_id,
                  fieldKey: q.fieldKey || q.field_key || '',
                  label: q.label || '',
                  inputType: q.inputType || q.input_type || 'SINGLE_CHOICE',
                  isRequired: q.isRequired ?? q.is_required ?? false,
                  orderIndex: q.orderIndex ?? 0,
                  options: q.options
                    ? [...q.options]
                        .sort((oa, ob) => (oa.orderIndex ?? 0) - (ob.orderIndex ?? 0))
                        .map((o) => ({
                          id: o.id,
                          label: o.label || '',
                          value: o.value || '',
                          orderIndex: o.orderIndex ?? 0
                        }))
                    : []
                }))
            : []
        }));
      setSteps(sortedSteps);
      if (sortedSteps.length > 0) {
        setExpandedStepIndex(0);
      } else {
        setExpandedStepIndex(null);
      }
    }
  }, [open, dbSteps]);

  // Helper to re-index steps/questions/options order
  const reorderStepsIndices = (updatedSteps: LocalStep[]) => {
    return updatedSteps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
      orderIndex: idx
    }));
  };

  // --- Step Management Actions ---
  const handleAddStep = () => {
    const nextIdx = steps.length;
    const newStep: LocalStep = {
      stepNumber: nextIdx + 1,
      title: '',
      subtitle: '',
      orderIndex: nextIdx,
      questions: []
    };
    const updated = [...steps, newStep];
    setSteps(updated);
    setExpandedStepIndex(nextIdx);
    message.success('New step added.');
  };

  const handleDeleteStep = (stepIdx: number) => {
    const updated = steps.filter((_, idx) => idx !== stepIdx);
    setSteps(reorderStepsIndices(updated));
    setExpandedStepIndex(updated.length > 0 ? Math.max(0, stepIdx - 1) : null);
    message.info('Step removed.');
  };

  const handleMoveStep = (stepIdx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && stepIdx === 0) return;
    if (direction === 'down' && stepIdx === steps.length - 1) return;

    const targetIdx = direction === 'up' ? stepIdx - 1 : stepIdx + 1;
    const updated = [...steps];
    const temp = updated[stepIdx];
    updated[stepIdx] = updated[targetIdx];
    updated[targetIdx] = temp;

    const reordered = reorderStepsIndices(updated);
    setSteps(reordered);
    setExpandedStepIndex(targetIdx);
  };

  const handleUpdateStepField = (stepIdx: number, field: keyof LocalStep, value: any) => {
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      [field]: value
    };
    setSteps(updated);
  };

  // --- Question Management Actions ---
  const handleAddQuestion = (stepIdx: number) => {
    const questions = steps[stepIdx].questions || [];
    const nextIdx = questions.length;
    const newQuestion: LocalQuestion = {
      fieldKey: '',
      label: '',
      inputType: 'SINGLE_CHOICE',
      isRequired: false,
      orderIndex: nextIdx,
      options: []
    };
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions: [...questions, newQuestion]
    };
    setSteps(updated);
    message.success('Question added to step.');
  };

  const handleDeleteQuestion = (stepIdx: number, qIdx: number) => {
    const questions = steps[stepIdx].questions || [];
    const updatedQuestions = questions
      .filter((_, idx) => idx !== qIdx)
      .map((q, idx) => ({ ...q, orderIndex: idx }));

    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions: updatedQuestions
    };
    setSteps(updated);
    message.info('Question removed.');
  };

  const handleMoveQuestion = (stepIdx: number, qIdx: number, direction: 'up' | 'down') => {
    const questions = steps[stepIdx].questions || [];
    if (direction === 'up' && qIdx === 0) return;
    if (direction === 'down' && qIdx === questions.length - 1) return;

    const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
    const updatedQuestions = [...questions];
    const temp = updatedQuestions[qIdx];
    updatedQuestions[qIdx] = updatedQuestions[targetIdx];
    updatedQuestions[targetIdx] = temp;

    const reordered = updatedQuestions.map((q, idx) => ({ ...q, orderIndex: idx }));
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions: reordered
    };
    setSteps(updated);
  };

  const handleUpdateQuestionField = (stepIdx: number, qIdx: number, field: keyof LocalQuestion, value: any) => {
    const updated = [...steps];
    const questions = [...updated[stepIdx].questions];
    questions[qIdx] = {
      ...questions[qIdx],
      [field]: value
    };
    // Initialize options list if changing type to choices and it was empty
    if (field === 'inputType' && (value === 'SINGLE_CHOICE' || value === 'MULTI_CHOICE' || value === 'DROPDOWN')) {
      if (!questions[qIdx].options || questions[qIdx].options.length === 0) {
        questions[qIdx].options = [
          { label: '', value: '', orderIndex: 0 }
        ];
      }
    }
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions
    };
    setSteps(updated);
  };

  // --- Option Management Actions ---
  const handleAddOption = (stepIdx: number, qIdx: number) => {
    const updated = [...steps];
    const questions = [...updated[stepIdx].questions];
    const options = questions[qIdx].options || [];
    const nextIdx = options.length;
    
    questions[qIdx] = {
      ...questions[qIdx],
      options: [
        ...options,
        { label: '', value: '', orderIndex: nextIdx }
      ]
    };
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions
    };
    setSteps(updated);
  };

  const handleDeleteOption = (stepIdx: number, qIdx: number, oIdx: number) => {
    const updated = [...steps];
    const questions = [...updated[stepIdx].questions];
    const options = questions[qIdx].options || [];
    
    questions[qIdx] = {
      ...questions[qIdx],
      options: options
        .filter((_, idx) => idx !== oIdx)
        .map((o, idx) => ({ ...o, orderIndex: idx }))
    };
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions
    };
    setSteps(updated);
  };

  const handleMoveOption = (stepIdx: number, qIdx: number, oIdx: number, direction: 'up' | 'down') => {
    const updated = [...steps];
    const questions = [...updated[stepIdx].questions];
    const options = questions[qIdx].options || [];
    if (direction === 'up' && oIdx === 0) return;
    if (direction === 'down' && oIdx === options.length - 1) return;

    const targetIdx = direction === 'up' ? oIdx - 1 : oIdx + 1;
    const updatedOptions = [...options];
    const temp = updatedOptions[oIdx];
    updatedOptions[oIdx] = updatedOptions[targetIdx];
    updatedOptions[targetIdx] = temp;

    questions[qIdx] = {
      ...questions[qIdx],
      options: updatedOptions.map((o, idx) => ({ ...o, orderIndex: idx }))
    };
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions
    };
    setSteps(updated);
  };

  const handleUpdateOptionField = (stepIdx: number, qIdx: number, oIdx: number, field: keyof LocalOption, value: any) => {
    const updated = [...steps];
    const questions = [...updated[stepIdx].questions];
    const options = [...questions[qIdx].options];
    options[oIdx] = {
      ...options[oIdx],
      [field]: value
    };
    questions[qIdx] = {
      ...questions[qIdx],
      options
    };
    updated[stepIdx] = {
      ...updated[stepIdx],
      questions
    };
    setSteps(updated);
  };

  // --- Save / Submit ---
  const handleSaveAll = async () => {
    if (!subCategoryId) return;

    // Validate keys and configurations
    for (let sIdx = 0; sIdx < steps.length; sIdx++) {
      const step = steps[sIdx];
      if (!step.title.trim()) {
        message.error(`Step ${sIdx + 1} must have a valid title.`);
        return;
      }
      for (let qIdx = 0; qIdx < step.questions.length; qIdx++) {
        const question = step.questions[qIdx];
        if (!question.fieldKey.trim()) {
          message.error(`Step ${sIdx + 1}, Question ${qIdx + 1} must have a valid Field Key (identifier).`);
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(question.fieldKey)) {
          message.error(`Step ${sIdx + 1}, Question ${qIdx + 1} Field Key must contain only alphanumeric characters or underscores.`);
          return;
        }
        if (!question.label?.trim()) {
          message.error(`Step ${sIdx + 1}, Question ${qIdx + 1} must have a valid label.`);
          return;
        }

        const choiceTypes = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN'];
        if (choiceTypes.includes(question.inputType)) {
          if (!question.options || question.options.length === 0) {
            message.error(`Question '${question.label}' has choices input type but no options configured.`);
            return;
          }
          for (let oIdx = 0; oIdx < question.options.length; oIdx++) {
            const opt = question.options[oIdx];
            if (!opt.label.trim() || !opt.value.trim()) {
              message.error(`Question '${question.label}', option ${oIdx + 1} must have both label and value.`);
              return;
            }
          }
        }
      }
    }

    try {
      // Map payload to SyncFormStepItemDto format
      const stepsPayload = steps.map((s) => ({
        stepNumber: s.stepNumber,
        title: s.title,
        subtitle: s.subtitle || null,
        orderIndex: s.orderIndex,
        questions: s.questions.map((q) => ({
          fieldKey: q.fieldKey,
          label: q.label,
          inputType: q.inputType,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          options: q.options.map((o) => ({
            label: o.label,
            value: o.value,
            orderIndex: o.orderIndex
          }))
        }))
      }));

      await bulkSyncFormSteps({ subCategoryId, steps: stepsPayload }).unwrap();
      message.success('Questionnaire saved successfully!');
      refetch();
      onCancel();
    } catch (err: any) {
      console.error(err);
      message.error(err.data?.message || err.message || 'Failed to save questionnaire.');
    }
  };

  return (
    <Modal
      title={
        <div className="flex flex-col gap-0.5 border-b border-line pb-3 -mx-[8px] px-[8px] bg-[rgba(184,148,106,0.02)]">
          <span className="label-overline text-mute text-[10px]">Taxonomy Form Curation</span>
          <h3 className="font-serif text-lg text-ink font-semibold !m-0">
            Form Steps Builder: <span className="text-gold font-sans">{subCategoryName}</span>
          </h3>
        </div>
      }
      open={open}
      centered
      onCancel={onCancel}
      footer={
        <div className="flex justify-between border-t border-line pt-4 -mx-[8px] px-[8px] mt-6">
          <Button onClick={onCancel} disabled={isSaving} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<LuSave size={16} />}
            loading={isSaving}
            onClick={handleSaveAll}
            size="large"
          >
            Save Questionnaire
          </Button>
        </div>
      }
      width={900}
      destroyOnClose
      styles={{ body: { padding: '24px 0 0 0', maxHeight: '70vh', overflowY: 'auto' } }}
      className="premium-modal font-sans"
    >
      <div className="px-6 pb-2">
        {isLoading ? (
          <div className="py-24 text-center">
            <Spin size="large" tip="Loading Subcategory Curation Fields..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Steps List Panel */}
            <div className="md:col-span-4 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="label-overline text-mute text-[10px]">Curation Flow Steps</span>
                <Button
                  type="dashed"
                  size="small"
                  icon={<LuPlus size={12} />}
                  onClick={handleAddStep}
                  className="!text-xs"
                >
                  Add Step
                </Button>
              </div>

              {steps.length === 0 ? (
                <div className="p-6 border border-dashed border-line bg-paper text-center rounded-lg">
                  <Empty description="No curation steps configured" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  <Button type="primary" size="small" className="mt-2" onClick={handleAddStep}>
                    Create First Step
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {steps.map((step, idx) => {
                    const isExpanded = expandedStepIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-col gap-1.5 ${
                          isExpanded
                            ? 'border-gold bg-[rgba(184,148,106,0.05)] shadow-sm'
                            : 'border-line bg-paper hover:bg-[rgba(0,0,0,0.01)]'
                        }`}
                        onClick={() => setExpandedStepIndex(idx)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-mute font-mono">
                            STEP 0{idx + 1}
                          </span>
                          <Space size={4} onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="text"
                              size="small"
                              icon={<LuArrowUp size={12} />}
                              disabled={idx === 0}
                              onClick={() => handleMoveStep(idx, 'up')}
                              className="h-6 w-6 flex items-center justify-center p-0"
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<LuArrowDown size={12} />}
                              disabled={idx === steps.length - 1}
                              onClick={() => handleMoveStep(idx, 'down')}
                              className="h-6 w-6 flex items-center justify-center p-0"
                            />
                            <Popconfirm
                              title="Delete this form step?"
                              description="This will clear all questions inside it."
                              onConfirm={() => handleDeleteStep(idx)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<LuTrash2 size={12} />}
                                className="h-6 w-6 flex items-center justify-center p-0 hover:bg-red-50"
                              />
                            </Popconfirm>
                          </Space>
                        </div>
                        <h4 className="font-serif text-sm font-semibold truncate !m-0 text-ink">
                          {step.title || 'Untitled Step'}
                        </h4>
                        <span className="text-[10px] text-mute truncate block">
                          {step.questions.length} Question(s) configured
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Question Editing Panel */}
            <div className="md:col-span-8">
              {expandedStepIndex === null || steps[expandedStepIndex] === undefined ? (
                <div className="p-12 border border-line bg-paper text-center rounded-lg h-[400px] flex flex-col justify-center items-center">
                  <LuLayoutGrid size={32} className="text-mute mb-2" />
                  <p className="text-mute text-sm">Select or add a curation step from the left panel to configure its questions.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step Configuration Card */}
                  <Card className="bg-[rgba(184,148,106,0.02)] border border-line rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <LuLayoutGrid className="text-gold" size={16} />
                      <span className="font-semibold text-xs tracking-wider uppercase text-cocoa">Step Config Details</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Step Title (Displayed to User)</label>
                        <Input
                          value={steps[expandedStepIndex].title}
                          onChange={(e) => handleUpdateStepField(expandedStepIndex, 'title', e.target.value)}
                          placeholder="e.g. Choose Your Style Aesthetic"
                          size="large"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Subtitle / User Instructions</label>
                        <Input.TextArea
                          value={steps[expandedStepIndex].subtitle || ''}
                          onChange={(e) => handleUpdateStepField(expandedStepIndex, 'subtitle', e.target.value)}
                          placeholder="e.g. Let our stylist know the tone you want to achieve."
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Questions Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-line pb-2">
                      <span className="font-serif text-base text-ink font-semibold">Questions inside Step</span>
                      <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<LuPlus size={14} />}
                        onClick={() => handleAddQuestion(expandedStepIndex)}
                      >
                        Add Question
                      </Button>
                    </div>

                    {steps[expandedStepIndex].questions.length === 0 ? (
                      <div className="py-12 border border-dashed border-line text-center text-mute bg-paper rounded-lg">
                        <LuCircleHelp size={24} className="mx-auto mb-2 text-mute" />
                        <p className="text-xs">No questions inside this step. Add a question to begin receiving customer answers.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {steps[expandedStepIndex].questions.map((question, qIdx) => (
                          <Card
                            key={qIdx}
                            size="small"
                            className="border border-line rounded-lg bg-paper hover:shadow-sm transition-all"
                            title={
                              <div className="flex items-center justify-between py-1">
                                <span className="font-mono text-[10px] text-mute font-bold">
                                  Q{qIdx + 1}
                                </span>
                                <Space size={4}>
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<LuArrowUp size={12} />}
                                    disabled={qIdx === 0}
                                    onClick={() => handleMoveQuestion(expandedStepIndex, qIdx, 'up')}
                                    className="h-6 w-6 flex items-center justify-center p-0"
                                  />
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<LuArrowDown size={12} />}
                                    disabled={qIdx === steps[expandedStepIndex].questions.length - 1}
                                    onClick={() => handleMoveQuestion(expandedStepIndex, qIdx, 'down')}
                                    className="h-6 w-6 flex items-center justify-center p-0"
                                  />
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<LuTrash2 size={12} />}
                                    onClick={() => handleDeleteQuestion(expandedStepIndex, qIdx)}
                                    className="h-6 w-6 flex items-center justify-center p-0 hover:bg-red-50"
                                  />
                                </Space>
                              </div>
                            }
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                                  Field Key (DB JSON Key) *
                                  <Tooltip title="Must be a unique lowercase string (e.g. style, body_contour, occasion) used as a database field.">
                                    <LuCircleHelp size={10} className="inline ml-1 text-mute cursor-pointer" />
                                  </Tooltip>
                                </label>
                                <Input
                                  value={question.fieldKey}
                                  onChange={(e) => handleUpdateQuestionField(expandedStepIndex, qIdx, 'fieldKey', e.target.value)}
                                  placeholder="e.g. occasion"
                                  className="font-mono text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Question / Label *</label>
                                <Input
                                  value={question.label || ''}
                                  onChange={(e) => handleUpdateQuestionField(expandedStepIndex, qIdx, 'label', e.target.value)}
                                  placeholder="e.g. What is the occasion?"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Input Field Type</label>
                                <Select
                                  value={question.inputType}
                                  onChange={(val) => handleUpdateQuestionField(expandedStepIndex, qIdx, 'inputType', val)}
                                  className="w-full"
                                  size="small"
                                >
                                  <Select.Option value="SINGLE_CHOICE">Single Choice (Radio Buttons)</Select.Option>
                                  <Select.Option value="MULTI_CHOICE">Multi Choice (Checkboxes)</Select.Option>
                                  <Select.Option value="TEXT_INPUT">Text Input Line</Select.Option>
                                  <Select.Option value="TEXTAREA">TextArea Box</Select.Option>
                                  <Select.Option value="DROPDOWN">Select Dropdown</Select.Option>
                                  <Select.Option value="DATE_PICKER">Date Picker</Select.Option>
                                </Select>
                              </div>

                              <div className="flex items-center mt-4">
                                <span className="text-[10px] font-semibold text-gray-500 mr-2">Required Field?</span>
                                <Switch
                                  size="small"
                                  checked={question.isRequired}
                                  onChange={(val) => handleUpdateQuestionField(expandedStepIndex, qIdx, 'isRequired', val)}
                                />
                              </div>
                            </div>

                            {/* Option selections editor */}
                            {['SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN'].includes(question.inputType) && (
                              <div className="mt-4 pt-3 border-t border-line">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-cocoa uppercase tracking-wider">Configure Options</span>
                                  <Button
                                    type="dashed"
                                    size="small"
                                    icon={<LuPlus size={10} />}
                                    onClick={() => handleAddOption(expandedStepIndex, qIdx)}
                                    className="!text-[10px] h-5 py-0 px-2"
                                  >
                                    Add Option
                                  </Button>
                                </div>

                                {(!question.options || question.options.length === 0) ? (
                                  <span className="text-xs text-red-500 block italic">Add options for user selection.</span>
                                ) : (
                                  <div className="space-y-1.5">
                                    {question.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2 bg-[rgba(0,0,0,0.01)] p-1 border border-line rounded">
                                        <Input
                                          value={opt.label}
                                          placeholder="Display Label (e.g. Wedding Guest)"
                                          size="small"
                                          onChange={(e) => handleUpdateOptionField(expandedStepIndex, qIdx, oIdx, 'label', e.target.value)}
                                          className="flex-1 text-xs"
                                        />
                                        <Input
                                          value={opt.value}
                                          placeholder="Value (e.g. wedding_guest)"
                                          size="small"
                                          onChange={(e) => handleUpdateOptionField(expandedStepIndex, qIdx, oIdx, 'value', e.target.value)}
                                          className="flex-1 text-xs font-mono"
                                        />
                                        <Space size={2}>
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<LuArrowUp size={10} />}
                                            disabled={oIdx === 0}
                                            onClick={() => handleMoveOption(expandedStepIndex, qIdx, oIdx, 'up')}
                                            className="h-5 w-5 flex items-center justify-center p-0"
                                          />
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<LuArrowDown size={10} />}
                                            disabled={oIdx === question.options.length - 1}
                                            onClick={() => handleMoveOption(expandedStepIndex, qIdx, oIdx, 'down')}
                                            className="h-5 w-5 flex items-center justify-center p-0"
                                          />
                                          <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<LuTrash2 size={10} />}
                                            onClick={() => handleDeleteOption(expandedStepIndex, qIdx, oIdx)}
                                            className="h-5 w-5 flex items-center justify-center p-0 hover:bg-red-50"
                                          />
                                        </Space>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
