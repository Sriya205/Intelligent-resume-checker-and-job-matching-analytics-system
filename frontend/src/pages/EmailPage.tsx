import { useState } from 'react';
import { useATS } from '@/contexts/ATSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailRecord } from '@/types/ats';
import emailjs from '@emailjs/browser';

// ✅ Aapki EmailJS credentials
const EMAILJS_SERVICE_ID = "service_v5u5xrr";
const EMAILJS_TEMPLATE_ID = "template_reyrt8o";
const EMAILJS_PUBLIC_KEY = "QQIQEHFrdEZisj6MG";

export default function EmailPage() {
  const { candidates, emailTemplates, emailRecords, addEmailRecord, jobs } = useATS();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const template = emailTemplates.find(t => t.id === selectedTemplate);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = emailTemplates.find(t => t.id === id);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const sendEmails = async () => {
    if (selectedCandidates.length === 0) {
      toast({ title: 'Select candidates', description: 'Please select at least one candidate.', variant: 'destructive' });
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const cid of selectedCandidates) {
      const c = candidates.find(x => x.id === cid);
      if (!c) continue;

      const job = jobs.find(j => j.id === c.jobId);

      // Subject aur body mein placeholder replace karo
      const finalSubject = subject
        .replace('{{candidateName}}', c.name)
        .replace('{{jobTitle}}', job?.title || '');

      const finalBody = body
        .replace('{{candidateName}}', c.name)
        .replace('{{jobTitle}}', job?.title || '');

      try {
        // ✅ Real email bhejna EmailJS se
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: c.email,
            to_name: c.name,
            subject: finalSubject,
            message: finalBody,
          },
          EMAILJS_PUBLIC_KEY
        );

        successCount++;

        // Record save karo
        const record: EmailRecord = {
          id: crypto.randomUUID(),
          candidateId: c.id,
          candidateName: c.name,
          templateType: template?.type || 'custom',
          subject: finalSubject,
          status: 'sent',
          sentAt: new Date(),
        };
        addEmailRecord(record);

      } catch (err) {
        console.error(`Email failed for ${c.name}:`, err);
        failCount++;

        const record: EmailRecord = {
          id: crypto.randomUUID(),
          candidateId: c.id,
          candidateName: c.name,
          templateType: template?.type || 'custom',
          subject: finalSubject,
          status: 'failed',
          sentAt: new Date(),
        };
        addEmailRecord(record);
      }
    }

    setSending(false);
    setSelectedCandidates([]);

    if (successCount > 0) {
      toast({ title: '✅ Emails Sent!', description: `${successCount} email(s) sent successfully!` });
    }
    if (failCount > 0) {
      toast({ title: '❌ Some Failed', description: `${failCount} email(s) failed.`, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Automation</h1>
        <p className="text-muted-foreground">Send real emails to candidates via EmailJS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Compose Email</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger>
                <SelectContent>
                  {emailTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Body</label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Email body..." />
            </div>
            <p className="text-xs text-muted-foreground">Placeholders: {'{{candidateName}}'}, {'{{jobTitle}}'}</p>
            <Button onClick={sendEmails} className="w-full" disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : `Send to ${selectedCandidates.length} candidate(s)`}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Select Candidates</CardTitle></CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No candidates available. Screen resumes first.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {candidates.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={selectedCandidates.includes(c.id)}
                      onCheckedChange={() => toggleCandidate(c.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email} — {c.matchScore}% match</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{c.status}</Badge>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {emailRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" /> Sent Communications
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailRecords.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.candidateName}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.subject}</TableCell>
                  <TableCell><Badge variant="secondary">{r.templateType}</Badge></TableCell>
                  <TableCell>
                    <Badge className={r.status === 'sent' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.sentAt.toLocaleString()}
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