import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Brush,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaDownload, 
  FaPrint,
  FaExpand,
  FaCompress,
  FaSun,
  FaMoon,
  FaPalette,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { Card, Button, Dropdown, Form, Badge, Spinner } from 'react-bootstrap';

const AnalyticsChart = ({ 
  data = [], 
  type = 'line',
  xKey = 'name',
  yKey = 'value',
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'],
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  title = '',
  subtitle = '',
  loading = false,
  onExport,
  onPrint,
  currency = false,
  currencySymbol = '₦',
  showDataPoints = true,
  stacked = false,
  animated = true,
  theme = 'light',
  brush = false,
  referenceLine = null,
  referenceArea = null,
  showControls = true,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [chartType, setChartType] = useState(type);
  const [showBrush, setShowBrush] = useState(brush);
  const [showReference, setShowReference] = useState(referenceLine !== null || referenceArea !== null);

  // Format currency for tooltips
  const formatCurrency = (value) => {
    if (currency) {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return value;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: selectedTheme === 'dark' ? '#1e293b' : '#ffffff',
          padding: '12px 16px',
          borderRadius: '8px',
          border: `1px solid ${selectedTheme === 'dark' ? '#334155' : '#e2e8f0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          color: selectedTheme === 'dark' ? '#e2e8f0' : '#1e293b'
        }}>
          <p className="mb-1 fw-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-0 small" style={{ color: entry.color }}>
              {entry.name}: {currency ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Theme colors
  const themeColors = useMemo(() => {
    if (selectedTheme === 'dark') {
      return {
        axis: '#94a3b8',
        grid: '#334155',
        label: '#e2e8f0',
        background: '#1e293b'
      };
    }
    return {
      axis: '#94a3b8',
      grid: '#e2e8f0',
      label: '#1e293b',
      background: '#ffffff'
    };
  }, [selectedTheme]);

  // Render chart based on type
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: height - 80 }}>
          <FaChartLine size={48} className="text-muted mb-3 opacity-50" />
          <p className="text-muted mb-0">No data available</p>
          <small className="text-muted">Data will appear here once available</small>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const axisProps = {
      stroke: themeColors.axis,
      tick: { fill: themeColors.label, fontSize: 12 },
      label: { fill: themeColors.label }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={currency ? (v) => formatCurrency(v) : undefined} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: themeColors.label }} />}
            {showBrush && <Brush dataKey={xKey} height={30} stroke="#8884d8" />}
            {referenceLine && <ReferenceLine {...referenceLine} />}
            {referenceArea && referenceArea.start && <ReferenceArea {...referenceArea} />}
            {Array.isArray(yKey) ? (
              yKey.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2}
                  dot={showDataPoints}
                  activeDot={{ r: 8 }}
                  animationDuration={animated ? 1000 : 0}
                />
              ))
            ) : (
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={showDataPoints}
                activeDot={{ r: 8 }}
                animationDuration={animated ? 1000 : 0}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={currency ? (v) => formatCurrency(v) : undefined} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: themeColors.label }} />}
            {showBrush && <Brush dataKey={xKey} height={30} stroke="#8884d8" />}
            {Array.isArray(yKey) ? (
              yKey.map((key, index) => (
                <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index % colors.length]} 
                  fill={colors[index % colors.length]} 
                  fillOpacity={0.3}
                  animationDuration={animated ? 1000 : 0}
                />
              ))
            ) : (
              <Area 
                type="monotone" 
                dataKey={yKey} 
                stroke={colors[0]} 
                fill={colors[0]} 
                fillOpacity={0.3}
                animationDuration={animated ? 1000 : 0}
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={currency ? (v) => formatCurrency(v) : undefined} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: themeColors.label }} />}
            {showBrush && <Brush dataKey={xKey} height={30} stroke="#8884d8" />}
            {Array.isArray(yKey) ? (
              yKey.map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={colors[index % colors.length]} 
                  stackId={stacked ? 'stack' : undefined}
                  animationDuration={animated ? 1000 : 0}
                />
              ))
            ) : (
              <Bar 
                dataKey={yKey} 
                fill={colors[0]} 
                animationDuration={animated ? 1000 : 0}
              />
            )}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie 
              data={data} 
              cx="50%" 
              cy="50%" 
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={animated ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: themeColors.label }} />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={currency ? (v) => formatCurrency(v) : undefined} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: themeColors.label }} />}
            <Scatter data={data} fill={colors[0]} />
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart {...commonProps} outerRadius={90}>
            <PolarGrid stroke={themeColors.grid} />
            <PolarAngleAxis dataKey={xKey} tick={{ fill: themeColors.label }} />
            <PolarRadiusAxis tick={{ fill: themeColors.label }} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: themeColors.label }} />}
            {Array.isArray(yKey) ? (
              yKey.map((key, index) => (
                <Radar 
                  key={key}
                  name={key} 
                  dataKey={key} 
                  stroke={colors[index % colors.length]} 
                  fill={colors[index % colors.length]} 
                  fillOpacity={0.6}
                />
              ))
            ) : (
              <Radar 
                name={yKey} 
                dataKey={yKey} 
                stroke={colors[0]} 
                fill={colors[0]} 
                fillOpacity={0.6}
              />
            )}
          </RadarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={currency ? (v) => formatCurrency(v) : undefined} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: themeColors.label }} />}
            <Bar dataKey="bar" fill={colors[0]} />
            <Line type="monotone" dataKey="line" stroke={colors[1]} />
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  // Chart type options
  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: FaChartLine },
    { value: 'area', label: 'Area Chart', icon: FaChartLine },
    { value: 'bar', label: 'Bar Chart', icon: FaChartBar },
    { value: 'pie', label: 'Pie Chart', icon: FaChartPie },
    { value: 'scatter', label: 'Scatter Chart', icon: FaChartLine },
    { value: 'radar', label: 'Radar Chart', icon: FaChartPie },
    { value: 'composed', label: 'Composed Chart', icon: FaChartBar }
  ];

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`} style={{ 
      borderRadius: '16px',
      background: selectedTheme === 'dark' ? '#1e293b' : '#ffffff',
      color: selectedTheme === 'dark' ? '#e2e8f0' : '#1e293b'
    }}>
      <Card.Body className={`p-${expanded ? '4' : '4'}`}>
        {/* Header */}
        {(title || subtitle || showControls) && (
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
            <div>
              {title && <h5 className="fw-bold mb-1">{title}</h5>}
              {subtitle && <small className="text-muted">{subtitle}</small>}
            </div>
            <div className="d-flex gap-2">
              {/* Chart Type Selector */}
              {showControls && (
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1">
                    <FaChartLine size={14} />
                    <span className="d-none d-sm-inline">Chart Type</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {chartTypes.map(ct => (
                      <Dropdown.Item 
                        key={ct.value} 
                        active={chartType === ct.value}
                        onClick={() => setChartType(ct.value)}
                      >
                        <ct.icon className="me-2" size={14} />
                        {ct.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              )}

              {/* Theme Toggle */}
              {showControls && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setSelectedTheme(selectedTheme === 'dark' ? 'light' : 'dark')}
                  className="d-flex align-items-center gap-1"
                >
                  {selectedTheme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
                </Button>
              )}

              {/* Show Values Toggle */}
              {showControls && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setShowValues(!showValues)}
                  className="d-flex align-items-center gap-1"
                >
                  {showValues ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                </Button>
              )}

              {/* Expand Toggle */}
              {showControls && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="d-flex align-items-center gap-1"
                >
                  {expanded ? <FaCompress size={14} /> : <FaExpand size={14} />}
                </Button>
              )}

              {/* Export */}
              {onExport && (
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={onExport}
                  className="d-flex align-items-center gap-1"
                >
                  <FaDownload size={14} />
                  <span className="d-none d-sm-inline">Export</span>
                </Button>
              )}

              {/* Print */}
              {onPrint && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={onPrint}
                  className="d-flex align-items-center gap-1"
                >
                  <FaPrint size={14} />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{ height: expanded ? height * 1.5 : height }}>
          {renderChart()}
        </div>

        {/* Footer Stats */}
        {data.length > 0 && (
          <div className="d-flex flex-wrap gap-3 mt-4 pt-3 border-top">
            <div>
              <small className="text-muted d-block">Total</small>
              <span className="fw-semibold">
                {currency ? formatCurrency(data.reduce((sum, d) => sum + (d[yKey] || 0), 0)) : data.reduce((sum, d) => sum + (d[yKey] || 0), 0)}
              </span>
            </div>
            <div>
              <small className="text-muted d-block">Average</small>
              <span className="fw-semibold">
                {currency ? formatCurrency(data.reduce((sum, d) => sum + (d[yKey] || 0), 0) / data.length) : (data.reduce((sum, d) => sum + (d[yKey] || 0), 0) / data.length).toFixed(1)}
              </span>
            </div>
            <div>
              <small className="text-muted d-block">Max</small>
              <span className="fw-semibold">
                {currency ? formatCurrency(Math.max(...data.map(d => d[yKey] || 0))) : Math.max(...data.map(d => d[yKey] || 0))}
              </span>
            </div>
            <div>
              <small className="text-muted d-block">Min</small>
              <span className="fw-semibold">
                {currency ? formatCurrency(Math.min(...data.map(d => d[yKey] || 0))) : Math.min(...data.map(d => d[yKey] || 0))}
              </span>
            </div>
            {data.length > 1 && (
              <div>
                <small className="text-muted d-block">Trend</small>
                <span className={`fw-semibold ${data[data.length - 1]?.[yKey] > data[0]?.[yKey] ? 'text-success' : 'text-danger'}`}>
                  {data[data.length - 1]?.[yKey] > data[0]?.[yKey] ? '↑' : '↓'}
                  {' '}
                  {currency ? formatCurrency(Math.abs((data[data.length - 1]?.[yKey] || 0) - (data[0]?.[yKey] || 0))) : Math.abs((data[data.length - 1]?.[yKey] || 0) - (data[0]?.[yKey] || 0)).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// Convenience components for common chart types
export const LineChartAnalytics = (props) => <AnalyticsChart {...props} type="line" />;
export const BarChartAnalytics = (props) => <AnalyticsChart {...props} type="bar" />;
export const PieChartAnalytics = (props) => <AnalyticsChart {...props} type="pie" />;
export const AreaChartAnalytics = (props) => <AnalyticsChart {...props} type="area" />;
export const ScatterChartAnalytics = (props) => <AnalyticsChart {...props} type="scatter" />;
export const RadarChartAnalytics = (props) => <AnalyticsChart {...props} type="radar" />;
export const ComposedChartAnalytics = (props) => <AnalyticsChart {...props} type="composed" />;

export default AnalyticsChart;