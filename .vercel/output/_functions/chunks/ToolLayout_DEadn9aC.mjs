import { a as createComponent, m as maybeRenderHead, b as renderTemplate, c as createAstro, r as renderComponent, d as addAttribute, u as unescapeHTML } from './astro/server_CayxtmO5.mjs';
import 'piccolore';
import { t as tools, $ as $$BaseLayout, a as $$AdSlot } from './BaseLayout_m8T0OSWF.mjs';
import { useState as useState$1, useRef as useRef$1, useEffect } from 'preact/hooks';
import { useState, useRef } from 'preact/compat';
import { jsxs, jsx, Fragment } from 'preact/jsx-runtime';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { openDB } from 'idb';
import 'clsx';

function FileDropzone({
  onFilesSelected,
  multiple = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }
  function handleFileChange(e) {
    if (e.currentTarget.files) {
      onFilesSelected(Array.from(e.currentTarget.files));
    }
  }
  return jsxs("div", {
    class: `border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition ${isDragging ? "border-sky bg-sky-light/30 dark:bg-sky/10" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"}`,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    children: [jsx("p", {
      class: `text-xl font-medium mb-2 ${isDragging ? "text-sky" : "text-black dark:text-white"}`,
      children: isDragging ? "Drop files here" : "Drag & drop your files"
    }), jsx("p", {
      class: "text-gray-500 dark:text-gray-400 mb-4",
      children: "or"
    }), jsx("button", {
      class: "bg-sky text-black font-semibold px-6 py-3 rounded-xl hover:bg-sky-bright active:scale-95 transition",
      onClick: () => inputRef.current?.click(),
      children: "Browse Files"
    }), jsx("input", {
      ref: inputRef,
      type: "file",
      class: "hidden",
      multiple,
      onChange: handleFileChange
    })]
  });
}

