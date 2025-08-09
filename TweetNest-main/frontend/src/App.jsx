import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/home/HomePage.jsx";
import LoginPage from "./pages/auth/login/LoginPage.jsx";
import SignupPage from "./pages/auth/signup/SignupPage.jsx";
import Sidebar from "./components/common/Sidebar.jsx";
import RightPanel from "./components/common/RightPanel.jsx";
import NotificationPage from "./pages/notification/NotificationPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner.jsx";

const AuthenticatedLayout = ({ children }) => (
	<>
		<Sidebar />
		<div className="flex-grow">{children}</div>
		<RightPanel />
	</>
);

function App() {
	const { data: authUser, isLoading, isError, error } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			const res = await fetch("/api/auth/getme");
			if (res.status === 401) return null;
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		retry: false,
	});

	if (isLoading) {
		return (
			<div className="h-screen flex justify-center items-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="h-screen flex justify-center items-center">
				<p className="text-red-500">Error: {error.message || "Failed to load user data"}</p>
			</div>
		);
	}

	return (
		<div className="flex max-w-6xl mx-auto">
			<Routes>
				<Route
					path="/"
					element={
						authUser ? (
							<AuthenticatedLayout>
								<HomePage />
							</AuthenticatedLayout>
						) : (
							<Navigate to="/login" />
						)
					}
				/>
				<Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
				<Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} />
				<Route
					path="/notifications"
					element={
						authUser ? (
							<AuthenticatedLayout>
								<NotificationPage />
							</AuthenticatedLayout>
						) : (
							<Navigate to="/login" />
						)
					}
				/>
				<Route
					path="/profile/:username"
					element={
						authUser ? (
							<AuthenticatedLayout>
								<ProfilePage />
							</AuthenticatedLayout>
						) : (
							<Navigate to="/login" />
						)
					}
				/>
			</Routes>
			<Toaster />
		</div>
	);
}

export default App;
