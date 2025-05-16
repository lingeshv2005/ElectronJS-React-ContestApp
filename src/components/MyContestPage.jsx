import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/MyContest.css';

export default function MyContestPage() {
  const [participatedContests, setParticipatedContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      fetchContests();
    } else {
      setError('User not logged in');
      setLoading(false);
    }
  }, [userId]);

  const fetchContests = async () => {
    localStorage.removeItem('contestId');
    try {
      setLoading(true);
      const [participatedRes] = await Promise.all([
        axios.get(`https://leetcode-tracker-backend-user.onrender.com/contest/participant/${userId}`),
      ]);
      setParticipatedContests(participatedRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching contests:', err);
      setError('Failed to load contests. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) return <div className="contests-loading">Loading your contests...</div>;
  if (error) return <div className="contests-error">{error}</div>;

  return (
    <div className="my-contests-container">
      <h1 className="my-contests-title">My Contests</h1>
      {participatedContests.length > 0 && (
        <>
          <h2 className="section-title">Contests You Participated In</h2>
          <div className="contests-grid">
            {participatedContests.map((contest) => (
              <Link to={`/${contest.contestId}`} className="contest-content" key={contest.contestId}>
                <h2 className="contest-title">{contest.title}</h2>
                <p className="contest-description">{contest.description}</p>
                <div className="contest-meta">
                  <span>Start: {new Date(contest.startTime).toLocaleString()}</span>
                  <span>End: {new Date(contest.endTime).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {participatedContests.length === 0 && (
        <div className="no-contests">
          <p>You haven’t joined any contests yet.</p>
        </div>
      )}
    </div>
  );
}
