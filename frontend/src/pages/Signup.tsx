import React, { useState } from "react";
// @ts-ignore - axiosInstance is a JS module without TS declarations
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!pin || !confirmPin) {
      setError("Please provide and confirm a 4-6 digit payment PIN.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4-6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const payload = { name, email, password, pin };
      const res = await axiosInstance.post("/auth/signup", payload);
      const data = res.data;

      // store token & user
      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // redirect to dashboard (simple navigation)
      navigate("/")
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Signup failed";
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Fill in your details to get started</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Full Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1" htmlFor="fullname">
              Full Name
            </label>
            <div className="relative flex items-center">
              <span className="material-icons absolute left-4 text-blue-400 text-xl">person</span>
              <input
                className="w-full py-3 pl-12 pr-4 rounded-xl border-blue-100 bg-blue-50/50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-base"
                id="fullname"
                placeholder="John Doe"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

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
            <p className="text-xs text-gray-500 mt-2 ml-1">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1" htmlFor="confirm-password">
              Confirm Password
            </label>

          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1" htmlFor="pin">
              Payment PIN
            </label>
            <div className="relative flex items-center">
              <span className="material-icons absolute left-4 text-blue-400 text-xl">vpn_key</span>
              <input
                className="w-full py-3 pl-12 pr-12 rounded-xl border-blue-100 bg-blue-50/50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-base"
                id="pin"
                placeholder="4-6 digit PIN"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-1">4-6 digits, used for confirming payments</p>
          </div>

          {/* Confirm PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1" htmlFor="confirm-pin">
              Confirm PIN
            </label>
            <div className="relative flex items-center">
              <span className="material-icons absolute left-4 text-blue-400 text-xl">vpn_key</span>
              <input
                className="w-full py-3 pl-12 pr-12 rounded-xl border-blue-100 bg-blue-50/50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-base"
                id="confirm-pin"
                placeholder="Confirm PIN"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
              />
            </div>
          </div>
            {/* <div className="relative flex items-center">
              <span className="material-icons absolute left-4 text-blue-400 text-xl">lock</span>
              <input
                className="w-full py-3 pl-12 pr-12 rounded-xl border-blue-100 bg-blue-50/50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-base"
                id="confirm-password"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button className="absolute right-4 text-blue-400 hover:text-blue-600 transition" type="button">
                <span className="material-icons text-xl">visibility</span>
              </button>
            </div> */}
          </div>

          {/* Terms & Conditions */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              className="w-4 h-4 mt-0.5 rounded border-blue-200 text-primary focus:ring-primary"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="text-sm text-gray-600">
              I agree to the{" "}
              <a className="text-primary hover:text-blue-600 font-medium" href="#">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="text-primary hover:text-blue-600 font-medium" href="#">
                Privacy Policy
              </a>
            </span>
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}

          {/* Submit Button */}
          <button
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex justify-center items-center space-x-2 group"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? "Creating..." : "Create Account"}</span>
            <span className="material-icons text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <a className="text-primary hover:text-blue-600 font-medium" href="/login">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
