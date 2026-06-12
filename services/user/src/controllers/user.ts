import { TryCatch } from "../utils/TryCatch.js";
import ErrorHandler from "../utils/errorHandler.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import { sql } from "../utils/db.js";
import axios from "axios";
import getBuffer from "../utils/buffer.js";

interface UploadResponse {
    url: string;
    public_id: string;
  }

  //function to get my profile
export const myProfile = TryCatch(
    async (req: AuthenticatedRequest, res, next) => {
      const user = req.user;
  
     res.json(user); 
    }
  );
  
  //function to get other user's profile 
  export const getUserProfile = TryCatch(async (req, res, next) => {
    const { userId } = req.params;
  
    const users = await sql`
          SELECT u.user_id, u.name, u.email, u.phone_number, u.role, u.bio, u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.subscription,
          ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) as skills
          FROM users u LEFT JOIN user_skills us ON u.user_id = us.user_id
          LEFT JOIN skills s ON us.skill_id = s.skill_id
          WHERE u.user_id = ${userId}
          GROUP BY u.user_id;
          `;
  
    if (users.length === 0) {
      throw new ErrorHandler(404, "User not found");
    }
  
    const user = users[0];
  
    user.skills = user.skills || [];
  
    res.json(user);
  });

  //function to update profile info 
  export const updateUserProfile = TryCatch(
    async (req: AuthenticatedRequest, res) => {
      const user = req.user;
  
      if (!user) {
        throw new ErrorHandler(401, "Authentication required");
      }
  
      const { name, phoneNumber, bio } = req.body;
  
      const newName = name || user.name;
      const newPhoneNumber = phoneNumber || user.phone_number;
      const newBio = bio || user.bio;
  
      /*updatedUser is taking out first elemt of returned array so updatedUser
      is basically an js object     this is known as Object Destructuring*/
      const [updatedUser] = await sql`
      UPDATE users SET name = ${newName}, phone_number = ${newPhoneNumber}, bio = ${newBio}
      WHERE user_id = ${user.user_id}
      RETURNING user_id, name, email, phone_number, bio
      `;
  
      res.json({
        message: "Profile Updated successfully",
        updatedUser,
      });
    }
  );

  //function to update profile pic  
  export const updateProfilePic = TryCatch(
    async (req: AuthenticatedRequest, res) => {
      const user = req.user;
  
      if (!user) {
        throw new ErrorHandler(401, "Authentication required");
      }
  
      const file = req.file;
  
      if (!file) {
        throw new ErrorHandler(400, "No image file provided");
      }
  
      // public_id was provided by cloudinary 
      const oldPublicId = user.profile_pic_public_id;
  
      //buffer utility to convert buffer that was stored by multer into Base64 format that cloudinary takes
      const fileBuffer = getBuffer(file);
  // fileBuffer contains data in RAM

      if (!fileBuffer || !fileBuffer.content) {
        throw new ErrorHandler(500, "failed to generate buffer");
      }



  /* The Problem: In your architecture, the Auth Service does not 
  save files directly to the database. You have a completely separate
   computer/container running an "Upload Service" (like Cloudinary or 
   a dedicated microservice).

The Solution: Your backend server now has to act exactly like a 
frontend React app. It must send its own outgoing HTTP request to 
another server.

Why Axios: Axios is a library designed exclusively to execute HTTP 
requests. It takes your JavaScript objects, automatically converts
 them into strict JSON format, executes the network jump, and parses
  the response when it comes back.*/
  /* However, when you are inside destructuring curly braces {},
   the colon loses its TypeScript meaning completely. It reverts 
   to a built-in JavaScript command that means exactly 
   one thing: "Rename this variable." So here data: uploadResult is 
   renamng data as uploadResult*/
      const { data: uploadResult } = await axios.post<UploadResponse>(
        `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
        {
          buffer: fileBuffer.content,
          public_id: oldPublicId,
        }
      );
  
      const [updatedUser] = await sql`
      UPDATE users SET profile_pic = ${uploadResult.url}, profile_pic_public_id = ${uploadResult.public_id} WHERE user_id = ${user.user_id} RETURNING user_id, name, profile_pic;
      `;
  
      res.json({
        message: "profile pic updated",
        updatedUser,
      });
    }
  );

  //function to update resume file
  export const updateResume = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
  
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }
  
    const file = req.file;
  
    if (!file) {
      throw new ErrorHandler(400, "No pdf file provided");
    }
  
    const oldPublicId = user.resume_public_id;
  
    const fileBuffer = getBuffer(file);
  
    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, "failed to generate buffer");
    }
  
    const { data: uploadResult } = await axios.post<UploadResponse>(
      `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
      {
        buffer: fileBuffer.content,
        public_id: oldPublicId,
      }
    );
  
    const [updatedUser] = await sql`
      UPDATE users SET resume = ${uploadResult.url}, resume_public_id = ${uploadResult.public_id} WHERE user_id = ${user.user_id} RETURNING user_id, name, resume;
      `;
  
    res.json({
      message: "Resume updated",
      updatedUser,
    });
  });

  //function to all skills
  export const addSkillToUser = TryCatch( 
    async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.user_id;
      const { skillName } = req.body;
  
      if (!skillName || skillName.trim() === "") {
        throw new ErrorHandler(400, "Please provide a skill name");
      }
  
      let wasSkillAdded = false;
  
      try {
        /*your code is executing three separate database commands
         in a row that rely on each other. await sql\BEGIN`;`
          activates a PostgreSQL feature called a Transaction.
           It bundles those three commands into a single, indivisible 
           unit. It enforces a strict rule: "All of these commands
            must succeed together, or all of them must fail together." */
        await sql`BEGIN`;
  
        const users =
          await sql`SELECT user_id FROM users WHERE user_id = ${userId}`;
  
        if (users.length === 0) {
          throw new ErrorHandler(404, "User not found.");
        }
  
        const [skill] =
        //end part is checking if there already exist a skill of provided name of skill if it already exist just return the skill id of that skill
          await sql`INSERT INTO skills (name) VALUES (${skillName.trim()}) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING skill_id`;
  
        const skillId = skill.skill_id;
  
        const insertionResult =
          await sql`INSERT INTO user_skills (user_id, skill_id) VALUES (${userId}, ${skillId}) ON CONFLICT (user_id, skill_id) DO NOTHING RETURNING user_id`;
  
        if (insertionResult.length > 0) {
          wasSkillAdded = true;
        }


  /*The Condition: If Node.js reaches this exact line, it means every
   single SELECT, INSERT, and UPDATE above it executed perfectly
    without a single error.

The Action: It sends the COMMIT command over the network to the
 database.

The Result: The database takes all the data sitting in that temporary
 RAM workspace we created with BEGIN, and physically writes it
  permanently to the hard drive. The transaction is now complete and
   irreversible. */
        await sql`COMMIT`;
      } catch (error) {
 /*Because the code crashed halfway through, your database is currently
  holding half-finished data in its temporary RAM workspace.

The Action: This line sends the ROLLBACK command to the database.

The Result: The database instantly deletes the temporary workspace. 
It completely destroys the half-finished data. The permanent hard drive
 remains completely untouched, exactly as it was before the user ever
  made the API request. */       
        await sql`ROLLBACK`;
        throw error;
      }
  
      if (!wasSkillAdded) {
        return res.status(200).json({
          message: "User already possesses this skill",
        });
      }
  
      res.json({
        message: `Skill ${skillName.trim()} is added successfully`,
      });
    }
  );

  //function to delete skill
  export const deleteSkillFromUser = TryCatch( 
    async (req: AuthenticatedRequest, res) => {
      const user = req.user; 
  
      if (!user) {
        throw new ErrorHandler(401, "Authentication Required");
      }
  
      const { skillName } = req.body;
  
      if (!skillName || skillName.trim() === "") {
        throw new ErrorHandler(400, "Please provide a skill name");
      }
  
      const result = await sql`DELETE FROM user_skills WHERE user_id = ${
        user.user_id
      } AND skill_id = (SELECT skill_id FROM skills WHERE name = ${skillName.trim()}) RETURNING user_id;`;
  
      if (result.length === 0) {
        throw new ErrorHandler(404, `Skill ${skillName.trim()} was not found`);
      }
  
      res.json({
        message: `Skill ${skillName.trim()} was deleted successfully`,
      });
    }
  );
  
  //function to apply for job and here i will be using application table that i created in jobs service
  export const applyForJob = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
  
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }
  
    if (user.role !== "jobseeker") {
      throw new ErrorHandler(403, "Forbidden you are not allowed for this api");
    }
  
    const applicant_id = user.user_id;
  
    const resume = user.resume;
  
    if (!resume) {
      throw new ErrorHandler(
        400,
        "You need to add resume in your profile to apply for this job"
      );
    }
  
    const { job_id } = req.body;
  
    if (!job_id) {
      throw new ErrorHandler(400, "job id is required");
    }
  
    const [job] = await sql`SELECT is_active FROM jobs WHERE job_id = ${job_id}`;
  
    if (!job) {
      throw new ErrorHandler(404, "No jobs with this id");
    }
  
    if (!job.is_active) {
      throw new ErrorHandler(400, "Job is not active");
    }
  
    //gives current time it is used to check subscription if there will be subscription the is_subscribed in the applicatoins table will be true and jobs will be shown to you first  
    const now = Date.now();
  
    //"Check if the user has a subscription, if yes get its time, if no set it to 0"
    const subTime = req.user?.subscription ? new Date(req.user.subscription).getTime() : 0;
  
    const isSubscribed = subTime > now;
  
    let newApplication;
  
    try {
      [newApplication] =
        await sql`INSERT INTO applications (job_id, applicant_id, applicant_email, resume, subscribed) VALUES (${job_id}, ${applicant_id}, ${user?.email}, ${resume}, ${isSubscribed})`;
    } catch (error: any) {
      //23505 is a PostgreSQL error code that means: "Duplicate entry — this record already exists"
      if (error.code === "23505") {
        throw new ErrorHandler(409, "you have already applied to this job.");
      }
      throw error;
      //If the error is NOT a duplicate (some other database problem), just throw it as is so it gets handled elsewhere.
    }
  
    res.json({
      message: "Applied for job successfully",
      application: newApplication,
    });
  });
  
  //function to get all application submitted by the logged-in user
  export const getAllaplications = TryCatch(
    async (req: AuthenticatedRequest, res) => {
      const applications = await sql`
      SELECT a.*, j.title AS job_title, j.salary AS job_salary, j.location AS job_location FROM applications a JOIN jobs j ON a.job_id = j.job_id WHERE a.applicant_id = ${req.user?.user_id}
    `;
    //"Get all applications submitted by the logged-in user, along with the job details for each application"
  
      res.json(applications);
    }
  );
  