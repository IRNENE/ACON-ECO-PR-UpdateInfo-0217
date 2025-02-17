import React, { useState, useEffect } from "react";
import {
  Table,
  Modal,
  Button,
  Form,
  Input,
  message,
  Space,
  Image,
  Tag,
  Descriptions,
  Select,
} from "antd";
import axios from "axios";
import styles from "../styles/MainPage.module.scss";
import dayjs from "dayjs";
import "dayjs/locale/zh-tw";
import PropTypes from "prop-types";

const SearchForm = ({
  type,
  searchState,
  setSearchState,
  onSearch,
  onReset,
}) => {
  return (
    <div className={styles.searchForm}>
      <div className={styles.searchRow}>
        <Space>
          <Input.Search
            placeholder="搜尋停車場/姓名/電話/車牌號碼"
            value={searchState.keyword}
            onChange={(e) =>
              setSearchState((prev) => ({
                ...prev,
                keyword: e.target.value,
              }))
            }
            onSearch={onSearch}
            style={{ width: 300 }}
            enterButton
          />
          {type === "pending" && (
            <div className={styles.searchRow} style={{ marginTop: "8px" }}>
              <Space>
                <Select
                  placeholder="審核狀態"
                  value={searchState.status}
                  onChange={(value) =>
                    setSearchState((prev) => ({
                      ...prev,
                      status: value,
                    }))
                  }
                  style={{ width: 200 }}
                  options={[
                    { value: "", label: "全部" },
                    { value: "0", label: "未審核" },
                    { value: "2", label: "待補件" },
                  ]}
                />
              </Space>
            </div>
          )}
          <Button onClick={onReset}>重置</Button>
        </Space>
      </div>
    </div>
  );
};

