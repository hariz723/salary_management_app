import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  TextField,
  Fab,
  Tooltip,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
  Collapse,
  Badge as MuiBadge,
} from '@mui/material';
import {
  SmartToy,
  Close,
  Send,
  DeleteSweep,
  AutoAwesome,
  Person,
  NorthEast,
} from '@mui/icons-material';
import { queryChatbot } from '../../services/api';
import { ChatMessage } from '../../types';

export const CompensationChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 Welcome to **PayHub AI Assistant**, powered by **Hugging Face**! Ask me questions about global workforce headcount, department pay, salary band outliers, top earners, or gender pay parity.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Who are the top 5 highest earners?',
        'What is the average salary in Engineering?',
        'What is the gender pay gap?',
        'How many employees are underpaid?',
        'Show workforce by country',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await queryChatbot(query);
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: res.category,
        dataType: res.data_type,
        data: res.data,
        suggestions: res.suggestions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chatbot error:', err);
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Sorry, I encountered an error querying the compensation database. Please check your network or try a different question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'What is the total annual payroll?',
          'Who is the highest paid employee?',
          'What is the salary band compliance rate?',
        ],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome_cleared',
        sender: 'bot',
        text: 'Conversation reset. What would you like to analyze next regarding workforce compensation?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Who are the top 5 highest earners?',
          'What is the average salary in Engineering?',
          'What is the gender pay parity ratio?',
          'Show underpaid outliers',
        ],
      },
    ]);
  };

  // Helper to format basic markdown bold **text** and code `code`
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            style={{
              backgroundColor: 'rgba(0,0,0,0.06)',
              padding: '2px 4px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.85em',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Chat Widget Window */}
      <Collapse in={isOpen} unmountOnExit>
        <Card
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 90 },
            right: { xs: 16, sm: 24 },
            width: { xs: 'calc(100vw - 32px)', sm: 420 },
            height: 560,
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            borderRadius: 4,
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <CardHeader
            avatar={
              <MuiBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#10b981',
                    color: '#10b981',
                    boxShadow: '0 0 0 2px #ffffff',
                  },
                }}
              >
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    width: 38,
                    height: 38,
                  }}
                >
                  <SmartToy sx={{ fontSize: 20, color: '#ffffff' }} />
                </Avatar>
              </MuiBadge>
            }
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Reset Chat History">
                  <IconButton size="small" onClick={handleClearHistory} sx={{ color: '#64748b' }}>
                    <DeleteSweep fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Minimize">
                  <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: '#64748b' }}>
                    <Close fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  PayHub Assistant
                </Typography>
                <Chip
                  label="Hugging Face 🤗"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                  }}
                />
              </Box>
            }
            subheader={
              <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AutoAwesome sx={{ fontSize: 12, color: '#f59e0b' }} /> AI-Powered Compensation Intelligence
              </Typography>
            }
            sx={{
              p: 1.75,
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
            }}
          />

          {/* Transcript Scroll Area */}
          <CardContent
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  {/* Category Chip */}
                  {!isUser && msg.category && (
                    <Chip
                      label={msg.category}
                      size="small"
                      sx={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        height: 18,
                        mb: 0.5,
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                      }}
                    />
                  )}

                  {/* Message Bubble */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isUser ? '#1d4ed8' : '#ffffff',
                      color: isUser ? '#ffffff' : '#1e293b',
                      border: isUser ? 'none' : '1px solid #e2e8f0',
                      maxWidth: '92%',
                      boxShadow: isUser ? '0 4px 12px rgba(29, 78, 216, 0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.5,
                        fontSize: '0.84rem',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {renderFormattedText(msg.text)}
                    </Typography>

                    {/* Rich Data View: KPI Grid */}
                    {msg.dataType === 'kpi' && msg.data && (
                      <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        {Object.entries(msg.data).map(([key, val]) => (
                          <Paper
                            key={key}
                            elevation={0}
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              backgroundColor: '#f8fafc',
                              border: '1px solid #f1f5f9',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6875rem', display: 'block', fontWeight: 600 }}>
                              {key}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8125rem' }}>
                              {String(val)}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}

                    {/* Rich Data View: Table */}
                    {msg.dataType === 'table' && msg.data?.rows && (
                      <Box
                        sx={{
                          mt: 1.5,
                          maxHeight: 180,
                          overflowY: 'auto',
                          borderRadius: 2,
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.725rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                              {msg.data.headers?.map((h: string) => (
                                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.data.rows.map((row: any, rIdx: number) => (
                              <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                {Object.values(row).map((v: any, cIdx: number) => (
                                  <td key={cIdx} style={{ padding: '6px 8px', color: '#1e293b' }}>
                                    {String(v)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    )}

                    {/* Rich Data View: Single Employee Card */}
                    {msg.dataType === 'employee' && msg.data && (
                      <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Person sx={{ fontSize: 18, color: '#2563eb' }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {msg.data['Full Name']} ({msg.data['Employee Code']})
                          </Typography>
                          <Chip
                            label={msg.data['Band Status']}
                            size="small"
                            color={msg.data['Band Status'] === 'WITHIN BAND' ? 'success' : 'warning'}
                            sx={{ height: 18, fontSize: '0.625rem', fontWeight: 800, ml: 'auto' }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {msg.data['Role & Department']} • {msg.data['Location']}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>Total Comp (USD):</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {msg.data['Total Compensation']}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Paper>

                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.5, px: 0.5 }}>
                    {msg.timestamp}
                  </Typography>

                  {/* Suggestions Chips */}
                  {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1, maxWidth: '95%' }}>
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <Chip
                          key={sIdx}
                          label={suggestion}
                          size="small"
                          onClick={() => handleSendMessage(suggestion)}
                          icon={<NorthEast sx={{ fontSize: '10px !important' }} />}
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#eff6ff',
                              borderColor: '#93c5fd',
                              color: '#1d4ed8',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}

            {/* Typing / Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#eff6ff', color: '#2563eb' }}>
                  <AutoAwesome sx={{ fontSize: 16 }} />
                </Avatar>
                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CircularProgress size={14} sx={{ color: '#2563eb' }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Analyzing compensation database...
                  </Typography>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Footer Input */}
          <CardActions
            sx={{
              p: 1.5,
              backgroundColor: '#ffffff',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}
            >
              <TextField
                inputRef={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about salary, department, outliers..."
                size="small"
                fullWidth
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: '#f8fafc',
                    fontSize: '0.84rem',
                  },
                }}
              />
              <IconButton
                type="submit"
                disabled={!inputMessage.trim() || loading}
                sx={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: 2.5,
                  p: 1,
                  '&:hover': { backgroundColor: '#1d4ed8' },
                  '&.Mui-disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' },
                }}
              >
                <Send fontSize="small" />
              </IconButton>
            </Box>
          </CardActions>
        </Card>
      </Collapse>

      {/* Floating Action Button */}
      <Tooltip title={isOpen ? 'Close Assistant' : 'Ask Hugging Face AI Assistant 🤗'} placement="left">
        <Fab
          color="primary"
          onClick={() => setIsOpen((prev) => !prev)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          {isOpen ? <Close /> : <SmartToy />}
        </Fab>
      </Tooltip>
    </>
  );
};
