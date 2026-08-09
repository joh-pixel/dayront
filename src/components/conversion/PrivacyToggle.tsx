interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function PrivacyToggle({ checked, onChange }: Props) {
  return (
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        class="w-4 h-4 text-lemon rounded border-gray-300 dark:border-gray-600 focus:ring-lemon"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span class="text-sm font-medium">Clean File Privacy Before Download</span>
    </label>
  );
}