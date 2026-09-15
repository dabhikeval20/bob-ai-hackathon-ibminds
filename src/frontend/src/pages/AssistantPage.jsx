import { useRef, useState } from 'react';
import { postJson } from '../lib/api';
import AssistantResponse from '../components/AssistantResponse';
import { ErrorState, LoadingState } from '../components/DataStates';

const suggestedQuestions = [
  'Which shipments need immediate attention?',
  'Why is shipment SG-0001 high risk?',
  'Which vehicles are idle?',
  'Are there any temperature alerts?',
  'What disruptions are affecting shipments?',
  'Which vehicles can help with shipment SG-0001?',
  'What should I do first as a logistics manager?'
];

export default function AssistantPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({ loading: false, error: null });
  const inputRef = useRef(null);

  async function submitQuestion(nextQuestion = question) {
    const value = nextQuestion.trim();
    if (!value || state.loading) return;
    setQuestion('');
    setState({ loading: true, error: null });
    setMessages((current) => [...current, { type: 'user', text: value }]);
    try {
      const response = await postJson('/assistant/ask', { question: value });
      setMessages((current) => [...current, { type: 'assistant', response }]);
      setState({ loading: false, error: null });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitQuestion();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  }

  return <div className="assistant-page"><section className="hero-panel"><div><p className="eyebrow text-cyan-300">Operations assistant</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ask the control room a logistics question.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Get grounded answers from shipment, risk, disruption, fleet, and cold-chain records. Facts and recommendations stay separate.</p></div><div className="hero-signal" aria-hidden="true"><span>Grounded</span><strong>trusted records</strong><i /></div></section><section className="assistant-workspace"><div className="assistant-thread" aria-live="polite">{messages.length === 0 && !state.loading ? <div className="assistant-empty"><div className="assistant-empty-mark" aria-hidden="true">?</div><h3>What should we investigate?</h3><p>Choose a suggested question or ask about the current synthetic logistics data.</p></div> : messages.map((message, index) => message.type === 'user' ? <div className="message-row user-row" key={`${message.text}-${index}`}><div className="user-bubble">{message.text}</div></div> : <div className="message-row" key={`${message.response.answer}-${index}`}><AssistantResponse response={message.response} /></div>)}{state.loading && <div className="message-row"><div className="assistant-loading"><span className="loading-spinner" /> Reviewing trusted logistics data...</div></div>}{state.error && <ErrorState message={state.error} onRetry={() => setState({ loading: false, error: null })} />}</div><aside className="assistant-suggestions"><p className="eyebrow">Suggested questions</p><div className="mt-3 space-y-2">{suggestedQuestions.map((suggestion) => <button className="suggestion-button" disabled={state.loading} key={suggestion} onClick={() => submitQuestion(suggestion)}>{suggestion}<span aria-hidden="true">→</span></button>)}</div><p className="mt-5 text-xs leading-5 text-slate-500">Responses are limited to available SupplyGuard records. Missing data is reported explicitly.</p></aside></section><form className="assistant-composer" onSubmit={handleSubmit}><label className="sr-only" htmlFor="assistant-question">Ask SupplyGuard a question</label><textarea aria-describedby="assistant-input-hint" aria-label="Ask SupplyGuard a question" id="assistant-question" onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about shipments, risk, fleet, disruptions, or cold-chain alerts..." ref={inputRef} rows="2" value={question} /><div className="composer-footer"><span id="assistant-input-hint">Press Enter to send · Shift+Enter for a new line</span><button className="send-button" disabled={!question.trim() || state.loading} type="submit">{state.loading ? 'Reviewing...' : 'Ask SupplyGuard'}<span aria-hidden="true">↗</span></button></div></form></div>;
}
