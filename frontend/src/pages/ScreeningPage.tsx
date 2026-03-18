import { useATS } from "@/contexts/ATSContext";
import { Resume } from "@/types/ats";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ScreeningPage() {

  const { resumes, addResume, jobs } = useATS();
  const [selectedJob, setSelectedJob] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id);

    if (error) { console.error("Error fetching resumes:", error); return; }

    data?.forEach((r: any) => {
      const exists = resumes.some(existing => existing.id === r.id);
      if (!exists) {
        addResume({
          id: r.id,
          fileName: r.file_name,
          candidateName: r.candidate_name,
          email: r.email || "",
          phone: r.phone || "",
          skills: r.skills || [],
          experience: r.experience || "",
          education: r.education || "",
          rawText: r.raw_text || "",
          status: "parsed",
          jobId: r.job_id || "",
          uploadedAt: new Date(r.created_at)
        });
      }
    });
  };

  const processResume = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.error("User not logged in"); return }
    if (!selectedJob) { alert("Please select a job first"); return }

    setUploading(true)

    try {
      // Step 1 - Parse resume
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("http://127.0.0.1:8000/parse-resume", {
        method: "POST",
        body: formData
      })
      const result = await response.json()
      console.log("Parsed result:", result)

      const candidateName = result?.name || file.name.replace(/\.[^.]+$/, "")
      const email = result?.email || ""
      const phone = result?.phone || ""
      const skills = result?.skills || []
      const rawText = result?.raw_text || ""

      // Step 2 - AI Analysis
      const selectedJobData = jobs.find(j => j.id === selectedJob)
      const aiResponse = await fetch("http://127.0.0.1:8000/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: rawText,
          job: `${selectedJobData?.title}\n${selectedJobData?.description}\nRequired Skills: ${selectedJobData?.skills?.join(', ')}`,
          candidate_name: candidateName,
          candidate_skills: skills
        })
      })
      const aiData = await aiResponse.json()
      console.log("AI Analysis:", aiData)

      // Step 3 - Upload file
      const filePath = `${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file)
      if (uploadError) console.error("Upload error:", uploadError)

      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath)
      const resumeUrl = urlData.publicUrl

      // Step 4 - Save to Supabase
      const resumeId = crypto.randomUUID()
      const { data: resumeData, error: insertError } = await supabase
        .from("resumes")
        .upsert({
          id: resumeId,
          user_id: user.id,
          file_name: file.name,
          candidate_name: candidateName,
          email: email,
          phone: phone,
          skills: skills,
          file_url: resumeUrl,
          job_id: selectedJob || null,
          experience: result?.experience || "",
          education: result?.education || "",
          raw_text: rawText
        })
        .select()

      if (insertError) console.error("Resume insert error:", insertError)
      else console.log("Resume saved:", resumeData)

      // Step 5 - React state mein add karo
      const resume: Resume = {
        id: resumeId,
        fileName: file.name,
        candidateName: candidateName,
        email: email,
        phone: phone,
        skills: skills,
        experience: result?.experience || "",
        education: result?.education || "",
        rawText: rawText,
        status: "parsed",
        jobId: selectedJob,
        uploadedAt: new Date()
      }

      addResume(resume)

    } catch (err) {
      console.error("processResume error:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processResume(file)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Screening</h1>
        <p className="text-muted-foreground">Upload and screen candidate resumes with AI</p>
      </div>

      <div className="w-64">
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger>
            <SelectValue placeholder="Select Job" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card
        className="border-2 border-dashed cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement("input")
          input.type = "file"
          input.accept = ".pdf,.doc,.docx"
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) processResume(file)
          }
          input.click()
        }}
      >
        <CardContent className="py-12 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">
            {uploading ? "Processing resume..." : "Drag & drop resumes here or click to upload"}
          </p>
        </CardContent>
      </Card>

      {resumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Resumes ({resumes.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumes.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {r.fileName}
                  </TableCell>
                  <TableCell>{r.candidateName}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {r.skills?.map(s => <Badge key={s}>{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{jobs.find(j => j.id === r.jobId)?.title || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}