function ProgressBar({
  percent,
  className = ""
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  return jsx("div", {
    class: `w-full ${className}`,
    role: "progressbar",
    "aria-valuenow": safePercent,
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "aria-label": "Processing progress",
    children: jsx("div", {
      class: "h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
      children: jsx("div", {
        class: "h-full rounded-full bg-sky-500 transition-[width] duration-300 ease-out dark:bg-sky-400",
        style: {
          width: `${safePercent}%`
        }
      })
    })
  });
}

function PrivacyToggle({
  checked,
  onChange
}) {
  return jsxs("label", {
    class: "flex items-center gap-2 cursor-pointer",
    children: [jsx("input", {
      type: "checkbox",
      class: "w-4 h-4 text-sky rounded border-gray-300 dark:border-gray-600 focus:ring-sky",
      checked,
      onChange: (e) => onChange(e.currentTarget.checked)
    }), jsx("span", {
      class: "text-sm font-medium text-black dark:text-white",
      children: "Clean File Privacy Before Download"
    })]
  });
}

let ffmpeg = null;
let loadingPromise = null;
let operationQueue = Promise.resolve();
function getMimeType(format) {
  const ext = format.toLowerCase().replace(/^\./, "");
  const mimeTypes = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",
    ogg: "audio/ogg",
    opus: "audio/ogg; codecs=opus",
    flac: "audio/flac",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    gif: "image/gif",
    bin: "application/octet-stream"
  };
  return mimeTypes[ext] || "application/octet-stream";
}
function normalizeFormat(format) {
  return format.toLowerCase().replace(/^\./, "").trim();
}
function getExtension(filename, fallback = "bin") {
  const cleanName = filename.split(/[?#]/)[0];
  const parts = cleanName.split(".");
  if (parts.length < 2) return fallback;
  const extension = parts.pop()?.toLowerCase().trim();
  return extension || fallback;
}
function makeName(prefix, extension) {
  let random;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    random = crypto.randomUUID();
  } else {
    random = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return `${prefix}-${random}.${extension}`;
}
async function deleteFile(ff, filename) {
  try {
    await ff.deleteFile(filename);
  } catch {
  }
}
async function getFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (typeof window === "undefined") throw new Error("FFmpeg can only run in the browser.");
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const instance = new FFmpeg();
    try {
      const CORE_VERSION = "0.12.6";
      const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
      const coreURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript");
      const wasmURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm");
      await instance.load({
        coreURL,
        wasmURL
      });
      ffmpeg = instance;
      return instance;
    } catch (error) {
      ffmpeg = null;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`FFmpeg load failed: ${message}`);
    } finally {
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}
async function execute(args, onProgress) {
  let result = null;
  let failure = null;
  const job = operationQueue.then(async () => {
    const ff = await getFFmpeg();
    const progressHandler = ({
      progress
    }) => {
      const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
      onProgress?.(percent);
    };
    if (onProgress) ff.on("progress", progressHandler);
    try {
      await ff.exec(args);
      onProgress?.(100);
      result = ff;
    } catch (error) {
      failure = error;
    } finally {
      if (onProgress) ff.off("progress", progressHandler);
    }
  });
  operationQueue = job.then(() => void 0, () => void 0);
  await job;
  if (failure) throw failure;
  if (!result) throw new Error("FFmpeg execution failed.");
  return result;
}
async function readBlob(ff, filename, format) {
  const data = await ff.readFile(filename);
  return new Blob([data], {
    type: getMimeType(format)
  });
}
async function convertFile(inputFile, outputFormat, onProgress, bitrate) {
  if (!inputFile || inputFile.size === 0) throw new Error("Please select a valid media file.");
  const format = normalizeFormat(outputFormat);
  if (!format) throw new Error("Output format is required.");
  const ff = await getFFmpeg();
  const inName = makeName("input", getExtension(inputFile.name));
  const outName = makeName("output", format);
  try {
    await ff.writeFile(inName, await fetchFile(inputFile));
    const args = ["-i", inName];
    if (bitrate && (format === "mp3" || format === "aac")) ;
    args.push("-y", outName);
    await execute(args, onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function cutAudio(file, startSec, durationSec, outputFormat = "mp3", onProgress) {
  if (!Number.isFinite(startSec) || startSec < 0) throw new Error("Start time cannot be negative.");
  if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error("Duration must be greater than zero.");
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("cut-input", getExtension(file.name));
  const outName = makeName("cut-output", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-ss", String(startSec), "-i", inName, "-t", String(durationSec), "-c", "copy", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function mergeAudio(files, outputFormat = "mp3", onProgress) {
  if (!files.length) throw new Error("No audio files were provided.");
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inputs = [];
  const ts = Date.now();
  try {
    for (let i = 0; i < files.length; i++) {
      const name = makeName(`merge-${ts}-${i}`, getExtension(files[i].name));
      await ff.writeFile(name, await fetchFile(files[i]));
      inputs.push(name);
    }
    const outName = makeName("merged", format);
    const filterInputs = inputs.map((_, idx) => `[${idx}:a]`).join("");
    const concatFilter = `${filterInputs}concat=n=${inputs.length}:v=0:a=1[out]`;
    await execute([...inputs.flatMap((n) => ["-i", n]), "-filter_complex", concatFilter, "-map", "[out]", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    for (const inp of inputs) await deleteFile(ff, inp);
  }
}
async function compressAudio(file, quality = 3, outputFormat = "mp3", onProgress) {
  const format = normalizeFormat(outputFormat);
  const safeQuality = Math.max(0, Math.min(9, Math.round(quality)));
  const ff = await getFFmpeg();
  const inName = makeName("compress-input", getExtension(file.name));
  const outName = makeName("compressed", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-c:a", "libmp3lame", "-q:a", String(safeQuality), "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function boostVolume(file, gainDb = 6, outputFormat = "mp3", onProgress) {
  if (!Number.isFinite(gainDb)) throw new Error("Volume gain must be a valid number.");
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("volume-input", getExtension(file.name));
  const outName = makeName("boosted", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-af", `volume=${gainDb}dB`, "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function changeSpeed(file, factor = 1.5, outputFormat = "mp3", onProgress) {
  if (!Number.isFinite(factor) || factor <= 0) throw new Error("Speed factor must be greater than zero.");
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("speed-input", getExtension(file.name));
  const outName = makeName("speed-output", format);
  try {
    let remaining = factor;
    const filters = [];
    while (remaining > 2) {
      filters.push("atempo=2");
      remaining /= 2;
    }
    while (remaining < 0.5) {
      filters.push("atempo=0.5");
      remaining /= 0.5;
    }
    filters.push(`atempo=${remaining}`);
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-filter:a", filters.join(","), "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function reverseAudio(file, outputFormat = "mp3", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("reverse-input", getExtension(file.name));
  const outName = makeName("reversed", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-af", "areverse", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function stereoToMono(file, outputFormat = "mp3", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("mono-input", getExtension(file.name));
  const outName = makeName("mono-output", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-ac", "1", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function stripMetadata(file, outputFormat) {
  const inputExtension = getExtension(file.name);
  const format = normalizeFormat(inputExtension);
  const ff = await getFFmpeg();
  const inName = makeName("metadata-input", inputExtension);
  const outName = makeName("clean", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-map_metadata", "-1", "-c", "copy", "-y", outName]);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function compressVideo(file, crf = 23, preset = "medium", outputFormat = "mp4", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("vcompress-in", getExtension(file.name));
  const outName = makeName("vcompress-out", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-c:v", "libx264", "-crf", String(crf), "-preset", preset, "-c:a", "aac", "-b:a", "128k", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function cutVideo(file, startSec, durationSec, outputFormat = "mp4", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("vcut-in", getExtension(file.name));
  const outName = makeName("vcut-out", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-ss", String(startSec), "-i", inName, "-t", String(durationSec), "-c", "copy", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function mergeVideos(files, outputFormat = "mp4", onProgress) {
  const format = normalizeFormat(outputFormat);
  if (files.length < 2) throw new Error("Need at least 2 videos to merge.");
  const ff = await getFFmpeg();
  const ts = Date.now();
  const inputNames = [];
  try {
    for (let i = 0; i < files.length; i++) {
      const name = makeName(`vmerge-${ts}-${i}`, getExtension(files[i].name));
      await ff.writeFile(name, await fetchFile(files[i]));
      inputNames.push(name);
    }
    const outName = makeName("merged", format);
    const filterParts = [];
    for (let i = 0; i < inputNames.length; i++) {
      filterParts.push(`[${i}:v:0]`);
    }
    const filterComplex = `${filterParts.join("")}concat=n=${inputNames.length}:v=1:a=0 [outv]`;
    await execute([
      ...inputNames.flatMap((n) => ["-i", n]),
      "-filter_complex",
      filterComplex,
      "-map",
      "[outv]",
      // use the concatenated video
      "-f",
      "lavfi",
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-map",
      "1:a",
      // silent audio input
      "-shortest",
      "-y",
      outName
    ], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    for (const inp of inputNames) await deleteFile(ff, inp);
  }
}
async function videoToGif(file, fps = 10, width = 320, onProgress) {
  const ff = await getFFmpeg();
  const inName = makeName("vgif-in", getExtension(file.name));
  const paletteName = makeName("palette", "png");
  const outName = makeName("vgif-out", "gif");
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`, "-y", paletteName]);
    await execute(["-i", inName, "-i", paletteName, "-lavfi", `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`, "-y", outName], onProgress);
    return await readBlob(ff, outName, "gif");
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, paletteName);
    await deleteFile(ff, outName);
  }
}
async function gifToMp4(file, onProgress) {
  const ff = await getFFmpeg();
  const inName = makeName("gif-in", "gif");
  const outName = makeName("gif-out", "mp4");
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-movflags", "faststart", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-y", outName], onProgress);
    return await readBlob(ff, outName, "mp4");
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function resizeVideo(file, width, height, outputFormat = "mp4", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("resize-in", getExtension(file.name));
  const outName = makeName("resized", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-vf", `scale=${width}:${height}`, "-c:a", "copy", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function cropVideo(file, x, y, w, h, outputFormat = "mp4", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("crop-in", getExtension(file.name));
  const outName = makeName("cropped", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-vf", `crop=${w}:${h}:${x}:${y}`, "-c:a", "copy", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function changeFPS(file, fps, outputFormat = "mp4", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("fps-in", getExtension(file.name));
  const outName = makeName("fps-out", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-filter:v", `fps=${fps}`, "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function muteVideo(file, outputFormat = "mp4", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("mute-in", getExtension(file.name));
  const outName = makeName("muted", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute(["-i", inName, "-an", "-c:v", "copy", "-y", outName], onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}
async function extractAudio(file, outputFormat = "mp3", onProgress) {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName("extract-in", getExtension(file.name));
  const outName = makeName("extracted", format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ["-i", inName, "-vn"];
    if (format === "mp3") {
      args.push("-c:a", "libmp3lame");
    } else if (format === "aac" || format === "m4a") {
      args.push("-c:a", "aac");
    } else if (format === "ogg") {
      args.push("-c:a", "libvorbis");
    } else if (format === "flac") {
      args.push("-c:a", "flac");
    } else {
      args.push("-c:a", "copy");
    }
    args.push("-y", outName);
    await execute(args, onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

const DB_NAME = "dayront-workspace";
const STORE_NAME = "files";
let db;
async function getDB() {
  if (!db) {
    db = await openDB(DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, {
            keyPath: "id"
          });
          store.createIndex("by-expiry", "expiry");
        }
      }
    });
  }
  return db;
}
async function saveFile(id, blob, ttlMs = 24 * 60 * 60 * 1e3) {
  const database = await getDB();
  await database.put(STORE_NAME, {
    id,
    blob,
    expiry: Date.now() + ttlMs
  });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

function isTimeSetting(name) {
  const lower = name.toLowerCase();
  return lower.includes("start") || lower.includes("duration") || lower.includes("cut");
}
function rangeHint(setting) {
  const name = setting.name.toLowerCase();
  if (name === "crf") return "Lower = better quality, larger file";
  if (name === "quality") return "0 = best, 9 = smallest";
  return null;
}
function Converter({
  toolConfig
}) {
  const [files, setFiles] = useState$1([]);
  const [processing, setProcessing] = useState$1(false);
  const [progress, setProgress] = useState$1(0);
  const [resultBlob, setResultBlob] = useState$1(null);
  const [outputFilename, setOutputFilename] = useState$1("");
  const [privacy, setPrivacy] = useState$1(false);
  const [error, setError] = useState$1(null);
  const [settingsState, setSettingsState] = useState$1(() => {
    const initial = {};
    toolConfig.settings?.forEach((setting) => {
      initial[setting.name] = setting.default;
    });
    return initial;
  });
  const [timeUnits, setTimeUnits] = useState$1({});
  const [previewUrl, setPreviewUrl] = useState$1(null);
  useRef$1(null);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  function clampProgress(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  function updateProgress(value) {
    setProgress(clampProgress(value));
  }
  function getSetting(name) {
    return settingsState[name];
  }
  function updateSetting(name, value) {
    setSettingsState((previous) => ({
      ...previous,
      [name]: value
    }));
  }
  function toDisplayValue(name, internalValue) {
    const unit = timeUnits[name] || "seconds";
    return unit === "minutes" ? internalValue / 60 : internalValue;
  }
  function fromDisplayValue(name, displayValue) {
    const unit = timeUnits[name] || "seconds";
    return unit === "minutes" ? displayValue * 60 : displayValue;
  }
  function handleFiles(selected) {
    if (processing) return;
    setFiles(selected);
    setResultBlob(null);
    setOutputFilename("");
    setError(null);
    setProgress(0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }
  async function startConversion() {
    if (files.length === 0 || processing) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setOutputFilename("");
    try {
      let output;
      const type = toolConfig.type;
      switch (type) {
        case "cut": {
          const start = Math.max(0, Number(getSetting("start") ?? 0));
          const duration = Math.max(0.01, Number(getSetting("duration") ?? 30));
          output = await cutAudio(files[0], start, duration, toolConfig.outputFormat || "mp3", updateProgress);
          break;
        }
        case "merge": {
          if (files.length < 2) throw new Error("Please select at least 2 audio files.");
          output = await mergeAudio(files, toolConfig.outputFormat || "mp3", updateProgress);
          break;
        }
        case "compress": {
          output = await compressAudio(files[0], Number(getSetting("quality") ?? 3), toolConfig.outputFormat || "mp3", updateProgress);
          break;
        }
        case "boost": {
          output = await boostVolume(files[0], Number(getSetting("gain") ?? 6), toolConfig.outputFormat || "mp3", updateProgress);
          break;
        }
        case "speed": {
          output = await changeSpeed(files[0], Number(getSetting("factor") ?? 1.5), toolConfig.outputFormat || "mp3", updateProgress);
          break;
        }
        case "reverse": {
          output = await reverseAudio(files[0], toolConfig.outputFormat || "mp3", updateProgress);
          break;
        }
        case "stereo-to-mono": {
          output = await stereoToMono(files[0], toolConfig.outputFormat || "mp3", updateProgress);
          break;
        }
        case "convert": {
          output = await convertFile(files[0], toolConfig.to || "mp3", updateProgress);
          break;
        }
        case "video-compress": {
          output = await compressVideo(files[0], Number(getSetting("crf") ?? 23), String(getSetting("preset") ?? "medium"), toolConfig.outputFormat || "mp4", updateProgress);
          break;
        }
        case "video-cut": {
          const start = Math.max(0, Number(getSetting("start") ?? 0));
          const duration = Math.max(0.01, Number(getSetting("duration") ?? 30));
          output = await cutVideo(files[0], start, duration, toolConfig.outputFormat || "mp4", updateProgress);
          break;
        }
        case "video-merge": {
          if (files.length < 2) throw new Error("Please select at least 2 video files.");
          output = await mergeVideos(files, toolConfig.outputFormat || "mp4", updateProgress);
          break;
        }
        case "video-to-gif": {
          output = await videoToGif(files[0], Number(getSetting("fps") ?? 10), Number(getSetting("width") ?? 320), updateProgress);
          break;
        }
        case "gif-to-video": {
          output = await gifToMp4(files[0], updateProgress);
          break;
        }
        case "resize-video": {
          output = await resizeVideo(files[0], Number(getSetting("width") ?? 1280), Number(getSetting("height") ?? 720), toolConfig.outputFormat || "mp4", updateProgress);
          break;
        }
        case "crop-video": {
          output = await cropVideo(files[0], Number(getSetting("x") ?? 0), Number(getSetting("y") ?? 0), Number(getSetting("w") ?? 640), Number(getSetting("h") ?? 480), toolConfig.outputFormat || "mp4", updateProgress);
          break;
        }
        case "change-fps": {
          output = await changeFPS(files[0], Number(getSetting("fps") ?? 30), toolConfig.outputFormat || "mp4", updateProgress);
          break;
        }
        case "mute-video": {
          output = await muteVideo(files[0], toolConfig.outputFormat || "mp4", updateProgress);
          break;
        }
        case "extract-audio": {
          output = await extractAudio(files[0], String(getSetting("format") ?? "mp3"), updateProgress);
          break;
        }
        case "convert-video": {
          output = await convertFile(files[0], toolConfig.to || "mp4", updateProgress);
          break;
        }
        default:
          throw new Error("Unsupported tool.");
      }
      if (privacy) {
        updateProgress(Math.min(progress, 95));
        output = await stripMetadata(new File([output], "output", {
          type: output.type
        }));
      }
      const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await saveFile(id, output);
      const format = toolConfig.outputFormat || toolConfig.to || "mp3";
      const originalName = files[0]?.name || "file";
      const base = originalName.replace(/\.[^/.]+$/, "");
      const filename = `${base}.${format}`;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(output);
      setPreviewUrl(url);
      setResultBlob(output);
      setOutputFilename(filename);
      setProgress(100);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || "An error occurred while processing your file.");
    } finally {
      setProcessing(false);
    }
  }
  function download() {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = outputFilename || "output.mp3";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  function resetAll() {
    setFiles([]);
    setResultBlob(null);
    setOutputFilename("");
    setError(null);
    setProgress(0);
    setProcessing(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }
  const settings = toolConfig.settings || [];
  const multipleAllowed = toolConfig.type === "merge" || toolConfig.type === "video-merge";
  const inputClass = ["w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900", "outline-none transition placeholder:text-gray-400", "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20", "dark:border-gray-600 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500", "dark:focus:border-sky-400 dark:focus:ring-sky-400/20"].join(" ");
  const selectClass = ["w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900", "outline-none transition", "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20", "dark:border-gray-600 dark:bg-gray-950 dark:text-white", "dark:focus:border-sky-400 dark:focus:ring-sky-400/20"].join(" ");
  const outputFormat = toolConfig.outputFormat || toolConfig.to || "mp3";
  const isVideoPreview = ["mp4", "webm", "mov", "avi", "mkv", "gif"].includes(outputFormat) || outputFormat === "gif";
  const isGif = outputFormat === "gif";
  return jsxs("div", {
    class: "w-full space-y-6 text-gray-900 dark:text-gray-100",
    children: [!resultBlob && jsxs(Fragment, {
      children: [jsx(FileDropzone, {
        onFilesSelected: handleFiles,
        multiple: multipleAllowed
      }), files.length > 0 && jsxs("div", {
        class: "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
        children: [jsxs("div", {
          class: "flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/60",
          children: [jsx("p", {
            class: "text-sm font-bold text-gray-900 dark:text-white",
            children: "Selected files"
          }), jsxs("span", {
            class: "shrink-0 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200",
            children: [files.length, " ", files.length === 1 ? "file" : "files"]
          })]
        }), jsx("ul", {
          class: "divide-y divide-gray-200 dark:divide-gray-700",
          children: files.map((file) => jsxs("li", {
            class: "flex items-center justify-between gap-4 px-5 py-3",
            children: [jsx("span", {
              class: "min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-200",
              children: file.name
            }), jsx("span", {
              class: "shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400",
              children: formatBytes(file.size)
            })]
          }, `${file.name}-${file.size}-${file.lastModified}`))
        })]
      }), settings.length > 0 && jsxs("section", {
        class: "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
        children: [jsx("div", {
          class: "border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/60",
          children: jsxs("div", {
            class: "flex items-center gap-3",
            children: [jsx("div", {
              class: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg dark:bg-sky-900/40",
              children: "⚙️"
            }), jsxs("div", {
              class: "min-w-0",
              children: [jsx("h2", {
                class: "text-sm font-bold text-gray-900 dark:text-white",
                children: "Settings & Adjustments"
              }), jsx("p", {
                class: "mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300",
                children: "Customize your output before processing."
              })]
            })]
          })
        }), jsx("div", {
          class: "space-y-6 p-5",
          children: settings.map((setting) => {
            const value = settingsState[setting.name] ?? setting.default;
            return jsxs("div", {
              class: "space-y-2.5",
              children: [jsx("label", {
                for: `setting-${setting.name}`,
                class: "block text-sm font-semibold text-gray-900 dark:text-white",
                children: setting.label
              }), setting.type === "select" && jsx("select", {
                id: `setting-${setting.name}`,
                value: String(value),
                disabled: processing,
                class: selectClass,
                onChange: (event) => updateSetting(setting.name, event.currentTarget.value),
                children: setting.options?.map((option) => jsx("option", {
                  value: option,
                  children: option
                }, option))
              }), setting.type === "range" && jsxs("div", {
                class: "rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950",
                children: [jsxs("div", {
                  class: "flex items-center gap-3",
                  children: [jsx("input", {
                    id: `setting-${setting.name}`,
                    type: "range",
                    min: setting.min,
                    max: setting.max,
                    value: Number(value),
                    disabled: processing,
                    onInput: (event) => updateSetting(setting.name, Number(event.target.value)),
                    class: "h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 accent-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700"
                  }), jsx("output", {
                    "aria-live": "polite",
                    class: "flex h-9 min-w-[52px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold tabular-nums text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                    children: value
                  })]
                }), rangeHint(setting) && jsx("p", {
                  class: "mt-2 text-xs text-gray-500 dark:text-gray-400",
                  children: rangeHint(setting)
                }), (setting.min !== void 0 || setting.max !== void 0) && jsxs("div", {
                  class: "mt-2 flex justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400",
                  children: [jsx("span", {
                    children: setting.min ?? ""
                  }), jsx("span", {
                    children: setting.max ?? ""
                  })]
                })]
              }), setting.type === "number" && (isTimeSetting(setting.name) ? jsxs("div", {
                class: "flex gap-2",
                children: [jsx("input", {
                  type: "number",
                  id: `setting-${setting.name}`,
                  min: setting.min != null ? timeUnits[setting.name] === "minutes" ? Math.ceil((setting.min || 0) / 60) : setting.min : void 0,
                  max: setting.max != null ? timeUnits[setting.name] === "minutes" ? Math.floor((setting.max || 9999) / 60) : setting.max : void 0,
                  value: toDisplayValue(setting.name, Number(value)),
                  disabled: processing,
                  onInput: (e) => {
                    const displayVal = Number(e.target.value);
                    if (!isNaN(displayVal)) {
                      updateSetting(setting.name, fromDisplayValue(setting.name, displayVal));
                    }
                  },
                  class: inputClass,
                  step: timeUnits[setting.name] === "minutes" ? 0.1 : 1
                }), jsxs("select", {
                  value: timeUnits[setting.name] || "seconds",
                  onChange: (e) => setTimeUnits((prev) => ({
                    ...prev,
                    [setting.name]: e.currentTarget.value
                  })),
                  class: "rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-white",
                  children: [jsx("option", {
                    value: "seconds",
                    children: "Seconds"
                  }), jsx("option", {
                    value: "minutes",
                    children: "Minutes"
                  })]
                })]
              }) : jsx("input", {
                type: "number",
                id: `setting-${setting.name}`,
                min: setting.min,
                max: setting.max,
                value: Number(value),
                disabled: processing,
                onInput: (event) => updateSetting(setting.name, Number(event.target.value)),
                class: inputClass
              }))]
            }, setting.name);
          })
        })]
      }), jsx("div", {
        class: "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800",
        children: jsx(PrivacyToggle, {
          checked: privacy,
          onChange: setPrivacy
        })
      }), jsx("button", {
        type: "button",
        disabled: files.length === 0 || processing,
        onClick: startConversion,
        "aria-busy": processing,
        class: "inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-sky-500 px-6 py-3.5 font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400",
        children: processing ? jsxs(Fragment, {
          children: [jsxs("svg", {
            class: "h-5 w-5 animate-spin",
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
            children: [jsx("circle", {
              class: "opacity-25",
              cx: "12",
              cy: "12",
              r: "10",
              stroke: "currentColor",
              "stroke-width": "4"
            }), jsx("path", {
              class: "opacity-75",
              fill: "currentColor",
              d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            })]
          }), "Processing…"]
        }) : `Start ${toolConfig.label || "Conversion"}`
      }), processing && jsx("div", {
        class: "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
        role: "status",
        "aria-live": "polite",
        "aria-label": `Processing ${progress}% complete`,
        children: jsxs("div", {
          class: "px-5 py-4",
          children: [jsxs("div", {
            class: "mb-3 flex items-center justify-between gap-4",
            children: [jsxs("div", {
              class: "flex min-w-0 items-center gap-2.5",
              children: [jsx("span", {
                class: "h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-sky-500",
                "aria-hidden": "true"
              }), jsx("span", {
                class: "truncate text-sm font-semibold text-gray-900 dark:text-white",
                children: "Processing"
              })]
            }), jsxs("span", {
              class: "shrink-0 text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400",
              children: [clampProgress(progress), "%"]
            })]
          }), jsx(ProgressBar, {
            percent: clampProgress(progress)
          })]
        })
      })]
    }), error && jsx("div", {
      class: "overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm dark:border-red-900/70 dark:bg-red-950/40",
      children: jsx("div", {
        class: "p-5",
        children: jsxs("div", {
          class: "flex gap-3",
          children: [jsx("div", {
            class: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600 dark:bg-red-900/50 dark:text-red-300",
            children: "!"
          }), jsxs("div", {
            class: "min-w-0",
            children: [jsx("p", {
              class: "font-semibold text-red-900 dark:text-red-100",
              children: "Something went wrong"
            }), jsx("p", {
              class: "mt-1 break-words text-sm leading-6 text-red-700 dark:text-red-300",
              children: error
            }), jsx("button", {
              type: "button",
              class: "mt-3 font-semibold text-red-700 underline decoration-red-300 underline-offset-4 hover:no-underline dark:text-red-300 dark:decoration-red-700",
              onClick: resetAll,
              children: "Try again"
            })]
          })]
        })
      })
    }), resultBlob && jsxs("div", {
      class: "overflow-hidden rounded-2xl border border-green-200 bg-green-50 shadow-sm dark:border-green-900/70 dark:bg-green-950/30",
      children: [jsxs("div", {
        class: "p-6",
        children: [jsxs("div", {
          class: "flex items-start gap-4",
          children: [jsx("div", {
            class: "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300",
            children: "✓"
          }), jsxs("div", {
            class: "min-w-0",
            children: [jsx("h2", {
              class: "text-lg font-bold text-green-900 dark:text-green-100",
              children: "Your file is ready"
            }), jsx("p", {
              class: "mt-1 break-all text-sm font-medium text-green-700 dark:text-green-300",
              children: outputFilename
            }), jsx("p", {
              class: "mt-1 text-xs font-medium text-green-600 dark:text-green-400",
              children: formatBytes(resultBlob.size)
            })]
          })]
        }), previewUrl && jsx("div", {
          class: "mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700",
          children: isGif ? jsx("img", {
            src: previewUrl,
            alt: "Preview",
            class: "w-full h-auto"
          }) : isVideoPreview ? jsx("video", {
            controls: true,
            class: "w-full max-h-96",
            src: previewUrl,
            children: "Your browser does not support the video tag."
          }) : jsx("audio", {
            controls: true,
            class: "w-full",
            src: previewUrl,
            children: "Your browser does not support the audio element."
          })
        })]
      }), jsx("div", {
        class: "border-t border-green-200 bg-white p-5 dark:border-green-900/70 dark:bg-gray-900/60",
        children: jsxs("div", {
          class: "flex flex-col gap-3 sm:flex-row",
          children: [jsx("button", {
            type: "button",
            onClick: download,
            class: "w-full rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.98] dark:bg-sky-500 dark:hover:bg-sky-400",
            children: "Download File"
          }), jsx("button", {
            type: "button",
            onClick: resetAll,
            class: "w-full rounded-xl border border-gray-300 bg-gray-100 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-200 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
            children: "Convert Another File"
          })]
        })
      })]
    })]
  });
}

const $$PrivacyBadge = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="privacy-badge mb-8"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
Your files never leave your device
</div>`;
}, "/home/dayront/src/components/ui/PrivacyBadge.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://dayront.com");
const $$ToolLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ToolLayout;
  const {
    toolKey,
    toolConfig: toolConfigProp,
    metaTitle: metaTitleProp,
    metaDescription: metaDescriptionProp,
    toolName: toolNameProp,
    toolIcon: toolIconProp,
    howTo: howToProp,
    faq: faqProp,
    relatedTools: relatedToolsProp = [],
    preConverter,
    postConverter,
    extraContent
  } = Astro2.props;
  const lang = new URL(Astro2.url).searchParams.get("lang") || "en";
  let toolsTranslations = {};
  let commonTranslations = {};
  try {
    const [toolsRes, commonRes] = await Promise.all([
      fetch(new URL(`/locales/${lang}/tools.json`, Astro2.url.origin)),
      fetch(new URL(`/locales/${lang}/common.json`, Astro2.url.origin))
    ]);
    if (toolsRes.ok) {
      toolsTranslations = await toolsRes.json();
    }
    if (commonRes.ok) {
      commonTranslations = await commonRes.json();
    }
  } catch {
  }
  let metaTitle = metaTitleProp || "";
  let metaDescription = metaDescriptionProp || "";
  let toolName = toolNameProp || "";
  let toolIcon = toolIconProp || "";
  let howTo = howToProp || [];
  let faq = faqProp || [];
  let relatedTools = relatedToolsProp || [];
  let toolConfig = toolConfigProp;
  if (toolKey) {
    const toolData = tools.find((t) => t.slug === toolKey);
    if (toolData) {
      metaTitle = metaTitle || toolData.metaTitle;
      metaDescription = metaDescription || toolData.metaDescription;
      toolName = toolName || toolData.name;
      toolIcon = toolIcon || toolData.icon;
      howTo = howTo.length > 0 ? howTo : toolData.howTo;
      faq = faq.length > 0 ? faq : toolData.faq;
      const tTool = toolsTranslations[toolKey] || {};
      if (tTool.title) toolName = tTool.title;
      if (tTool.metaTitle) metaTitle = tTool.metaTitle;
      if (tTool.metaDescription) metaDescription = tTool.metaDescription;
      if (tTool.icon) toolIcon = tTool.icon;
      if (tTool.howTo) howTo = tTool.howTo;
      if (tTool.faq) faq = tTool.faq;
      if (!toolConfig) {
        toolConfig = {
          type: toolData.type || "convert",
          from: toolData.from,
          to: toolData.to,
          outputFormat: toolData.outputFormat,
          label: toolName,
          // translated name
          settings: toolData.settings || []
        };
      }
      if (relatedTools.length === 0 && toolData.relatedTools) {
        relatedTools = toolData.relatedTools.map((slug) => {
          const t = tools.find((tt) => tt.slug === slug);
          if (!t) return null;
          const relatedTrans = toolsTranslations[slug] || {};
          const name = relatedTrans.title || t.name;
          const icon = relatedTrans.icon || t.icon;
          return {
            href: t.from && t.to ? `/convert/${t.slug}` : `/tools/${t.slug}`,
            icon,
            name
          };
        }).filter(Boolean);
      }
    }
  }
  if (!toolConfig) {
    toolConfig = { type: "convert", label: toolName || "Conversion", settings: [] };
  }
  const howToHeading = commonTranslations.how_to_use || "How to use";
  const faqHeading = commonTranslations.faq_heading || "Frequently Asked Questions";
  const relatedToolsHeading = commonTranslations.related_tools || "Related Tools";
  const relatedArticlesHeading = commonTranslations.related_articles || "Related Articles";
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: toolName,
    description: metaDescription,
    step: howTo.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.text
    }))
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer
      }
    }))
  };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": metaTitle, "description": metaDescription }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([' <script type="application/ld+json">', '<\/script> <script type="application/ld+json">', "<\/script> ", '<section class="max-w-7xl mx-auto px-4 py-8 sm:py-12"> <!-- Breadcrumbs --> <nav class="text-sm text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb"> <ol class="flex items-center flex-wrap gap-x-2 gap-y-1"> <li><a href="/" class="hover:text-sky transition dark:hover:text-sky">Home</a></li> <li aria-hidden="true">/</li> <li><a href="/tools" class="hover:text-sky transition dark:hover:text-sky">Tools</a></li> <li aria-hidden="true">/</li> <li class="text-gray-900 dark:text-white font-medium">', '</li> </ol> </nav> <div class="lg:grid lg:grid-cols-3 lg:gap-10"> <div class="lg:col-span-2"> <!-- Header --> <div class="flex items-center gap-3 mb-6"> <span class="text-3xl">', '</span> <h1 class="text-3xl sm:text-4xl font-extrabold text-black dark:text-white">', "</h1> </div> ", " ", " ", " ", " ", " ", " ", " ", " ", "  ", ' </div> <!-- Sidebar (desktop) --> <aside class="hidden lg:block space-y-8"> <div class="sticky top-24"> <h3 class="text-lg font-semibold text-black dark:text-white mb-4">', '</h3> <ul class="space-y-2"> ', " </ul> </div> </aside> </div> </section> "])), unescapeHTML(JSON.stringify(howToSchema)), unescapeHTML(JSON.stringify(faqSchema)), maybeRenderHead(), toolName, toolIcon, toolName, renderComponent($$result2, "PrivacyBadge", $$PrivacyBadge, {}), preConverter && renderTemplate`<div class="mb-6">${preConverter}</div>`, renderComponent($$result2, "Converter", Converter, { "client:load": true, "toolConfig": toolConfig, "client:component-hydration": "load", "client:component-path": "/home/dayront/src/components/conversion/Converter", "client:component-export": "default" }), postConverter && renderTemplate`<div class="mt-6">${postConverter}</div>`, renderComponent($$result2, "AdSlot", $$AdSlot, { "position": "below-tool", "class": "my-10" }), howTo.length > 0 && renderTemplate`<section class="mt-16"> <h2 class="text-2xl font-bold text-black dark:text-white mb-6"> ${howToHeading} ${toolName} </h2> <ol class="space-y-6"> ${howTo.map((step, i) => renderTemplate`<li class="flex gap-4"> <span class="flex-shrink-0 w-8 h-8 rounded-full bg-sky text-black font-bold flex items-center justify-center text-sm"> ${i + 1} </span> <div> <h3 class="font-semibold text-lg text-black dark:text-white">${step.title}</h3> <p class="text-gray-600 dark:text-white">${step.text}</p> </div> </li>`)} </ol> </section>`, faq.length > 0 && renderTemplate`<section class="mt-16"> <h2 class="text-2xl font-bold text-black dark:text-white mb-6">${faqHeading}</h2> <dl class="space-y-6"> ${faq.map((q) => renderTemplate`<div> <dt class="font-semibold text-lg text-black dark:text-white mb-2">${q.question}</dt> <dd class="text-gray-600 dark:text-white">${q.answer}</dd> </div>`)} </dl> </section>`, extraContent?.tutorial && renderTemplate`<section class="mt-16 prose dark:prose-invert max-w-none">${unescapeHTML(extraContent.tutorial)}</section>`, extraContent?.relatedBlogs && extraContent.relatedBlogs.length > 0 && renderTemplate`<section class="mt-16"> <h2 class="text-2xl font-bold text-black dark:text-white mb-6">${relatedArticlesHeading}</h2> <div class="grid sm:grid-cols-2 gap-4"> ${extraContent.relatedBlogs.map((post) => renderTemplate`<a${addAttribute(`/blog/${post.slug}`, "href")} class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:border-sky transition"> <h3 class="font-semibold text-black dark:text-white text-sm">${post.title}</h3> </a>`)} </div> </section>`, relatedTools.length > 0 && renderTemplate`<section class="mt-16"> <h2 class="text-2xl font-bold text-black dark:text-white mb-6">${relatedToolsHeading}</h2> <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"> ${relatedTools.map((tool) => renderTemplate`<a${addAttribute(tool.href, "href")} class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:border-sky transition flex flex-col items-start gap-2"> <span class="text-2xl">${tool.icon}</span> <span class="text-sm font-medium text-black dark:text-white">${tool.name}</span> </a>`)} </div> </section>`, relatedToolsHeading, relatedTools.map((tool) => renderTemplate`<li> <a${addAttribute(tool.href, "href")} class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"> <span>${tool.icon}</span> <span class="text-sm font-medium text-black dark:text-white">${tool.name}</span> </a> </li>`)) })}`;
}, "/home/dayront/src/layouts/ToolLayout.astro", void 0);

export { $$ToolLayout as $ };
