import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setPhone, setLicense } from "../features/user/userSlice";
import SubmitButton from "./submitButton";
import styles from "../styles/loginPage.module.scss";
import ContractModal from "./Contract/ContractModal";
import AddressSelect from "./Address/AddressSelect";
import axios from "axios";
import Swal from "sweetalert2";
import ImageUpload from "./Photo/ImageUpload";

function LoginPage() {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    parking_id: "",
    identityNo: "",
    phone: "",
    license: "",
    vehicle_type: "",
    identity_id: "",
    address: "",
    address_city: "",
    address_county: "",
    personal_id: "identity",
    idType: "identity",
    frontIdImage: null,
    backIdImage: null,
    residenceIdImage: null,
    vehicleLicenseImage: null,
    disabilityCertificateImage: null,
  });

  const [searchError, setSearchError] = useState("");
  const [showModal, setShowModal] = useState(true);
  const handleAgree = () => {
    setShowModal(false);
  };
  const [showFullForm, setShowFullForm] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const phone = useSelector((state) => state.user.phone);
  const license = useSelector((state) => state.user.license);
  const [isAllFilled, setIsAllFilled] = useState(false);
  const [isInitialSearchValid, setIsInitialSearchValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (phone.trim() !== "" && license.trim() !== "") {
      setIsInitialSearchValid(true);
    } else {
      setIsInitialSearchValid(false);
    }
  }, [phone, license]);

  // 處理初始搜尋
  const handleInitialSearch = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInitialSearchValid) {
      try {
        const response = await axios.post("/api/search-register", {
          phone,
          license,
        });

        if (response.data.showAlert) {
          let alertConfig = {
            icon: "info",
            title: "申請狀態",
            text: response.data.message,
            confirmButtonText: "確定",
          };

          switch (response.data.status) {
            case 0:
              alertConfig.icon = "info";
              await Swal.fire(alertConfig);
              return;

            case 1:
              alertConfig.icon = "success";
              await Swal.fire(alertConfig);
              return;

            case 2:
              alertConfig.icon = "warning";
              if (response.data.errorDetails?.textMessage) {
                alertConfig.html = `
                  <div>需要補件</div>
                  <div style="margin-top: 10px; color: #666;">
                    ${response.data.errorDetails.textMessage}
                  </div>
                `;
                delete alertConfig.text;
              }
              await Swal.fire(alertConfig);
              try {
                const updateResponse = await axios.get(
                  `/api/get-update-register/${phone}/${license}`
                );

                if (updateResponse.data.success) {
                  const updateData = updateResponse.data.data;
                  setFormDataFromResponse(updateData, true);
                  setShowFullForm(true);
                  setSearchError("");
                }
              } catch (error) {
                console.error("獲取補件資料失敗:", error);
                setSearchError("獲取補件資料失敗，請稍後再試");
              }
              break;
          }
        } else if (response.data.success) {
          const registerData = response.data.data;
          setFormDataFromResponse(registerData, false);
          setShowFullForm(true);
          setSearchError("");
        } else {
          setSearchError("查無資料，請確認輸入資訊是否正確");
        }
      } catch (error) {
        console.error("搜尋失敗:", error);
        setSearchError("搜尋失敗，請稍後再試");
      }
    }
  };

  const setFormDataFromResponse = (data, isFromUpdateLog) => {
    // 處理車種顯示文字
    const vehicleTypeText = data.vehicle_type === 0 ? "汽車" : "機車";
    // 處理身分別文字
    const identityText = getIdentityText(data.identity_id);
    const baseFormData = {
      id: data.id || "",
      name: data.name || "",
      parking_id: data.parking_id || "",
      parkingName: data.parking_name || "未知停車場",
      identityNo: isFromUpdateLog ? data.identity_no : "",

      phone: data.tel || "",
      license: data.licenseplate || "",
      vehicle_type: data.vehicle_type,
      vehicleText: vehicleTypeText,
      identity_id: data.identity_id || "",
      identityText: identityText,
      address: data.address || "",
      address_city: data.address_city || "",
      address_county: data.address_county || "",
      personal_id: isFromUpdateLog
        ? data.identity_no?.match(/^[A-Z][A-D]\d{8}$/)
          ? "residence"
          : "identity"
        : "identity",
      idType: isFromUpdateLog
        ? data.identity_no?.match(/^[A-Z][A-D]\d{8}$/)
          ? "residence"
          : "identity"
        : "identity",
    };

    if (isFromUpdateLog) {
      baseFormData.original_phone = data.original_phone || "";
      baseFormData.original_license = data.original_license || "";
    } else {
      baseFormData.original_phone = data.tel || "";
      baseFormData.original_license = data.licenseplate || "";
    }

    setFormData(baseFormData);
  };

  const getIdentityText = (identityId) => {
    const identityMap = {
      1: "一般優惠",
      2: "身心障礙者",
      3: "小資優惠價(限本停車場汽車租戶)",
      4: "里民",
      5: "ACON-ECO會員",
      6: "一般優惠(機)",
    };
    return identityMap[identityId] || "";
  };

  useEffect(() => {
    if (phone.trim() !== "" && license.trim() !== "") {
      setIsAllFilled(true);
    } else {
      setIsAllFilled(false);
    }
  }, [phone, license]);

  const [isFormValid, setIsFormValid] = useState(false);
  const sanitizeInput = (input, type = "text") => {
    if (typeof input !== "string") return "";
    let sanitized = input.trim();

    switch (type) {
      case "name":
        // 只允許中文、英文、空格
        return sanitized.replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, "").slice(0, 100);

      case "phone":
        // 只允許數字
        return sanitized.replace(/[^\d]/g, "").slice(0, 10);

      case "license":
        // 只允許英文和數字
        return sanitized
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 10);

      case "identity":
        // 只允許英文和數字
        return sanitized
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 10);

      case "address":
        // 允許中文、英文、數字和基本標點
        return sanitized
          .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s,.()-]/g, "")
          .slice(0, 100);
    }
  };

  const handlePhoneChange = (e) => {
    const sanitizedValue = sanitizeInput(e.target.value, "phone");
    dispatch(setPhone(sanitizedValue));
  };

  const handleLicenseChange = (e) => {
    const sanitizedValue = sanitizeInput(e.target.value, "license");
    dispatch(setLicense(sanitizedValue));
  };

  // 驗證身分證
  const validateTaiwanID = (id) => {
    const idRegex = /^[A-Z][12]\d{8}$/;
    if (!idRegex.test(id)) return false;

    const letterMap = {
      A: 10,
      B: 11,
      C: 12,
      D: 13,
      E: 14,
      F: 15,
      G: 16,
      H: 17,
      I: 34,
      J: 18,
      K: 19,
      L: 20,
      M: 21,
      N: 22,
      O: 35,
      P: 23,
      Q: 24,
      R: 25,
      S: 26,
      T: 27,
      U: 28,
      V: 29,
      W: 32,
      X: 30,
      Y: 31,
      Z: 33,
    };

    const firstNum = letterMap[id[0]];
    const firstDigit = Math.floor(firstNum / 10);
    const secondDigit = firstNum % 10;

    let sum = firstDigit * 1 + secondDigit * 9;
    for (let i = 1; i < 9; i++) {
      sum += parseInt(id[i]) * (9 - i);
    }

    const checkDigit = parseInt(id[9]);
    return (sum + checkDigit) % 10 === 0;
  };

  const validateResidenceID = (id) => {
    const residenceRegex = /^[A-Z]([A-D]\d{8}|\d{9})$/;
    return residenceRegex.test(id);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^09\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 如果正在提交中，直接返回
    if (isSubmitting) return;
    const newErrors = {};

    // 驗證姓名（不能為空）
    if (!formData.name.trim()) {
      newErrors.name = "請輸入姓名";
    }

    // 手機號碼驗證
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "請輸入正確的手機號碼格式（09開頭共10碼）";
    }

    // 身分證/居留證驗證

    if (formData.idType === "identity") {
      if (!validateTaiwanID(formData.identityNo)) {
        newErrors.identityNo = "請輸入正確的身分證字號";
      }
    } else {
      if (!validateResidenceID(formData.identityNo)) {
        newErrors.identityNo = "請輸入正確的居留證號碼";
      }
    }

    if (!formData.identityNo.trim()) {
      newErrors.identityNo = "此欄位為必填寫";
    }
    if (!formData.address.trim()) {
      newErrors.address = "請輸入戶籍地址";
    }
    if (!formData.address_city) {
      newErrors.address_city = "請選擇縣市";
    }
    if (!formData.address_county) {
      newErrors.address_county = "請選擇區域";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    const result = await Swal.fire({
      title: "確認送出表單？",
      text: "請確認填寫內容無誤，表單送出後將無法修改！",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "確認送出",
      cancelButtonText: "返回",
    });

    if (!result.isConfirmed) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // 設置提交狀態為 true
    setIsSubmitting(true);
    try {
      const submitData = {
        id: formData.id,
        vehicle_type: formData.vehicle_type,
        parking_id: formData.parking_id,
        identityNo: formData.identityNo,
        name: formData.name,
        phone: formData.phone,
        original_phone: formData.original_phone,
        license: formData.license,
        original_license: formData.original_license,
        identity_id: formData.identity_id,
        address: formData.address,
        address_city: formData.address_city,
        address_county: formData.address_county,
      };

      const imageData = {
        frontId: formData.frontIdImage,
        backId: formData.backIdImage,
        residence: formData.residenceIdImage,
        vehicle: formData.vehicleLicenseImage,
        disability: formData.disabilityCertificateImage,
      };
      const response = await axios.post("/api/save-Info", submitData);
      if (!response.data) {
        throw new Error("API 未返回任何數據");
      }

      if (!response.data.success) {
        throw new Error(response.data.message || "儲存基本資料失敗");
      }

      const imagesApiUrl = response.data.isUpdate
        ? "/api/update-images"
        : "/api/upload-images";

      const userId = response.data.id;
      if (!userId) {
        throw new Error("API 未返回用戶 ID");
      }

      const formDataForFiles = new FormData();
      formDataForFiles.append("userId", userId);

      let hasImages = false;

      if (formData.personal_id === "identity") {
        if (formData.frontIdImage?.file) {
          formDataForFiles.append(
            "images",
            formData.frontIdImage.file,
            `${userId}_front_id`
          );
          hasImages = true;
        }
        if (formData.backIdImage?.file) {
          formDataForFiles.append(
            "images",
            formData.backIdImage.file,
            `${userId}_back_id`
          );
          hasImages = true;
        }
      } else if (formData.residenceIdImage?.file) {
        formDataForFiles.append(
          "images",
          formData.residenceIdImage.file,
          `${userId}_residence`
        );
        hasImages = true;
      }

      if (formData.vehicleLicenseImage?.file) {
        formDataForFiles.append(
          "images",
          formData.vehicleLicenseImage.file,
          `${userId}_vehicle`
        );
        hasImages = true;
      }

      if (formData.disabilityCertificateImage?.file) {
        formDataForFiles.append(
          "images",
          formData.disabilityCertificateImage.file,
          `${userId}_disability`
        );
        hasImages = true;
      }

      if (!hasImages) {
        return;
      }

      const imageResponse = await axios.post(imagesApiUrl, formDataForFiles, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!imageResponse.data.success) {
        throw new Error(imageResponse.data.message || "圖片上傳失敗");
      }
      setIsSubmitting(false);

      await Swal.fire({
        icon: "success",
        title: "提交成功！",
        text: "表單已成功送出",
        confirmButtonText: "確定",
        confirmButtonColor: "#3085d6",
      });

      navigate("/final");
    } catch (error) {
      console.error("\n=== 錯誤詳情 ===");
      console.error("錯誤訊息:", error.message);

      if (error.response) {
        console.error("API 錯誤回應:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      setErrors((prev) => ({
        ...prev,
        submit: error.message || "提交失敗，請稍後再試",
      }));
      setIsSubmitting(false);
      await Swal.fire({
        icon: "error",
        title: "系統錯誤",
        text: "系統暫時無法處理您的請求，請稍後再試",
        confirmButtonText: "確定",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  useEffect(() => {
    if (!showFullForm) return;

    const isValid =
      formData.name.trim() !== "" && formData.identityNo.trim() !== "";

    setIsFormValid(isValid);
  }, [formData, showFullForm]);

  const handleCityChange = (newCity) => {
    setFormData((prev) => ({
      ...prev,
      address_city: newCity,
    }));
  };

  const handleDistrictChange = (newDistrict) => {
    setFormData((prev) => ({
      ...prev,
      address_county: newDistrict,
    }));
  };

  const handlePersonalIDChange = (e) => {
    const selectedType = e.target.value;

    setFormData((prev) => ({
      ...prev,
      personal_id: selectedType,
      frontIdImage: null,
      backIdImage: null,
      residenceIdImage: null,
    }));
  };
  const IDENTITY_OPTIONS = [
    { id: "1", text: "一般優惠" },
    { id: "2", text: "身心障礙者" },
    { id: "3", text: "小資優惠價(限本停車場汽車租戶)" },
    { id: "4", text: "里民" },
    { id: "5", text: "ACON-ECO會員" },
    { id: "6", text: "一般優惠(機)" },
  ];
  return (
    <div className={styles.pageBackground}>
      {showModal && <ContractModal onAgree={handleAgree} />}
      <main className={styles.container}>
        <img src="/assets/logo.png" alt="Logo" />
        <div className={styles.loginContent}>
          {/* 2.初始搜尋欄位 */}

          {!showFullForm && (
            <div className={styles.inputForm}>
              <div className={styles.inputWrapper}>
                <label htmlFor="license-input" className={styles.floatingLabel}>
                  車牌號碼
                </label>
                <div className={styles.inputField}>
                  <input
                    type="text"
                    id="license-input"
                    placeholder="請填完整車牌不含『-』如：ABC1234"
                    value={license}
                    onChange={handleLicenseChange}
                  />
                </div>
              </div>
              <div className={styles.inputWrapper}>
                <label htmlFor="phone-input" className={styles.floatingLabel}>
                  電話號碼
                </label>
                <div className={styles.inputField}>
                  <input
                    type="tel"
                    id="phone-input"
                    placeholder="請輸入電話號碼"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>
              {searchError && (
                <div className={styles.errorMessage}>{searchError}</div>
              )}
              <SubmitButton
                text="搜尋"
                onClick={handleInitialSearch}
                isEnabled={isAllFilled}
                disabled={!isInitialSearchValid}
              />

              <div className={styles.youtubeBox}>
                <a
                  href="https://youtube.com/shorts/qSHDSXF-bLc?si=Nxo2nWNh0HxRl8t3"
                  className={styles.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/assets/youtube-icon.svg"
                    alt="YouTube"
                    style={{
                      width: "24px",
                      height: "24px",
                    }}
                  />
                  <span className={styles.youtubeLinkText}>
                    月租補件系統教學影片
                  </span>
                </a>
              </div>
            </div>
          )}
          {/* 3.完整表單欄位 */}
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            {showFullForm && (
              <div className={styles.fullFormSection}>
                <div className={styles.inputWrapper}>
                  <label htmlFor="parking_id" className={styles.floatingLabel}>
                    停車場
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      id="parking_id"
                      value={formData.parkingName}
                      readOnly
                    />
                  </div>
                </div>
                <div className={styles.inputWrapper}>
                  <label
                    htmlFor="vehicle_type"
                    className={styles.floatingLabel}
                  >
                    車種
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      id="vehicle_type"
                      value={formData.vehicleText}
                      readOnly
                    />
                  </div>
                </div>

                <div className={styles.inputWrapper}>
                  <label htmlFor="identity" className={styles.floatingLabel}>
                    登記身分別
                  </label>
                  <div className={styles.inputField}>
                    <select
                      id="identity"
                      value={formData.identity_id || ""}
                      onChange={(e) => {
                        const selectedOption = IDENTITY_OPTIONS.find(
                          (option) => option.id === e.target.value
                        );
                        setFormData({
                          ...formData,
                          identity_id: e.target.value,
                          identityText: selectedOption
                            ? selectedOption.text
                            : "",
                        });
                      }}
                      required={!formData.identity_id}
                    >
                      <option value="" disabled>
                        {formData.identityText || "請選擇身分別"}
                      </option>
                      {IDENTITY_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.inputWrapper}>
                  <label htmlFor="name-input" className={styles.floatingLabel}>
                    姓名
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      id="name-input"
                      placeholder="請輸入姓名"
                      value={formData.name}
                      onChange={(e) => {
                        const sanitizedValue = sanitizeInput(
                          e.target.value,
                          "name"
                        );
                        setFormData({ ...formData, name: sanitizedValue });
                      }}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputWrapper}>
                  <label htmlFor="tel-input" className={styles.floatingLabel}>
                    電話
                  </label>

                  <div className={styles.inputField}>
                    <input
                      type="tel"
                      id="tel-input"
                      placeholder="請輸入手機號碼(ex:0910101101)"
                      value={formData.phone}
                      onChange={(e) => {
                        const sanitizedValue = sanitizeInput(
                          e.target.value,
                          "phone"
                        );
                        setFormData({ ...formData, phone: sanitizedValue });
                      }}
                      maxLength={10}
                      required
                    />
                    {errors.phone && (
                      <div className={styles.errorMessage}>{errors.phone}</div>
                    )}
                  </div>
                </div>

                <div className={styles.inputWrapper}>
                  <label
                    htmlFor="license-input"
                    className={styles.floatingLabel}
                  >
                    車牌
                  </label>
                  <div className={styles.inputField}>
                    <input
                      type="text"
                      id="license-input"
                      placeholder="請輸入完整車牌且不需輸入『-』例如：ABC1234"
                      value={formData.license}
                      onChange={(e) => {
                        const sanitizedValue = sanitizeInput(
                          e.target.value,
                          "license"
                        );
                        setFormData({ ...formData, license: sanitizedValue });
                      }}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="idType"
                      value="identity"
                      checked={formData.idType === "identity"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          idType: e.target.value,
                        }))
                      }
                      required
                    />
                    身分證
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="idType"
                      value="residence"
                      checked={formData.idType === "residence"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          idType: e.target.value,
                        }))
                      }
                      required
                    />
                    居留證
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <label htmlFor="id-input" className={styles.floatingLabel}>
                    身分證或居留證號碼
                  </label>

                  <div className={styles.inputField}>
                    <input
                      type="text"
                      id="id-input"
                      value={formData.identityNo || ""}
                      placeholder={
                        formData.idType === "identity"
                          ? "請輸入身分證字號"
                          : "請輸入居留證號碼"
                      }
                      onChange={(e) => {
                        const sanitizedValue = sanitizeInput(
                          e.target.value,
                          "identity"
                        );
                        setFormData((prev) => ({
                          ...prev,
                          identityNo: sanitizedValue,
                        }));
                      }}
                      maxLength={10}
                      required
                    />
                    {errors.identityNo && (
                      <div className={styles.errorMessage}>
                        {errors.identityNo}
                      </div>
                    )}
                  </div>
                </div>
                {/* 照片 */}
                {/* 新增：身分證明類型選擇 */}
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="personal_id"
                      value="identity"
                      checked={formData.personal_id === "identity"}
                      onChange={handlePersonalIDChange}
                      required
                    />
                    身分證
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="personal_id"
                      value="residence"
                      checked={formData.personal_id === "residence"}
                      onChange={handlePersonalIDChange}
                      required
                    />
                    居留證
                  </label>
                </div>

                {/* 修改：根據選擇顯示不同的上傳欄位 */}
                {formData.personal_id === "identity" ? (
                  <>
                    <ImageUpload
                      label="(必填)身分證正面"
                      id="front-identity"
                      value={formData.frontIdImage}
                      onChange={(imageData) => {
                        setFormData((prev) => ({
                          ...prev,
                          frontIdImage: imageData,
                        }));
                      }}
                      required
                    />

                    <ImageUpload
                      label="(必填)身分證反面"
                      id="back-identity"
                      value={formData.backIdImage}
                      onChange={(imageData) => {
                        setFormData((prev) => ({
                          ...prev,
                          backIdImage: imageData,
                        }));
                      }}
                      required
                    />
                  </>
                ) : (
                  <ImageUpload
                    label="(必填)居留證正面"
                    id="residenceIdImage"
                    value={formData.residenceIdImage}
                    onChange={(imageData) => {
                      setFormData((prev) => ({
                        ...prev,
                        residenceIdImage: imageData,
                      }));
                    }}
                    required
                  />
                )}

                <ImageUpload
                  label="(必填)行照"
                  id="vehicleLicense"
                  value={formData.vehicleLicenseImage}
                  onChange={(imageData) => {
                    setFormData((prev) => ({
                      ...prev,
                      vehicleLicenseImage: imageData,
                    }));
                  }}
                  required
                />

                <ImageUpload
                  label="(選填)請上傳其他文件(身心障礙)"
                  id="disabilityCertificate"
                  value={formData.disabilityCertificateImage}
                  onChange={(imageData) => {
                    setFormData((prev) => ({
                      ...prev,
                      disabilityCertificateImage: imageData,
                    }));
                  }}
                />

                {/* 戶籍 */}
                <div className={styles.inputWrapper}>
                  <label
                    htmlFor="address-input"
                    className={styles.floatingLabel}
                  >
                    戶籍地址
                  </label>

                  <div className={styles.inputField}>
                    <AddressSelect
                      initialCity={formData.address_city}
                      initialDistrict={formData.address_county}
                      onCityChange={handleCityChange}
                      onDistrictChange={handleDistrictChange}
                      required
                    />
                    <input
                      type="text"
                      id="address-input"
                      placeholder="請輸入戶籍地址"
                      value={formData.address}
                      onChange={(e) => {
                        const sanitizedValue = sanitizeInput(
                          e.target.value,
                          "address"
                        );
                        setFormData({ ...formData, address: sanitizedValue });
                      }}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                <SubmitButton
                  text="送出"
                  // isEnabled={isFormValid}
                  isEnabled={isFormValid && !isSubmitting} // 使用 isSubmitting 來控制按鈕狀態
                  buttonType="submit"
                />
                {isSubmitting && (
                  <div
                    style={{
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 9999,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <img
                      src="/assets/loading.svg"
                      alt="Loading..."
                      style={{
                        transform: "scale(1.2)",
                        transformOrigin: "center",
                      }}
                    />
                    <div
                      style={{
                        color: "#3085d6",
                        fontSize: "1rem",
                        fontWeight: "500",
                      }}
                    >
                      資料傳輸中，請稍後
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
