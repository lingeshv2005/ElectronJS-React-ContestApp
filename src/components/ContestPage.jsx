import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import '../styles/ContestProblems.css';

const defaultBackground = 'https://miro.medium.com/v2/resize:fit:4800/format:webp/1*OhrAmSvpDWk0gzb_08PkhQ.png';

export default function ContestPage() {
  const { contestId } = useParams();
  const [contest, setContest] = useState(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('problems');
const [problemDetails, setProblemDetails] = useState({});

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      setError('User ID not found in local storage.');
      return;
    }
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem('contestId', contestId);
    const fetchContest = async () => {
      try {
        const res = await axios.get(`https://leetcode-tracker-backend-user.onrender.com/contest/${contestId}?userId=${userId}`);
        setContest(res.data);
      } catch (err) {
        console.error('Error fetching contest:', err);
        setError(err.response?.data?.message || 'Failed to fetch contest');
      }
    };

    fetchContest();
  }, [contestId, userId]);

  useEffect(() => {
    if (contest && contest.startTime && contest.endTime) {
      const contestStartTime = new Date(contest.startTime).getTime();
      const contestEndTime = new Date(contest.endTime).getTime();

      if (contestStartTime <= Date.now() && contestEndTime >= Date.now()) {
        setTimerStarted(true);

        const intervalId = setInterval(() => {
          const currentTime = Date.now();
          const remaining = contestEndTime - currentTime;

          if (remaining <= 0) {
            clearInterval(intervalId);
            setRemainingTime(0);
          } else {
            setRemainingTime(remaining);
          }
        }, 1000);

        return () => clearInterval(intervalId);
      }
    }
  }, [contest]);

  useEffect(() => {
  if (!contest || !Array.isArray(contest.problems)) return;

  const fetchProblemDetails = async () => {
    const promises = contest.problems.map(async (problemId) => {
      try {
        const res = await axios.get(`https://leetcode-tracker-backend-user.onrender.com/problems/${problemId}`);
        console.log(`Fetched problem ${problemId}:`, res.data);
        return { problemId, title: res.data.title };
      } catch (error) {
        console.error(`Failed to fetch problem ${problemId}:`, error);
        return { problemId, title: problemId }; // fallback
      }
    });

    const results = await Promise.all(promises);
    const detailsMap = {};
    results.forEach(({ problemId, title }) => {
      detailsMap[problemId] = title;
    });
    setProblemDetails(detailsMap);
  };

  fetchProblemDetails();
}, [contest]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!contest) return <div className="loading-container"><div className="loading-spinner"></div><p>Loading contest details...</p></div>;

  const formatRemainingTime = (remainingTime) => {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const currentParticipant = contest.participants.find(p => p.userId === userId);
  const backgroundImage = contest.backgroundImage || defaultBackground;

  const getSubmissionStatusClass = (status) => {
    if (status === 'Accepted') return 'status-passed';
    if (status === 'Failed') return 'status-failed';
    return 'status-pending';
  };

  const getDifficultyClass = (difficulty) => {
    if (!difficulty) return '';
    const lowerDifficulty = difficulty.toLowerCase();
    if (lowerDifficulty === 'easy') return 'difficulty-easy';
    if (lowerDifficulty === 'medium') return 'difficulty-medium';
    if (lowerDifficulty === 'hard') return 'difficulty-hard';
    return '';
  };

  const problemDifficulties = {
    'easy': ['Problem 1', 'Problem 4'],
    'medium': ['Problem 2', 'Problem 5'],
    'hard': ['Problem 3', 'Problem 6']
  };

  const getProblemDifficulty = (problemId) => {
    for (const [difficulty, problems] of Object.entries(problemDifficulties)) {
      if (problems.includes(problemId)) return difficulty;
    }
    return 'medium';
  };

  return (
    <div className="contest-container">
      <div className="contest-header">
        <img 
          src={backgroundImage} 
          alt="Contest Background" 
          className="contest-background"
        />
        <div className="contest-title-overlay">
          <h1>{contest.title}</h1>
        </div>
      </div>
      <div className="contest-content">
        <div className="description-card">
          <h2>Description</h2>
          <p>{contest.description}</p>
        </div>
        <div className="contest-info">
          <div className="info-card">
            <h3>Start Time</h3>
            <p>{new Date(contest.startTime).toLocaleString()}</p>
          </div>
          <div className="info-card">
            <h3>End Time</h3>
            <p>{new Date(contest.endTime).toLocaleString()}</p>
          </div>
          {timerStarted && (
            <div className="info-card timer-card">
              <h3>Time Remaining</h3>
              <div className="timer-value">{formatRemainingTime(remainingTime)}</div>
            </div>
          )}
        </div>
        
        <div className="contest-tabs">
          <button 
            className={`tab-button ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            Problems
          </button>
          <button 
            className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            Submissions
          </button>
        </div>

        {activeTab === 'problems' && (
          <div className="problems-section">
            <h2 className="section-title">Problems</h2>
            <div className="problems-grid">
              {Array.isArray(contest.problems) && contest.problems.map((problemId, index) => {
                const problemDifficulty = getProblemDifficulty(problemId);
                const difficultyClass = getDifficultyClass(problemDifficulty);
                
                const hasSubmission = currentParticipant?.submissions?.some(
                  sub => sub.problemId === problemId
                );
                
                const isAccepted = currentParticipant?.submissions?.some(
                  sub => sub.problemId === problemId && sub.result.status === 'Accepted'
                );
                
                return (
                  <Link 
                    key={index}
                    to={`/${contestId}/${problemId}`}
                    className={`problem-card ${difficultyClass} ${hasSubmission ? (isAccepted ? 'problem-solved' : 'problem-attempted') : ''}`}
                  >
                    <div className="problem-number">{index + 1}</div>
                    <div className="problem-content">
                      <h3 className="problem-title">{problemDetails[problemId] || problemId}</h3>
                      <div className="problem-meta">
                        <span className={`problem-difficulty ${difficultyClass}`}>
                          {problemDifficulty.charAt(0).toUpperCase() + problemDifficulty.slice(1)}
                        </span>
                        {hasSubmission && (
                          <span className={`submission-indicator ${isAccepted ? 'solved' : 'attempted'}`}>
                            {isAccepted ? 'Solved' : 'Attempted'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="problem-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && currentParticipant && (
          <div className="submissions-container">
            <h2 className="section-title">Your Submissions</h2>
            {currentParticipant.submissions.length > 0 ? (
              <div className="submissions-list">
                {currentParticipant.submissions.map((submission, subIndex) => (
                  <div key={subIndex} className="submission-card">
                    <div className="submission-header">
                      <div className="submission-problem">
                        {problemDetails[submission.problemId] || submission.problemId}
                      </div>
                      <div className="submission-problem">
                        <span className={`submission-status ${getSubmissionStatusClass(submission.result.status)}`}>
                          {submission.result.status}
                        </span>
                      </div>
                      <div className="submission-time">
                        {new Date(submission.submittedAt || Date.now()).toLocaleString()}
                      </div>
                    </div>
                    <div className="submission-grid">
                      <div className="submission-item">
                        <span className="submission-label">Language</span>
                        <div className="submission-value">{submission.language}</div>
                      </div>
                      <div className="submission-item">
                        <span className="submission-label">Test Cases</span>
                        <div className="submission-value">
                          {submission.result.passedTestCases} / {submission.result.totalTestCases}
                        </div>
                      </div>
                      <div className="submission-item">
                        <span className="submission-label">Score</span>
                        <div className="submission-value">{submission.scoreAwarded}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-submissions">
                <p>You haven't made any submissions yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && !currentParticipant && (
          <div className="not-participant">
            You are not a participant in this contest.
          </div>
        )}
      </div>
    </div>
  );
}