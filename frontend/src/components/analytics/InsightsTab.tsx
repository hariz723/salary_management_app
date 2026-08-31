import React, { useEffect, useState } from 'react';
import { getHRQuestions } from '../../services/api';
import { HRQuestionCard } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Paper,
  Avatar,
  Grid,
} from '@mui/material';
import {
  AutoAwesome,
  People,
  Security,
  CorporateFare,
  Public,
  EmojiEvents,
  HelpOutline,
} from '@mui/icons-material';

export const InsightsTab: React.FC = () => {
  const [questions, setQuestions] = useState<HRQuestionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatMoney } = useCurrency();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await getHRQuestions();
        setQuestions(data);
      } catch (err) {
        console.error('Failed to load HR Q&A:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress size={40} sx={{ color: '#2563eb' }} />
        <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
          Computing strategic organizational pay answers...
        </Typography>
      </Box>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Equity & Diversity':
        return <People sx={{ color: '#db2777' }} />;
      case 'Compensation Governance':
        return <Security sx={{ color: '#d97706' }} />;
      case 'Department Allocation':
        return <CorporateFare sx={{ color: '#4f46e5' }} />;
      case 'Global Payroll':
        return <Public sx={{ color: '#059669' }} />;
      case 'Executive & Key Talent':
        return <EmojiEvents sx={{ color: '#2563eb' }} />;
      default:
        return <HelpOutline sx={{ color: '#2563eb' }} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          color: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Chip
          icon={<AutoAwesome sx={{ fontSize: '14px !important', color: '#93c5fd' }} />}
          label="Automated HR Intelligence"
          size="small"
          sx={{
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            color: '#93c5fd',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            fontWeight: 700,
            fontSize: '0.6875rem',
            mb: 1.5,
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
          Strategic Compensation Q&A
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
          Instant analytical answers to executive questions regarding how the organization pays its employees.
        </Typography>
      </Paper>

      {/* Questions Stack */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {questions.map((q, idx) => (
          <Card key={q.id} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', width: 44, height: 44 }}>
                  {getCategoryIcon(q.category)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip label={q.category} size="small" color="primary" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Question #{idx + 1}</Typography>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                    {q.question}
                  </Typography>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mt: 1.5,
                      borderRadius: 2.5,
                      bgcolor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e3a8a', lineHeight: 1.5 }}>
                      💡 {q.summary_answer}
                    </Typography>
                  </Paper>

                  {q.id === 'q1_gender_parity' && q.detailed_data?.departments && (
                    <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                        Department Gender Pay Parity Ratio (Female / Male)
                      </Typography>
                      <Grid container spacing={1.5}>
                        {q.detailed_data.departments.map((dept: any) => (
                          <Grid item xs={6} sm={3} key={dept.department}>
                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {dept.department}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Ratio:</Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 800,
                                    color: dept.female_to_male_ratio >= 0.95 ? '#059669' : '#d97706',
                                  }}
                                >
                                  {(dept.female_to_male_ratio * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {q.id === 'q5_top_earners' && q.detailed_data?.top_earners && (
                    <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                        Top 5 Highest Compensated Roles
                      </Typography>
                      <Grid container spacing={1.5}>
                        {q.detailed_data.top_earners.map((earner: any, eIdx: number) => (
                          <Grid item xs={12} sm={2.4} key={eIdx}>
                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip label={`#${eIdx + 1}`} size="small" sx={{ height: 18, fontSize: '0.625rem', bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800 }} />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563eb' }}>
                                  {formatMoney(earner.total_comp_usd)}
                                </Typography>
                              </Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {earner.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {earner.title}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
