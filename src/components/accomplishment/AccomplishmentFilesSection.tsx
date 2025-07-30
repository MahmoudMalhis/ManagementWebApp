/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideFileText } from "lucide-react";

const AccomplishmentFilesSection = ({ files }: { files: any[] }) => (
  <>
    {/* Images */}
    {files.some((f) => f.fileType?.startsWith("image")) && (
      <div className="flex gap-4 flex-wrap mb-2">
        {files
          .filter((f) => f.fileType?.startsWith("image"))
          .map((file, i) => (
            <img
              key={i}
              src={`http://localhost:5000${file.filePath}`}
              alt={file.fileName}
              className="w-32 h-32 object-cover rounded shadow"
            />
          ))}
      </div>
    )}
    {/* Documents */}
    {files.some((f) => !f.fileType?.startsWith("image")) && (
      <div className="flex flex-col gap-2">
        {files
          .filter((f) => !f.fileType?.startsWith("image"))
          .map((file, i) => (
            <a
              key={i}
              href={`http://localhost:5000${file.filePath}`}
              download={file.fileName}
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              <LucideFileText className="h-4 w-4" />
              {file.fileName}
            </a>
          ))}
      </div>
    )}
  </>
);

export default AccomplishmentFilesSection;
