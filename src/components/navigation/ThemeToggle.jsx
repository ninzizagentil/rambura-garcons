import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import IconButton from '../common/IconButton';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <IconButton
      icon={isDark ? Sun : Moon}
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
    />
  );
}
