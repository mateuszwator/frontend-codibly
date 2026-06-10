import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Chip
} from '@mui/material';
import { ElectricCar, EvStation, FlashOn, Timeline, CalendarToday } from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';

const API_BASE_URL = 'http://localhost:8080/api';

interface FuelAverage {
  fuel: string;
  percentage: number;
}

interface DailyEnergyMix {
  date: string;
  cleanEnergyPercentage: number;
  generationMix: FuelAverage[];
}

interface OptimalChargingWindow {
  startTimeLondon: string;
  endTimeLondon: string;
  startTimeUtc: string;
  endTimeUtc: string;
  averageCleanEnergyPercentage: number;
}

const FUEL_COLORS: Record<string, string> = {
  wind: '#26A69A',      // Teal
  solar: '#FFCA28',     // Amber
  hydro: '#29B6F6',     // Blue
  nuclear: '#AB47BC',   // Purple
  biomass: '#8D6E63',   // Brown
  coal: '#78909C',      // Slate Gray
  gas: '#FF7043',       // Coral Orange
  imports: '#EC407A',   // Pink
  other: '#BDC3C7'      // Light Gray
};

const getFuelColor = (fuel: string): string => {
  return FUEL_COLORS[fuel.toLowerCase()] || FUEL_COLORS.other;
};

const getFuelLabelPl = (fuel: string): string => {
  const translations: Record<string, string> = {
    biomass: 'Biomasa',
    coal: 'Węgiel',
    imports: 'Import',
    gas: 'Gaz',
    nuclear: 'Jądrowa',
    other: 'Inne',
    hydro: 'Hydroenergia',
    solar: 'Fotowoltaika',
    wind: 'Wiatr'
  };
  return translations[fuel.toLowerCase()] || fuel;
};

