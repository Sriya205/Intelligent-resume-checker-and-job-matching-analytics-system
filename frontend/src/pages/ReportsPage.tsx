import { useATS } from '@/contexts/ATSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['hsl(217, 71%, 45%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export default function ReportsPage() {
  const { candidates, resumes, jobs } = useATS();

  const funnelData = [
    { name: 'Applied', value: resumes.length },
    { name: 'Screened', value: candidates.length },
    { name: 'Shortlisted', value: candidates.filter(c => c.status === 'shortlisted').length },
    { name: 'Interview', value: candidates.filter(c => c.status === 'interview').length },
    { name: 'Hired', value: candidates.filter(c => c.status === 'hired').length },
  ];

  const statusData = [
    { name: 'Pending', value: candidates.filter(c => c.status === 'pending').length },
    { name: 'Shortlisted', value: candidates.filter(c => c.status === 'shortlisted').length },
    { name: 'Rejected', value: candidates.filter(c => c.status === 'rejected').length },
    { name: 'Interview', value: candidates.filter(c => c.status === 'interview').length },
  ].filter(d => d.value > 0);

  // Skill demand across jobs
  const skillCounts: Record<string, number> = {};
  jobs.forEach(j => j.skills.forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));
  const skillDemand = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([skill, count]) => ({ skill, count }));

  // Avg match score per job
  const jobScores = jobs.map(j => {
    const jc = candidates.filter(c => c.jobId === j.id);
    const avg = jc.length ? Math.round(jc.reduce((s, c) => s + c.matchScore, 0) / jc.length) : 0;
    return { job: j.title.slice(0, 20), avgScore: avg, count: jc.length };
  });

  const hasData = resumes.length > 0 || candidates.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Hiring insights, trends, and performance metrics</p>
      </div>

      {!hasData ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No data yet. Upload resumes and screen candidates to generate reports.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Hiring Funnel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(217, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Candidate Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No candidates to display.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Skill Demand Across Jobs</CardTitle></CardHeader>
            <CardContent>
              {skillDemand.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={skillDemand} layout="vertical">
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="skill" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Create jobs to see skill demand.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Average Match Score by Job</CardTitle></CardHeader>
            <CardContent>
              {jobScores.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={jobScores}>
                    <XAxis dataKey="job" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No job data.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
