import { useState } from 'react';
import { useATS } from '@/contexts/ATSContext';
import { Candidate } from '@/types/ats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, ChevronDown, ChevronUp, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function RankingPage() {
  const { candidates, resumes, jobs, addCandidate, updateCandidate } = useATS();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [screening, setScreening] = useState(false);

  const filteredCandidates =
    selectedJob !== "all"
      ? [...candidates].filter(c => c.jobId === selectedJob).sort((a, b) => b.matchScore - a.matchScore)
      : [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  const screenResumes = async () => {
    if (!selectedJob) {
      toast({ title: 'Select a job', description: 'Pick a job posting to rank candidates against.', variant: 'destructive' });
      return;
    }
    const job = jobs.find(j => j.id === selectedJob);
    if (!job) return;

    const jobResumes = resumes.filter(
      r => r.status === "parsed" && (!selectedJob || selectedJob === "none" || r.jobId === selectedJob)
    );
    if (jobResumes.length === 0) {
      toast({ title: 'No resumes', description: 'Upload and parse resumes linked to this job first.', variant: 'destructive' });
      return;
    }

    setScreening(true);
    for (const resume of jobResumes) {
      // Skip if already ranked
      if (candidates.some(c => c.resumeId === resume.id && c.jobId === selectedJob)) continue;

      try {
        const { data, error } = await supabase.functions.invoke('analyze-resume', {
          body: {
            action: 'score',
            resumeText: resume.rawText,
            jobDescription: `${job.title}\n${job.description}\nRequirements: ${job.requirements}\nSkills: ${job.skills.join(', ')}`,
            candidateName: resume.candidateName,
            candidateSkills: resume.skills,
          },
        });
        if (error) throw error;

        const candidate: Candidate = {
          id: crypto.randomUUID(),
          resumeId: resume.id,
          jobId: selectedJob,
          name: resume.candidateName,
          email: resume.email,
          matchScore: data.matchScore ?? 0,
          skillMatch: data.skillMatch ?? [],
          skillGaps: data.skillGaps ?? [],
          experienceScore: data.experienceScore ?? 0,
          educationScore: data.educationScore ?? 0,
          overallFit: data.overallFit ?? 'Unknown',
          strengths: data.strengths ?? [],
          weaknesses: data.weaknesses ?? [],
          flags: data.flags ?? [],
          aiExplanation: data.aiExplanation ?? { summary: '', factors: [], confidence: 0, recommendation: '' },
          status: 'pending',
        };
        addCandidate(candidate);
      } catch (err) {
        console.error('Score error:', err);
        toast({ title: 'AI Error', description: `Failed to score ${resume.candidateName}`, variant: 'destructive' });
      }
    }
    setScreening(false);
    toast({ title: 'Screening complete', description: 'Candidates have been ranked.' });
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-[hsl(142,71%,45%)]' : score >= 60 ? 'text-[hsl(38,92%,50%)]' : 'text-destructive';

  if (!candidates || !jobs) {
    return <div className="p-6">Loading candidates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Candidate Ranking</h1>
          <p className="text-muted-foreground">AI-scored candidates ranked by job fit</p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="w-64">
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>

                {jobs?.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}

              </SelectContent>
            </Select>
          </div>
          <Button onClick={screenResumes} disabled={screening}>
            {screening ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
            {screening ? 'Screening...' : 'Screen & Rank'}
          </Button>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No candidates ranked yet. Select a job and click "Screen & Rank".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCandidates?.map((c, i) => (
            <Card key={c.id} className="overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <User className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.email}</p>
                </div>
                <div className="text-right mr-2">
                  <p className={`text-2xl font-bold ${scoreColor(c.matchScore)}`}>{c.matchScore}%</p>
                  <p className="text-xs text-muted-foreground">Match Score</p>
                </div>
                <Badge className={
                  c.status === 'shortlisted' ? 'bg-[hsl(142,71%,45%)] text-[hsl(0,0%,100%)]' :
                  c.status === 'rejected' ? 'bg-destructive text-destructive-foreground' :
                  'bg-secondary text-secondary-foreground'
                }>{c.status}</Badge>
                {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {expanded === c.id && (
                <div className="border-t px-6 py-4 space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Score Breakdown</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Experience</span><span>{c.experienceScore}%</span></div>
                        <Progress value={c.experienceScore} className="h-2" />
                        <div className="flex justify-between text-sm"><span>Education</span><span>{c.educationScore}%</span></div>
                        <Progress value={c.educationScore} className="h-2" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Strengths</p>
                      <ul className="text-sm space-y-1">
                        {c.strengths.map((s, i) => <li key={i} className="text-[hsl(142,71%,45%)]">✓ {s}</li>)}
                      </ul>
                      <p className="text-sm font-medium mt-3 mb-2">Weaknesses</p>
                      <ul className="text-sm space-y-1">
                        {c.weaknesses.map((w, i) => <li key={i} className="text-destructive">✗ {w}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Skill Gaps</p>
                      <div className="flex flex-wrap gap-1">
                        {c.skillGaps.map(g => <Badge key={g} variant="outline" className="text-xs border-destructive text-destructive">{g}</Badge>)}
                      </div>
                      {c.flags.length > 0 && (
                        <>
                          <p className="text-sm font-medium mt-3 mb-2">⚠️ Flags</p>
                          <ul className="text-sm text-[hsl(38,92%,50%)] space-y-1">
                            {c.flags.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => updateCandidate({ ...c, status: 'shortlisted' })} disabled={c.status === 'shortlisted'}>
                      Shortlist
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateCandidate({ ...c, status: 'rejected' })} disabled={c.status === 'rejected'}>
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateCandidate({ ...c, status: 'interview' })}>
                      Schedule Interview
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
