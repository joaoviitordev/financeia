import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl';
import type { ThemePreference } from '@/theme/theme-context';
import { useTheme } from '@/theme/useTheme';

const OPTIONS: readonly SegmentedOption<ThemePreference>[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
];

/**
 * Três estados, não dois. "Sistema" precisa ser uma opção explícita: com um
 * toggle binário não há como voltar a seguir o sistema depois de escolher uma
 * vez, e quem alterna o tema por horário do dia fica preso.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <SegmentedControl
      options={OPTIONS}
      value={preference}
      onChange={setPreference}
      aria-label="Aparência"
      className="w-fit"
    />
  );
}
