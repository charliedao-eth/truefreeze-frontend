import { useState } from "react";
import { InputNumber } from "antd";

export default function CustomNumberInput({ value, onAmountChange, label = "", ...props }) {
  const [revertValue, setRevertValue] = useState(value);

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
        onFocus={() => {
          setRevertValue(value);
          onAmountChange("");
        }}
        onBlur={(evt) => {
          const inputIsEmpty = !(evt?.target?.value) && value === "";
          const revertIsNumber = isValidNumber(revertValue);
          
          if(inputIsEmpty) {
            if(revertIsNumber) {
              onAmountChange(revertValue);
            } else {
              onAmountChange("1");
            }
          } else {
            const valueIsNumber = isValidNumber(evt?.target?.value);
            !valueIsNumber && onAmountChange(revertValue); // if you input something like "bananas" then click out we just revert to some sane number instead of blowing up with NaN
          }
        }}
        onChange={onAmountChange}
        stringMode
        controls={false}
        {...props}
      />
    </label>
  );
}

const isValidNumber = (val) => {
  const parsedValue = parseFloat(val);
  return typeof parsedValue === "number" && !isNaN(val);
}