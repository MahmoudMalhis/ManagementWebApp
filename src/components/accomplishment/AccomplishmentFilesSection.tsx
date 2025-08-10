/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideFileText } from "lucide-react";

const AccomplishmentFilesSection = ({ files }: { files: any[] }) => (
  <>
    {/* Images */}
    {files.some((f) => f.fileType?.startsWith("image")) && (
      <div className="flex gap-4 flex-wrap mb-2">
        {files
          .filter((f) => f.fileType?.startsWith("image"))
          .map((file, i) => {
            // Determine base URL for serving files from environment
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const BASE_URL: string =
              (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
            return (
              <img
                key={i}
                src={`${BASE_URL}${file.filePath}`}
                alt={file.fileName}
                className="w-32 h-32 object-cover rounded-2xl glass-img shadow"
                style={{
                  border: "1.5px solid rgba(255,255,255,0.20)",
                  background: "rgba(255,255,255,0.16)",
                  backdropFilter: "blur(8px)",
                }}
              />
            );
          })}
      </div>
    )}
    {/* Documents */}
    {files.some((f) => !f.fileType?.startsWith("image")) && (
      <div className="flex flex-col gap-2 mt-2">
        {files
          .filter((f) => !f.fileType?.startsWith("image"))
          .map((file, i) => {
            // Determine base URL for serving files from environment
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const BASE_URL: string =
              (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
            return (
              <a
                key={i}
                href={`${BASE_URL}${file.filePath}`}
                download={file.fileName}
                className="glass-link text-blue-700 hover:underline flex items-center gap-2 rounded-lg px-2 py-1 transition"
                style={{
                  background: "rgba(255,255,255,0.16)",
                  backdropFilter: "blur(7px)",
                  border: "1px solid rgba(120,170,255,0.14)",
                }}
              >
                <LucideFileText className="h-5 w-5 glassy-text" />
                {file.fileName}
              </a>
            );
          })}
      </div>
    )}
  </>
);

export default AccomplishmentFilesSection;
