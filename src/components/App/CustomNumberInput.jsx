import { InputNumber } from "antd";

export default function CustomNumberInput({ onAmountChange }) {
  return (
    <label>
      AMOUNT
      <InputNumber
        style={{
          width: "100%",
        }}
        defaultValue="1"
        min="0"
        step="0.1"
        precision={8}
        onChange={onAmountChange}
        stringMode
      />
    </label>
  );
}
