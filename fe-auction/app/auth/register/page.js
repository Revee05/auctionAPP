"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState("COLLECTOR"); // COLLECTOR or ARTIST
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await authService.register({
        name,
        email,
        password,
        roleName: selectedRole,
      });

      if (result.success) {
        setSuccess(result.message || "Registration successful! Redirecting to login...");
        
        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Create Account</h1>
        <p className="text-zinc-400 text-center mb-6">Join our art community</p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-2 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              onClick={() => setSelectedRole("COLLECTOR")}
              className={`flex-1 py-2 rounded font-semibold transition ${
                selectedRole === "COLLECTOR"
                  ? "bg-black text-white border-2 border-purple-400"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              As Collector
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedRole("ARTIST")}
              className={`flex-1 py-2 rounded font-semibold transition ${
                selectedRole === "ARTIST"
                  ? "bg-black text-white border-2 border-purple-400"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              As Artist
            </Button>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              {selectedRole === "ARTIST" ? "Artist Name" : "Full Name"}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedRole === "ARTIST" ? "Your artist name" : "John Doe"}
              className="text-white"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRole === "ARTIST" ? "artist@example.com" : "you@example.com"}
              className="text-white"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="text-white"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-400 hover:bg-purple-500 text-black font-semibold"
            disabled={loading || !!success}
          >
            {loading ? "Creating account..." : `Register as ${selectedRole === "ARTIST" ? "Artist" : "Collector"}`}
          </Button>
        </form>

        <p className="text-zinc-400 text-center mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-purple-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
