export interface IntegerInputProps {
  name?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  defaultValue?: number;
}

export const IntegerInput = ({ onChange, ...props }: IntegerInputProps) => {
  return (
    <input
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      {...props}
      onChange={(e) => {
        const newValue = e.target.valueAsNumber;
        if (onChange && !isNaN(newValue)) {
          onChange(newValue);
        }
      }}
    />
  );
};
