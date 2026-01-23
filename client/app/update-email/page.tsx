'use client'    
import { useSearchParams } from "next/navigation";
import { SuccessVerification } from "./components/SuccessVerification";
import { FailedVerification } from "./components/FailedVerification";



export default function UpdateEmailPage() {
    const searchParams = useSearchParams();

    const emailStatus = searchParams.get("status");
    if (emailStatus === "success") {
        return <SuccessVerification />;
    } else if (emailStatus === "error") {
        return <FailedVerification />;
    }
}
