import React, { useState } from "react";
// @ts-ignore - axiosInstance is a JS module without TS declarations
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      const data = res.data;

      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      // Optional: store token_type
      if (data?.token_type) {
        localStorage.setItem("token_type", data.token_type);
      }

      // redirect to dashboard
      navigate("/")
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-blue-100">
        <div className="flex items-center justify-center space-x-3 mb-8 text-primary">
          <span className="material-icons text-3xl">account_balance_wallet</span>
          <h1 className="text-2xl font-bold text-gray-800">FinApp</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
          <p className="text-gray-600">Enter your credentials to access your account</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <span className="material-icons absolute left-4 text-blue-400 text-xl">email</span>
              <input
                className="w-full py-3 pl-12 pr-4 rounded-xl border-blue-100 bg-blue-50/50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-base"
                id="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-icons absolute left-4 text-blue-400 text-xl">lock</span>
              <input
                className="w-full py-3 pl-12 pr-12 rounded-xl border-blue-100 bg-blue-50/50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-base"
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="absolute right-4 text-blue-400 hover:text-blue-600 transition" type="button">
                <span className="material-icons text-xl">visibility</span>
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                className="w-4 h-4 rounded border-blue-200 text-primary focus:ring-primary"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <a className="text-sm text-primary hover:text-blue-600 font-medium" href="#">
              Forgot password?
            </a>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          {/* Submit Button */}
          <button
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex justify-center items-center space-x-2 group"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <span className="material-icons text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <a className="text-primary hover:text-blue-600 font-medium" href="/signup">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
