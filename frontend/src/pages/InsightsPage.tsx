import { useState } from 'react';
import { useATS } from '@/contexts/ATSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, AlertTriangle, TrendingUp, Target } from 'lucide-react';

export default function InsightsPage() {
  const { candidates, jobs } = useATS();
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const candidate = candidates.find(c => c.id === selectedCandidate);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Candidate Insights</h1>
        <p className="text-muted-foreground">AI-powered deep analysis of candidate profiles</p>
      </div>

      <div className="w-80">
        <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
          <SelectTrigger><SelectValue placeholder="Select a candidate" /></SelectTrigger>
          <SelectContent>
            {candidates.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} — {c.matchScore}%</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!candidate ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Select a candidate to view AI insights.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Target className="w-4 h-4" /> Skill Match Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.skillMatch.length > 0 ? candidate.skillMatch.map(sm => (
                <div key={sm.skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{sm.skill} {sm.required && <Badge variant="secondary" className="ml-1 text-[10px]">Required</Badge>}</span>
                    <span className={sm.matched ? 'text-[hsl(142,71%,45%)]' : 'text-destructive'}>{sm.proficiency}%</span>
                  </div>
                  <Progress value={sm.proficiency} className="h-2" />
                </div>
              )) : <p className="text-sm text-muted-foreground">No skill data available.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="w-4 h-4" /> Skill Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.skillGaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.skillGaps.map(g => (
                    <Badge key={g} variant="outline" className="border-destructive text-destructive">{g}</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-[hsl(142,71%,45%)]">No skill gaps identified!</p>}

              {candidate.flags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2 text-[hsl(38,92%,50%)]">⚠️ Inconsistency Alerts</p>
                  <ul className="space-y-1 text-sm">
                    {candidate.flags.map((f, i) => <li key={i} className="text-[hsl(38,92%,50%)]">• {f}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4" /> Strengths & Weaknesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Strengths</p>
                  <ul className="space-y-1">{candidate.strengths.map((s, i) => <li key={i} className="text-sm text-[hsl(142,71%,45%)]">✓ {s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Weaknesses</p>
                  <ul className="space-y-1">{candidate.weaknesses.map((w, i) => <li key={i} className="text-sm text-destructive">✗ {w}</li>)}</ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Brain className="w-4 h-4" /> AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{candidate.aiExplanation.summary || 'No AI summary available.'}</p>
              <div className="mt-4 flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold">{candidate.aiExplanation.confidence}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recommendation</p>
                  <Badge variant={candidate.aiExplanation.recommendation === 'Shortlist' ? 'default' : 'secondary'}>
                    {candidate.aiExplanation.recommendation || 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
