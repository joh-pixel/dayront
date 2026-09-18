import { useRef, useState, type DragEvent, type ChangeEvent } from 'preact/compat';

interface Props {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  allowedExtensions?: string[]; // ★ NEW: Pass this from the parent tool component
}

export default function FileDropzone({ 
  onFilesSelected, 
  multiple = false,
  allowedExtensions 
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ★ NEW: Validate files before passing them up
  function validateFiles(files: File[]): File[] | null {
    if (!allowedExtensions || allowedExtensions.length === 0) {
      return files; // No restrictions, allow everything
    }

    const invalidFiles = files.filter((file) => {
      const ext = file.name.toLowerCase().split('.').pop() || '';
      return !allowedExtensions.includes(ext);
    });

    if (invalidFiles.length > 0) {
      const badNames = invalidFiles.map(f => f.name).join(', ');
      const allowedList = allowedExtensions.map(e => e.toUpperCase()).join(', ');
      
      setError(
        `❌ Invalid file type: ${badNames}. This tool only accepts: ${allowedList}`
      );
      return null;
    }

    setError(null);
    return files;
  }

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
      const files = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(files);
      if (validFiles) {
        onFilesSelected(validFiles);
      }
    }
  }
  
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.currentTarget.files) {
      const files = Array.from(e.currentTarget.files);
      const validFiles = validateFiles(files);
      if (validFiles) {
        onFilesSelected(validFiles);
      }
      
      // Reset input so user can re-select the same file after fixing error
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  // Build the `accept` attribute to filter the file picker
  const acceptAttr = allowedExtensions && allowedExtensions.length > 0
    ? allowedExtensions.map(ext => `.${ext}`).join(',')
    : undefined;

  return (
    <div>
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
          accept={acceptAttr}
          onChange={handleFileChange}
        />
      </div>

      {/* ★ NEW: Inline error message */}
      {error && (
        <div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
          <p class="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}