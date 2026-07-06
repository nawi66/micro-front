import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Field, Input } from "@pulse/ui";
import { useCreateWorkspace } from "../hooks/useWorkspaces.js";

/** Shown when the user belongs to no workspace yet — first-run onboarding. */
export function NoWorkspace() {
  const [name, setName] = useState("");
  const create = useCreateWorkspace();

  return (
    <div className="grid h-full place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your first workspace</CardTitle>
          <CardDescription>
            Workspaces keep your team’s tasks and docs together. You’ll be the owner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) create.mutate(name.trim());
            }}
          >
            <Field label="Workspace name" htmlFor="ws-name">
              <Input
                id="ws-name"
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
            {create.isError && (
              <p className="text-sm text-danger">Could not create workspace. Try again.</p>
            )}
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}