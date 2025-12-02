"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState("collector"); // collector atau artist
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setRole } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Replace with real API call to backend
      const response = await fetch("http://localhost:3500/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: selectedRole 
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      const data = await response.json();
      
      // Set user & role dari response backend
      setUser(data.user);
      setRole(data.role);
      
      // Simpan di localStorage
      localStorage.setItem("user", JSON.stringify({ user: data.user, role: data.role }));

      // Redirect berdasarkan role
      if (data.role === "artist") {
        router.push("/my-art");
      } else if (data.role === "collector") {
        router.push("/my-bids");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err.message);
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

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              onClick={() => setSelectedRole("collector")}
              className={`flex-1 py-2 rounded font-semibold transition ${
                selectedRole === "collector"
                  ? "bg-black text-white border-2 border-purple-400"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              As Collector
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedRole("artist")}
              className={`flex-1 py-2 rounded font-semibold transition ${
                selectedRole === "artist"
                  ? "bg-black text-white border-2 border-purple-400"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              As Artist
            </Button>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              {selectedRole === "artist" ? "Artist Name" : "Full Name"}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedRole === "artist" ? "Your artist name" : "John Doe"}
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
              placeholder={selectedRole === "artist" ? "artist@example.com" : "you@example.com"}
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
            disabled={loading}
          >
            {loading ? "Creating account..." : `Register as ${selectedRole === "artist" ? "Artist" : "Collector"}`}
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
