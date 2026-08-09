import { useState } from 'preact/hooks';
import FileDropzone from './FileDropzone';
import ProgressBar from './ProgressBar';
import PrivacyToggle from './PrivacyToggle';
import {
  convertFile,
  cutAudio,
  mergeAudio,
  compressAudio,
  boostVolume,
  changeSpeed,
  reverseAudio,
  stereoToMono,
  stripMetadata,
} from '../../lib/ffmpeg';
import { saveFile } from '../../lib/db';
import { formatBytes } from '../../lib/utils';

type ToolType =
  | 'convert'
  | 'cut'
  | 'merge'
  | 'compress'
  | 'boost'
  | 'speed'
  | 'reverse'
  | 'stereo-to-mono';

interface ToolConfig {
  type: ToolType;
  from?: string;
  to?: string;
  outputFormat?: string;
  label?: string;
}

function getOutputFilename(originalName: string, outputFormat: string): string {
  const base = originalName.replace(/\.[^/.]+$/, '');
  return `${base}.${outputFormat}`;
}

export default function Converter({ toolConfig }: { toolConfig: ToolConfig }) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [outputFilename, setOutputFilename] = useState<string>('');
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(selected: File[]) {
    setFiles(selected);
    setResultBlob(null);
    setOutputFilename('');
    setError(null);
  }

  async function startConversion() {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      let output: Blob;
      const type = toolConfig.type;

      switch (type) {
        case 'convert':
          output = await convertFile(files[0], toolConfig.to || 'mp3', setProgress);
          break;
        case 'cut':
          output = await cutAudio(files[0], 0, 30, toolConfig.outputFormat || 'mp3', setProgress);
          break;
        case 'merge':
          if (files.length < 2) throw new Error('Please select at least 2 files.');
          output = await mergeAudio(files, toolConfig.outputFormat || 'mp3', setProgress);
          break;
        case 'compress':
          output = await compressAudio(files[0], 3, toolConfig.outputFormat || 'mp3', setProgress);
          break;
        case 'boost':
          output = await boostVolume(files[0], 6, toolConfig.outputFormat || 'mp3', setProgress);
          break;
        case 'speed':
          output = await changeSpeed(files[0], 1.5, toolConfig.outputFormat || 'mp3', setProgress);
          break;
        case 'reverse':
          output = await reverseAudio(files[0], toolConfig.outputFormat || 'mp3', setProgress);
          break;
        case 'stereo-to-mono':
          output = await stereoToMono(files[0], toolConfig.outputFormat || 'mp3', setProgress);
          break;
        default:
          throw new Error('Unsupported tool');
      }

      if (privacy) {
        output = await stripMetadata(new File([output], 'temp', { type: output.type }));
      }

      const id = `conv_${Date.now()}`;
      await saveFile(id, output);

      const format = toolConfig.outputFormat || toolConfig.to || 'mp3';
      const originalName = files[0]?.name || 'file';
      const filename = getOutputFilename(originalName, format);

      setResultBlob(output);
      setOutputFilename(filename);
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename || 'output.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function resetAll() {
    setFiles([]);
    setResultBlob(null);
    setOutputFilename('');
    setError(null);
    setProgress(0);
    setProcessing(false);
  }

  return (
    <div class="space-y-6">
      {!resultBlob && (
        <>
          <FileDropzone
            onFilesSelected={handleFiles}
            multiple={toolConfig.type === 'merge'}
          />
          {files.length > 0 && (
            <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-sm">
              <p class="font-medium">Selected files:</p>
              <ul class="list-disc list-inside">
                {files.map((f) => (
                  <li>{f.name} ({formatBytes(f.size)})</li>
                ))}
              </ul>
            </div>
          )}
          <PrivacyToggle checked={privacy} onChange={setPrivacy} />
          <button
            class="bg-sky text-black font-semibold px-6 py-3 rounded-xl hover:bg-sky-bright active:scale-95 transition-all duration-200 disabled:opacity-50"
            disabled={files.length === 0 || processing}
            onClick={startConversion}
          >
            {processing ? 'Processing...' : `Start ${toolConfig.label || 'Conversion'}`}
          </button>
          {processing && <ProgressBar percent={progress} />}
        </>
      )}

      {error && (
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p class="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            class="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
            onClick={resetAll}
          >
            Try again
          </button>
        </div>
      )}

      {resultBlob && (
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">✅</span>
            <div>
              <p class="font-semibold text-lg text-green-800 dark:text-green-100">Ready!</p>
              <p class="text-sm text-green-700 dark:text-green-300">
                {outputFilename} – {formatBytes(resultBlob.size)}
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <button
              class="bg-sky text-black font-semibold px-6 py-3 rounded-xl hover:bg-sky-bright active:scale-95 transition-all flex-1"
              onClick={download}
            >
              Download File
            </button>
            <button
              class="bg-gray-200 dark:bg-gray-800 text-black dark:text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95 transition-all"
              onClick={resetAll}
            >
              Convert Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}