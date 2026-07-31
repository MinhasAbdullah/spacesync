import { Suspense } from "react";
import AuthPage from "@/components/auth-page";
import "../auth.css";

export default function LoginPage() {
  return <Suspense><AuthPage mode="login" /></Suspense>;
}
