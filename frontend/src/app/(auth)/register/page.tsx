"use client";
/*"use client" is a Next.js directive that tells Next.js this file should run on the client side (browser).
Why is it needed?
Next.js by default runs all components on the server side. But some things only work in the browser like:
useState
useEffect
onClick
useRef
browser events */


import { auth_service, useAppData } from "@/context/AppContext";
import axios from "axios";
import { redirect } from "next/navigation";
import React, { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { ArrowRight, Briefcase, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/loading";


const RegisterPage = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);


  const { isAuth, setUser, loading, setIsAuth, fetchApplications } =
    useAppData();

    if (loading) return <Loading />;
  

  //This line redirects the user away from the login page if they are already logged in.
  if (isAuth) return redirect("/");



  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); {/*e.preventDefault() stops the page from refreshing on form submit*/}

    setBtnLoading(true);{/*Makes the button show "Loading..." while API call is happening*/}

    const formData = new FormData(); //it's the standard, browser-native way to prepare a mix of text and files for an HTTP request.
    formData.append("role", role);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phoneNumber", phoneNumber);

    if (role === "jobseeker") {
      formData.append("bio", bio);
      if (resume) {
        formData.append("file", resume);
      }
    }

    try {
        {/* Sends email and password to the backend login API*/}
      const { data } = await axios.post(`${auth_service}/api/auth/register`, formData);

      toast.success(data.message); {/*If register SUCCESS Shows a green success popup message */}

      {/* Saves the login token in browser cookies
expires: 15 → cookie stays for 15 days
This keeps the user logged in even after closing the browser*/}
      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });

      setUser(data.registeredUser); //Saves the user data in context
      setIsAuth(true);   //Sets isAuth to true → user is now logged in
      fetchApplications();    //Fetches the user's job applications
    } catch (error: any) {
     
      toast.error(error.response.data.message);
      setIsAuth(false);
    } finally {
      setBtnLoading(false); //Whether register succeeded or failed, stop the loading on the button

    }
  };

  return (
   <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join HireHeaven</h1>
          <p className="text-sm opacity-70">
            Create your account to start a new journey
          </p>
        </div>

        <div className="border border-gray-400 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
            
          <form onSubmit={submitHandler} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                I want to
              </Label>
              <div className="relative">
                <Briefcase className="icon-style" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border-2 border-gray-300 rounded-md bg-transparent "
                  required
                >
                  <option value="">Select your role</option>
                  <option value="jobseeker">Find a Job</option>
                  <option value="recruiter">Hire Talent</option>
                </select>
              </div>
            </div>

            {role && (
              <div className="space-y-5 animate-in fade-in duration-300">

                {/*Full Name*/}
                <div className="space-y-2">
                    {/*htmlFor="name" links the label to an input field that has id="name".*/}
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <Mail className="icon-style" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                
                {/*Email address*/}
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

                {/*Password*/}
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

                {/*Phone number*/}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Lock className="icon-style" />
                    <Input
                      id="phone"
                      type="number"
                      placeholder="+91 1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                  
                  {/*if role is jobseeker then resume && bio*/}
                {role === "jobseeker" && (
                <div className="space-y-5 pt-4 border-t border-gray-400">
                    {/*Resume*/}
                    <div className="space-y-2">
                      <Label htmlFor="resume" className="text-sm font-medium">
                        Resume (PDF)
                      </Label>
                      <div className="relative">
                        
                        <Input
                          id="resume"
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setResume(e.target.files[0]);
                            }
                          }}
                          className="h-11 cursor-pointer"
                        />
                      </div>
                    </div>

                     {/*Bio*/}      
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </Label>
                      <div className="relative">
                        <Lock className="icon-style" />
                        <Input
                          id="bio"
                          type="text"
                          placeholder="Tell us about yourself..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                </div>
                )}

                <Button disabled={btnLoading} className="w-full">
                  {btnLoading ? "Please Wait..." : "Register"}
                  <ArrowRight size={18} />
                </Button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-400">
            <p className="text-center text-sm">
              Already have an account{" "}
              <Link
                href={"/register"}
                className="text-blue-500 font-medium hover:underline transition-all"
              >
                Login?
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
