import React from 'react';
import { Card } from 'react-bootstrap';

const StatsCard = ({ title, value, icon, color = 'primary', trend, trendValue }) => {
  const getColorClass = () => {
    const colors = {
      primary: 'bg-primary bg-opacity-10 text-primary',
      success: 'bg-success bg-opacity-10 text-success',
      warning: 'bg-warning bg-opacity-10 text-warning',
      danger: 'bg-danger bg-opacity-10 text-danger',
      info: 'bg-info bg-opacity-10 text-info',
      secondary: 'bg-secondary bg-opacity-10 text-secondary'
    };
    return colors[color] || colors.primary;
  };

  return (
    <Card className="border-0 shadow-sm stat-card h-100">
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className={`${getColorClass()} p-3 rounded-circle me-3`}>
            {icon}
          </div>
          <div className="flex-grow-1">
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="mb-0">{value}</h3>
            {trend && (
              <small className={trend === 'up' ? 'text-success' : 'text-danger'}>
                {trend === 'up' ? '↑' : '↓'} {trendValue} vs last month
              </small>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatsCard;