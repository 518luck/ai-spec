import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/field";

export function SignUpEmail() {
  return (
    <FieldSet>
      <FieldGroup> 
        <Field>
          <FieldLabel>
            <FieldDescription>描述</FieldDescription>
          </FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
