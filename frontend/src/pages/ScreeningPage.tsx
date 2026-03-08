import { useState, useCallback } from 'react';
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

export default function ScreeningPage() {
  const { resumes, addResume, updateResume, jobs } = useATS();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedJob, setSelectedJob] = useState<string>('');

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(`[Could not read file: ${file.name}]`);
      reader.readAsText(file);
    });
  };

  const processFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    setProgress(0);
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      const rawText = await readFileAsText(file);

      const resume: Resume = {
        id: crypto.randomUUID(),
        fileName: file.name,
        candidateName: '',
        email: '',
        phone: '',
        skills: [],
        experience: '',
        education: '',
        rawText,
        status: 'parsing',
        jobId: selectedJob || undefined,
        uploadedAt: new Date(),
      };
      addResume(resume);

      // Call AI to parse resume
      try {
        const { data, error } = await supabase.functions.invoke('analyze-resume', {
          body: { resumeText: rawText, action: 'parse' },
        });
        if (error) throw error;

// 🔹 SAVE CANDIDATE TO DATABASE
        const { data: candidateData, error: candidateError } = await supabase
        .from("candidates")
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          skills: data.skills,
          experience: data.experience,
          education: data.education,
        })
        .select()
        .single();
        if (candidateError) {
          console.error("Database insert error:", candidateError);
        }
        let matchScore = 0;
        
        if (selectedJob) {
          const job = jobs.find(j => j.id === selectedJob);
          const scoreResponse = await supabase.functions.invoke('analyze-resume', {
            body: {
              action: "score",
              resumeText: rawText,
              jobDescription: job?.description || "",
              candidateName: data.name,
              candidateSkills: data.skills
            }
          });
          
          matchScore = scoreResponse.data?.matchScore || 0;
        }

        if (error) throw error;

        updateResume({
          ...resume,
          candidateName: data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          skills: data.skills || [],
          experience: data.experience || '',
          education: data.education || '',
          status: 'parsed',
        });
      } catch (err) {
        console.error('Parse error:', err);
        updateResume({ ...resume, status: 'parsed', candidateName: file.name.replace(/\.[^.]+$/, '') });
        toast({ title: 'Parsing note', description: `Used filename for ${file.name}`, variant: 'destructive' });
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setUploading(false);
    toast({ title: 'Upload complete', description: `${total} resume(s) processed.` });
  }, [addResume, updateResume, selectedJob, toast]);

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
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = '.txt,.pdf,.doc,.docx';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) processFiles(files);
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
                      {r.skills.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      {r.skills.length > 3 && <Badge variant="secondary" className="text-xs">+{r.skills.length - 3}</Badge>}
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
