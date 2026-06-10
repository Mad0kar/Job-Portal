"use client";
import { auth_service, useAppData } from "@/context/AppContext";
import axios from "axios";
import { redirect } from "next/navigation";
import React, { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/loading";


const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const { isAuth, setUser, loading, setIsAuth, fetchApplications } =
    useAppData();

  if (loading) return <Loading />;

  //This line redirects the user away from the login page if they are already logged in.
  if (isAuth) return redirect("/");


  {/*submitHandler is the login function that runs when the form is submitted. It sends email and password to the backend, and if successful it saves the 
    token in cookies, stores user data in context, and marks the user as logged in. If it fails it shows an error message. The finally block always stops the 
    loading button at the end regardless of success or failure. */}
  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); {/*e.preventDefault() stops the page from refreshing on form submit*/}

    setBtnLoading(true);{/*Makes the button show "Loading..." while API call is happening*/}
    try {
        {/* Sends email and password to the backend login API*/}
      const { data } = await axios.post(`${auth_service}/api/auth/login`, {
        email,
        password,
      });

      toast.success(data.message); {/*If login SUCCESS Shows a green success popup message */}

      {/* Saves the login token in browser cookies
expires: 15 → cookie stays for 15 days
This keeps the user logged in even after closing the browser*/}
      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });

      setUser(data.userObject); //Saves the user data in context
      setIsAuth(true);   //Sets isAuth to true → user is now logged in
      fetchApplications();    //Fetches the user's job applications
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message);
      setIsAuth(false);
    } finally {
      setBtnLoading(false); //Whether login succeeded or failed, stop the loading on the button

    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back to HireHeaven
          </h1>
          <p className="text-sm opacity-70">Sign in to continue your journey</p>
        </div>
        
        <div className="border border-gray-400 rounded-2xl p-8 shadow-lg backdrop-blur-sm">

          <form onSubmit={submitHandler} className="space-y-5">

            {/*Input space to write email to sign in*/}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="icon-style" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

              {/*Input space to write Password to sign in*/}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="icon-style" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

              {/*Forgot Password option*/}
            <div className="flex items-center justify-end">
              <Link
                href={"/forgot"}
                className="text-sm text-blue-500 hover:underline transition-all"
              >
                Forgot Password?
              </Link>
            </div>
               
                 {/*Sign in ->   button*/}
            <Button disabled={btnLoading} className="w-full">
              {btnLoading ? "Signing in..." : "Sign In"}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-400">
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <Link
                href={"/register"}
                className="text-blue-500 font-medium hover:underline transition-all"
              >
                Create a new account?
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;
