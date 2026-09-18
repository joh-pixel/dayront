import { useRef, useState, type DragEvent, type ChangeEvent } from 'preact/compat';
import { useRef as usePrefRef } from 'preact/hooks';

interface Props {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  allowedExtensions?: string[];
}

export default function FileDropzone({
  onFilesSelected,
  multiple = false,
  allowedExtensions,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates files and separates them into valid + invalid.
   * For single-file tools: rejects everything if any file is invalid.
   * For multi-file tools: keeps valid files, warns about invalid ones.
   */
  function validateFiles(files: File[]): { valid: File[]; invalid: File[] } {
    if (!allowedExtensions || allowedExtensions.length === 0) {
      return { valid: files, invalid: [] };
    }

    const valid: File[] = [];
    const invalid: File[] = [];

    files.forEach((file) => {
      const ext = file.name.toLowerCase().split('.').pop() || '';
      if (allowedExtensions.includes(ext)) {
        valid.push(file);
      } else {
        invalid.push(file);
      }
    });

    return { valid, invalid };
  }

  function processFiles(files: File[]) {
    const { valid, invalid } = validateFiles(files);

    if (valid.length === 0) {
      // Nothing usable
      const badNames = invalid.map((f) => f.name).join(', ');
      const allowedList = allowedExtensions?.map((e) => e.toUpperCase()).join(', ') || '';
      setError(`❌ Invalid file type: ${badNames}. This tool only accepts: ${allowedList}`);
      return;
    }

    if (invalid.length > 0) {
      // Partial success: warn but proceed with the valid ones
      const badNames = invalid.map((f) => f.name).join(', ');
      setError(`⚠️ Skipped incompatible file(s): ${badNames}`);
    } else {
      setError(null);
    }

    // For single-file tools, only pass the first valid file
    const finalFiles = multiple ? valid : [valid[0]];
    onFilesSelected(finalFiles);
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
      processFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.currentTarget.files) {
      processFiles(Array.from(e.currentTarget.files));
      // Reset so the same file can be re-selected after fixing an error
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  // Build the `accept` attribute to filter the file picker
  const acceptAttr =
    allowedExtensions && allowedExtensions.length > 0
      ? allowedExtensions.map((ext) => `.${ext}`).join(',')
      : undefined;

  // Human-readable list of accepted formats
  const acceptedList =
    allowedExtensions && allowedExtensions.length > 0
      ? allowedExtensions.map((ext) => ext.toUpperCase()).join(', ')
      : null;

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
        <p
          class={`text-xl font-medium mb-2 ${
            isDragging ? 'text-sky' : 'text-black dark:text-white'
          }`}
        >
          {isDragging ? 'Drop files here' : 'Drag & drop your files'}
        </p>
        <p class="text-gray-500 dark:text-gray-400 mb-4">or</p>
        <button
          type="button"
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

        {/* Show accepted formats hint */}
        {acceptedList && (
          <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Accepted: <span class="font-semibold">{acceptedList}</span>
          </p>
        )}
      </div>

      {/* Inline error / warning */}
      {error && (
        <div
          class={`mt-4 p-4 rounded-xl border ${
            error.startsWith('⚠️')
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
          }`}
        >
          <p
            class={`text-sm font-medium ${
              error.startsWith('⚠️')
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-red-700 dark:text-red-300'
            }`}
          >
            {error}
          </p>
        </div>
      )}
    </div>
  );
}