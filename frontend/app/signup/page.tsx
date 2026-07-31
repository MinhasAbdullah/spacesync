import { Suspense } from "react";
import AuthPage from "@/components/auth-page";
import "../auth.css";

export default function SignupPage() {
  return <Suspense><AuthPage mode="signup" /></Suspense>;
}