SearchForm.propTypes = {
  type: PropTypes.oneOf(["pending", "approved"]).isRequired,
  searchState: PropTypes.shape({
    keyword: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  setSearchState: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};
dayjs.locale("zh-tw");

export default function MainPage() {
  const CLOUDFLARE_PUBLIC_URL = import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [pendingData, setPendingData] = useState([]);
  const [approvedData, setApprovedData] = useState([]);
  const [pendingPagination, setPendingPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [approvedPagination, setApprovedPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingSearch, setPendingSearch] = useState({
    keyword: "",
    status: "",
  });

  const [approvedSearch, setApprovedSearch] = useState({
    keyword: "",
  });

  const fetchPendingData = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page,
        ...pendingSearch,
      });
      const response = await axios.get(`/api/pending-records?${params}`);
      setPendingData(response.data.data);
      setPendingPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching pending data:", error);
      message.error("獲取待審核資料失敗");
    }
  };

  const fetchApprovedData = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page,
        ...approvedSearch,
      });

      const response = await axios.get(`/api/approved-records?${params}`);
      setApprovedData(response.data.data);
      setApprovedPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching approved data:", error);
      message.error("獲取已審核資料失敗");
    }
  };

  const handleLogin = async (values) => {
    if (values.username === "admin" && values.password === "admin124") {
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true");
      message.success("登入成功");

      fetchPendingData();
      fetchApprovedData();
    } else {
      message.error("帳號或密碼錯誤");
    }
  };

  const handleView = async (record) => {
    setSelectedRecord(record);
    try {
      const response = await axios.get(`/api/get-images/${record.id}`);
      setUserImages(response.data.images);
    } catch (error) {
      console.error("Error fetching images:", error);
      message.error("獲取圖片失敗");
    }
    setModalVisible(true);
  };

  useEffect(() => {
    const loginStatus = localStorage.getItem("isLoggedIn") === "true";
    if (loginStatus) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPendingData();
      fetchApprovedData();
    }
  }, [isLoggedIn]);

  const columns = [
    { title: "停車場", dataIndex: "parking_name", key: "parking_name" },

    { title: "姓名", dataIndex: "name", key: "name" },
    { title: "電話", dataIndex: "tel", key: "tel" },
    { title: "車牌號碼", dataIndex: "licenseplate", key: "licenseplate" },
    {
      title: "審核狀態",
      dataIndex: "status",
      key: "status",
      width: 180,

      render: (status) => {
        const statusMap = {
          0: { text: "未審核", color: "#999999" },
          1: { text: "審核成功", color: "#4f9c29" },
          2: { text: "已退件，等用戶補件", color: "#1890ff" },
        };

        return (
          <Tag
            color={statusMap[status]?.color || "#999999"}
            style={{
              fontSize: "14px",
              padding: "4px 12px",
            }}
          >
            {statusMap[status]?.text || "未知狀態"}
          </Tag>
        );
      },
    },

    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleView(record)}>
          查看
        </Button>
      ),
    },
    {
      title: "時間",
      dataIndex: "createat",
      key: "createat",
      width: 180,
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 300, margin: "100px auto" }}>
        <Form form={loginForm} onFinish={handleLogin}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "請輸入帳號" }]}
          >
            <Input placeholder="帳號" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "請輸入密碼" }]}
          >
            <Input.Password placeholder="密碼" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登入
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }

  const identityMap = {
    1: "一般優惠",
    2: "身心障礙者",
    3: "小資優惠價(限本停車場汽車租戶)",
    4: "里民",
    5: "ACON-ECO會員",
    6: "一般優惠(機)",
  };

  const imageNameMap = {
    back_id: "身分證反面",
    disability: "身心障礙證明",
    front_id: "身分證正面",
    vehicle: "行照",
    residence: "居留證",
  };

  const identityLabel = identityMap[selectedRecord?.identity_id] || "未知身份";

  const handleAudit = async (id, status) => {
    try {
      await axios.post("/api/success-status", { id, status });
      message.success("已更新審核狀態為通過");
      fetchPendingData(pendingPagination.current);
      fetchApprovedData(approvedPagination.current);
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("更新審核狀態為通過，失敗");
    }
  };

  const handleError = async (id) => {
    setSelectedId(id);
    setErrorModalVisible(true);
  };

  const handleErrorSubmit = async () => {
    if (!errorMessage.trim()) {
      message.error("請輸入退件原因");
      return;
    }

    try {
      await axios.post("/api/error-status", {
        id: selectedId,
        error_message: errorMessage,
      });
      message.success("已更新審核狀態為需補件");
      fetchPendingData(pendingPagination.current);
      fetchApprovedData(approvedPagination.current);
      setErrorModalVisible(false);
      setErrorMessage("");
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("更新審核狀態為需補件，失敗");
    }
  };
  // 圖片快取問題
  const generateCacheBuster = () => {
    return `?t=${new Date().getTime()}`;
  };

  const renderModalFooter = (record) => {
    if (record.status === 2) {
      return null;
    }

    if (record.status === 0) {
      return (
        <Space>
          <Button type="primary" danger onClick={() => handleError(record.id)}>
            退件請補件
          </Button>
          <Button type="primary" onClick={() => handleAudit(record.id, 1)}>
            審核通過
          </Button>
        </Space>
      );
    }

    if (record.status === 1) {
      return (
        <Space>
          <Button type="primary" danger onClick={() => handleError(record.id)}>
            退件請補件
          </Button>
        </Space>
      );
    }

    return null;
  };

  const handlePendingSearch = () => {
    fetchPendingData(1);
  };

  const handleApprovedSearch = () => {
    fetchApprovedData(1);
  };

  const handlePendingReset = () => {
    setPendingSearch({
      keyword: "",
      status: "",
    });
    fetchPendingData(1);
  };

  const handleApprovedReset = () => {
    setApprovedSearch({
      keyword: "",
    });
    fetchApprovedData(1);
  };

  return (
    <>
      <div className={styles.pageBackground}>
        <div className={styles.pageTitle}>
          <h1>月租平台審核後台</h1>
        </div>
        {/* 待審核表格 */}
        <div className={styles.tableContainer}>
          <h4 className={styles.sectionTitle}>待審核清單</h4>

          <SearchForm
            type="pending"
            searchState={pendingSearch}
            setSearchState={setPendingSearch}
            onSearch={handlePendingSearch}
            onReset={handlePendingReset}
          />

          <Table
            columns={columns}
            dataSource={pendingData}
            pagination={{
              ...pendingPagination,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 筆`,
            }}
            onChange={(pagination) => {
              fetchPendingData(pagination.current);
            }}
            rowKey="id"
          />
        </div>

        {/* 已審核表格 */}
        <div className={styles.tableContainer}>
          <h4 className={styles.sectionTitle}>已審核清單</h4>
          <SearchForm
            type="approved"
            searchState={approvedSearch}
            setSearchState={setApprovedSearch}
            onSearch={handleApprovedSearch}
            onReset={handleApprovedReset}
          />

          <Table
            columns={columns}
            dataSource={approvedData}
            pagination={{
              ...approvedPagination,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 筆`,
            }}
            onChange={(pagination) => {
              fetchApprovedData(pagination.current);
            }}
            rowKey="id"
          />
        </div>

        <Modal
          title="審核補件資料"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          width={800}
          footer={selectedRecord && renderModalFooter(selectedRecord)}
        >
          {selectedRecord && (
            <div>
              <Descriptions title="基本資料" bordered column={2}>
                <Descriptions.Item label="姓名">
                  {selectedRecord.name}
                </Descriptions.Item>
                <Descriptions.Item label="身分證字號">
                  {selectedRecord.identity_no}
                </Descriptions.Item>
                <Descriptions.Item label="電話">
                  {selectedRecord.tel}
                </Descriptions.Item>
                <Descriptions.Item label="車牌號碼">
                  {selectedRecord.licenseplate}
                </Descriptions.Item>
                <Descriptions.Item label="身分類別">
                  {identityLabel}
                </Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>
                  {selectedRecord.address_city}
                  {selectedRecord.address_county}
                  {selectedRecord.address}
                </Descriptions.Item>
                <Descriptions.Item label="退件原因" span={1}>
                  {selectedRecord.error_message}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions
                title="相關圖片"
                bordered
                column={2}
                style={{ marginTop: 20 }}
              ></Descriptions>
              <Image.PreviewGroup>
                <Space
                  size="middle"
                  style={{ width: "100%", overflowX: "auto" }}
                >
                  {userImages.map((image, index) => {
                    const imageName = image.name.split("_").slice(1).join("_");
                    const displayName = imageNameMap[imageName] || imageName;

                    return (
                      <Image
                        key={index}
                        width={180}
                        height={120}
                        style={{ objectFit: "cover" }}
                        src={`${CLOUDFLARE_PUBLIC_URL}/${
                          image.path
                        }${generateCacheBuster()}`}
                        alt={displayName}
                        preview={{
                          mask: `點擊查看大圖 ${displayName}`,
                        }}
                      />
                    );
                  })}
                </Space>
              </Image.PreviewGroup>
            </div>
          )}
        </Modal>

        <Modal
          title="請輸入退件原因"
          open={errorModalVisible}
          onOk={handleErrorSubmit}
          onCancel={() => {
            setErrorModalVisible(false);
            setErrorMessage("");
          }}
        >
          <Input.TextArea
            rows={4}
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="請輸入退件原因..."
          />
        </Modal>
      </div>
    </>
  );
}
