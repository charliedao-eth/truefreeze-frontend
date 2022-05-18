import { useState } from "react";
import { InputNumber } from "antd";
import { renderSync } from "sass";

export default function CustomNumberInput({
  value,
  onAmountChange,
  label = "",
  ...props
}) {
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
        {...props}
      />
    </label>
  );
}
