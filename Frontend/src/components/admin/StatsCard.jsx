import React from 'react';
import { Card, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaInfoCircle,
  FaChartLine,
  Fa
  Fa
  FaMinus
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend, 
  trendValue,
  subtitle,
  progress,
  progressColor = 'primary',
  onClick,
  loading = false,
  className = '',
  showCurrency = false,
  currencySymbol = '₦',
  compact = false,
  badge,
  badgeColor = 'primary',
  tooltip,
  animated = true,
  chartData,
  children
}) => {
  const getColorClass = () => {
    const colors = {
      primary: 'bg-primary bg-opacity-10 text-primary',
      success: 'bg-success bg-opacity-10 text-success',
      warning: 'bg-warning bg-opacity-10 text-warning',
      danger: 'bg-danger bg-opacity-10 text-danger',
      info: 'bg-info bg-opacity-10 text-info',
      secondary: 'bg-secondary bg-opacity-10 text-secondary',
      dark: 'bg-dark bg-opacity-10 text-dark',
      purple: 'bg-purple bg-opacity-10 text-purple',
      pink: 'bg-pink bg-opacity-10 text-pink',
      teal: 'bg-teal bg-opacity-10 text-teal',
      indigo: 'bg-indigo bg-opacity-10 text-indigo'
    };
    return colors[color] || colors.primary;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <FaTrendingUp className="text-success" size={14} />;
    if (trend === 'down') return <FaTrendingDown className="text-danger" size={14} />;
    return <FaMinus className="text-muted" size={14} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'success';
    if (trend === 'down') return 'danger';
    return 'secondary';
  };

  const formatValue = (val) => {
    if (val === undefined || val === null) return '0';
    
    // If showCurrency is true, format as currency
    if (showCurrency) {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    
    // If value is large, format with K/M suffix
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
      return val.toLocaleString();
    }
    
    return val;
  };

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -4,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  const cardContent = (
    <Card 
      className={`border-0 shadow-sm stat-card h-100 ${className}`}
      style={{ 
        borderRadius: '16px', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease'
      }}
      onClick={onClick}
    >
      <Card.Body className="p-4">
        <div className="d-flex align-items-start justify-content-between">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              <h6 className="text-muted mb-0">{title}</h6>
              {badge && (
                <Badge bg={badgeColor} className="rounded-pill" style={{ fontSize: '10px' }}>
                  {badge}
                </Badge>
              )}
              {tooltip && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>{tooltip}</Tooltip>}
                >
                  <FaInfoCircle size={12} className="text-muted" style={{ cursor: 'help' }} />
                </OverlayTrigger>
              )}
            </div>
            
            <div className="d-flex align-items-end gap-3">
              {!compact && (
                <div className={`${getColorClass()} p-3 rounded-circle d-flex align-items-center justify-content-center`}>
                  {icon}
                </div>
              )}
              <div>
                <h3 className={`mb-0 ${loading ? 'placeholder-glow' : ''}`}>
                  {loading ? (
                    <span className="placeholder" style={{ width: '100px' }}></span>
                  ) : (
                    formatValue(value)
                  )}
                </h3>
                {subtitle && (
                  <small className="text-muted">{subtitle}</small>
                )}
              </div>
            </div>
          </div>
          
          {!compact && trend && (
            <div className={`text-${getTrendColor()} d-flex align-items-center gap-1`}>
              {getTrendIcon()}
              <span className="fw-semibold small">{trendValue}</span>
            </div>
          )}
        </div>

        {progress !== undefined && !loading && (
          <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">Progress</small>
              <small className="text-muted">{Math.round(progress)}%</small>
            </div>
            <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
              <div 
                className={`progress-bar bg-${progressColor}`}
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  borderRadius: '3px',
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
          </div>
        )}

        {chartData && !loading && (
          <div className="mt-3">
            <div className="d-flex gap-1" style={{ height: '30px' }}>
              {chartData.map((data, index) => (
                <div 
                  key={index}
                  className="flex-grow-1 rounded"
                  style={{ 
                    height: `${(data / Math.max(...chartData)) * 100}%`,
                    backgroundColor: `var(--bs-${color})`,
                    opacity: 0.3 + (0.7 * (data / Math.max(...chartData))),
                    transition: 'height 0.3s ease',
                    minHeight: '4px'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {children && !loading && (
          <div className="mt-3 pt-2 border-top">
            {children}
          </div>
        )}
      </Card.Body>
    </Card>
  );

  if (animated) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        variants={cardVariants}
        transition={{ duration: 0.3 }}
        style={{ height: '100%' }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

// Compact version of StatsCard for tight spaces
export const CompactStatsCard = ({ title, value, icon, color = 'primary', trend, trendValue }) => {
  return (
    <StatsCard
      title={title}
      value={value}
      icon={icon}
      color={color}
      trend={trend}
      trendValue={trendValue}
      compact={true}
    />
  );
};

// Mini version for sidebar or small spaces
export const MiniStatsCard = ({ title, value, icon, color = 'primary' }) => {
  const getColorClass = () => {
    const colors = {
      primary: 'bg-primary bg-opacity-10 text-primary',
      success: 'bg-success bg-opacity-10 text-success',
      warning: 'bg-warning bg-opacity-10 text-warning',
      danger: 'bg-danger bg-opacity-10 text-danger',
      info: 'bg-info bg-opacity-10 text-info'
    };
    return colors[color] || colors.primary;
  };

  return (
    <Card className="border-0 bg-transparent">
      <Card.Body className="p-2">
        <div className="d-flex align-items-center gap-2">
          <div className={`${getColorClass()} p-2 rounded-circle d-flex align-items-center justify-content-center`}>
            {icon}
          </div>
          <div>
            <small className="text-muted d-block" style={{ fontSize: '10px' }}>{title}</small>
            <span className="fw-bold small">{value}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatsCard;