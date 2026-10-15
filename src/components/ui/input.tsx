"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export const Label = ({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("label", className)} {...props} />
);

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("input", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("input min-h-[100px] resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "input appearance-none bg-white bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9",
      "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%238C8682%27 stroke-width=%272%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')]",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-berry-deep">{children}</p>;
}

type FieldShellProps = {
  label: ReactNode;
  id?: string;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  footer?: ReactNode;
};

export type FieldInputProps = FieldShellProps & {
  as?: "input";
  controlClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export type FieldTextareaProps = FieldShellProps & {
  as: "textarea";
  controlClassName?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export type FieldSelectProps = FieldShellProps & {
  as: "select";
  controlClassName?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

export type FieldCustomProps = FieldShellProps & {
  control: ReactElement<{ id?: string; className?: string }>;
};

export type FieldProps =
  | FieldInputProps
  | FieldTextareaProps
  | FieldSelectProps
  | FieldCustomProps;

function FieldShell({
  fieldId,
  label,
  required,
  hint,
  error,
  className,
  footer,
  control,
}: {
  fieldId: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  footer?: ReactNode;
  control: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label className="!mb-0" htmlFor={fieldId}>
        {label}
        {required ? (
          <span className="text-berry-deep" aria-hidden> *</span>
        ) : null}
      </Label>
      {control}
      {hint ? (
        <p className="mt-1 text-xs text-cocoa-soft/60">{hint}</p>
      ) : null}
      {footer}
      <FieldError>{error}</FieldError>
    </div>
  );
}

function isCustomField(props: FieldProps): props is FieldCustomProps {
  return "control" in props;
}

function isSelectField(props: FieldProps): props is FieldSelectProps {
  return "as" in props && props.as === "select";
}

function isTextareaField(props: FieldProps): props is FieldTextareaProps {
  return "as" in props && props.as === "textarea";
}

function useFieldId(idProp?: string) {
  const autoId = useId();
  return idProp ?? autoId;
}

function FieldInput(props: FieldInputProps) {
  const {
    label,
    id: idProp,
    hint,
    error,
    className,
    footer,
    controlClassName,
    as: _as,
    ...inputProps
  } = props;
  const fieldId = useFieldId(idProp);
  return (
    <FieldShell
      fieldId={fieldId}
      label={label}
      required={inputProps.required}
      hint={hint}
      error={error}
      className={className}
      footer={footer}
      control={
        <Input id={fieldId} className={controlClassName} {...inputProps} />
      }
    />
  );
}

function FieldTextarea(props: FieldTextareaProps) {
  const {
    label,
    id: idProp,
    hint,
    error,
    className,
    footer,
    controlClassName,
    as: _as,
    ...textareaProps
  } = props;
  const fieldId = useFieldId(idProp);
  return (
    <FieldShell
      fieldId={fieldId}
      label={label}
      required={textareaProps.required}
      hint={hint}
      error={error}
      className={className}
      footer={footer}
      control={
        <Textarea
          id={fieldId}
          className={controlClassName}
          {...textareaProps}
        />
      }
    />
  );
}

function FieldSelect(props: FieldSelectProps) {
  const {
    label,
    id: idProp,
    hint,
    error,
    className,
    footer,
    controlClassName,
    children,
    as: _as,
    ...selectProps
  } = props;
  const fieldId = useFieldId(idProp);
  return (
    <FieldShell
      fieldId={fieldId}
      label={label}
      required={selectProps.required}
      hint={hint}
      error={error}
      className={className}
      footer={footer}
      control={
        <Select id={fieldId} className={controlClassName} {...selectProps}>
          {children}
        </Select>
      }
    />
  );
}

function FieldCustom(props: FieldCustomProps) {
  const {
    label,
    id: idProp,
    hint,
    error,
    className,
    footer,
    control,
  } = props;
  const fieldId = useFieldId(idProp);
  const controlNode = isValidElement(control)
    ? cloneElement(control, {
        id: control.props.id ?? fieldId,
        className: cn("input", control.props.className),
      })
    : control;
  return (
    <FieldShell
      fieldId={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={className}
      footer={footer}
      control={controlNode}
    />
  );
}

/** Campo padrão do projeto: label + controle + hint/erro. */
export function Field(props: FieldInputProps): ReactElement;
export function Field(props: FieldTextareaProps): ReactElement;
export function Field(props: FieldSelectProps): ReactElement;
export function Field(props: FieldCustomProps): ReactElement;
export function Field(props: FieldProps): ReactElement {
  if (isCustomField(props)) return FieldCustom(props);
  if (isSelectField(props)) return FieldSelect(props);
  if (isTextareaField(props)) return FieldTextarea(props);
  return FieldInput(props);
}
