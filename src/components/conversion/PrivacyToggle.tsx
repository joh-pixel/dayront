interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function PrivacyToggle({ checked, onChange }: Props) {
  return (
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        class="w-4 h-4 text-sky rounded border-gray-300 dark:border-gray-600 focus:ring-sky"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span class="text-sm font-medium text-black dark:text-white">
        Clean File Privacy Before Download
      </span>
    </label>
  );
}