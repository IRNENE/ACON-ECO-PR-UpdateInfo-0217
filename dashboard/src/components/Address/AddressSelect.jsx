import React, { useState, useEffect } from "react";
import styles from "../../styles/AddressSelect.module.scss";
import { getCityList, getDistrictList } from "./taiwanDistricts";

function AddressSelect({
  initialCity,
  initialDistrict,
  onCityChange,
  onDistrictChange,
}) {
  const [selectedCity, setSelectedCity] = useState(initialCity || "");
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialDistrict || ""
  );

  useEffect(() => {
    setSelectedCity(initialCity || "");
    setSelectedDistrict(initialDistrict || "");
  }, [initialCity, initialDistrict]);

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setSelectedCity(newCity);
    setSelectedDistrict("");
    onCityChange(newCity);
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    onDistrictChange(newDistrict);
  };

  const cities = getCityList();
  const districts = getDistrictList(selectedCity);

  return (
    <div className={styles.selectGroup}>
      <select
        value={selectedCity}
        onChange={handleCityChange}
        className={styles.select}
        required
      >
        <option value="">請選擇縣市</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <select
        value={selectedDistrict}
        onChange={handleDistrictChange}
        className={styles.select}
        disabled={!selectedCity}
        required
      >
        <option value="">請選擇區域</option>
        {districts.map((district) => (
          <option key={district} value={district}>
            {district}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AddressSelect;
