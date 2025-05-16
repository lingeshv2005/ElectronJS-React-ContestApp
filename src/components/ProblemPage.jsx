import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import '../styles/SolveProblem.css';

// ...import statements unchanged
export default function ProblemPage() {
  const { contestId, problemId } = useParams();
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [result, setResult] = useState(null);
  const [testCaseResults, setTestCaseResults] = useState([]); // Store the test case results
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (problemId) {
      setLoading(true);
      axios.get(`https://leetcode-tracker-backend-user.onrender.com/problems/${problemId}`)
        .then((res) => {
          setProblem(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching problem:', err);
          navigate(`/${contestId}/join`, { replace: true });
          setError('Failed to load problem details');
          setLoading(false);
        });
    }
  }, [problemId]);

  const handleSubmit = async () => {
    if (!userId) {
      alert('User not logged in');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`https://leetcode-tracker-backend-user.onrender.com/contest/${contestId}/submit`, {
        userId,
        problemId,
        code,
        language,
      });
      setResult(res.data.submission);
      setTestCaseResults(res.data.testCaseResults); // Update test case results
      setError(res.data.stderr || null);
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting code:', error);
      setError('Error submitting code');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="problem-loading">Loading problem...</div>;
  if (error) return <div className="problem-error">{error}</div>;
  
  const handleNavigate = () => {
    navigate(`/${contestId}`); 
  };


  return (
    <div className="solve-problem-container">
      <div className="problem-details">
        <button onClick={handleNavigate}>←</button>
        <h2 className="problem-title">{problem?.title}</h2>

        <div className="problem-section"><strong>Statement:</strong><p>{problem?.statement}</p></div>

        {problem.inputFormat && (
          <div className="problem-section"><strong>Input Format:</strong><p>{problem.inputFormat}</p></div>
        )}

        {problem.outputFormat && (
          <div className="problem-section"><strong>Output Format:</strong><p>{problem.outputFormat}</p></div>
        )}

        {problem.sampleInput && (
          <div className="problem-section"><strong>Sample Input:</strong><pre>{problem.sampleInput}</pre></div>
        )}

        {problem.sampleOutput && (
          <div className="problem-section"><strong>Sample Output:</strong><pre>{problem.sampleOutput}</pre></div>
        )}

        {problem.constraints?.length > 0 && (
          <div className="problem-section">
            <strong>Constraints:</strong>
            <ul>
              {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {problem.tags?.length > 0 && (
          <div className="problem-section">
            <strong>Tags:</strong> {problem.tags.join(', ')}
          </div>
        )}

        <div className="problem-section">
          <strong>Difficulty:</strong> {problem.difficulty} | <strong>Points:</strong> {problem.points}
        </div>
      </div>

      <div className="code-section">
        <div className="language-selection">
          <label htmlFor="language">Language: </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-select"
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        <Editor
          height="70vh"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value)}
          className="code-editor"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
          }}
        />

        <button
          onClick={handleSubmit}
          className="submit-button"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Solution'}
        </button>
      </div>

      {result && (
        <div className="result-section">
          <h3 className="result-title">Submission Result</h3>
          <div className={`result-status ${result.result.status.toLowerCase()}`}>
            Status: {result.result.status}
          </div>
          <div className="result-details">
            <div>Passed: {result.result.passedTestCases} / {result.result.totalTestCases}</div>
            <div>Score: {result.scoreAwarded}</div>
          </div>

          {testCaseResults.length > 0 && (
            <div className="failed-tests">
              <h4>Test Case Results:</h4>
              <ul>
                {testCaseResults.map((test, idx) => (
                  <li key={idx}>
                    <pre><strong>Input:</strong> {test.input}</pre>
                    <pre><strong>Expected:</strong> {test.expectedOutput}</pre>
                    <pre><strong>Got:</strong> {test.actualOutput}</pre>
                    <div>Execution Time: {test.execTime} ms</div>
                    <div>Memory Used: {test.memoryUsedKb} MB</div>
                    <div>Status: {test.status}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="stderr-section">
              <h4>Error Output:</h4>
              <pre className="stderr">{error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
