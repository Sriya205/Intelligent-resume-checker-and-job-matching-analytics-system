import { useState, useCallback, useEffect } from 'react';
import { useATS } from '@/contexts/ATSContext';
import { Resume } from '@/types/ats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function extractPDFText(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");

    text += pageText + "\n";
  }

  return text;
}

export default function ScreeningPage() {
  const { resumes, addResume, updateResume, jobs, addCandidate } = useATS();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedJob, setSelectedJob] = useState<string>('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch resumes error:", error);
      return;
    }



    if (!data) return;

    data.forEach((resume: any) => {
      addResume({
        id: resume.id,
        fileName: resume.file_name,
        candidateName: resume.candidate_name,
        email: resume.email,
        phone: resume.phone,
        skills: resume.skills || [],
        experience: resume.experience || "",
        education: resume.education || "",
        rawText: resume.raw_text || "",
        status: "parsed",
        jobId: resume.job_id || undefined,
        uploadedAt: new Date(resume.created_at)
      });
    });
  };

  const readFileAsText = async (file: File): Promise<string> => {
    try {
      const text = await file.text();
      return text;
    } catch (err) {
      console.error("File read error:", err);
      return "";
    }
  };

  const processFiles = useCallback(async (files: FileList) => {

    const { data: { user } } = await supabase.auth.getUser();
    setUploading(true);
    setProgress(0);
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      console.log("Processing file:", file.name);
      console.log("Uploading:", file.name);
      let rawText = "";

      if (file.type === "application/pdf") {
        try {
          rawText = await extractPDFText(file);
        } catch (err) {
          console.error("PDF parse failed:", err);
          rawText = file.name;
        }
      } else {
        rawText = await readFileAsText(file);
      }
      console.log("Extracted text:", rawText.slice(0, 200));

      const filePath = `${crypto.randomUUID()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Resume upload error:", uploadError);
      }

      // 🔹 GET PUBLIC URL
      const { data: publicUrlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      const resumeUrl = publicUrlData.publicUrl;

      const resumeId = crypto.randomUUID();

      const resume: Resume = {
        id: resumeId,
        fileName: file.name,
        candidateName: '',
        email: '',
        phone: '',
        skills: [],
        experience: '',
        education: '',
        rawText,
        status: 'parsing',
        jobId: selectedJob && selectedJob !== "none" ? selectedJob : undefined,
        uploadedAt: new Date(),
      };
      addResume(resume);

      // Call AI to parse resume
      try {
        let data = null;

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("http://127.0.0.1:8000/parse-resume", {
            method: "POST",
            body: formData
          });

          const result = await response.json();

          const aiResponse = await fetch("http://127.0.0.1:8000/ai-analysis", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              resume: rawText,
              job: jobs.find(j => j.id === selectedJob)?.description || ""
            })
          })

          const aiData = await aiResponse.json()

          console.log("AI Analysis:", aiData)

          console.log("FastAPI result:", result);

          data = {
            name: result?.name || file.name.replace(/\.[^.]+$/, ''),
            email: result?.email || "",
            phone: result?.phone || "",
            skills: result?.skills || [],
            experience: "",
            education: ""
          };
        } catch (err) {
          console.error("AI parsing failed:", err);
        }
        console.log("AI Parsed Data:", data);
        console.log("Parsed name:", data?.name);
        console.log("Parsed email:", data?.email);
        console.log("Parsed skills:", data?.skills);

        const { data: resumeInsertData, error: resumeInsertError } = await supabase
          .from("resumes")
          .insert({
            id: crypto.randomUUID(),
            user_id: user?.id || null,
            file_url: resumeUrl,
            file_name: file.name,
            candidate_name: data.name,
            email: data.email,
            phone: data.phone,
            skills: data.skills,
            experience: data.experience,
            education: data.education,
            raw_text: rawText,
            job_id: selectedJob !== "none" ? selectedJob : null
          })
          .select();

        console.log("Resume saved:", resumeInsertData);
        console.log("Resume insert error:", resumeInsertError);

        // 🔹 SAVE CANDIDATE TO DATABASE
        const { data: candidateData, error: candidateError } = await supabase

          .from("candidates")
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            skills: data.skills.join(", "),
            experience: data.experience,
            education: data.education,
            resume_url: resumeUrl
          })
          .select()
          .single();
        if (candidateError) {
          console.error("Database insert error:", candidateError);
        }
        let matchScore = 0;
        let skillMatch: any[] = [];
        let weaknesses: string[] = [];
        let strengths: string[] = [];
        let flags: string[] = [];

        if (selectedJob && selectedJob !== "none") {
          const job = jobs.find(j => j.id === selectedJob);
          const scoreResponse = await supabase.functions.invoke('analyze-resume', {
            body: {
              action: "score",
              resumeText: rawText,
              jobDescription: `${job?.title}\n${job?.description}\nRequirements: ${job?.requirements}\nSkills: ${(job?.skills || []).join(', ')}`,
              candidateName: data.name,
              candidateSkills: data.skills
            }
          });

          if (scoreResponse.data) {
            matchScore = scoreResponse.data.matchScore || 0;
            skillMatch = scoreResponse.data.skillMatch || [];
            weaknesses = scoreResponse.data.weaknesses || [];
            strengths = scoreResponse.data.strengths || [];
            flags = scoreResponse.data.flags || [];
          }

          // Add candidate to context only if job selected
          const candidate = {
            id: resumeId,
            name: data.name || file.name.replace(/\.[^.]+$/, ''),
            email: data.email || '',
            phone: data.phone || '',
            skills: data.skills || [],
            experience: data.experience || '',
            education: data.education || '',
            matchScore,
            jobId: selectedJob,
            resumeId: resume.id,
            status: 'pending' as const,
            appliedAt: new Date(),
            skillMatch,
            weaknesses,
            strengths,
            flags,
            skillGaps: [], // Add if needed
            experienceScore: 0, // Add defaults
            educationScore: 0,
            overallFit: '',
            aiExplanation: { summary: '', factors: [], confidence: 0, recommendation: '' },
          };
        }


        await supabase
          .from("resume_analysis")
          .insert({
            resume_id: resumeId,
            skills: aiData.skill_match,
            ats_score: matchScore,
            missing_skills: aiData.missing_skills
          });


        await supabase
          .from("matches")
          .insert({
            resume_id: resumeId,
            job_id: selectedJob,
            match_score: matchScore
          });

        updateResume({
          ...resume,
          candidateName: data.name || file.name.replace(/\.[^.]+$/, ''),
          email: data.email,
          phone: data.phone,
          skills: data.skills,
          experience: data.experience,
          education: data.education,
          jobId: selectedJob,
          status: "parsed"
        });
      } catch (err) {
        console.error('Parse error:', err);
        updateResume({
          ...resume,
          status: 'parsed',
          candidateName: file.name.replace(/\.[^.]+$/, '')
        });
        toast({ title: 'Parsing note', description: `Used filename for ${file.name}`, variant: 'destructive' });
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setUploading(false);
    toast({ title: 'Upload complete', description: `${total} resume(s) processed.` });
  }, [addResume, updateResume, addCandidate, selectedJob, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const statusBadge: Record<string, string> = {
    uploaded: 'bg-muted text-muted-foreground',
    parsing: 'bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)]',
    parsed: 'bg-primary text-primary-foreground',
    screening: 'bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)]',
    reviewed: 'bg-[hsl(142,71%,45%)] text-[hsl(0,0%,100%)]',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Screening</h1>
        <p className="text-muted-foreground">Upload and screen candidate resumes with AI</p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="space-y-2 w-64">
          <label className="text-sm font-medium">Link to Job Posting</label>
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger><SelectValue placeholder="Select a job (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No job selected</SelectItem>
              {jobs.filter(j => j.status === 'active').map(j => (
                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".txt,.pdf,.doc,.docx";

          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;

            console.log("Selected files:", files);

            if (files && files.length > 0) {
              processFiles(files);
            }
          };

          input.click();
        }}
      >
        <CardContent className="py-12 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Drag & drop resumes here</p>
          <p className="text-sm text-muted-foreground mt-1">or click to browse — supports TXT, PDF, DOC files</p>
          {uploading && (
            <div className="mt-4 max-w-xs mx-auto space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{progress}% processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {resumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Resumes ({resumes.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumes.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {r.fileName}
                  </TableCell>
                  <TableCell>{r.candidateName || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {r.skills?.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      {r.skills?.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{r.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{jobs.find(j => j.id === r.jobId)?.title || '—'}</TableCell>
                  <TableCell>
                    <Badge className={statusBadge[r.status]}>
                      {r.status === 'parsing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {r.status === 'parsed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}