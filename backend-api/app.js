require("dotenv").config({
  path: "./dev.env",
});
const db = require("./config/db_connect");
const cors = require("cors");
const bodyParser = require("body-parser");
const r2Client = require("./config/r2_connect");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const fs = require("fs");
const https = require("https");
const express = require("express");
const app = express();

// ssl
const options = {
  key: fs.readFileSync("./root/STAR.acon-eco.com_key.txt"),
  cert: fs.readFileSync("./root/STAR.acon-eco.com.fullchain.crt"),
  ca: [fs.readFileSync("./root/STAR.acon-eco.com.p7b")],
};
const corsOption = {
  credentials: true,
  origin: (origin, cb) => {
    cb(null, true);
  },
};

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOption));
app.use(bodyParser.json());

app.get("/test", async (req, res) => {
  try {
    const sql = `SELECT * FROM Register`;
    const [result] = await db.query(sql);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 前台
app.post("/search-register", async (req, res) => {
  try {
    const { phone, license } = req.body;
    if (!phone || !license) {
      return res.status(400).json({
        success: false,
        message: "必須提供電話和車牌號碼",
      });
    }
    const updateLogSql = `
   SELECT *
   FROM RegisterUpdateLog 
   WHERE original_phone = ? AND original_license = ?
 `;
    const [updateLogResult] = await db.query(updateLogSql, [phone, license]);
    if (updateLogResult.length > 0) {
      const status = updateLogResult[0].status;
      const errorMessage = updateLogResult[0].error_message;
      let message = "";

      switch (status) {
        case 0:
          message = "您的申請正在審核中，請耐心等待";
          break;
        case 1:
          message = "您的申請已審核通過";
          break;
        case 2:
          message = `您的申請需要補件，原因：${errorMessage || "請聯繫管理員"}`;
          break;
      }

      return res.json({
        success: false,
        showAlert: true,
        status: status,
        message: message,
        errorDetails: status === 2 ? { textMessage: errorMessage } : null,
      });
    }
    const registerSql = `
SELECT 
  r.*,
  p.name as parking_name,
  p.id as parking_id,
  p.name as parkingName  -- 添加額外的別名以確保前端能接收到
FROM Register r
LEFT JOIN Parking p ON r.parking_id = p.id
WHERE r.tel = ? AND r.licenseplate = ?
`;

    const [registerResult] = await db.query(registerSql, [phone, license]);
    if (registerResult.length > 0) {
      res.json({
        success: true,
        data: {
          ...registerResult[0],
          parking_name: registerResult[0].parking_name || "未知停車場",
          parkingName: registerResult[0].name || "未知停車場",
        },
      });
    } else {
      res.json({
        success: false,
        message: "查無註冊資料",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取補件資料的 API
app.get("/get-update-register/:phone/:license", async (req, res) => {
  try {
    const { phone, license } = req.params;

    const sql = `
      SELECT rul.*, p.name as parking_name 
      FROM RegisterUpdateLog rul
      LEFT JOIN Parking p ON rul.parking_id = p.id
      WHERE rul.original_phone = ? 
      AND rul.original_license = ?
      AND rul.status = 2
      ORDER BY rul.createat DESC
      LIMIT 1
    `;

    const [result] = await db.query(sql, [phone, license]);

    if (result.length > 0) {
      const updateData = {
        ...result[0],
        id: result[0].id,
        name: result[0].name,
        identity_no: result[0].identity_no,
        tel: result[0].tel,
        licenseplate: result[0].licenseplate,
        original_phone: result[0].original_phone,
        original_license: result[0].original_license,
        identity_id: result[0].identity_id,
        address: result[0].address,
        address_city: result[0].address_city,
        address_county: result[0].address_county,
        parking_name: result[0].parking_name,
        vehicle_type: result[0].vehicle_type,
        parking_id: result[0].parking_id,
        createat: result[0].createat,
        status: result[0].status,
        error_message: result[0].error_message,
      };

      res.json({
        success: true,
        data: updateData,
      });
    } else {
      res.json({
        success: false,
        message: "查無補件資料",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "系統錯誤，請稍後再試",
    });
  }
});

app.post("/save-Info", async (req, res) => {
  try {
    const {
      id,
      identityNo,
      name,
      phone,
      original_phone,
      license,
      original_license,
      identity_id,
      address,
      address_city,
      address_county,
      parking_id,
      vehicle_type,
    } = req.body;

    const checkSql = `
      SELECT * FROM RegisterUpdateLog 
      WHERE original_phone = ? AND original_license = ?
    `;
    const [existingRecords] = await db.query(checkSql, [
      original_phone,
      original_license,
    ]);

    if (existingRecords.length === 0) {
      const insertLogSql = `
INSERT INTO RegisterUpdateLog 
(id, identity_no, name, tel, original_phone, 
 licenseplate, original_license, identity_id, address, 
 address_city, address_county, contract_agreed, status, 
 createat, parking_id,vehicle_type)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
 NOW(), ?,?)
`;

      await db.query(insertLogSql, [
        id,
        identityNo,
        name,
        phone,
        original_phone,
        license,
        original_license,
        identity_id,
        address,
        address_city,
        address_county,
        1,
        0,
        parking_id,
        vehicle_type,
      ]);

      res.json({
        success: true,
        message: "資料新增成功",
        id: id,
        isUpdate: false,
      });
    } else {
      const updateLogSql = `
        UPDATE RegisterUpdateLog 
        SET identity_no = ?, 
            name = ?, 
            tel = ?,
            licenseplate = ?, 
            identity_id = ?, 
            address = ?,
            address_city = ?, 
            address_county = ?,
            createat = NOW(),
            status=0,
            error_message="已補件"
        WHERE id = ?
      `;

      await db.query(updateLogSql, [
        identityNo,
        name,
        phone,
        license,
        identity_id,
        address,
        address_city,
        address_county,
        id,
      ]);

      res.json({
        success: true,
        message: "資料更新成功",
        id: id,
        isUpdate: true,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 上傳Cloud R2
// 設置 multer 配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).array("images");

// 新增圖片
app.post("/upload-images", upload, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new Error("未收到任何檔案");
    }

    if (!process.env.R2_BUCKET_NAME) {
      throw new Error("未設置 R2_BUCKET_NAME 環境變數");
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const uploadParams = {
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `images/${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadResult = await r2Client.send(
          new PutObjectCommand(uploadParams)
        );
        const [userId, fileType] = file.originalname.split("_");
        if (!userId || !fileType) {
          throw new Error(`檔案名稱格式錯誤: ${file.originalname}`);
        }
        const [fileResult] = await db.query(
          `INSERT INTO UpdateFiles (
            name,
            path,
            size,
            mimetype,
            createat
          ) VALUES (?, ?, ?, ?, NOW())`,
          [
            file.originalname,
            `images/${file.originalname}`,
            file.size,
            file.mimetype,
          ]
        );

        await db.query(
          `INSERT INTO RegisterUpdateImage (
            register_id,
            file_id
          ) VALUES (?, ?)`,
          [userId, fileResult.insertId]
        );

        uploadedFiles.push({
          type: fileType,
          fileId: fileResult.insertId,
          name: file.originalname,
          size: file.size,
          path: `images/${file.originalname}`,
        });
      } catch (fileError) {
        const errorInfo = {
          fileName: file.originalname,
          error: fileError.message,
          time: new Date().toISOString(),
        };
        errors.push(errorInfo);
        console.error("\n=== 檔案處理錯誤 ===");
        console.error(errorInfo);
      }
    }
    if (uploadedFiles.length > 0) {
      res.json({
        success: true,
        message:
          errors.length > 0
            ? `成功上傳 ${uploadedFiles.length} 個檔案，${errors.length} 個檔案失敗`
            : "所有檔案上傳成功",
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      });
    } else {
      throw new Error("所有檔案上傳失敗");
    }
  } catch (error) {
    const errorTime = new Date().toISOString();
    console.error("\n=== 上傳處理失敗 ===");
    console.error("錯誤時間:", errorTime);
    console.error("錯誤類型:", error.name);
    console.error("錯誤訊息:", error.message);
    console.error("錯誤堆疊:", error.stack);
    if (req.files) {
      console.error(
        "相關檔案:",
        req.files.map((f) => ({
          name: f.originalname,
          size: f.size,
          type: f.mimetype,
        }))
      );
    }

    res.status(500).json({
      success: false,
      message: "圖片上傳處理失敗",
      error: error.message,
      time: errorTime,
    });
  }
});

// 更新圖片
app.post("/update-images", upload, async (req, res) => {
  try {
    const [userId] = req.files[0].originalname.split("_");
    if (!req.files || req.files.length === 0) {
      throw new Error("未收到任何檔案");
    }

    if (!userId) {
      throw new Error("未提供用戶ID");
    }

    const [oldFiles] = await db.query(
      `
      SELECT uf.* 
      FROM UpdateFiles uf
      JOIN RegisterUpdateImage rui ON uf.id = rui.file_id
      WHERE rui.register_id = ?
    `,
      [userId]
    );

    for (const oldFile of oldFiles) {
      try {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: oldFile.path,
          })
        );
      } catch (deleteError) {
        console.error(`刪除 R2 檔案失敗: ${oldFile.path}`, deleteError);
      }
    }

    if (oldFiles.length > 0) {
      const oldFileIds = oldFiles.map((file) => file.id);
      await db.query(`DELETE FROM UpdateFiles WHERE id IN (?)`, [oldFileIds]);
      await db.query(
        `DELETE FROM RegisterUpdateImage WHERE register_id = ? AND file_id IN (?)`,
        [userId, oldFileIds]
      );
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const uploadParams = {
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `images/${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await r2Client.send(new PutObjectCommand(uploadParams));

        const [fileResult] = await db.query(
          `INSERT INTO UpdateFiles (
            name,
            path,
            size,
            mimetype,
            createat
          ) VALUES (?, ?, ?, ?, NOW())`,
          [
            file.originalname,
            `images/${file.originalname}`,
            file.size,
            file.mimetype,
          ]
        );

        await db.query(
          `INSERT INTO RegisterUpdateImage (
            register_id,
            file_id
          ) VALUES (?, ?)`,
          [userId, fileResult.insertId]
        );

        const [, fileType] = file.originalname.split("_");
        uploadedFiles.push({
          type: fileType,
          fileId: fileResult.insertId,
          name: file.originalname,
          path: `images/${file.originalname}`,
        });
      } catch (fileError) {
        errors.push({
          fileName: file.originalname,
          error: fileError.message,
          time: new Date().toISOString(),
        });
      }
    }

    if (uploadedFiles.length > 0) {
      res.json({
        success: true,
        message:
          errors.length > 0
            ? `成功更新 ${uploadedFiles.length} 個檔案，${errors.length} 個檔案失敗`
            : "所有檔案更新成功",
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      });
    } else {
      throw new Error("所有檔案更新失敗");
    }
  } catch (error) {
    console.error("\n=== 更新處理失敗 ===");
    console.error(error);
    res.status(500).json({
      success: false,
      message: "圖片更新處理失敗",
      error: error.message,
    });
  }
});

// 後台
// 待審核記錄 API (status 0 和 2)
app.get("/pending-records", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const { keyword, status } = req.query;

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push("rul.status = ?");
      params.push(status);
    } else {
      whereConditions.push("rul.status IN (0, 2)");
    }

    if (keyword) {
      whereConditions.push(`(
        p.name LIKE ? OR 
        rul.name LIKE ? OR 
        rul.tel LIKE ? OR 
        rul.licenseplate LIKE ?
      )`);
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }

    const whereClause = whereConditions.join(" AND ");

    const [records] = await db.query(
      `SELECT rul.*, p.name as parking_name 
       FROM RegisterUpdateLog rul
       LEFT JOIN Parking p ON rul.parking_id = p.id
       WHERE ${whereClause}
       ORDER BY rul.createat DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM RegisterUpdateLog rul
       LEFT JOIN Parking p ON rul.parking_id = p.id
       WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: records,
      pagination: {
        current: page,
        pageSize,
        total: totalResult[0].total,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 已審核記錄 API (status 1)
app.get("/approved-records", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const { keyword } = req.query;

    let whereConditions = ["rul.status = 1"];
    let params = [];

    if (keyword) {
      whereConditions.push(`(
        p.name LIKE ? OR 
        rul.name LIKE ? OR 
        rul.tel LIKE ? OR 
        rul.licenseplate LIKE ?
      )`);
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }

    const whereClause = whereConditions.join(" AND ");

    const [records] = await db.query(
      `SELECT rul.*, p.name as parking_name 
       FROM RegisterUpdateLog rul
       LEFT JOIN Parking p ON rul.parking_id = p.id
       WHERE ${whereClause}
       ORDER BY rul.createat DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total 
   FROM RegisterUpdateLog rul
   LEFT JOIN Parking p ON rul.parking_id = p.id
   WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: records,
      pagination: {
        current: page,
        pageSize,
        total: totalResult[0].total,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// 獲取特定記錄的圖片
app.get("/get-images/:registerId", async (req, res) => {
  try {
    const { registerId } = req.params;
    const sql = `
      SELECT uf.* 
      FROM UpdateFiles uf
      JOIN RegisterUpdateImage rui ON uf.id = rui.file_id
      WHERE rui.register_id = ?
    `;
    const [result] = await db.query(sql, [registerId]);

    res.json({ success: true, images: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 審核通過 API
app.post("/success-status", async (req, res) => {
  try {
    const { id } = req.body;
    const sql = `
      UPDATE RegisterUpdateLog 
      SET status = 1, 
          createat = NOW()
      WHERE id = ?
    `;

    await db.query(sql, [id]);
    res.json({ success: true, message: "審核狀態已更新為通過" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 退件請補件 API
app.post("/error-status", async (req, res) => {
  try {
    const { id, error_message } = req.body;
    const sql = `
      UPDATE RegisterUpdateLog 
      SET status = 2, 
          createat = NOW(),
          error_message = ?
      WHERE id = ?
    `;

    await db.query(sql, [error_message, id]);
    res.json({ success: true, message: "審核狀態已更新為需補件" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const port = process.env.PORT;

// for dev 測試區
// app.listen(port, () => console.log(`測試區伺服器啟動:${port}`));

// for app正式區
https.createServer(options, app).listen(port, () => {
  console.log(`正式區伺服器啟動:${port}`);
});

module.exports = app;
