"use client";
import { useSearchParams } from "next/navigation";
import { SuccessVerification } from "./components/SuccessVerification";
import { FailedVerification } from "./components/FailedVerification";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";




function UpdateEmail()
{
    const searchParams = useSearchParams();
    const emailStatus = searchParams.get("status");
    if (emailStatus =="success")
        return <SuccessVerification />
    else if (emailStatus === "error")
        return <FailedVerification />
    return null;
}

export default function UpdateEmailPage() {

    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }
    >
       <UpdateEmail />
    </Suspense>
    )
}
