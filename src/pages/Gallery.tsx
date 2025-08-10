import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "@/api/api";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";

export default function GalleryPage() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showSwiper, setShowSwiper] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState("");

  const { t } = useTranslation();

  useEffect(() => {
    api.get("/gallery/folders").then((res) => setFolders(res.data.folders));
  }, []);

  const openFolder = async (folderId) => {
    const res = await api.get(`/gallery/folders/${folderId}`);
    setSelectedFolder(res.data.folder);
  };

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#c9d6ff] to-[#e2e2e2] flex flex-col">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">
        {t("gallery.title")}
      </h1>
      <input
        type="text"
        placeholder={t("gallery.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-8 glass-input border-none outline-none py-3 px-4 w-full md:w-1/3 text-gray-700 text-base transition-all"
      />

      {!selectedFolder ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {filteredFolders.map((folder) => (
            <div
              key={folder._id}
              className="glass-card flex flex-col items-center justify-center cursor-pointer p-6 hover:scale-105 transition"
              onClick={() => openFolder(folder._id)}
            >
              <svg viewBox="0 0 24 24" fill="none" width={40} className="mb-2">
                <g id="SVGRepoIconCarrier">
                  <path
                    d="M16 19C15.6218 17.2883 13.9747 16 12 16C10.0253 16 8.37818 17.2883 8 19M12 12H12.01M12.0627 6.06274L11.9373 5.93726C11.5914 5.59135 11.4184 5.4184 11.2166 5.29472C11.0376 5.18506 10.8425 5.10425 10.6385 5.05526C10.4083 5 10.1637 5 9.67452 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V15.8C3 16.9201 3 17.4802 3.21799 17.908C3.40973 18.2843 3.71569 18.5903 4.09202 18.782C4.51984 19 5.07989 19 6.2 19H17.8C18.9201 19 19.4802 19 19.908 18.782C20.2843 18.5903 20.5903 18.2843 20.782 17.908C21 17.4802 21 16.9201 21 15.8V10.2C21 9.0799 21 8.51984 20.782 8.09202C20.5903 7.71569 20.2843 7.40973 19.908 7.21799C19.4802 7 18.9201 7 17.8 7H14.3255C13.8363 7 13.5917 7 13.3615 6.94474C13.1575 6.89575 12.9624 6.81494 12.7834 6.70528C12.5816 6.5816 12.4086 6.40865 12.0627 6.06274ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12Z"
                    stroke="#6386bf"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </g>
              </svg>
              <div className="font-bold text-lg text-[#2e3957] mb-1">
                {folder.name}
              </div>
              <div className="text-xs text-[#6386bf]">
                {t("gallery.fileCount", { count: folder.filesCount })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            className="glass-btn mb-6 py-2 px-6 flex items-center gap-2"
            onClick={() => setSelectedFolder(null)}
          >
            <svg
              viewBox="0 0 1024 1024"
              xmlns="http://www.w3.org/2000/svg"
              fill="#6386bf"
              width={20}
              className="inline-block"
            >
              <g id="SVGRepo_iconCarrier">
                <path
                  fill="#6386bf"
                  d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                ></path>
                <path
                  fill="#6386bf"
                  d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                ></path>
              </g>
            </svg>
            <span className="text-[#6386bf] font-semibold">
              {t("gallery.back")}
            </span>
          </button>
          <h2 className="font-bold mb-5 text-[#2e3957]">
            {selectedFolder.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {(selectedFolder?.files || []).map((file, i) => (
              <div
                key={i}
                className="glass-card p-3 flex flex-col items-center"
              >
                {file.fileType && file.fileType.startsWith("image") ? (
                  <img
                    src={file.filePath}
                    alt={file.fileName}
                    className="w-full h-32 object-cover rounded-xl cursor-pointer border border-white border-opacity-30"
                    style={{
                      backdropFilter: "blur(2px)",
                      background: "rgba(255,255,255,0.2)",
                    }}
                    onClick={() => {
                      setActiveIndex(i);
                      setShowSwiper(true);
                    }}
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs text-[#6386bf]">
                    <a href={file.filePath} target="_blank" rel="noreferrer">
                      {file.fileName}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {showSwiper && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/60"
          style={
            {
              backdropFilter: "blur(2px)",
              "--swiper-navigation-color": "#6386bf",
            } as React.CSSProperties
          }
        >
          <div className="relative w-full max-w-3xl glass-modal">
            <button
              onClick={() => setShowSwiper(false)}
              className="absolute left-2 top-2 z-10 glass-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" width={20}>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"
                    fill="#6386bf"
                  ></path>
                </g>
              </svg>
            </button>
            <Swiper
              initialSlide={activeIndex}
              navigation
              pagination={{ clickable: true }}
              modules={[Navigation, Pagination]}
              spaceBetween={30}
              className="rounded-xl glass-modal"
            >
              {(selectedFolder.files || [])
                .filter(
                  (file) => file.fileType && file.fileType.startsWith("image")
                )
                .map((file, idx) => (
                  <SwiperSlide key={idx}>
                    <img
                      src={file.filePath}
                      alt={file.fileName}
                      style={{
                        maxHeight: "75vh",
                        width: "auto",
                        margin: "auto",
                        display: "block",
                        objectFit: "contain",
                        borderRadius: "1.5rem",
                        background: "rgba(255,255,255,0.15)",
                        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        backdropFilter: "blur(6px)",
                      }}
                    />
                  </SwiperSlide>
                ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
}
