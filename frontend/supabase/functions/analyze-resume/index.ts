/// <reference lib="deno.ns" />
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, resumeText, jobDescription, candidateName, candidateSkills } = await req.json();
    // @ts-ignore
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "parse") {
      systemPrompt = `You are a resume parser. Extract structured data from the resume text provided. Return a JSON object with these fields:
- name (string): candidate full name
- email (string): email address if found
- phone (string): phone number if found
- skills (string[]): list of technical and soft skills
- experience (string): brief summary of work experience
- education (string): brief summary of education

Be accurate and concise. If a field is not found, use empty string or empty array.`;
      userPrompt = `Parse this resume:\n\n${resumeText}`;
    } else if (action === "score") {
      systemPrompt = `You are an AI recruiter assistant. Score a candidate against a job description. Return a JSON object with:
- matchScore (number 0-100): overall job fit percentage
- skillMatch (array of objects with: skill (string), required (boolean), matched (boolean), proficiency (number 0-100))
- skillGaps (string[]): skills the candidate is missing
- experienceScore (number 0-100): experience relevance score
- educationScore (number 0-100): education relevance score
- overallFit (string): "Excellent", "Good", "Fair", or "Poor"
- strengths (string[]): 3-5 key strengths
- weaknesses (string[]): 2-4 areas of concern
- flags (string[]): any red flags or inconsistencies detected (can be empty)
- aiExplanation (object with: summary (string 2-3 sentences), factors (array of objects with name, score 0-100, weight 0-1, reasoning), confidence (number 0-100), recommendation (string: "Shortlist", "Review", or "Reject"))

Be fair, unbiased, and thorough in your evaluation.`;
      userPrompt = `Job Description:\n${jobDescription}\n\nCandidate: ${candidateName}\nSkills: ${(candidateSkills || []).join(", ")}\n\nResume:\n${resumeText}`;
    } else {
      throw new Error("Invalid action. Use 'parse' or 'score'.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: action === "parse" ? "extract_resume_data" : "score_candidate",
              description: action === "parse" ? "Extract structured resume data" : "Score candidate against job",
              parameters: action === "parse"
                ? {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      skills: { type: "array", items: { type: "string" } },
                      experience: { type: "string" },
                      education: { type: "string" },
                    },
                    required: ["name", "skills"],
                    additionalProperties: false,
                  }
                : {
                    type: "object",
                    properties: {
                      matchScore: { type: "number" },
                      skillMatch: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            skill: { type: "string" },
                            required: { type: "boolean" },
                            matched: { type: "boolean" },
                            proficiency: { type: "number" },
                          },
                          required: ["skill", "required", "matched", "proficiency"],
                          additionalProperties: false,
                        },
                      },
                      skillGaps: { type: "array", items: { type: "string" } },
                      experienceScore: { type: "number" },
                      educationScore: { type: "number" },
                      overallFit: { type: "string" },
                      strengths: { type: "array", items: { type: "string" } },
                      weaknesses: { type: "array", items: { type: "string" } },
                      flags: { type: "array", items: { type: "string" } },
                      aiExplanation: {
                        type: "object",
                        properties: {
                          summary: { type: "string" },
                          factors: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                score: { type: "number" },
                                weight: { type: "number" },
                                reasoning: { type: "string" },
                              },
                              required: ["name", "score", "weight", "reasoning"],
                              additionalProperties: false,
                            },
                          },
                          confidence: { type: "number" },
                          recommendation: { type: "string" },
                        },
                        required: ["summary", "factors", "confidence", "recommendation"],
                        additionalProperties: false,
                      },
                    },
                    required: ["matchScore", "skillMatch", "skillGaps", "experienceScore", "educationScore", "overallFit", "strengths", "weaknesses", "flags", "aiExplanation"],
                    additionalProperties: false,
                  },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: action === "parse" ? "extract_resume_data" : "score_candidate" },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
