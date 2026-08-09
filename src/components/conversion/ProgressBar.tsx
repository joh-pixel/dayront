interface Props {
  percent: number;
  label?: string;
}

export default function ProgressBar({ percent, label = 'Processing...' }: Props) {
  return (
    <div class="w-full">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium">{label}</span>
        <span class="text-sm font-medium">{percent}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-lemon h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}