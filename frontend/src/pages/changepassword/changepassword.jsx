import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/contexts/auth.context";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { changePasswordSchema } from "./changepassword.schema";
import { Check, X } from "lucide-react"; // or your preferred icon set
import { cn } from "@/lib/utils"; // shadcn utility

export default function ChangePassword() {
  const { changePassword } = useAuth();

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync((data) =>
    changePassword(data.currentPassword, data.newPassword)
  );

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: () => form.reset(),
  });

  // Live password value
  const newPassword = form.watch("newPassword") || "";

  // Password rules (same as your Zod schema)
  const passwordRules = [
    {
      label: "At least 8 characters",
      test: (val) => val.length >= 8,
    },
    {
      label: "Maximum 64 characters",
      test: (val) => val.length <= 64,
    },
    {
      label: "At least one uppercase letter",
      test: (val) => /[A-Z]/.test(val),
    },
    {
      label: "At least one lowercase letter",
      test: (val) => /[a-z]/.test(val),
    },
    {
      label: "At least one number",
      test: (val) => /[0-9]/.test(val),
    },
  ];

  return (
    <div className="flex justify-center items-start pt-10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter current password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />

                    {/* Live password conditions */}
                    {newPassword.length > 0 && (
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {passwordRules.map((rule) => {
                          const isValid = rule.test(newPassword);
                          return (
                            <li
                              key={rule.label}
                              className={cn(
                                "flex items-center gap-2 transition-colors",
                                isValid
                                  ? "text-green-600 dark:text-green-500"
                                  : "text-muted-foreground"
                              )}
                            >
                              {isValid ? (
                                <Check className="h-4 w-4 shrink-0" />
                              ) : (
                                <X className="h-4 w-4 shrink-0 opacity-50" />
                              )}
                              <span>{rule.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Re-enter new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {ErrorAlert}

              <Button
                type="submit"
                loading={loading}
                loadingText="Updating password.."
              >
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}