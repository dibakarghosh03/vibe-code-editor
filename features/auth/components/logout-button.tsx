import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import React from "react";

const LogoutButton = ({ children }: { children : React.ReactNode }) => {
  const router = useRouter();

  const onLogout = async () => {
    await signOut();
    router.refresh();
  };

    return (
        <span className="cursor-pointer" onClick={onLogout}>
            {children}
        </span>
    );
}

export default LogoutButton;