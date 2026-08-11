import { useRef, useState, type DragEvent, type ChangeEvent } from 'preact/compat';

interface Props {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
}

export default function FileDropzone({ onFilesSelected, multiple = false }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.currentTarget.files) {
      onFilesSelected(Array.from(e.currentTarget.files));
    }
  }

  return (
    <div
      class={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition ${
        isDragging
          ? 'border-sky bg-sky-light/30 dark:bg-sky/10'
          : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p class={`text-xl font-medium mb-2 ${isDragging ? 'text-sky' : 'text-black dark:text-white'}`}>
        {isDragging ? 'Drop files here' : 'Drag & drop your files'}
      </p>
      <p class="text-gray-500 dark:text-gray-400 mb-4">or</p>
      <button
        class="bg-sky text-black font-semibold px-6 py-3 rounded-xl hover:bg-sky-bright active:scale-95 transition"
        onClick={() => inputRef.current?.click()}
      >
        Browse Files
      </button>
      <input
        ref={inputRef}
        type="file"
        class="hidden"
        multiple={multiple}
        onChange={handleFileChange}
      />
    </div>
  );
}