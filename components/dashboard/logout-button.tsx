"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
      disabled={isPending}
      className="text-neutral-700 hover:text-neutral-900 border-neutral-300"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </>
      )}
    </Button>
  );
}