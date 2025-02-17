import React, { useEffect, useState } from "react";
import imageStyles from "../../styles/ImageUpload.module.scss";

const ImageUpload = ({
  label,
  id,
  value,
  onChange,
  required = false,
  placeholder = "未選擇任何檔案",
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // 壓縮圖片
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 2500;
          const MAX_HEIGHT = 1600;
          const MIN_WIDTH = 1500;
          const MIN_HEIGHT = 1000;
          const TARGET_SIZE = 2 * 1024 * 1024;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.max(width / MAX_WIDTH, height / MAX_HEIGHT);
            width = width / ratio;
            height = height / ratio;
          }
          if (width < MIN_WIDTH || height < MIN_HEIGHT) {
            width = MIN_WIDTH;
            height = MIN_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn("壓縮失敗，保留原檔案");
                resolve(file);
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: "image/webp",
                lastModified: Date.now(),
              });

              if (compressedFile.size > TARGET_SIZE) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            },
            "image/webp",
            0.9
          );
        };
      };
    });
  };

  const resetFileInput = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFiles([]);
    const fileInput = document.getElementById(id);
    if (fileInput) {
      fileInput.value = "";
    }
    if (onChange) {
      onChange(null);
    }
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length + selectedFiles.length > 1) {
      setError("最多只能上傳1張圖片，請重新上傳圖片");
      resetFileInput();
      return;
    }
    const file = event.target.files[0];

    try {
      const compressedFile = await compressImage(files[0]);
      if (compressedFile.size > 5 * 1024 * 1024) {
        setError("壓縮後超過5MB，請選擇較小的圖片，請重新上傳圖片");
        resetFileInput();
        return;
      }

      const originalObjectUrl = URL.createObjectURL(file);
      const watermarkedPreviewUrl = await createWatermarkedPreview(
        originalObjectUrl
      );
      URL.revokeObjectURL(originalObjectUrl);

      setPreviewUrl(watermarkedPreviewUrl);
      setSelectedFiles([compressedFile]);
      setError(null);

      if (onChange) {
        onChange({
          file: compressedFile,
          name: compressedFile.name,
          size: compressedFile.size,
          type: compressedFile.type,
          preview: watermarkedPreviewUrl,
        });
      }
    } catch (err) {
      setError("圖片處理失敗，請重新上傳圖片");
      console.error("圖片處理錯誤:", err);
      resetFileInput();
    }
  };

  // 浮水印
  const createWatermarkedPreview = (previewUrl) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = previewUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const fontSize = Math.floor(img.width * 0.04);
        ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 
                  "Segoe UI", "Microsoft JhengHei", "Microsoft YaHei", 
                  sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const watermarkText = "僅供月租平台補件使用";
        const spacing = fontSize * 8;
        for (let y = 0; y < img.height; y += spacing) {
          for (let x = 0; x < img.width; x += spacing) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(watermarkText, 0, 0);
            ctx.restore();
          }
        }

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };

      img.onerror = () => {
        console.error("圖片載入失敗");
        setError("圖片載入失敗，請重新上傳圖片");
        resolve(previewUrl);
      };
    });
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={imageStyles.inputWrapper}>
      <label htmlFor={id} className={imageStyles.floatingLabel}>
        {label}
      </label>
      <div className={imageStyles.inputField}>
        <input
          type="file"
          id={id}
          accept="image/*"
          onChange={handleFileChange}
          required={required}
        />
        {error && <div className={imageStyles.imageError}>{error}</div>}
        {selectedFiles.length > 0 && (
          <div className={imageStyles.imageInfo}>
            <p>檔案大小: {Math.round(selectedFiles[0].size / 1024)} KB</p>
            <button
              type="button"
              className={imageStyles.previewButton}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "隱藏圖片" : "點擊查看圖片"}
            </button>
            {previewUrl && showPreview && (
              <div className={imageStyles.previewContainer}>
                <img
                  src={previewUrl}
                  alt={`${label}預覽`}
                  className={imageStyles.imagePreview}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
