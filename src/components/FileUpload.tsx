/*
 * A reusable file upload component that handles selecting, previewing and
 * removing files. It accepts an array of files (both newly added and
 * existing files from the backend) and a setter function to update that
 * array. Each file item can either be a `File` object (for new uploads)
 * or an object with metadata from the database such as `_id`, `fileName`,
 * `filePath` and `fileType`. New files should carry a `file` property
 * referencing the underlying `File` instance. Existing files from the
 * server will not have a `file` property, so they will not be uploaded
 * again. This component detects whether a file is an image via its
 * `fileType` or the `type` of the underlying `File` and displays a
 * thumbnail accordingly. It also exposes a remove button for each item.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

// Define a unified file data type that can represent both new files from
// the client and existing files from the database. New files should
// provide a `file` property and optionally a `fileType` for images.
export interface FileData {
  _id?: string;
  fileName: string;
  filePath?: string;
  fileType?: string;
  file?: File;
}

// Base URL for serving existing files. Reads from Vite environment
// variable `VITE_API_URL` and falls back to localhost. This allows
// configuring the backend address without changing the code.
const BASE_URL: string =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface FileUploadProps {
  /**
   * Array of files to display. Each item can be either a new file (with a
   * `file` property) or an existing file (with a `filePath`).
   */
  files: FileData[];
  /**
   * Setter to update the files array. This will be called when new files
   * are selected or when existing files are removed.
   */
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  /**
   * Toggle to show or hide the remove buttons. Defaults to true.
   */
  showRemove?: boolean;
  /**
   * Extra CSS classes for the root wrapper.
   */
  className?: string;
}

/**
 * FileUpload is a reusable component for handling file uploads. It
 * encapsulates file input, preview rendering and removal logic so that
 * pages like AddAccomplishment and ModifyForm don't have to re‑implement
 * the same behaviours. It is intentionally simple: it always allows
 * multiple file selection and renders a grid of previews for any
 * uploaded files. The caller is responsible for preparing the files
 * array and extracting newly added files when submitting a form.
 */
const FileUpload: React.FC<FileUploadProps> = ({
  files,
  setFiles,
  showRemove = true,
  className = "",
}) => {
  const { t } = useTranslation();
  // Add selected files to the current list. Each File is converted
  // into a FileData object with a fileName and fileType for easier
  // rendering and image detection. Existing entries in the state are
  // preserved.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const mappedFiles: FileData[] = selectedFiles.map((file) => ({
        fileName: file.name,
        fileType: file.type,
        file,
      }));
      setFiles((prev) => [...prev, ...mappedFiles]);
    }
  };

  // Remove a file at a specific index. This simply filters it out of
  // the files array. For new files this also implicitly removes the
  // underlying File from any subsequent uploads since it no longer
  // appears in the state array.
  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      {/* Previews */}
      <div className="mt-3 grid md:grid-cols-4 gap-3">
        {files.map((file, index) => {
          // Determine if this file is an image based on its type. When
          // uploading, the File object has a type property. When the
          // file comes from the database, we rely on file.fileType.
          const isImage =
            file.fileType?.startsWith("image") ||
            (file.file && file.file.type?.startsWith("image"));
          // Derive the source for the preview. New files use
          // URL.createObjectURL() to create a local preview URL, while
          // existing files build a URL based on the filePath.
          const src = file.file
            ? URL.createObjectURL(file.file)
            : file.filePath
            ? `${BASE_URL}${file.filePath}`
            : "";
          return (
            <div
              key={index}
              className="relative glass-card p-2 flex flex-col items-center gap-2 border-none"
              style={{ minHeight: "120px", minWidth: "110px" }}
            >
              {isImage ? (
                <img
                  src={src}
                  alt={file.fileName}
                  className="w-24 h-24 object-cover rounded-xl glass-img"
                />
              ) : (
                <span className="text-xs text-center break-all glassy-text mt-4">
                  {file.fileName}
                </span>
              )}
              {showRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="glass-btn"
                >
          {t("common.delete")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {/* File input */}
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="block w-full glass-input mt-3"
      />
    </div>
  );
};

export default FileUpload;