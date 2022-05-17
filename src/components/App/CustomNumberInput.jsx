import { InputNumber } from "antd";

export default function CustomNumberInput({ value, onAmountChange, label = "" }) {
  return (
    <label>
      {label}
      <InputNumber
        style={{
          width: "100%",
        }}
        value={value}
        min="0"
        step="0.1"
        precision={4}
        onChange={onAmountChange}
        stringMode
      />
    </label>
  );
}
