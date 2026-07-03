import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function TaskDetailPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const load = useCallback(async () => {
    const [taskRes, commentsRes] = await Promise.all([
      api.get(`/tasks/${id}`),
      api.get(`/tasks/${id}/comments`),
    ]);
    setTask(taskRes.data.task);
    setAssignments(taskRes.data.assignments);
    setComments(commentsRes.data.comments);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(submissionId, score, feedback, approve) {
    await api.post(`/tasks/submissions/${submissionId}/review`, { score, feedback, approve });
    load();
  }

  async function postComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    await api.post(`/tasks/${id}/comments`, { body: newComment });
    setNewComment('');
    load();
  }

  if (!task) {
    return <div className="px-6 py-10 text-parchment/50 font-mono text-sm">Loading task…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to="/tasks" className="text-parchment/45 text-sm hover:text-parchment mb-4 inline-block">
        ← All tasks
      </Link>

      <h1 className="font-display text-3xl text-parchment mb-1">{task.title}</h1>
      <p className="text-parchment/50 text-sm mb-1">
        {task.program_name} {task.due_date ? `· due ${task.due_date.slice(0, 10)}` : ''}
      </p>
      {task.description && <p className="text-parchment/70 mt-4 mb-8">{task.description}</p>}

      <h2 className="font-display text-xl text-parchment mb-4">Submissions</h2>
      <div className="space-y-3 mb-10">
        {assignments.map((a) => (
          <SubmissionRow key={a.assignment_id} assignment={a} onReview={handleReview} />
        ))}
        {assignments.length === 0 && <p className="text-parchment/40 text-sm">No one assigned yet.</p>}
      </div>

      <h2 className="font-display text-xl text-parchment mb-4">Discussion</h2>
      <div className="space-y-3 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-ink-panel border border-ink-line rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-parchment font-medium">{c.author_name}</span>
              <span className="text-[10px] font-mono uppercase text-parchment/40">{c.author_role}</span>
            </div>
            <p className="text-sm text-parchment/75">{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-parchment/35 text-sm">No comments yet.</p>}
      </div>

      <form onSubmit={postComment} className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 bg-ink border border-ink-line rounded-md px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
        />
        <button type="submit" className="bg-parchment text-parchment-text font-semibold rounded-md px-4 py-2 text-sm">
          Post
        </button>
      </form>
    </div>
  );
}

function SubmissionRow({ assignment: a, onReview }) {
  const [score, setScore] = useState(a.score ?? '');
  const [feedback, setFeedback] = useState(a.feedback || '');
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-ink-panel border border-ink-line rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-parchment font-medium text-sm">{a.intern_name}</p>
          <p className="text-xs text-parchment/45 font-mono">{a.email}</p>
        </div>
        <span className="text-[11px] font-mono uppercase text-parchment/50">{a.status.replace('_', ' ')}</span>
      </div>

      {a.content_url ? (
        <p className="text-sm font-mono text-stamp-amber/90 truncate mb-2">{a.content_url}</p>
      ) : (
        <p className="text-sm text-parchment/35 mb-2">No submission yet.</p>
      )}
      {a.submission_notes && <p className="text-sm text-parchment/60 mb-2">{a.submission_notes}</p>}

      {a.content_url && (
        <>
          {!editing && a.review_id ? (
            <div className="bg-ink border border-ink-line rounded-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-parchment/45">Score: {a.score}/100</p>
                {a.feedback && <p className="text-sm text-parchment/75 mt-1">{a.feedback}</p>}
              </div>
              <button onClick={() => setEditing(true)} className="text-stamp-amber text-xs shrink-0 ml-3">
                Edit
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Score"
                className="w-20 bg-ink border border-ink-line rounded-md px-2 py-1.5 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              />
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback"
                className="flex-1 min-w-[160px] bg-ink border border-ink-line rounded-md px-3 py-1.5 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              />
              <button
                onClick={() => {
                  onReview(a.submission_id, score, feedback, true);
                  setEditing(false);
                }}
                disabled={score === ''}
                className="bg-stamp-green text-parchment text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  onReview(a.submission_id, score, feedback, false);
                  setEditing(false);
                }}
                disabled={score === ''}
                className="bg-stamp-red/80 text-parchment text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-40"
              >
                Request revision
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
