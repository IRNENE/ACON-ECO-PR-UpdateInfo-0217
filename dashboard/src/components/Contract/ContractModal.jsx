import React from "react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/ContractModal.module.scss";
import { IoWarningOutline } from "react-icons/io5";
import contracts from "./ContractContent";

function ContractModal({ onAgree }) {
  const [isChecked, setIsChecked] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [agreements, setAgreements] = useState(
    contracts.map((contract) => ({
      checked: false,
      title: contract.title,
    }))
  );

  const handleCheckboxChange = (index) => {
    const newAgreements = [...agreements];
    newAgreements[index].checked = !newAgreements[index].checked;
    setAgreements(newAgreements);
  };

  const isAllChecked = agreements.every((agreement) => agreement.checked);

  const handleAgree = () => {
    if (isAllChecked) {
      onAgree();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <IoWarningOutline color="#4bc6f6" size={40} />
          <h2>服務條款</h2>
        </div>

        <div className={styles.modalContent}>
          {/* 條款切換按鈕 */}
          <div className={styles.tabButtons}>
            {contracts.map((contract, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={currentPage === index ? styles.activeTab : ""}
              >
                {contract.title}
              </button>
            ))}
          </div>

          {/* 條款內容 */}
          <div className={styles.contractText}>
            {contracts[currentPage].content}
          </div>

          {/* 勾選區域 */}
          <div className={styles.checkboxGroup}>
            {agreements.map((agreement, index) => (
              <label key={index} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreement.checked}
                  onChange={() => handleCheckboxChange(index)}
                />
                <span>我已閱讀並同意{agreement.title}</span>
              </label>
            ))}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.agreeBtn} ${
                isAllChecked ? styles.enabled : ""
              }`}
              onClick={handleAgree}
              disabled={!isAllChecked}
            >
              我同意上述契約
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractModal;
