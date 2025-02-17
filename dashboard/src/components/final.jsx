import styles from "../styles/final.module.scss";

function final() {
  return (
    <div className={styles.pageBackground}>
      <main className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>資料已成功送出</h1>
          <div className={styles.mainText}>
            <p>感謝您耐心填寫，</p>
            <p>
              本文件僅使用台中鐵道下停車場租賃系統平台校檔使用，資料審核通過將不另通知。若資料不完整將會通知您補件，請留意簡訊通知，以免影響後續月租權益，感謝您配合，謝謝！！
            </p>
          </div>

          <div className={styles.contactInfo}>
            <p>客服專線：0800-868-886#2</p>
            <p>Line ID：@a5588</p>
            <p>電子郵件：acon-eco@acon.com</p>
          </div>

          <div className={styles.footer}>
            <p>【台中都會區鐵路高架橋下多目標停車場】</p>
            <p>車麗屋汽車百貨/連展電能科技股份有限公司</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default final;
