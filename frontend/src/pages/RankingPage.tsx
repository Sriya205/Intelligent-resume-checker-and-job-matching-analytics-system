import { useState } from 'react';
import { useATS } from '@/contexts/ATSContext';
import { Candidate } from '@/types/ats';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RankingPage() {

  const { candidates, resumes, jobs, addCandidate } = useATS();
  const { toast } = useToast();

  const [selectedJob, setSelectedJob] = useState<string>('');
  const [screening, setScreening] = useState(false);

  const filteredCandidates = selectedJob
    ? [...candidates]
        .filter(c => c.jobId === selectedJob)
        .sort((a, b) => b.matchScore - a.matchScore)
    : [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  const screenResumes = async () => {

    if (!selectedJob) {
      toast({ title: "Select Job", description: "Please select a job first", variant: "destructive" });
      return;
    }

    const job = jobs.find(j => j.id === selectedJob);
    if (!job) return;

    const jobResumes = resumes.filter(r => r.status === "parsed");

    if (jobResumes.length === 0) {
      toast({ title: "No resumes", description: "Upload resumes first", variant: "destructive" });
      return;
    }

    setScreening(true);

    for (const resume of jobResumes) {

      if (candidates.some(c => c.resumeId === resume.id)) continue;

      try {

        // ✅ Seedha FastAPI backend call
        const response = await fetch("http://127.0.0.1:8000/ai-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume: resume.rawText,
            job: `${job.title} ${job.description}`,
            candidate_name: resume.candidateName,
            candidate_skills: resume.skills
          })
        });

        if (!response.ok) throw new Error("Backend error");

        const data = await response.json();

        const candidate: Candidate = {
          id: crypto.randomUUID(),
          resumeId: resume.id,
          jobId: selectedJob,
          name: resume.candidateName || "Unknown",
          email: resume.email || "",
          matchScore: data?.matchScore || 0,
          skillMatch: data?.skillMatch || [],
          skillGaps: data?.skillGaps || [],
          experienceScore: data?.experienceScore || 0,
          educationScore: data?.educationScore || 0,
          overallFit: data?.overallFit || "",
          strengths: data?.strengths || [],
          weaknesses: data?.weaknesses || [],
          flags: data?.flags || [],
          aiExplanation: {
            summary: data?.aiExplanation?.summary || "",
            factors: data?.aiExplanation?.factors || [],
            confidence: data?.aiExplanation?.confidence || 0,
            recommendation: data?.aiExplanation?.recommendation || ""
          },
          status: "pending"
        };

        addCandidate(candidate);

      } catch (err) {

        console.error("Screening error:", err);

        // Error hone par bhi candidate add karo placeholder ke saath
        const candidate: Candidate = {
          id: crypto.randomUUID(),
          resumeId: resume.id,
          jobId: selectedJob,
          name: resume.candidateName || "Unknown",
          email: resume.email || "",
          matchScore: 0,
          skillMatch: [],
          skillGaps: [],
          experienceScore: 0,
          educationScore: 0,
          overallFit: "",
          strengths: [],
          weaknesses: [],
          flags: [],
          aiExplanation: { summary: "", factors: [], confidence: 0, recommendation: "" },
          status: "pending"
        };

        addCandidate(candidate);
      }
    }

    setScreening(false);
    toast({ title: "Ranking Complete", description: "Candidates have been ranked" });
  };

  const updateStatus = (candidate: Candidate, status: "shortlisted" | "rejected") => {
    candidate.status = status;
    toast({ title: `Candidate ${status}`, description: `${candidate.name} has been ${status}` });
  };

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidate Ranking</h1>
          <p className="text-muted-foreground">AI ranked candidates based on job fit</p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select Job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={screenResumes} disabled={screening}>
            <Trophy className="w-4 h-4 mr-2" />
            {screening ? "Ranking..." : "Screen & Rank"}
          </Button>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No candidates ranked yet. Upload resumes and click "Screen & Rank".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate, index) => (
            <Card key={candidate.id}>
              <CardContent className="flex items-center gap-4 p-4">

                <div className="text-xl font-bold w-8 text-center">#{index + 1}</div>

                <User className="w-5 h-5 text-muted-foreground" />

                <div className="flex-1">
                  <p className="font-medium">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>
                  {candidate.overallFit && (
                    <p className="text-xs text-muted-foreground">Fit: {candidate.overallFit}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">{candidate.matchScore}%</p>
                  <p className="text-xs text-muted-foreground">Match Score</p>
                </div>

                <Badge>{candidate.status}</Badge>

                <Button size="sm" onClick={() => updateStatus(candidate, "shortlisted")}>
                  Shortlist
                </Button>

                <Button size="sm" variant="destructive" onClick={() => updateStatus(candidate, "rejected")}>
                  Reject
                </Button>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}