import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useForm } from "react-hook-form";
import { useMediaQuery } from "@/shared/hooks/use-media-query";

export function SignUpEmail() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { isMobile } = useMediaQuery();

  return (
    <form>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel>
              <FieldDescription>邮箱</FieldDescription>
              <Input
                type="email"
                placeholder="panic@thedis.co"
                autoComplete="email"
                required
                autoFocus={!isMobile}
              />
            </FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
