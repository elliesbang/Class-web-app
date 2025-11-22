export function canSubmit(rule: any, now = new Date()) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = dayNames[now.getDay()];
  const time = now.toTimeString().slice(0, 5);

  switch (rule.assignment_rule_type) {
    case 'always_open':
      return true;
    case 'time_range':
      return rule.assignment_start_time <= time && time <= rule.assignment_end_time;
    case 'weekly_days':
      return rule.assignment_days?.includes(day);
    case 'weekly_days_with_time':
      return (
        rule.assignment_days?.includes(day) &&
        rule.assignment_start_time <= time &&
        time <= rule.assignment_end_time
      );
    default:
      return false;
  }
}
