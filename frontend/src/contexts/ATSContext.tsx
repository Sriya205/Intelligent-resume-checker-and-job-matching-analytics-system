import React, { createContext, useContext, useState, useCallback } from 'react';
import { Job, Resume, Candidate, EmailRecord, EmailTemplate, ActivityItem } from '@/types/ats';

const defaultTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Shortlist Notification',
    type: 'shortlist',
    subject: 'Congratulations! You\'ve been shortlisted for {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nWe are pleased to inform you that you have been shortlisted for the position of {{jobTitle}}. We were impressed by your qualifications and experience.\n\nWe will be in touch shortly with the next steps.\n\nBest regards,\nHR Team',
  },
  {
    id: '2',
    name: 'Rejection Notice',
    type: 'rejection',
    subject: 'Update on your application for {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nThank you for your interest in the {{jobTitle}} position and for taking the time to apply.\n\nAfter careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.\n\nWe encourage you to apply for future openings.\n\nBest regards,\nHR Team',
  },
  {
    id: '3',
    name: 'Interview Invitation',
    type: 'interview',
    subject: 'Interview Invitation - {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nWe would like to invite you for an interview for the {{jobTitle}} position.\n\nPlease let us know your availability for the coming week.\n\nBest regards,\nHR Team',
  },
  {
    id: '4',
    name: 'Offer Letter',
    type: 'offer',
    subject: 'Job Offer - {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nWe are excited to extend an offer for the {{jobTitle}} position.\n\nPlease review the attached offer details and let us know your decision.\n\nBest regards,\nHR Team',
  },
];

interface ATSContextType {
  jobs: Job[];
  resumes: Resume[];
  candidates: Candidate[];
  emailRecords: EmailRecord[];
  emailTemplates: EmailTemplate[];
  activities: ActivityItem[];
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;
  addResume: (resume: Resume) => void;
  updateResume: (resume: Resume) => void;
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (candidate: Candidate) => void;
  addEmailRecord: (record: EmailRecord) => void;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

const ATSContext = createContext<ATSContextType | undefined>(undefined);

export const ATSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [emailRecords, setEmailRecords] = useState<EmailRecord[]>([]);
  const [emailTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    setActivities(prev => [{
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }, ...prev].slice(0, 50));
  }, []);

  const addJob = useCallback((job: Job) => {
    setJobs(prev => [...prev, job]);
    addActivity({ type: 'job_created', message: `New job posted: ${job.title}` });
  }, [addActivity]);

  const updateJob = useCallback((job: Job) => {
    setJobs(prev => prev.map(j => j.id === job.id ? job : j));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const addResume = useCallback((resume: Resume) => {
    setResumes(prev => [...prev, resume]);
    addActivity({ type: 'resume_uploaded', message: `Resume uploaded: ${resume.fileName}` });
  }, [addActivity]);

  const updateResume = useCallback((resume: Resume) => {
    setResumes(prev => prev.map(r => r.id === resume.id ? resume : r));
  }, []);

  const addCandidate = useCallback((candidate: Candidate) => {
    setCandidates(prev => [...prev, candidate]);
    addActivity({ type: 'candidate_screened', message: `Candidate screened: ${candidate.name} (${candidate.matchScore}% match)` });
  }, [addActivity]);

  const updateCandidate = useCallback((candidate: Candidate) => {
    setCandidates(prev => prev.map(c => c.id === candidate.id ? candidate : c));
  }, []);

  const addEmailRecord = useCallback((record: EmailRecord) => {
    setEmailRecords(prev => [...prev, record]);
    addActivity({ type: 'email_sent', message: `Email sent to ${record.candidateName}` });
  }, [addActivity]);

  return (
    <ATSContext.Provider value={{
      jobs, resumes, candidates, emailRecords, emailTemplates, activities,
      addJob, updateJob, deleteJob, addResume, updateResume,
      addCandidate, updateCandidate, addEmailRecord, addActivity,
    }}>
      {children}
    </ATSContext.Provider>
  );
};

export const useATS = () => {
  const context = useContext(ATSContext);
  if (!context) throw new Error('useATS must be used within ATSProvider');
  return context;
};
