import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, ApiError } from "@pulse/auth";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from "@pulse/ui";

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: "", email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (mode === "login") {
        await login(values.email, values.password);
      } else {
        await registerUser(values.email, values.password, values.name);
      }
      await navigate({ to: "/" });
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <div className="grid min-h-full place-items-center bg-surface-sunken p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to your PulseHQ workspace."
              : "Get started with PulseHQ in seconds."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {mode === "register" && (
              <Field label="Name" htmlFor="name" error={errors.name?.message}>
                <Input
                  id="name"
                  autoComplete="name"
                  invalid={!!errors.name}
                  {...register("name", { required: "Name is required" })}
                />
              </Field>
            )}
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={!!errors.email}
                {...register("email", { required: "Email is required" })}
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
              hint={mode === "register" ? "At least 12 characters." : undefined}
            >
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                invalid={!!errors.password}
                {...register("password", {
                  required: "Password is required",
                  minLength:
                    mode === "register"
                      ? { value: 12, message: "At least 12 characters" }
                      : undefined,
                })}
              />
            </Field>

            {formError && <p className="text-sm text-danger">{formError}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-fg-muted">
            {mode === "login" ? "New to PulseHQ? " : "Already have an account? "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setFormError(null);
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}