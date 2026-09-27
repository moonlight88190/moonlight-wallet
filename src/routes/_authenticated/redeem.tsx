import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/redeem")({
  beforeLoad: () => {
    throw redirect({
      to: "/withdraw",
      replace: true,
    });
  },
});
