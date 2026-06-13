import express, { json } from "express";
import cloudinary from "cloudinary";

const router = express.Router();

router.post("/upload", async (req, res) => {
    try {
      const { buffer, public_id } = req.body;
  
      if (public_id) {
        await cloudinary.v2.uploader.destroy(public_id);
      }
  
      const cloud = await cloudinary.v2.uploader.upload(buffer);
  
      res.json({
        url: cloud.secure_url,
        public_id: cloud.public_id,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  });

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });

//function for-> "User sends their skills → AI analyzes them → Returns a complete career path suggestion"
router.post("/career", async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills) {
      return res.status(400).json({
        message: "Skills Required",
      });
    }


/*The prompt tells AI to return 4 things:
Field               What it contains
Summary             Brief overview of the user's skillset
JobOptions          List of suitable job roles
SkillsToLearn       What skills to learn next
LearningApproach    How to approach learning */    

/*AI sometimes wraps its response in markdown code blocks like: ```json { ... } ``` So we strip those out to get clean JSON:  { ... }*/
    const prompt = ` 
Based on the following skills: ${skills}. 
 
Please act as a career advisor and generate a career path suggestion. 
Your entire response must be in a valid JSON format. Do not include any text or markdown 
formatting outside of the JSON structure. 
 
The JSON object should have the following structure: 
{ 
 "summary": "A brief, encouraging summary of the user's skill set and their general job 
title.", 
 "jobOptions": [ 
 { 
"title": "The name of the job role.", 
"responsibilities": "A description of what the user would do in this role.", 
"why": "An explanation of why this role is a good fit for their skills." 
 } 
 ], 
 "skillsToLearn": [ 
 { 
"category": "A general category for skill improvement (e.g., 'Deepen Your Existing Stack 
Mastery', 'DevOps & Cloud').", 
"skills": [ 
 { 
 "title": "The name of the skill to learn.", 
 "why": "Why learning this skill is important.", 
 "how": "Specific examples of how to learn or apply this skill." 
 } 
] 
 } 
 ], 
 "learningApproach": { 
"title": "How to Approach Learning", 
"points": ["A bullet point list of actionable advice for learning."] 
 } 
} 
 `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    let jsonResponse;

    try {
      const rawText = response.text
        ?.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!rawText) {
        throw new Error("Ai did not return a valid text response.");
      }

      //After JSON.parse() runs, jsonResponse is 100% a JavaScript object — NOT JSON anymore.
      jsonResponse = JSON.parse(rawText);
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }

   //res.json() converts the JavaScript object BACK into JSON and sends it to the frontend.
    res.json(jsonResponse);

  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

//function for->"User uploads their resume as a PDF → AI analyzes it → Returns an ATS score with detailed feedback"
router.post("/resume-analyser", async (req, res) => {
  try {
    const { pdfBase64 } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ message: "PDF data is required" });
    }


/*Telling AI to:
Act as an ATS expert
Analyze the resume
Return results in a specific JSON format */

/*The AI will check the resume for:
What it checks          Meaning
formatting              Is the resume format ATS friendly
keywords                Does it have the right keywords
structure               Are sections properly organized
readability             Can ATS easily read the content
 */

    const prompt = ` 
You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume 
and provide: 
1. An ATS compatibility score (0-100) 
2. Detailed suggestions to improve the resume for better ATS performance 
 
Your entire response must be in valid JSON format. Do not include any text or markdown 
formatting outside of the JSON structure. 
 
The JSON object should have the following structure: 
{ 
  "atsScore": 85, 
  "scoreBreakdown": { 
    "formatting": { 
      "score": 90, 
      "feedback": "Brief feedback on formatting" 
    }, 
    "keywords": { 
      "score": 80, 
      "feedback": "Brief feedback on keyword usage" 
    }, 
    "structure": { 
      "score": 85, 
      "feedback": "Brief feedback on resume structure" 
    }, 
    "readability": { 
      "score": 88, 
      "feedback": "Brief feedback on readability" 
    } 
  }, 
  "suggestions": [ 
    { 
      "category": "Category name (e.g., 'Formatting', 'Content', 'Keywords', 
'Structure')", 
      "issue": "Description of the issue found", 
      "recommendation": "Specific actionable recommendation to fix it", 
      "priority": "high/medium/low" 
    } 
  ], 
  "strengths": [ 
    "List of things the resume does well for ATS" 
  ], 
  "summary": "A brief 2-3 sentence summary of the overall ATS performance" 
} 
 
Focus on: - File format and structure compatibility - Proper use of standard section headings - Keyword optimization - Formatting issues (tables, columns, graphics, special characters) - Contact information placement - Date formatting - Use of action verbs and quantifiable achievements - Section organization and flow 
`;

/* Sending 2 things to AI together:
1.The prompt (instructions what to do)
2.The actual PDF (the resume to analyze) */
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
       //" inlineData->Sending the actual file directly inside the request instead of a URL"       
              inlineData: {
                mimeType: "application/pdf",
//mimeType tells AI what type of file you are sending: application/pdf ->PDF file                
                
/* pdfBase64.replace->This strips the prefix from base64 string:
Before → "data:application/pdf;base64,JVBERi0x..."
After  → "JVBERi0x..."   ← just the actual base64 data
Because Gemini only needs the raw base64 data, not the prefix. */                
                data: pdfBase64.replace(/^data:application\/pdf;base64,/, ""),
              },
            },
          ],
        },
      ],
    });

    let jsonResponse;

    try {
      const rawText = response.text
        ?.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!rawText) {
        throw new Error("Ai did not return a valid text response.");
      }
 
      jsonResponse = JSON.parse(rawText); //convert to js object
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }

    res.json(jsonResponse); //convert to json
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