export default function App() {
  const [mixData, setMixData] = useState<DailyEnergyMix[]>([]);
  const [mixLoading, setMixLoading] = useState<boolean>(true);
  const [mixError, setMixError] = useState<string | null>(null);

  const [duration, setDuration] = useState<number>(3);
  const [windowData, setWindowData] = useState<OptimalChargingWindow | null>(null);
  const [windowLoading, setWindowLoading] = useState<boolean>(false);
  const [windowError, setWindowError] = useState<string | null>(null);

  // pobieramy dane na starcie
  useEffect(() => {
    fetchEnergyMix();
  }, []);

  const fetchEnergyMix = async () => {
    setMixLoading(true);
    setMixError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/energy-mix`);
      if (!res.ok) {
        throw new Error(`Błąd serwera: ${res.status}`);
      }
      const data: DailyEnergyMix[] = await res.json();
      setMixData(data);
    } catch (err: any) {
      setMixError(err.message || 'Nie udało się pobrać miksu energetycznego.');
    } finally {
      setMixLoading(false);
    }
  };

  const calculateOptimalWindow = async () => {
    setWindowLoading(true);
    setWindowError(null);
    setWindowData(null);
    try {
      const res = await fetch(`${API_BASE_URL}/charging/optimal-window?durationHours=${duration}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Błąd serwera: ${res.status}`);
      }
      const data: OptimalChargingWindow = await res.json();
      setWindowData(data);
    } catch (err: any) {
      setWindowError(err.message || 'Nie udało się obliczyć okna ładowania.');
    } finally {
      setWindowLoading(false);
    }
  };

  const formatDateTime = (isoStr: string, timeZone?: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    if (timeZone) {
      options.timeZone = timeZone;
    }
    return new Date(isoStr).toLocaleString('pl-PL', options);
  };

  const getDayLabel = (index: number, dateStr: string) => {
    const labels = ['Dzisiaj', 'Jutro', 'Pojutrze'];
    return `${labels[index]} (${dateStr})`;
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <Toolbar>
          <EvStation sx={{ mr: 2, color: '#10b981' }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Smart Charge GB & Miks Energetyczny
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' }, gap: 4, alignItems: 'center' }}>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <ElectricCar sx={{ color: '#0284c7', fontSize: 32 }} />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                    Optymalizacja Ładowania EV
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Podaj planowany czas ładowania samochodu elektrycznego (w pełnych godzinach). 
                  Aplikacja znajdzie przedział czasowy w ciągu najbliższych 48 godzin, w którym średni udział czystej energii w sieci jest najwyższy.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <FormControl sx={{ minWidth: 160 }}>
                    <InputLabel id="duration-select-label">Czas ładowania</InputLabel>
                    <Select
                      labelId="duration-select-label"
                      id="duration-select"
                      value={duration}
                      label="Czas ładowania"
                      onChange={(e) => setDuration(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((h) => (
                        <MenuItem key={h} value={h}>
                          {h} {h === 1 ? 'godzina' : h < 5 ? 'godziny' : 'godzin'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    onClick={calculateOptimalWindow}
                    disabled={windowLoading}
                    size="large"
                    startIcon={windowLoading ? <CircularProgress size={20} color="inherit" /> : <FlashOn />}
                    sx={{ 
                      bgcolor: '#0284c7', 
                      '&:hover': { bgcolor: '#0369a1' },
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Znajdź okno ładowania
                  </Button>
                </Box>

                {windowError && (
                  <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                    {windowError}
                  </Alert>
                )}
              </Box>

              <Box>
                {windowLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <CircularProgress size={48} sx={{ color: '#0284c7', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Trwa analizowanie prognozy energetycznej GB...
                    </Typography>
                  </Box>
                ) : windowData ? (
                  <Card variant="outlined" sx={{ borderRadius: 3, border: '2px solid #10b981', bgcolor: '#f0fdf4' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip 
                          label="Najlepszy przedział" 
                          color="success" 
                          sx={{ fontWeight: 600, borderRadius: 1.5 }} 
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h4" component="div" sx={{ color: '#065f46', fontWeight: 800 }}>
                            {windowData.averageCleanEnergyPercentage}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Średni udział czystej energii
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2, borderColor: '#a7f3d0' }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#065f46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Timeline fontSize="small" /> Czas Londynu (Wielka Brytania)
                          </Typography>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                            <strong>Od:</strong> {formatDateTime(windowData.startTimeLondon, 'Europe/London')}
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            <strong>Do:</strong> {formatDateTime(windowData.endTimeLondon, 'Europe/London')}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#1e3a8a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday fontSize="small" /> Twój czas lokalny
                          </Typography>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                            <strong>Od:</strong> {formatDateTime(windowData.startTimeLondon)}
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            <strong>Do:</strong> {formatDateTime(windowData.endTimeLondon)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: 200,
                      border: '2px dashed #cbd5e1', 
                      borderRadius: 3, 
                      p: 3, 
                      textAlign: 'center' 
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Wybierz czas ładowania i kliknij przycisk, aby wyznaczyć optymalne okno.
                    </Typography>
                  </Box>
                )}
              </Box>

            </Box>
          </Paper>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Timeline sx={{ color: '#10b981', fontSize: 32 }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                Dobowy Miks Energetyczny Wielkiej Brytanii
              </Typography>
            </Box>

            {mixLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={48} sx={{ color: '#10b981' }} />
              </Box>
            ) : mixError ? (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {mixError}
              </Alert>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {mixData.map((day, idx) => {
                  const chartData = day.generationMix
                    .filter(item => item.percentage > 0)
                    .map((item, index) => ({
                      id: index,
                      value: item.percentage,
                      label: getFuelLabelPl(item.fuel),
                      color: getFuelColor(item.fuel)
                    }));

                  return (
                    <Card key={day.date} variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: 520 }}>
                      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                          {getDayLabel(idx, day.date)}
                        </Typography>

                        <Box 
                          sx={{ 
                            bgcolor: '#ecfdf5', 
                            color: '#047857', 
                            p: 1.5, 
                            borderRadius: 2, 
                            mb: 3, 
                            fontWeight: 700, 
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}
                        >
                          Czysta energia: {day.cleanEnergyPercentage}%
                        </Box>

                        {chartData.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
                            <Box sx={{ width: '100%', height: 200, mb: 2 }}>
                              <PieChart
                                series={[
                                  {
                                    data: chartData,
                                    innerRadius: 40,
                                    outerRadius: 80,
                                    paddingAngle: 2,
                                    cornerRadius: 4,
                                    cx: '50%',
                                    cy: '50%',
                                  },
                                ]}
                                height={200}
                                margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                slotProps={{ legend: { hidden: true } as any }}
                              />
                            </Box>

                            <Divider sx={{ width: '100%', my: 2 }} />

                            {/* wlasna legenda, bo domyslna z mui-charts sie rozjeżdżała */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, width: '100%' }}>
                              {day.generationMix.map((item) => (
                                <Box key={item.fuel} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                  <Box 
                                    sx={{ 
                                      width: 10, 
                                      height: 10, 
                                      borderRadius: '50%', 
                                      bgcolor: getFuelColor(item.fuel),
                                      flexShrink: 0 
                                    }} 
                                  />
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.75rem' 
                                    }}
                                  >
                                    {getFuelLabelPl(item.fuel)}: <strong>{item.percentage}%</strong>
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                            <Typography variant="body2" color="text.secondary">
                              Brak danych o miksie
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>

        </Box>
      </Container>
    </Box>
  );
}
