import styles from "../styles/final.module.scss";

function final() {
  return (
    <>
      <div className={styles.pageBackground}>
        <main className={styles.container}>
          <div className={styles.title}>
            <p className={styles.titleColor}></p>
          </div>
          <div className={styles.content}>
            <div className={styles.subtitle}>
              <p>
                此為頁面
                <br />
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default final;
