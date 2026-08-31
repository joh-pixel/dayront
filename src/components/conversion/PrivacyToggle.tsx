interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function PrivacyToggle({ checked, onChange }: Props) {
  return (
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        aria-label="Clean File Privacy Before Download"
        class="w-4 h-4 text-sky rounded border-gray-300 dark:border-gray-600 focus:ring-sky cursor-pointer"
        checked={checked}
        // Stop any parent container clicks from accidentally triggering this
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          // Prevent the default browser behavior (like submitting a form or causing a full page reload)
          e.preventDefault();
          onChange(e.currentTarget.checked);
        }}
      />
      <span class="text-sm font-medium text-black dark:text-white">
        Clean File Privacy Before Download
      </span>
    </label>
  );
}