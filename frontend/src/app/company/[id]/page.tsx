"use client";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import React, { useEffect, useRef, useState } from "react";
import { job_service, useAppData } from "@/context/AppContext";
import { Company, Job } from "@/type";
import axios from "axios";
import Loading from "@/components/loading";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Briefcase,
    Building2,
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    FilePlus,
    FileText,
    Globe,
    Laptop,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    Users,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const CompanyPage = () => {
    const { id } = useParams();
    const token = Cookies.get("token");

    const { user, isAuth } = useAppData();
    const [loading, setLoading] = useState(false);
    const [btnLoading, setBtnLoading] = useState(false);
    const [company, setCompany] = useState<Company | null>(null);

    {/*This function fetches the company's details (including its job listings) from the backend using the company id, stores the result in state to update the UI, and manages a loading state throughout the process. It is called after actions like posting a new job or editing one — to refresh the page data without a full page reload.*/ }
    async function fetchCompany() {
        try {
            setLoading(true);
            const { data } = await axios.get(`${job_service}/api/job/company/${id}`);
            setCompany(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCompany();
    }, [id]);

    const isRecruiterOwner =
        user && company && user.user_id === company.recruiter_id; //to check if the recruiter is the owner of that specific commpany 

    //A modal is a popup window that appears on top of the current page, blocking interaction with the rest of the page until it's closed.
    const [isUpdatedModalOpen, setIsUpdatedModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    const addModalRef = useRef<HTMLButtonElement>(null);
    const updateModalRef = useRef<HTMLButtonElement>(null);

    const [title, settitle] = useState("");
    const [description, setdescription] = useState("");
    const [role, setrole] = useState("");
    const [salary, setsalary] = useState("");
    const [location, setlocation] = useState("");
    const [openings, setopenings] = useState("");
    const [job_type, setjob_type] = useState<string>("");
    const [work_location, setwork_location] = useState<string | null>(null);
    const [is_active, setis_active] = useState(true);

    const clearInput = () => {
        settitle("");
        setdescription("");
        setrole("");
        setsalary("");
        setlocation("");
        setopenings("");
        setjob_type("");
        setwork_location("");
        setis_active(true);
    };

    {/*addJobHandler func.-> It collects the job form data, sends it to the backend API to create a new job, shows a success or error notification based on the response, and if successful — refreshes the company data, clears the form, and closes the modal. Throughout the process, it manages a loading state to prevent duplicate submissions.*/ }
    const addJobHandler = async () => {
        setBtnLoading(true);
        try {
            const jobData = {
                title,
                description,
                role,
                salary: Number(salary),
                location,
                openings: Number(openings),
                job_type,
                work_location,
                company_id: id,
            };

            await axios.post(`${job_service}/api/job/new`, jobData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast.success("New job posted successfully");
            fetchCompany();
            clearInput();
            addModalRef.current?.click();
        } catch (error: any) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally {
            setBtnLoading(false);
        }
    };

    {/*This function is for the recruiter only. It deletes a specific job by its jobId. It first asks the user for confirmation via a browser dialog — if confirmed, it sends a DELETE request to the backend with authorization, then refreshes the company data and shows a success notification. If anything goes wrong, it shows an error notification. The loading state is managed throughout to prevent duplicate clicks.*/ }
    const deleteHandler = async (jobId: number) => {
        if (confirm("Are you sure you want to delete this job?")) {
            setBtnLoading(true);
            try {
                await axios.delete(`${job_service}/api/job/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                toast.success("Job has been deleted");
                fetchCompany();
            } catch (error: any) {
                toast.error(error.response.data.message);
            } finally {
                setBtnLoading(false);
            }
        }
    };

    {/*This function is for the recruiter only. When the recruiter clicks the "Edit" button on a job, this function stores the selected job, pre-fills all the form fields with that job's existing data, and opens the update modal — so the recruiter can edit the existing values instead of filling everything from scratch. */ }
    const handleOpenUpdateModal = (job: Job) => {
        setSelectedJob(job);
        settitle(job.title);
        setdescription(job.description);
        setrole(job.role);
        setsalary(String(job.salary || ""));
        setlocation(job.location || "");
        setopenings(String(job.openings));
        setjob_type(job.job_type);
        setwork_location(job.work_location);
        setis_active(job.is_active);
        setIsUpdatedModalOpen(true);
    };

    {/*This function is for the recruiter only. It is the cleanup function for the edit modal — it closes the modal, clears the selected job from state, and resets all form fields. This ensures that when the recruiter opens the edit modal for a different job next time, they start with a clean, fresh form instead of seeing leftover data from the previously edited job.*/ }
    const handleCloseUpdateModal = () => {
        setIsUpdatedModalOpen(false);
        setSelectedJob(null);
        clearInput();
    };

    {/*This function is for the recruiter only. It updates an existing job by sending a PUT request to the backend with the edited form data and the specific job_id. It first checks if a job is actually selected, then on success it refreshes the company data, shows a success notification, and closes the edit modal cleanly. It is essentially the save button logic for the edit job form. */ }
    const updateJobHandler = async () => {
        if (!selectedJob) return;

        setBtnLoading(true);
        try {
            const updateData = {
                title,
                description,
                role,
                salary: Number(salary),
                location,
                openings: Number(openings),
                job_type,
                work_location,
                is_active,
            };

            await axios.put(
                `${job_service}/api/job/${selectedJob.job_id}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success("Job updated successfully");
            fetchCompany();
            handleCloseUpdateModal();
        } catch (error: any) {
            toast.error(error.response.data.message);
        } finally {
            setBtnLoading(false);
        }
    };

    if (loading) return <Loading />;
    return (
        <div className="min-h-screen bg-secondary/30">
            {company && (
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <Card className="overflow-hidden shadow-lg border-2 mb-8">

                        <div className="h-32 bg-blue-600"></div>

                        <div className="px-8 pb-8">

                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16">

                                {/*Company logo */}
                                <div className="w-32 h-32 rounded-2xl border-4 border-background overflow-hidden shadow-xl bg-background shrink-0">
                                    <img
                                        src={company.logo}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/*Company name and description*/}
                                <div className="flex-1 md:mb-4">
                                    <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                                    <p className="text-base leading-relaxed opacity-80 max-w-3xl">
                                        {company.description}
                                    </p>
                                </div>

                                {/*Company website */}
                                <Link
                                    href={company.website}
                                    target="_blank"
                                    className="md:mb-4"
                                >
                                    <Button className="gap-2">
                                        <Globe size={18} />
                                        Visit Website
                                    </Button>
                                </Link>

                            </div>

                        </div>

                    </Card>

                    {/* It is the "Post New Job" form modal that appears when the recruiter clicks the "Post New Job" button. It collects all the necessary job details through input fields and dropdowns, and on submission calls addJobHandler to create the new job in the backend. The Cancel button safely closes the modal without making any changes. */}
                    <Dialog>
                        {/* Job section */}
                        <Card className="shadow-lg border-2 overflow-hidden">

                            <div className="bg-blue-600 border-b p-6">

                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <Briefcase size={20} className="text-blue-600" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">
                                        Open Positions
                                    </h2>
                                    <p className="text-sm opacity-70 text-white">
                                        {company.jobs?.length || 0} active job
                                        {company.jobs?.length !== 1 ? "s" : ""}
                                    </p>
                                </div>

                            </div>

                            {isRecruiterOwner && (
                                <>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2">
                                            <Plus size={18} />
                                            Post New Job
                                        </Button>
                                    </DialogTrigger>

                                    {/*overflow-y-auto is a Tailwind CSS utility class that controls vertical scrolling.*/}
                                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}
                                        onPointerDownOutside={(e) => e.preventDefault()}>

                                        <DialogHeader>
                                            <DialogTitle className="text-2xl flex items-center gap-2">
                                                <FilePlus size={24} className="text-blue-600" strokeWidth={2} />
                                                Post a new Job
                                            </DialogTitle>
                                        </DialogHeader>

                                        <div className="space-y-5 py-4">

                                            {/*For job title*/}
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="title"
                                                    className="text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Briefcase size={16} /> Job Title
                                                </Label>
                                                <Input
                                                    id="title"
                                                    type="text"
                                                    placeholder="Enter Job title"
                                                    className="h-11"
                                                    value={title}
                                                    onChange={(e) => settitle(e.target.value)}
                                                />
                                            </div>

                                            {/*For description*/}
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="description"
                                                    className="text-sm font-medium flex items-center gap-2"
                                                >
                                                    <FileText size={16} /> Description
                                                </Label>
                                                <Input
                                                    id="description"
                                                    type="text"
                                                    placeholder="Enter Description"
                                                    className="h-11"
                                                    value={description}
                                                    onChange={(e) => setdescription(e.target.value)}
                                                />
                                            </div>

                                            {/*For Role/Department*/}
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="role"
                                                    className="text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Building2 size={16} /> Role/Department
                                                </Label>
                                                <Input
                                                    id="role"
                                                    type="text"
                                                    placeholder="Enter Job Role"
                                                    className="h-11"
                                                    value={role}
                                                    onChange={(e) => setrole(e.target.value)}
                                                />
                                            </div>

                                            {/*For salary*/}
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="salary"
                                                    className="text-sm font-medium flex items-center gap-2"
                                                >
                                                    <DollarSign size={16} /> Salary
                                                </Label>
                                                <Input
                                                    id="salary"
                                                    type="number"
                                                    placeholder="Enter salary"
                                                    className="h-11 cursor-pointer"
                                                    value={salary}
                                                    onChange={(e) => setsalary(e.target.value)}
                                                />
                                            </div>

                                            {/*For Openings*/}
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="openings"
                                                    className="text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Users size={16} /> Openings
                                                </Label>
                                                <Input
                                                    id="openings"
                                                    type="number"
                                                    placeholder="Eg. 5"
                                                    className="h-11 cursor-pointer"
                                                    value={openings}
                                                    onChange={(e) => setopenings(e.target.value)}
                                                />
                                            </div>

                                            {/*For Location*/}
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="location"
                                                    className="text-sm font-medium flex items-center gap-2"
                                                >
                                                    <MapPin size={16} /> Location
                                                </Label>
                                                <Input
                                                    id="location"
                                                    type="text"
                                                    placeholder="Enter location"
                                                    className="h-11 cursor-pointer"
                                                    value={location}
                                                    onChange={(e) => setlocation(e.target.value)}
                                                />
                                            </div>

                                            {/*For job type and work_location selection*/}
                                            <div className="grid md:grid-cols-2 gap-4">

                                                {/*For job type */}
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor="job_type"
                                                        className="text-sm font-medium flex items-center gap-1"
                                                    >
                                                        <Clock size={16} /> Job Type
                                                    </Label>
                                                    <Select value={job_type} onValueChange={(value) => setjob_type(value ?? "")}>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Select job type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Full-time">Full-time</SelectItem>
                                                            <SelectItem value="Part-time">Part-time</SelectItem>
                                                            <SelectItem value="Contract">Contract</SelectItem>
                                                            <SelectItem value="Internship">Internship</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>


                                                {/*For  work location */}
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor="work_location"
                                                        className="text-sm font-medium flex items-center gap-1"
                                                    >
                                                        <Laptop size={16} /> Work Location
                                                    </Label>
                                                    <Select
                                                        value={work_location}
                                                        onValueChange={(value: string | null) => setwork_location(value)}
                                                    >
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Select Work Location" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="On-site">On-site</SelectItem>
                                                            <SelectItem value="Remote">Remote</SelectItem>
                                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                            </div>

                                        </div>

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button ref={addModalRef} variant={"outline"}>
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                disabled={btnLoading}
                                                onClick={addJobHandler}
                                                className="gap-2"
                                            >
                                                {btnLoading ? "Posting job..." : "Post Job"}
                                            </Button>
                                        </DialogFooter>

                                    </DialogContent>
                                </>
                            )}

                            <div className="p-6">
                                {company.jobs && company.jobs.length > 0 ? (
                                    <div className="space-y-4">
                                        {company.jobs.map((j) => (
                                            <div
                                                key={j.job_id}
                                                className="p-5 rounded-lg border-2 hover:border-blue-500 transition-all bg-background"
                                            >
                                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                                    <div className="flex-1 min-w-0">

                                                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                            <h3 className="text-xl font-semibold">
                                                                {j.title}
                                                            </h3>

                                                            <span
                                                                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${j.is_active
                                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600"
                                                                    }`}
                                                            >
                                                                {j.is_active ? (
                                                                    <CheckCircle size={14} />
                                                                ) : (
                                                                    <XCircle size={14} />
                                                                )}
                                                                {j.is_active ? "Active" : "Inactive"}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">

                                                            {/*To show job role */}
                                                            <div className="flex items-center gap-2 opacity-70">
                                                                <Building2 size={16} />
                                                                <span>{j.role}</span>
                                                            </div>

                                                            {/*To show salary */}
                                                            <div className="flex items-center gap-2 opacity-70">
                                                                <DollarSign size={16} />
                                                                <span>
                                                                    {j.salary
                                                                        ? `₹ ${j.salary.toLocaleString()}`
                                                                        : "Not Disclosed"}
                                                                </span>
                                                            </div>

                                                            {/*To show job location */}
                                                            <div className="flex items-center gap-2 opacity-70">
                                                                <MapPin size={16} />
                                                                <span>{j.location}</span>
                                                            </div>

                                                            {/*To show job type */}
                                                            <div className="flex items-center gap-2 opacity-70">
                                                                <Laptop size={16} />
                                                                <span>
                                                                    {j.work_location} ({j.job_type})
                                                                </span>
                                                            </div>

                                                            {/*To show openings */}
                                                            <div className="flex items-center gap-2 opacity-70">
                                                                <Users size={16} />
                                                                <span>{j.openings} openings</span>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    {/*For view and edit option */}
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/jobs/${j.job_id}`}>
                                                            <Button
                                                                variant={"outline"}
                                                                size={"sm"}
                                                                className="gap-2"
                                                            >
                                                                <Eye size={16} /> View
                                                            </Button>
                                                        </Link>

                                                        {isRecruiterOwner && (
                                                            <>
                                                                <Button
                                                                    onClick={() => handleOpenUpdateModal(j)}
                                                                    variant={"outline"}
                                                                    size={"sm"}
                                                                    className="gap-2"
                                                                >
                                                                    <Pencil size={16} />
                                                                    Edit
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                                <Briefcase size={32} className="opacity-40" />
                                            </div>
                                            <p className="text-base opacity-70 mb-2">
                                                No jobs postet yet
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                        </Card>
                    </Dialog>

                    {/*This dialog is for the recruiter only. It is the "Edit Job" modal that opens when the recruiter clicks the "Edit" button on a job card. It comes pre-filled with the job's existing data (done by handleOpenUpdateModal) and allows the recruiter to update all job details including an extra "Active/Inactive" status toggle that the "Post New Job" dialog doesn't have. On submission it calls updateJobHandler to save the changes to the backend.*/}
                    <Dialog
                        open={isUpdatedModalOpen}
                        onOpenChange={setIsUpdatedModalOpen}
                    >
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                    Update Job
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-5 py-4">

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="title"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Briefcase size={16} /> Job Title
                                    </Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="Enter Job title"
                                        className="h-11"
                                        value={title}
                                        onChange={(e) => settitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="description"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <FileText size={16} /> Description
                                    </Label>
                                    <Input
                                        id="description"
                                        type="text"
                                        placeholder="Enter Description"
                                        className="h-11"
                                        value={description}
                                        onChange={(e) => setdescription(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="role"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Building2 size={16} /> Role/Department
                                    </Label>
                                    <Input
                                        id="role"
                                        type="text"
                                        placeholder="Enter Job Role"
                                        className="h-11"
                                        value={role}
                                        onChange={(e) => setrole(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="salary"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <DollarSign size={16} /> Salary
                                    </Label>
                                    <Input
                                        id="salary"
                                        type="number"
                                        placeholder="Enter salary"
                                        className="h-11 cursor-pointer"
                                        value={salary}
                                        onChange={(e) => setsalary(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="openings"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Users size={16} /> Openings
                                    </Label>
                                    <Input
                                        id="openings"
                                        type="number"
                                        placeholder="Eg. 5"
                                        className="h-11 cursor-pointer"
                                        value={openings}
                                        onChange={(e) => setopenings(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="location"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <MapPin size={16} /> Location
                                    </Label>
                                    <Input
                                        id="location"
                                        type="text"
                                        placeholder="Enter location"
                                        className="h-11 cursor-pointer"
                                        value={location}
                                        onChange={(e) => setlocation(e.target.value)}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="job_type"
                                            className="text-sm font-medium flex items-center gap-1"
                                        >
                                            <Clock size={16} /> Job Type
                                        </Label>
                                        <Select value={job_type} onValueChange={(value) => { if (value) setjob_type(value) }}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select job type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full-time">Full-time</SelectItem>
                                                <SelectItem value="Part-time">Part-time</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Internship">Internship</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="work_location"
                                            className="text-sm font-medium flex items-center gap-1"
                                        >
                                            <Laptop size={16} /> Work Location
                                        </Label>
                                        <Select
                                            value={work_location}
                                            onValueChange={(value) => { if (value) setwork_location(value) }}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select Work Location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="On-site">On-site</SelectItem>
                                                <SelectItem value="Remote">Remote</SelectItem>
                                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="update-is_active"
                                            className="text-sm font-medium flex items-center gap-2"
                                        >
                                            {is_active ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : (
                                                <XCircle size={16} className="text-gray-50" />
                                            )}
                                        </Label>

                                        <Select
                                            value={is_active ? "true" : "false"}
                                            onValueChange={(value) => setis_active(value === "true")}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">Active</SelectItem>
                                                <SelectItem value="false">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button ref={addModalRef} variant={"outline"}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    disabled={btnLoading}
                                    onClick={updateJobHandler}
                                    className="gap-2"
                                >
                                    {btnLoading ? "Updating job..." : "Update Job"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            )}
        </div>
    );
};

export default CompanyPage;
