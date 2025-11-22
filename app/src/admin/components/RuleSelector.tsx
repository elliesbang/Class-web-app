import DaySelector from './DaySelector';
import TimeRangeSelector from './TimeRangeSelector';

export type AssignmentRuleType =
  | 'always_open'
  | 'time_range'
  | 'weekly_days'
  | 'weekly_days_with_time';

export interface AssignmentRule {
  assignment_rule_type: AssignmentRuleType;
  assignment_days?: string[] | null;
  assignment_start_time?: string | null;
  assignment_end_time?: string | null;
}

interface RuleSelectorProps {
  value: AssignmentRule;
  onChange: (rule: AssignmentRule) => void;
}

const RuleSelector = ({ value, onChange }: RuleSelectorProps) => {
  const handleTypeChange = (type: AssignmentRuleType) => {
    onChange({ ...value, assignment_rule_type: type });
  };

  return (
    <div className="space-y-3 rounded-2xl bg-[#fff7d6] p-4 shadow-inner shadow-[#ffeab2]">
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#3f3a37]">과제 규칙 형태</label>
        <select
          value={value.assignment_rule_type}
          onChange={(e) => handleTypeChange(e.target.value as AssignmentRuleType)}
          className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
        >
          <option value="always_open">상시 제출 가능</option>
          <option value="time_range">특정 시간대만 제출</option>
          <option value="weekly_days">특정 요일만 제출</option>
          <option value="weekly_days_with_time">요일 + 시간대 설정</option>
        </select>
      </div>

      {(value.assignment_rule_type === 'weekly_days' || value.assignment_rule_type === 'weekly_days_with_time') && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">제출 가능 요일</p>
          <DaySelector selectedDays={value.assignment_days ?? []} onChange={(days) => onChange({ ...value, assignment_days: days })} />
        </div>
      )}

      {(value.assignment_rule_type === 'time_range' || value.assignment_rule_type === 'weekly_days_with_time') && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">제출 가능 시간</p>
          <TimeRangeSelector
            startTime={value.assignment_start_time || ''}
            endTime={value.assignment_end_time || ''}
            onChange={({ start, end }) =>
              onChange({ ...value, assignment_start_time: start || null, assignment_end_time: end || null })
            }
          />
        </div>
      )}
    </div>
  );
};

export default RuleSelector;
