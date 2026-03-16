import { useState } from "react";
import { useATS } from "@/contexts/ATSContext";
import { Resume } from "@/types/ats";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export default function ScreeningPage() {

  const { resumes, addResume, jobs } = useATS();

  const [selectedJob,setSelectedJob] = useState<string>("")
  const [uploading,setUploading] = useState(false)

  const processResume = async(file:File)=>{

    setUploading(true)

    const formData = new FormData()
    formData.append("file",file)

    const response = await fetch("http://127.0.0.1:8000/parse-resume",{
      method:"POST",
      body:formData
    })

    const result = await response.json()

    console.log("Parsed result:",result)

    const candidateName = result?.name || file.name.replace(/\.[^.]+$/,"")
    const email = result?.email || ""
    const phone = result?.phone || ""
    const skills = result?.skills || []

    const filePath = `${crypto.randomUUID()}-${file.name}`

    await supabase
      .storage
      .from("resumes")
      .upload(filePath,file)

    const {data:urlData} = supabase
      .storage
      .from("resumes")
      .getPublicUrl(filePath)

    const resumeUrl = urlData.publicUrl

    const resumeId = crypto.randomUUID()

    await supabase
      .from("resumes")
      .insert({
        id:resumeId,
        file_name:file.name,
        candidate_name:candidateName,
        email:email,
        phone:phone,
        skills:skills,
        file_url:resumeUrl,
        job_id:selectedJob || null
      })

    const resume:Resume = {
      id:resumeId,
      fileName:file.name,
      candidateName:candidateName,
      email:email,
      phone:phone,
      skills:skills,
      experience:"",
      education:"",
      rawText:"",
      status:"parsed",
      jobId:selectedJob,
      uploadedAt:new Date()
    }

    addResume(resume)

    setUploading(false)
  }

  const handleDrop=(e:React.DragEvent)=>{
    e.preventDefault()

    const file=e.dataTransfer.files[0]

    if(file){
      processResume(file)
    }
  }

  return (

    <div className="p-6 space-y-6">

      <div>

        <h1 className="text-2xl font-bold">
          Resume Screening
        </h1>

        <p className="text-muted-foreground">
          Upload and screen candidate resumes with AI
        </p>

      </div>

      {/* JOB SELECT */}

      <div className="w-64">

        <Select value={selectedJob} onValueChange={setSelectedJob}>

          <SelectTrigger>
            <SelectValue placeholder="Select Job"/>
          </SelectTrigger>

          <SelectContent>

            {jobs.map(j=>(
              <SelectItem key={j.id} value={j.id}>
                {j.title}
              </SelectItem>
            ))}

          </SelectContent>

        </Select>

      </div>

      {/* UPLOAD AREA */}

      <Card
        className="border-2 border-dashed cursor-pointer"
        onDragOver={(e)=>e.preventDefault()}
        onDrop={handleDrop}
        onClick={()=>{

          const input=document.createElement("input")

          input.type="file"
          input.accept=".pdf,.doc,.docx"

          input.onchange=(e)=>{
            const file=(e.target as HTMLInputElement).files?.[0]

            if(file){
              processResume(file)
            }
          }

          input.click()
        }}
      >

        <CardContent className="py-12 text-center">

          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground"/>

          <p className="text-lg font-medium">

            {uploading
              ? "Processing resume..."
              : "Drag & drop resumes here or click to upload"
            }

          </p>

        </CardContent>

      </Card>

      {/* RESUME TABLE */}

      {resumes.length>0 && (

        <Card>

          <CardHeader>
            <CardTitle>
              Uploaded Resumes ({resumes.length})
            </CardTitle>
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

              {resumes.map(r=>(
                <TableRow key={r.id}>

                  <TableCell className="flex items-center gap-2">

                    <FileText className="w-4 h-4"/>

                    {r.fileName}

                  </TableCell>

                  <TableCell>
                    {r.candidateName}
                  </TableCell>

                  <TableCell>
                    {r.email}
                  </TableCell>

                  <TableCell>
                    {r.phone}
                  </TableCell>

                  <TableCell>

                    <div className="flex gap-1 flex-wrap">

                      {r.skills?.map(s=>(
                        <Badge key={s}>
                          {s}
                        </Badge>
                      ))}

                    </div>

                  </TableCell>

                  <TableCell>

                    {jobs.find(j=>j.id===r.jobId)?.title || "-"}

                  </TableCell>

                </TableRow>
              ))}

            </TableBody>

          </Table>

        </Card>

      )}

    </div>
  )
}