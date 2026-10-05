import { format } from 'date-fns';
import type { CSSProperties } from 'react';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Web date field: the browser's own <input type="date">, since
// @react-native-community/datetimepicker renders nothing on web.
export function DateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const theme = useTheme();

  const style: CSSProperties = {
    alignSelf: 'flex-start',
    padding: `${Spacing.two}px ${Spacing.three}px`,
    borderRadius: Spacing.three,
    border: 'none',
    background: theme.backgroundElement,
    color: theme.text,
    fontSize: 16,
    fontFamily: 'inherit',
    colorScheme: 'light dark',
  };

  return (
    <input
      type="date"
      style={style}
      value={format(value, 'yyyy-MM-dd')}
      onChange={(event) => {
        const [year, month, day] = event.target.value.split('-').map(Number);
        if (!year || !month || !day) {
          return; // cleared field: keep the previous date
        }
        // Change only the calendar day; keep the time of day, like the
        // native picker in date mode does.
        const next = new Date(value);
        next.setFullYear(year, month - 1, day);
        onChange(next);
      }}
    />
  );
}
