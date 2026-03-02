import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { myProfile, getUserProfile, updateUserProfile, updateProfilePic, updateResume, addSkillToUser, deleteSkillFromUser } from "../controllers/user.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.get("/:userId", isAuth, getUserProfile);
router.put("/update/profile", isAuth, updateUserProfile);
router.put("/update/pic", isAuth, uploadFile, updateProfilePic);
router.put("/update/resume", isAuth, uploadFile, updateResume);
router.post("/skill/add", isAuth, addSkillToUser);
router.put("/skill/delete", isAuth, deleteSkillFromUser);


export default router;
