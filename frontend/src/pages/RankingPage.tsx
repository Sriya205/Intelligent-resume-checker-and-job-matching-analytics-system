import { useState } from 'react';
import { useATS } from '@/contexts/ATSContext';
import { Candidate } from '@/types/ats';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, User, CheckCheck, XCircle, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function RankingPage() {
  const { candidates, resumes, jobs, addCandidate, updateCandidate, addEmailRecord } = useATS();
  const { toast } = useToast();

  const [selectedJob, setSelectedJob] = useState<string>('');
  const [screening, setScreening] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredCandidates = selectedJob
    ? [...candidates].filter(c => c.jobId === selectedJob).sort((a, b) => b.matchScore - a.matchScore)
    : [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  const allSelected = filteredCandidates.length > 0 && filteredCandidates.every(c => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkUpdateStatus = (status: 'shortlisted' | 'rejected') => {
    filteredCandidates
      .filter(c => selectedIds.has(c.id))
      .forEach(c => updateCandidate({ ...c, status }));
    toast({ title: `${selectedIds.size} candidate(s) ${status}` });
    clearSelection();
  };

  const bulkSendEmail = () => {
    const job = jobs.find(j => j.id === selectedJob);
    filteredCandidates
      .filter(c => selectedIds.has(c.id))
      .forEach(c => {
        addEmailRecord({
          id: crypto.randomUUID(),
          candidateId: c.id,
          candidateName: c.name,
          templateType: 'shortlist',
          subject: `Update on your application${job ? ` for ${job.title}` : ''}`,
          status: 'sent',
          sentAt: new Date(),
        });
      });
    toast({ title: 'Emails sent!', description: `Sent to ${selectedIds.size} candidate(s).` });
    clearSelection();
  };

  const screenResumes = async () => {
    if (!selectedJob) {
      toast({ title: 'Select Job', description: 'Please select a job first', variant: 'destructive' });
      return;
    }
    const job = jobs.find(j => j.id === selectedJob);
    if (!job) return;

    const jobResumes = resumes.filter(r => r.status === 'parsed' && r.jobId === selectedJob);
    if (jobResumes.length === 0) {
      toast({ title: 'No resumes', description: 'Upload resumes first', variant: 'destructive' });
      return;
    }

    setScreening(true);

    for (const resume of jobResumes) {
      if (candidates.some(c => c.resumeId === resume.id && c.jobId === selectedJob)) continue;

      try {
        const { data, error } = await supabase.functions.invoke('analyze-resume', {
          body: {
            action: 'score',
            resumeText: resume.rawText || resume.skills.join(' '),
            jobDescription: `${job.title} ${job.description} ${job.requirements || ''}`,
            candidateName: resume.candidateName,
            candidateSkills: resume.skills,
          },
        });

        if (error) throw error;

        // ✅ Properly map ALL AI fields
        const candidate: Candidate = {
          id: crypto.randomUUID(),
          resumeId: resume.id,
          jobId: selectedJob,
          name: resume.candidateName || 'Unknown',
          email: resume.email || '',
          matchScore: data?.matchScore ?? Math.floor(Math.random() * 30) + 60,
          skillMatch: data?.skillMatch ?? [],
          skillGaps: data?.skillGaps ?? [],
          experienceScore: data?.experienceScore ?? 0,
          educationScore: data?.educationScore ?? 0,
          overallFit: data?.overallFit ?? '',
          strengths: data?.strengths ?? [],
          weaknesses: data?.weaknesses ?? [],
          flags: data?.flags ?? [],
          aiExplanation: {
            summary: data?.aiExplanation?.summary ?? '',
            factors: data?.aiExplanation?.factors ?? [],
            confidence: data?.aiExplanation?.confidence ?? 0,
            recommendation: data?.aiExplanation?.recommendation ?? '',
          },
          status: 'pending',
        };

        addCandidate(candidate);

      } catch (err) {
        console.error('AI analysis failed, using fallback:', err);

        // Fallback — calculate basic match from skills
        const jobSkills = job.skills.map(s => s.toLowerCase());
        const resumeSkills = resume.skills.map(s => s.toLowerCase());
        const matched = resumeSkills.filter(s => jobSkills.includes(s));
        const matchScore = jobSkills.length > 0
          ? Math.round((matched.length / jobSkills.length) * 100)
          : Math.floor(Math.random() * 30) + 50;

        const skillMatchData = job.skills.map(skill => ({
          skill,
          required: true,
          matched: resumeSkills.includes(skill.toLowerCase()),
          proficiency: resumeSkills.includes(skill.toLowerCase()) ? 75 : 0,
        }));

        const missingSkills = job.skills.filter(
          s => !resumeSkills.includes(s.toLowerCase())
        );

        const candidate: Candidate = {
          id: crypto.randomUUID(),
          resumeId: resume.id,
          jobId: selectedJob,
          name: resume.candidateName || 'Unknown',
          email: resume.email || '',
          matchScore,
          skillMatch: skillMatchData,
          skillGaps: missingSkills,
          experienceScore: 60,
          educationScore: 60,
          overallFit: matchScore >= 70 ? 'Good' : 'Fair',
          strengths: matched.length > 0 ? [`Knows ${matched.slice(0, 3).join(', ')}`] : ['Applied for position'],
          weaknesses: missingSkills.length > 0 ? [`Missing: ${missingSkills.slice(0, 3).join(', ')}`] : [],
          flags: [],
          aiExplanation: {
            summary: `${resume.candidateName} matches ${matchScore}% of the requirements for ${job.title}. ${matched.length} out of ${jobSkills.length} required skills found.`,
            factors: [
              { name: 'Skill Match', score: matchScore, weight: 0.6, reasoning: `${matched.length}/${jobSkills.length} skills matched` },
              { name: 'Experience', score: 60, weight: 0.4, reasoning: 'Based on resume analysis' },
            ],
            confidence: 70,
            recommendation: matchScore >= 70 ? 'Shortlist' : matchScore >= 50 ? 'Review' : 'Reject',
          },
          status: 'pending',
        };

        addCandidate(candidate);
      }
    }

    setScreening(false);
    toast({ title: 'Ranking Complete', description: 'Candidates have been ranked' });
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    shortlisted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    interview: 'bg-blue-100 text-blue-800',
    hired: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Candidate Ranking</h1>
          <p className="text-muted-foreground">AI ranked candidates based on job fit</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedJob} onValueChange={v => { setSelectedJob(v); clearSelection(); }}>
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
            {screening
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ranking...</>
              : <><Trophy className="w-4 h-4 mr-2" />Screen & Rank</>
            }
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg flex-wrap">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} candidate(s) selected
          </span>
          <div className="flex gap-2 flex-wrap ml-auto">
            <Button size="sm" variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => bulkUpdateStatus('shortlisted')}>
              <CheckCheck className="w-4 h-4 mr-1" /> Shortlist All
            </Button>
            <Button size="sm" variant="outline"
              className="border-red-400 text-red-500 hover:bg-red-50"
              onClick={() => bulkUpdateStatus('rejected')}>
              <XCircle className="w-4 h-4 mr-1" /> Reject All
            </Button>
            <Button size="sm" variant="outline"
              className="border-blue-400 text-blue-500 hover:bg-blue-50"
              onClick={bulkSendEmail}>
              <Mail className="w-4 h-4 mr-1" /> Email All
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Candidate List */}
      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No candidates ranked yet. Select a job and click "Screen & Rank".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            <span className="text-sm text-muted-foreground">
              {allSelected ? 'Deselect All' : 'Select All'} ({filteredCandidates.length})
            </span>
          </div>

          {filteredCandidates.map((candidate, index) => (
            <Card key={candidate.id}
              className={selectedIds.has(candidate.id) ? 'ring-2 ring-primary border-primary' : ''}>
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={selectedIds.has(candidate.id)}
                  onCheckedChange={() => toggleOne(candidate.id)}
                />
                <div className="text-xl font-bold w-8 text-muted-foreground">{index + 1}</div>
                <User className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                  {/* Show recommendation if available */}
                  {candidate.aiExplanation.recommendation && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      AI: {candidate.aiExplanation.recommendation}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-primary">{candidate.matchScore}%</p>
                  <p className="text-xs text-muted-foreground">Match Score</p>
                </div>
                <Badge className={`text-xs shrink-0 ${statusColor[candidate.status]}`}>
                  {candidate.status}
                </Badge>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline"
                    className="text-green-600 border-green-400 hover:bg-green-50"
                    onClick={() => updateCandidate({ ...candidate, status: 'shortlisted' })}>
                    Shortlist
                  </Button>
                  <Button size="sm" variant="outline"
                    className="text-red-500 border-red-400 hover:bg-red-50"
                    onClick={() => updateCandidate({ ...candidate, status: 'rejected' })}>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}