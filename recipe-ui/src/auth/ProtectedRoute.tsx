import { useAuth0 } from '@auth0/auth0-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen text-white bg-dark">Loading...</div>;
    }

    if (!isAuthenticated) {
        loginWithRedirect();
        return null;
    }

    return <>{children}</>;
}
