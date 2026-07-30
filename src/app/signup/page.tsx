import { redirect } from "next/navigation";

// Accounts are created automatically when a trip is submitted — there is no
// separate password signup. Send visitors to the planner.
export default function SignupPage() {
  redirect("/plan");
}
