import styles from "../styles/submitButton.module.scss";

function SubmitButton({ text, onClick, isEnabled, buttonType = "button" }) {
  return (
    <div
      className={`${styles.inputButton} ${
        isEnabled ? styles.enabled : styles.disabled
      }`}
    >
      <button
        type={buttonType}
        aria-label="提交登入表單"
        className={`${styles.submitButton} ${
          isEnabled ? styles.enabled : styles.disabled
        }`}
        onClick={isEnabled ? onClick : undefined}
        disabled={!isEnabled}
      >
        {text}
      </button>
    </div>
  );
}

export default SubmitButton;
